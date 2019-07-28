import { TeamSpeak } from "ts3-nodejs-library"
import { TeamSpeakClient } from "ts3-nodejs-library/lib/node/Client"
import { Commander, CommanderTextMessage } from "Commander"
import { Argument } from "./arguments/Argument"
import { StringArgument } from "./arguments/StringArgument"
import { NumberArgument } from "./arguments/NumberArgument"
import { RestArgument } from "./arguments/RestArgument"
import { ClientArgument } from "./arguments/ClientArgument"
import { ParseError } from "./exceptions/ParseError"
import { TooManyArguments } from "./exceptions/TooManyArgumentsError"

export interface ArgType {
  string: StringArgument,
  number: NumberArgument,
  client: ClientArgument,
  rest: RestArgument
}

export type runHandler = (event: CommanderTextMessage) => void
export type permissionHandler = (invoker: TeamSpeakClient) => Promise<boolean>|boolean
export type argumentCreateHandler = (arg: ArgType) => Argument

export class Command {
  private commander: Commander
  private prefix: string = ""
  private name: string
  private enabled: boolean = true
  private help: string = ""
  private manual: string[] = []
  private permissionHandler: permissionHandler[] = []
  private runHandler: runHandler[] = []
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
   * @returns retrieves the complete usage of the command with its argument names
   */
  getUsage() {
    //return `${this.getFullCommandName()} ${this.getArguments().map(arg => arg.getManual()).join(" ")}`
  }

  /**
   * adds an argument to the command
   * @param argument an argument to add
   */
  addArgument(callback: argumentCreateHandler) {
    this.arguments.push(callback(Command.createArgumentLayer()))
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
  run(callback: runHandler) {
    this.runHandler.push(callback)
    return this
  }

  handleRequest(args: string, ev: CommanderTextMessage) {
    this.dispatchCommand(this.validate(args), ev)
  }

  private dispatchCommand(args: Record<string, any>, ev: CommanderTextMessage) {
    this.runHandler.forEach(handle => handle({ ...ev, arguments: args }))
  }

  /**
   * Validates the command
   * @param args the arguments from the command which should be validated
   */
  validate(args: string) {
    const { result, errors, remaining } = this.validateArgs(args)
    if (remaining.length > 0) throw new TooManyArguments(`Too many argument!`, errors.length > 0 ? errors[0] : undefined)
    return result
  }

  /**
   * Validates the given input string to all added arguments
   * @param args the string which should get validated
   */
  validateArgs(args: string) {
    args = args.trim()
    const resolved: Record<string, any> = {}
    const errors: Array<ParseError> = []
    this.getArguments().forEach(arg => {
      try {
        const [val, rest] = arg.validate(args)
        resolved[arg.getName()] = val
        return args = rest.trim()
      } catch (e) {
        if (e instanceof ParseError && arg.isOptional()) {
          resolved[arg.getName()] = arg.getDefault()
          return errors.push(e)
        }
        throw e
    }
    })
    return { result: resolved, remaining: args, errors }
  }

  static createArgumentLayer() {
    return {
      string: new StringArgument(),
      number: new NumberArgument(),
      client: new ClientArgument(),
      rest: new RestArgument(),
    }
  }
}


export interface Command {
  run(callback: runHandler): void
}