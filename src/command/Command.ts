import { Commander, CommanderTextMessage } from "../Commander"
import { TeamSpeakClient } from "ts3-nodejs-library/lib/node/Client"
import { Argument } from "../arguments/Argument"
import { StringArgument } from "../arguments/StringArgument"
import { NumberArgument } from "../arguments/NumberArgument"
import { RestArgument } from "../arguments/RestArgument"
import { ClientArgument } from "../arguments/ClientArgument"
import { ParseError } from "../exceptions/ParseError"
import { TooManyArguments } from "../exceptions/TooManyArgumentsError"
import { BaseCommand } from "./BaseCommand"

export interface ArgType {
  string: StringArgument,
  number: NumberArgument,
  client: ClientArgument,
  rest: RestArgument
}

export type argumentCreateHandler = (arg: ArgType) => Argument

export class Command extends BaseCommand {
  private arguments: Argument[] = []

  constructor(cmd: string, commander: Commander) {
    super(cmd, commander)
  }

  /**
   * Retrieves the usage of the command with its parameterized names
   * @returns retrieves the complete usage of the command with its argument names
   */
  getUsage() {
    return `${this.getFullCommandName()} ${this.getArguments().map(arg => arg.getManual()).join(" ")}`
  }

  /**
   * checks if a client should have permission to use this command
   * @param client the client which should be checked
   */
  hasPermission(client: TeamSpeakClient) {
    return this.permCheck(client)
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
   * Validates the command
   * @param args the arguments from the command which should be validated
   */
  validate(args: string) {
    const { result, errors, remaining } = this.validateArgs(args)
    if (remaining.length > 0) throw new TooManyArguments(`Too many argument!`, errors.length > 0 ? errors[0] : undefined)
    return result
  }

  handleRequest(args: string, ev: CommanderTextMessage) {
    this.dispatchCommand({ ...ev, arguments: this.validate(args) })
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

  /** creates new object with argument options */
  static createArgumentLayer() {
    return {
      string: new StringArgument(),
      number: new NumberArgument(),
      client: new ClientArgument(),
      rest: new RestArgument(),
    }
  }
}