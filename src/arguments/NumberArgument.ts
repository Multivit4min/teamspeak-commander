import { Argument } from "./Argument"
import { ParseError } from "../exceptions/ParseError"

export class NumberArgument extends Argument {
  private min: number|null = null
  private max: number|null = null
  private int: boolean = false
  private forcePositive: boolean = false
  private forceNegative: boolean = false

  /**
   * Validates the given Number to the Object
   * @param args the remaining args
   */
  validate(args: string) {
    const argArray = args.split(" ")
    const arg = <string>argArray.shift()
    const num = parseFloat(arg)
    if (!(/^-?\d+(\.\d+)?$/).test(arg) || isNaN(num)) throw new ParseError(`"${arg}" is not a valid number`, this)
    if (this.min !== null && this.min > num) throw new ParseError(`Number not greater or equal! Expected at least ${this.min}, but got ${num}`, this)
    if (this.max !== null && this.max < num) throw new ParseError(`Number not less or equal! Expected at least ${this.max}, but got ${num}`, this)
    if (this.int && num % 1 !== 0) throw new ParseError(`Given Number is not an Integer! (${num})`, this)
    if (this.forcePositive && num <= 0) throw new ParseError(`Given Number is not Positive! (${num})`, this)
    if (this.forceNegative && num >= 0) throw new ParseError(`Given Number is not Negative! (${num})`, this)
    return [num, argArray.join(" ")]
  }

  /**
   * specifies the minimum value
   * @param min the minimum length of the argument
   */
  minimum(min: number) {
    this.min = min
    return this
  }

  /**
   * specifies the maximum value
   * @param {number} max the maximum length of the argument
   */
  maximum(max: number) {
    this.max = max
    return this
  }

  /** specifies that the Number must be an integer (no floating point) */
  integer() {
    this.int = true
    return this
  }

  /** specifies that the Number must be a positive Number */
  positive() {
    this.forcePositive = true
    this.forceNegative = false
    return this
  }

  /** specifies that the Number must be a negative Number */
  negative() {
    this.forcePositive = false
    this.forceNegative = true
    return this
  }

}