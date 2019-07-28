import { Argument } from "./Argument"
import { ParseError } from "../exceptions/ParseError"

export class GroupArgument extends Argument {
  private type: GroupArgument.Type
  private args: Array<Argument>

  constructor(type: GroupArgument.Type) {
    super()
    this.type = type
    this.args = []
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
      default: throw new Error(`${this.type} not a valid Group Type`)
    }
  }

  /**
   * Validates the given string to the "or" of the GroupArgument
   * @param {string} args the remaining args
   */
  private validateOr(args: string) {
    const errors = []
    const resolved: Record<string, any> = {}
    const valid = this.args.some(arg => {
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
    this.args.some(arg => {
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
   * Adds one or multiple argument to the validation chain
   * @param args the remaining args
   */
  argument(...args: Argument[]) {
    this.args.push(...args)
    return this
  }
}

export namespace GroupArgument {
  export enum Type {
    OR = "or",
    AND = "and"
  }
}