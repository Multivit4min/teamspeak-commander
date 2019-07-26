import { TeamSpeak } from "ts3-nodejs-library"
import { TeamSpeakClient } from "ts3-nodejs-library/lib/node/Client"
import { Commander, CommanderTextMessage } from "Commander"

export interface execEvent {
  reply: (message: string) => void
  invoker: TeamSpeakClient
  message: string
  teamspeak: TeamSpeak
}
type execHandler = (event: CommanderTextMessage) => void
type permissionHandler = (invoker: TeamSpeakClient) => Promise<boolean>|boolean

export interface Argument {

}

export class Command {
  private commander: Commander
  private prefix: string = ""
  private name: string
  private enabled: boolean = true
  private help: string = ""
  private manual: string[] = []
  private permissionHandler: permissionHandler[] = []
  private runHandler: execHandler[] = []
  private arguments: Argument[] = []

  constructor(cmd: string, commander: Commander) {
    this.name = cmd
    this.commander = commander
  }

  /** gets the current prefix for this command */
  getPrefix() {
    if (this.prefix.length > 0) return this.prefix
    return this.commander.config.prefix 
  }

  /**
   * sets a prefix for this command
   * should only used in specific cases
   * by default the prefix gets inherited from its Commander
   * @param prefix the new prefix for this command
   */
  setPrefix(prefix: string) {
    this.prefix = prefix
    return this
  }

  /**
   * checks if a client should have permission to use this command
   * @param client the client which should be checked
   */
  async hasPermission(client: TeamSpeakClient) {
    return (await Promise.all(this.permissionHandler.map(cb => cb(client)))).every(result => result)
  }

  /** gets the command name with its prefix */
  getFullCommandName() {
    return `${this.getPrefix()}${this.name}`
  }

  /** checks if the command is enabled */
  isEnabled() {
    return this.enabled
  }

  /**
   * enables or disables a command
   * @param status wether the command should be enabled or disabled
   */
  enable(status: boolean) {
    this.enabled = status
    return this
  }

  /** retrieves the help text */
  getHelp() {
    return this.help
  }

  /**
   * sets a help text (should be a very brief description)
   * @param text help text
   */
  setHelp(text: string) {
    this.help = text
    return this
  }

  /** retrieves the current manual text */
  getManual() {
    return this.manual.join("\r\n")
  }

  /**
   * Retrieves the usage of the command with its parameterized names
   * @returns {string} retrieves the complete usage of the command with its argument names
   */
  getUsage() {
    //return `${this.getFullCommandName()} ${this.getArguments().map(arg => arg.getManual()).join(" ")}`
  }

  /**
   * adds an argument to the command
   * @param argument an argument to add
   */
  addArgument(argument: Argument) {
    this.arguments.push(argument)
    return this
  }

  /** retrieves all available arguments */
  getArguments() {
    return this.arguments
  }

  /**
   * sets a manual text, this function can be called multiple times
   * in order to create a multilined manual text
   * @param text the manual text
   */
  setManual(text: string) {
    this.manual.push(text)
  }

  /**
   * clears the current manual text
   */
  clearManual() {
    this.manual = []
    return this
  }

  /**
   * register a permission handler for this command
   * @param callback gets called whenever the permission for a client gets checked
   */
  checkPermission(callback: permissionHandler) {
    this.permissionHandler.push(callback)
    return this
  }

  /**
   * register an execution handler for this command
   * @param callback gets called whenever the command should do something
   */
  run(callback: execHandler) {
    this.runHandler.push(callback)
    return this
  }
}