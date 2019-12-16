import { Argument } from "./Argument"
import { ParseError } from "../exceptions/ParseError"
import { createArgumentHandler, createArgumentLayer } from "./ArgumentCreator"

export class GroupArgument extends Argument {
  private type: GroupArgument.Type
  private arguments: Argument[] = []

  constructor(type: GroupArgument.Type) {
    super()
    this.type = type
  }

  /**
   * Validates the given String to the GroupArgument
   * @private
   * @param args the remaining args
   */
  validate(args: string) {
    switch (this.type) {
      case GroupArgument.Type.OR: return this.validateOr(args)
      case GroupArgument.Type.AND: return this.validateAnd(args)
    }
  }

  /**
   * Validates the given string to the "or" of the GroupArgument
   * @param {string} args the remaining args
   */
  private validateOr(args: string) {
    const errors: Error[] = []
    const resolved: Record<string, any> = {}
    const valid = this.arguments.some(arg => {
      try {
        const result = arg.validate(args)
        resolved[arg.getName()] = result[0]
        return (args = result[1].trim(), true)
      } catch (e) {
        errors.push(e)
        return false
      }
    })
    if (!valid) throw new ParseError(`No valid match found`, this)
    return [resolved, args]
  }

  /**
   * Validates the given string to the "and" of the GroupArgument
   * @param args the remaining args
   */
  private validateAnd(args: string) {
    const resolved: Record<string, any> = {}
    let error = null
    this.arguments.some(arg => {
      try {
        const result = arg.validate(args)
        resolved[arg.getName()] = result[0]
        return (args = result[1].trim(), false)
      } catch (e) {
        error = e
        return true
      }
    })
    if (error !== null) return error
    return [resolved, args]
  }

  /**
   * adds an argument to the command
   * @param argument an argument to add
   */
  addArgument(callback: createArgumentHandler) {
    this.arguments.push(callback(createArgumentLayer()))
    return this
  }
}

export namespace GroupArgument {
  export enum Type {
    OR = "or",
    AND = "and"
  }
}