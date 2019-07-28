import { TeamSpeak, TextMessageTargetMode } from "ts3-nodejs-library"
import { TextMessage } from "ts3-nodejs-library/lib/types/Events"
import { Command } from "./Command"

export interface CommanderTextMessage extends TextMessage {
  arguments: Record<string, any>,
  teamspeak: TeamSpeak,
  reply: (msg: string) => Promise<any>
}

export interface CommanderOptions {
  prefix: string
}

export class Commander {

  readonly config: CommanderOptions
  private instances: TeamSpeak[] = []
  private commands: Command[] = []

  constructor(config: Partial<CommanderOptions> = {}) {
    this.config = {
      prefix: "!",
      ...config
    }
  }

  private async textMessageHandler(event: CommanderTextMessage) {
    if (event.invoker.isQuery()) return
    if (!this.isPossibleCommand(event.msg)) return
    const match = event.msg.match(/^(?<command>\S*)\s*(?<args>.*)\s*/s)
    if (!match || !match.groups) return
    const { command, args } = match.groups
    let commands = this.getAvailableCommands(command)
    if (commands.length === 0) return event.reply("no command found")
    const result = await Promise.all(commands.map(async cmd =>  await cmd.hasPermission(event.invoker)))
    commands = <Command[]>result.map((res, i) => res ? commands[i] : false).filter(res => res instanceof Command)
    if (commands.length === 0) return event.reply("no permission to use this command")
    commands.forEach(cmd => cmd.handleRequest(args, event))
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

  getAvailableCommands(name: string) {
    return this.commands
      .filter(cmd => cmd.getFullCommandName() === name)
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
   * @param command the name of the command
   */
  createCommand(command: string) {
    if (command.length === 0) throw new Error("Can not create a command with length of 0")
    const cmd = new Command(command, this)
    this.commands.push(cmd)
    return cmd
  }

  /** adds a teamspeak instance to the command handler */
  addInstance(teamspeak: TeamSpeak) {
    this.instances.push(teamspeak)
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

}