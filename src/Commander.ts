import { TeamSpeak, TextMessageTargetMode } from "ts3-nodejs-library"
import { TextMessage } from "ts3-nodejs-library/lib/types/Events"
import { Command } from "./command/Command"
import { CommandGroup } from "./command/CommandGroup"
import { BaseCommand } from "./command/BaseCommand"
import { TooManyArgumentsError } from "./exceptions/TooManyArgumentsError"
import { ThrottleError } from "./exceptions/ThrottleError"
import { ParseError } from "./exceptions/ParseError"
import { PermissionError } from "./exceptions/PermissionError"
import { CommandNotFoundError } from "./exceptions/CommandNotFoundError"
import { TeamSpeakClient } from "ts3-nodejs-library/lib/node/Client"

declare interface helpTexts {
  name: string,
  help: string
}

export interface CommanderTextMessage extends TextMessage {
  arguments: Record<string, any>,
  teamspeak: TeamSpeak,
  reply: (msg: string) => Promise<any>
}

export interface CommanderOptions {
  prefix: string,
}

export class Commander {

  readonly config: CommanderOptions
  private instances: TeamSpeak[] = []
  private commands: BaseCommand[] = []

  constructor(config: Partial<CommanderOptions> = {}) {
    this.config = {
      prefix: "!",
      ...config
    }
    this.registerBaseCommands()
  }

  private registerBaseCommands() {
    this.registerHelp()
    this.registerMan()
  }

  private registerHelp() {
    this.createCommand("help")
      .setHelp("Displays this text")
      .setManual(`Displays a list of useable commands`)
      .setManual(`you can search/filter for a specific commands by adding a keyword`)
      .addArgument(arg => arg.rest.setName("filter").optional())
      .run(async ev => {
        const { filter } = ev.arguments
        let cmds = this.getAvailableCommands()
          .filter(cmd => !filter ||
            cmd.getCommandName().match(new RegExp(filter, "i")) ||
            cmd.getHelp().match(new RegExp(filter, "i")))
        cmds = await this.checkPermissions(cmds, ev.invoker)
        if (cmds.length === 0) return ev.reply("No Commands to display a help texts have been!")
        const help: helpTexts[] = []
        await Promise.all(cmds.map(async cmd => {
          if (cmd instanceof CommandGroup) {
            return (await cmd.getAvailableSubCommands(ev.invoker)).forEach(sub => {
              help.push({ name: `${cmd.getFullCommandName()} ${sub.getCommandName()}`, help: sub.getHelp() })
            })
          } else {
            help.push({ name: cmd.getFullCommandName(), help: cmd.getHelp()})
          }
        }))
        ev.reply(`${help.length} Command${help.length === 1 ? "" : "s"} found:`)
        return help.forEach(({ name, help }) => ev.reply(`[b]${name}[/b] ${help}`))
      })
  }
  private registerMan() {  
    this.createCommand("man")
      .setHelp("Displays detailed help about a command if available")
      .setManual(`Displays detailed usage help for a specific command`)
      .setManual(`Arguments with Arrow Brackets (eg. < > ) are mandatory arguments`)
      .setManual(`Arguments with Square Brackets (eg. [ ] ) are optional arguments`)
      .addArgument(arg => arg.string.setName("command").minimum(1))
      .addArgument(arg => arg.string.setName("subcommand").minimum(1).optional(false, false))
      .run(async ev => {
        const getManual = (cmd: BaseCommand) => {
          if (cmd.hasManual()) return cmd.getManual()
          if (cmd.hasHelp()) return cmd.getHelp()
          return "No manual available"
        }
        const { command, subcommand } = ev.arguments
        const commands = await this.checkPermissions(this.getAvailableCommands(command), ev.invoker)
        if (commands.length === 0) return ev.reply(`No command with name [b]${command}[/b] found! Did you misstype the command?`)
        commands.map(async cmd => {
          if (cmd instanceof CommandGroup) {
            if (subcommand) {
              (await cmd.getAvailableSubCommands(ev.invoker, subcommand)).forEach(sub => {
                ev.reply(`\n[b]Usage:[/b] ${cmd.getFullCommandName()} ${sub.getUsage()}\n${getManual(sub)}`)
              })
            } else {
              ev.reply(`[b]${cmd.getFullCommandName()}[/b] ${getManual(cmd)}`)
              ;(await cmd.getAvailableSubCommands(ev.invoker)).forEach(sub => {
                ev.reply(`[b]${cmd.getFullCommandName()} ${sub.getUsage()}[/b] ${sub.getHelp()}`)
              })
            }
          } else {
            ev.reply(`\nManual for command: [b]${cmd.getFullCommandName()}[/b]\n[b]Usage:[/b] ${cmd.getUsage()}\n${getManual(cmd)}`)
          }
        })
      })
  }

  private async textMessageHandler(event: CommanderTextMessage) {
    if (event.invoker.isQuery()) return
    if (!this.isPossibleCommand(event.msg)) return
    const match = event.msg.match(/^(?<command>\S*)\s*(?<args>.*)\s*/s)
    if (!match || !match.groups) return
    const { command, args } = match.groups
    let commands = this.getAvailableCommands(command)
    if (commands.length === 0) return event.reply("no command found")
    commands = await this.checkPermissions(commands, event.invoker)
    if (commands.length === 0) return event.reply("no permission to use this command")
    commands.forEach(cmd => this.runCommand(cmd, args, event))
  }

  private runCommand(cmd: BaseCommand, args: string, event: CommanderTextMessage) {
    try {
      cmd.handleRequest(args, event)
    } catch (e) {
      //Handle Command not found Exceptions for CommandGroups
      if (e instanceof CommandNotFoundError) {
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
    teamspeak.on("textmessage", (ev: TextMessage) => {
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