import {
  CommanderTextMessage,
  TranslationString,
  TranslationStringGetter
} from "./util/types"
import { TeamSpeak, TextMessageTargetMode } from "ts3-nodejs-library/src/TeamSpeak"
import { TeamSpeakClient } from "ts3-nodejs-library/src/node/Client"
import { Command } from "./command/Command"
import { CommandGroup } from "./command/CommandGroup"
import { BaseCommand } from "./command/BaseCommand"
import { TooManyArgumentsError } from "./exceptions/TooManyArgumentsError"
import { ThrottleError } from "./exceptions/ThrottleError"
import { ParseError } from "./exceptions/ParseError"
import { PermissionError } from "./exceptions/PermissionError"
import { CommandNotFoundError } from "./exceptions/CommandNotFoundError"
import { Throttle } from "./util/Throttle"
import { TextMessage } from "ts3-nodejs-library/src/types/Events"

export interface TranslationMessages {
  COMMAND_NOT_FOUND: TranslationString
  COMMAND_NO_PERMISSION: TranslationString
  SUBCOMMAND_NOT_FOUND: TranslationString<{
    error: Error
    cmd: BaseCommand
  }>
}

export interface CommanderOptions {
  prefix: string
  messages: TranslationMessages
}

export class Commander {

  readonly config: CommanderOptions
  private instances: TeamSpeak[] = []
  private commands: BaseCommand[] = []

  constructor(config: Partial<CommanderOptions> = {}) {
    const { messages, ...rest } = config
    this.config = {
      prefix: Commander.DEFAULT_PREFIX,
      messages: {
        COMMAND_NOT_FOUND: "no command found",
        COMMAND_NO_PERMISSION: "no permission to use this command",
        SUBCOMMAND_NOT_FOUND: ({ error, cmd }) => `${error.message}\nFor Command usage see ${this.defaultPrefix()}man ${cmd.getCommandName()}\n`,
        ...messages
      },
      ...rest
    }
  }

  /** creates a new Throttle instance */
  static createThrottle() {
    return new Throttle()
  }

  /*private registerBaseCommands() {
    registerHelpCommand(this)
    registerManualCommand(this)
  }*/

  private getTranslator(event: TextMessage, teamspeak: TeamSpeak): TranslationStringGetter {
    return <T>(data: TranslationString<T>, args: T extends object ? T : never) => {
      return this.getTranslatedString({
        event,
        teamspeak,
        data,
        ...args
      })
    }
  }

  /**
   * retrieves a string from a CommanderString Type
   * @param data the string getter data
   */
  private getTranslatedString({ teamspeak, event, data, ...rest }: {
    teamspeak: TeamSpeak,
    event: TextMessage,
    data: TranslationString<any>
  }) {
    if (typeof data === "string") return data
    return data({ client: event.invoker, teamspeak, ...rest })
  }

  private async textMessageHandler(event: CommanderTextMessage) {
    if (event.invoker.isQuery()) return
    if (!this.isPossibleCommand(event.msg)) return
    const t = this.getTranslator(event, event.teamspeak)
    const match = event.msg.match(/^(?<command>\S*)\s*(?<args>.*)\s*/s)
    if (!match || !match.groups) return
    const { command, args } = match.groups
    let commands = this.getAvailableCommands(command)
    if (commands.length === 0)
      return event.reply(t(this.config.messages.COMMAND_NOT_FOUND))
    commands = await this.checkPermissions(commands, event.invoker)
    if (commands.length === 0)
      return event.reply(t(this.config.messages.COMMAND_NO_PERMISSION))
    commands.forEach(cmd => this.runCommand(cmd, args, event, t))
  }

  private runCommand(
    cmd: BaseCommand,
    args: string,
    event: CommanderTextMessage,
    translate: TranslationStringGetter
  ) {
    try {
      cmd.handleRequest(args, event)
    } catch (e) {
      //Handle Command not found Exceptions for CommandGroups
      if (e instanceof CommandNotFoundError) {
        translate(this.config.messages.SUBCOMMAND_NOT_FOUND, { error: e, cmd })
        event.reply(`${e.message}\nFor Command usage see ${this.defaultPrefix()}man ${cmd.getCommandName()}\n`)
      } else if (e instanceof PermissionError) {
        event.reply(`You do not have permissions to use this command!\nTo get a list of available commands see [b]${this.defaultPrefix()}help[/b]`)
      } else if (e instanceof ParseError) {
        event.reply(`Invalid Command usage! For Command usage see [b]${this.defaultPrefix()}man ${cmd.getCommandName()}[/b]\n`)
      } else if (e instanceof ThrottleError) {
        event.reply(e.message)
      } else if (e instanceof TooManyArgumentsError) {
        let response = `Too many Arguments received for this Command!\n`
        if (e.parseError) {
            response += `Argument parsed with an error [b]${e.parseError.argument.getManual()}[/b]\n`
            response += `Returned with [b]${e.parseError.message}[/b]\n`
        }
        response += `Invalid Command usage! For Command usage see [b]${this.defaultPrefix()}man ${cmd.getCommandName()}[/b]`
        event.reply(response)
      } else {
        throw e
      }
    }
  }

  static getReplyFunction(event: TextMessage, teamspeak: TeamSpeak) {
    const { invoker } = event
    const { CLIENT, SERVER, CHANNEL } = TextMessageTargetMode
    switch (event.targetmode) {
      case CLIENT: return (msg: string) => teamspeak.sendTextMessage(invoker.clid, CLIENT, msg)
      case CHANNEL: return (msg: string) => teamspeak.sendTextMessage(invoker.cid, CHANNEL, msg)
      case SERVER: return (msg: string) => teamspeak.sendTextMessage(0, SERVER, msg)
      default: throw new Error(`unknown targetmode ${event.targetmode}`)
    }
  }

  async checkPermissions(commands: BaseCommand[], client: TeamSpeakClient) {
    const result = await Promise.all(commands.map(async cmd => await cmd.hasPermission(client)))
    return <BaseCommand[]>result
      .map((res, i) => res ? commands[i] : false)
      .filter(res => res instanceof BaseCommand)
  }

  getAvailableCommands(name?: string) {
    return this.commands
      .filter(cmd => !name || cmd.getCommandName() === name || cmd.getFullCommandName() === name)
      .filter(cmd => cmd.isEnabled())
  }

  defaultPrefix() {
    return this.config.prefix
  }

  isPossibleCommand(text: string) {
    if (text.startsWith(this.defaultPrefix())) return true
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

  /** adds a teamspeak instance to the command handler */
  async addInstance(teamspeak: TeamSpeak) {
    this.instances.push(teamspeak)
    await Promise.all([
      teamspeak.registerEvent("textserver"),
      teamspeak.registerEvent("textchannel"),
      teamspeak.registerEvent("textprivate")
    ])
    teamspeak.on("textmessage", ev => {
      this.textMessageHandler({
        ...ev,
        teamspeak,
        reply: Commander.getReplyFunction(ev, teamspeak),
        arguments: {}
      })
    })
    return this
  }

  static isValidCommandName(name: string) {
    return name.length > 0
  }
}

export namespace Commander {
  export const DEFAULT_PREFIX = "!"
}