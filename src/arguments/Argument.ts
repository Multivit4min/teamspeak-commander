export abstract class Argument {
  private opt: boolean
  private name: string
  private display: string
  private displayDefault: boolean
  private default: any

  constructor() {
    this.opt = false
    this.name = "_"
    this.display = "_"
    this.displayDefault = true
    this.default = undefined
  }

  /**
   * Sets an Argument as optional
   * if the argument has not been parsed successful it will use the first argument which has been given inside this method
   * @param fallback the default value which should be set if this parameter has not been found
   * @param displayDefault wether it should display the default value when called with the #getUsage method
   */
  optional(fallback?: any, displayDefault: boolean = true) {
    this.displayDefault = displayDefault
    this.default = fallback
    this.opt = true
    return this
  }

  /** retrieves the default value if it had been set */
  getDefault() {
    return this.default
  }

  /** checks if the Argument has a default value */
  hasDefault(): boolean {
    return this.default !== undefined
  }

  /** gets the manual of a command */
  getManual(): string {
    if (this.isOptional()) {
      if (this.displayDefault && this.hasDefault()) {
        return `[${this.display}=${this.getDefault()}]`
      } else {
        return `[${this.display}]`
      }
    } else {
      return `<${this.display}>`
    }
  }

  /** checks if the Argument is optional */
  isOptional(): boolean {
    return this.opt
  }

  /**
   * Sets a name for the argument to identify it later when the command gets dispatched
   * This name will be used when passing the parsed argument to the exec function
   * @param name sets the name of the argument
   * @param display sets a beautified display name which will be used when the getManual command gets executed, if none given it will use the first parameter as display value
   */
  setName(name: string, display?: string) {
    this.display = display === undefined ? name : display
    if (typeof name !== "string") throw new Error("Argument of setName needs to be a string")
    if (name.length < 1) throw new Error("Argument of setName needs to be at least 1 char long")
    if (!name.match(/^[a-z0-9_]+$/i)) throw new Error("Argument of setName should contain only chars A-z, 0-9 and _")
    this.name = name
    return this
  }

  /**
   * Retrieves the name of the Argument
   * @returns {string} retrieves the arguments name
   */
  getName() {
    return this.name
  }

  abstract validate(args: string): Array<any>
}