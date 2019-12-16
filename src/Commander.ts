import {
  CommanderTextMessage,
  TranslationString,
  TranslationStringGetter
} from "./util/types"
import { TeamSpeak, TeamSpeakClient, TextMessageEvent, TextMessageTargetMode } from "ts3-nodejs-library"
import { Command } from "./command/Command"
import { CommandGroup } from "./command/CommandGroup"
import { BaseCommand } from "./command/BaseCommand"
import { TooManyArgumentsError } from "./exceptions/TooManyArgumentsError"
import { ThrottleError } from "./exceptions/ThrottleError"
import { ParseError } from "./exceptions/ParseError"
import { PermissionError } from "./exceptions/PermissionError"
import { CommandNotFoundError } from "./exceptions/CommandNotFoundError"
import { Throttle } from "./util/Throttle"

export interface CommandErrorType<T extends Error> {
  cmd: BaseCommand
  error: T
}

export interface TranslationMessages {
  COMMAND_NOT_FOUND: TranslationString
  COMMAND_NO_PERMISSION: TranslationString<CommandErrorType<PermissionError>>
  SUBCOMMAND_NOT_FOUND: TranslationString<CommandErrorType<CommandNotFoundError>>
  COMMAND_PARSE_ERROR: TranslationString<CommandErrorType<ParseError>>
  COMMAND_THROTTLE_ERROR: TranslationString<CommandErrorType<ThrottleError>>
  COMMAND_TOO_MANY_ARGUMENTS_ERROR: TranslationString<CommandErrorType<TooManyArgumentsError>>
}

export interface CommanderOptions extends TranslationMessages {
  prefix: string
}

export class Commander {

  static DEFAULT_PREFIX = "!"
  readonly config: CommanderOptions
  private instances: TeamSpeak[] = []
  private commands: BaseCommand[] = []

  constructor(config: Partial<CommanderOptions> = {}) {
    this.config = {
      prefix: Commander.DEFAULT_PREFIX,
      COMMAND_NOT_FOUND: "no command found",
      COMMAND_NO_PERMISSION: ({ commander }) => `You do not have permissions to use this command!\nTo get a list of available commands see [b]${commander.prefix()}help[/b]`,
      SUBCOMMAND_NOT_FOUND: ({ commander, error, cmd }) => `${error.message}\nFor Command usage see ${commander.prefix()}man ${cmd.getCommandName()}\n`,
      COMMAND_PARSE_ERROR: ({ commander, cmd }) =>  `Invalid Command usage! For Command usage see [b]${commander.prefix()}man ${cmd.getCommandName()}[/b]\n`,
      COMMAND_THROTTLE_ERROR: ({ error }) => error.message,
      COMMAND_TOO_MANY_ARGUMENTS_ERROR: ({ commander, error, cmd }) => {
        let response = `Too many Arguments received for this Command!\n`
        if (error.parseError) {
            response += `Argument parsed with an error [b]${error.parseError.argument.getManual()}[/b]\n`
            response += `Returned with [b]${error.parseError.message}[/b]\n`
        }
        return response + `Invalid Command usage! For Command usage see [b]${commander.prefix()}man ${cmd.getCommandName()}[/b]`
      },
      ...config
    }
  }


  /** creates a new Throttle instance */
  static createThrottle() {
    return new Throttle()
  }

  private getTranslator(event: TextMessageEvent): TranslationStringGetter {
    return <T>(data: TranslationString<T>, args: T extends object ? T : never) => {
      return this.getTranslatedString({ client: event.invoker, data, ...args })
    }
  }

  /**
   * retrieves a string from a CommanderString Type
   * @param data the string getter data
   */
  private getTranslatedString({ client, data, ...rest }: {
    client: TeamSpeakClient,
    data: TranslationString<any>
  }) {
    if (typeof data === "string") return data
    return data({
      commander: this,
      client,
      teamspeak: client.getParent(),
      ...rest
    })
  }

  /**
   * gets a string translation with the client object
   * @param client 
   */
  translateString(client: TeamSpeakClient) {
    return (data: TranslationString<any>) => {
      return this.getTranslatedString({ client, data })
    }
  }

  private async textMessageHandler(event: CommanderTextMessage) {
    if (event.invoker.isQuery()) return
    if (!this.isPossibleCommand(event.msg)) return
    const t = this.getTranslator(event)
    const match = event.msg.match(/^(?<command>\S*)\s*(?<args>.*)\s*/s)
    if (!match || !match.groups) return
    const { command, args } = match.groups
    let commands = this.getAvailableCommands(command)
    if (commands.length === 0)
      return event.reply(t(this.config.COMMAND_NOT_FOUND))
    commands = await this.checkPermissions(commands, event.invoker)
    if (commands.length === 0)
      return event.reply(t(this.config.COMMAND_NO_PERMISSION))
    commands.forEach(cmd => this.runCommand(cmd, args, event, t))
  }

  private async runCommand(
    cmd: BaseCommand,
    args: string,
    event: CommanderTextMessage,
    translate: TranslationStringGetter
  ) {
    try {
      await cmd.handleRequest(args, event)
    } catch (error) {
      if (error instanceof CommandNotFoundError) {
        event.reply(translate(this.config.SUBCOMMAND_NOT_FOUND, { error, cmd }))
      } else if (error instanceof PermissionError) {
        event.reply(translate(this.config.COMMAND_NO_PERMISSION, { error, cmd }))
      } else if (error instanceof ParseError) {
        event.reply(translate(this.config.COMMAND_PARSE_ERROR, { error, cmd }))
      } else if (error instanceof ThrottleError) {
        event.reply(translate(this.config.COMMAND_THROTTLE_ERROR, { error, cmd }))
      } else if (error instanceof TooManyArgumentsError) {
        event.reply(translate(this.config.COMMAND_TOO_MANY_ARGUMENTS_ERROR, { error, cmd }))
      } else {
        throw error
      }
    }
  }

  getReplyFunction(ev: TextMessageEvent) {
    const { CLIENT, SERVER, CHANNEL } = TextMessageTargetMode
    switch (ev.targetmode) {
      case CLIENT:
        return (msg: TranslationString) => ev.invoker.getParent().sendTextMessage(ev.invoker.clid, CLIENT, this.getTranslator(ev)(msg))
      case CHANNEL:
        return (msg: TranslationString) => ev.invoker.getParent().sendTextMessage(ev.invoker.cid, CHANNEL, this.getTranslator(ev)(msg))
      case SERVER:
        return (msg: TranslationString) => ev.invoker.getParent().sendTextMessage(0, SERVER, this.getTranslator(ev)(msg))
      default: throw new Error(`unknown targetmode ${ev.targetmode}`)
    }
  }

  async checkPermissions(commands: BaseCommand[], client: TeamSpeakClient) {
    const result = await Promise.all(commands.map(async cmd => await cmd.hasPermission(client)))
    return <BaseCommand[]>result
      .map((res, i) => res ? commands[i] : false)
      .filter(res => res instanceof BaseCommand)
  }

  /**
   * gets a list of enabled commands
   * @param name the name to find
   */
  getAvailableCommands(name?: string) {
    return this.commands
      .filter(cmd => cmd.isEnabled())
      .filter(cmd => !name || cmd.getCommandName() === name || cmd.getFullCommandName() === name)
  }

  /**
   * regex searches available commands
   * @param name the name to find 
   * @param client the requesting client 
   */
  searchAvailableCommands(name: string, client: TeamSpeakClient) {
    return this.commands
      .filter(cmd => cmd.isEnabled())
      .filter(cmd => {
        const regex = new RegExp(name, "i")
        return (
          regex.test(cmd.getFullCommandName()) ||
          regex.test(cmd.getHelp(client))
        )
      })
  }

  /**
   * gets a list of availale commands with permission checks
   * @param client the client to check permissions for
   * @param filter the name to prefilter commands
   */
  getAvailableCommandsWithPermission(client: TeamSpeakClient, filter?: string) {
    const cmds = filter ? this.searchAvailableCommands(filter, client) : this.commands
    return this.checkPermissions(cmds, client)
  }

  prefix() {
    return this.config.prefix
  }

  isPossibleCommand(text: string) {
    if (text.startsWith(this.prefix())) return true
    return this.commands.some(cmd => cmd.getFullCommandName() === text.split(" ")[0])
  }

  /**
   * creates a new command
   * @param name the name of the command
   */
  createCommand(name: string) {
    if (!Commander.isValidCommandName(name)) throw new Error("Can not create a command with length of 0")
    const cmd = new Command(name, this)
    this.commands.push(cmd)
    return cmd
  }

  /**
   * creates a new command
   * @param name the name of the command
   */
  createCommandGroup(name: string) {
    if (!Commander.isValidCommandName(name)) throw new Error("Can not create a command with length of 0")
    const cmd = new CommandGroup(name, this)
    this.commands.push(cmd)
    return cmd
  }

  /**
   * adds a teamspeak instance to the command handler
   * @param teamspeak the instance to add
   * @param registerEvents depending on this setting the registerEvent command will be sent to the teamspeak server
   */
  async addInstance(teamspeak: TeamSpeak, registerEvents: boolean = true) {
    this.instances.push(teamspeak)
    if (registerEvents) {
      await Promise.all([
        teamspeak.registerEvent("textserver"),
        teamspeak.registerEvent("textchannel"),
        teamspeak.registerEvent("textprivate")
      ])
    }
    teamspeak.on("textmessage", ev => {
      this.textMessageHandler({
        ...ev,
        teamspeak,
        reply: this.getReplyFunction(ev),
        args: {}
      })
    })
    return this
  }

  /**
   * checks if the command name is valid to be created as a command
   * @param name the command to create
   */
  static isValidCommandName(name: string) {
    return name.length > 0 && !(/^\S$/).test(name)
  }
}