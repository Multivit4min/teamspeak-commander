import { TeamSpeakClient } from "ts3-nodejs-library/lib/node/Client"
import { Commander } from "../Commander"
import { CommanderTextMessage } from "../util/types"
import { Throttle } from "../util/Throttle"
import { ThrottleError } from "../exceptions/ThrottleError"

export type permissionHandler = (invoker: TeamSpeakClient) => Promise<boolean>|boolean
export type runHandler = (event: CommanderTextMessage) => void

export abstract class BaseCommand {
  protected commander: Commander
  protected permissionHandler: permissionHandler[] = []
  protected runHandler: runHandler[] = []
  private cmdPrefix: string = ""
  private cmdHelp: string = ""
  private cmdManual: string[] = []
  private cmdName: string
  private cmdEnabled: boolean = true
  private cmdThrottle: Throttle

  constructor(cmd: string, commander: Commander) {
    this.cmdName = cmd
    this.commander = commander
  }

  abstract getUsage(): string
  abstract hasPermission(client: TeamSpeakClient): Promise<boolean>
  abstract validate(args: string): Record<string, any>
  abstract handleRequest(args: string, ev: CommanderTextMessage): void

  /** checks if the command is enabled */
  isEnabled() {
    return this.cmdEnabled
  }

  /* enables this command */
  enable() {
    this.cmdEnabled = true
    return this
  }

  /* disabled this command */
  disable() {
    this.cmdEnabled = false
    return this
  }

  /** gets the command name without its prefix */
  getCommandName() {
    return this.cmdName
  }

  /** gets the command name with its prefix */
  getFullCommandName() {
    return `${this.getPrefix()}${this.getCommandName()}`
  }

  /** retrieves the help text */
  getHelp() {
    return this.cmdHelp
  }

  /**
   * sets a help text (should be a very brief description)
   * @param text help text
   */
  help(text: string) {
    this.cmdHelp = text
    return this
  }

  /** returns a boolean wether a help text has been set or not */
  hasHelp() {
    return this.cmdHelp !== ""
  }

  /** retrieves the current manual text */
  getManual() {
    return this.cmdManual.join("\r\n")
  }

  /** returns a boolean wether a help text has been set or not */
  hasManual() {
    return this.cmdManual.length > 0
  }

  /**
   * sets a prefix for this command
   * should only used in specific cases
   * by default the prefix gets inherited from its Commander
   * @param prefix the new prefix for this command
   */
  prefix(prefix: string) {
    this.cmdPrefix = prefix
    return this
  }

  /** gets the current prefix for this command */
  getPrefix() {
    if (this.cmdPrefix.length > 0) return this.cmdPrefix
    return this.commander.config.prefix 
  }

  /**
   * sets a manual text, this function can be called multiple times
   * in order to create a multilined manual text
   * @param text the manual text
   */
  manual(text: string) {
    this.cmdManual.push(text)
    return this
  }

  /**
   * clears the current manual text
   */
  clearManual() {
    this.cmdManual = []
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
   * adds an instance of a throttle class
   * @param throttle adds the throttle instance
   */
  addThrottle(throttle: Throttle) {
    this.cmdThrottle = throttle
    return this
  }

  private handleThrottle(client: TeamSpeakClient) {
    if (!(this.cmdThrottle instanceof Throttle)) return
    if (this.cmdThrottle.isThrottled(client)) {
      const time = (this.cmdThrottle.timeTillNextCommand(client) / 1000).toFixed(1)
      throw new ThrottleError(`You can use this command again in ${time} seconds!`)
    } else {
      this.cmdThrottle.throttle(client)
    }
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
    this.handleThrottle(ev.invoker)
    this.runHandler.forEach(handle => handle({...ev}))
  }
}