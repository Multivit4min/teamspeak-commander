import { TeamSpeakClient } from "ts3-nodejs-library/lib/node/Client"
import { Commander, CommanderTextMessage } from "../Commander"

export type permissionHandler = (invoker: TeamSpeakClient) => Promise<boolean>|boolean
export type runHandler = (event: CommanderTextMessage) => void

export abstract class BaseCommand {
  protected commander: Commander
  protected permissionHandler: permissionHandler[] = []
  protected runHandler: runHandler[] = []
  private prefix: string = ""
  private help: string = ""
  private manual: string[] = []
  private name: string
  private enabled: boolean = true

  constructor(cmd: string, commander: Commander) {
    this.name = cmd
    this.commander = commander
  }

  abstract getUsage(): string
  abstract hasPermission(client: TeamSpeakClient): Promise<boolean>
  abstract validate(args: string): Record<string, any>
  abstract handleRequest(args: string, ev: CommanderTextMessage): void

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

  /** gets the command name without its prefix */
  getCommandName() {
    return this.name
  }

  /** gets the command name with its prefix */
  getFullCommandName() {
    return `${this.getPrefix()}${this.getCommandName()}`
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

  /** returns a boolean wether a help text has been set or not */
  hasHelp() {
    return this.help !== ""
  }

  /** retrieves the current manual text */
  getManual() {
    return this.manual.join("\r\n")
  }

  /** returns a boolean wether a help text has been set or not */
  hasManual() {
    return this.manual.length > 0
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

  /** gets the current prefix for this command */
  getPrefix() {
    if (this.prefix.length > 0) return this.prefix
    return this.commander.config.prefix 
  }

  /**
   * sets a manual text, this function can be called multiple times
   * in order to create a multilined manual text
   * @param text the manual text
   */
  setManual(text: string) {
    this.manual.push(text)
    return this
  }

  /**
   * clears the current manual text
   */
  clearManual() {
    this.manual = []
    return this
  }

  /**
   * register an execution handler for this command
   * @param callback gets called whenever the command should do something
   */
  run(callback: runHandler) {
    this.runHandler.push(callback)
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

  protected async permCheck(client: TeamSpeakClient) {
    return (await Promise.all(this.permissionHandler.map(cb => cb(client)))).every(result => result)
  }

  protected dispatchCommand(ev: CommanderTextMessage) {
    this.runHandler.forEach(handle => handle({...ev}))
  }
}