import { Argument } from "../arguments/Argument"

/**
 * Class representing a ParseError
 * gets thrown when an Argument has not been parsed successful
 * @extends Error
 * @param err the error which will be handed over to the Error instance
 * @param argument the argument which failed
 */
export class ParseError extends Error {
  argument: Argument

  constructor(err: string, argument: Argument) {
      super(err)
      this.argument = argument
  }
}