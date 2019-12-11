export abstract class Argument {
  private argOptional: boolean = false
  private argName: string = "_"
  private argDisplay: string = "_"
  private argDisplayDefault: boolean = true
  private argDefault: any = undefined

  abstract validate(args: string): Array<any>


  /**
   * Sets a name for the argument to identify it later when the command gets dispatched
   * This name will be used when passing the parsed argument to the exec function
   * @param name sets the name of the argument
   * @param display sets a beautified display name which will be used when the getManual command gets executed, if none given it will use the first parameter as display value
   */
  name(name: string, display?: string) {
    this.argDisplay = display === undefined ? name : display
    if (typeof name !== "string") throw new Error("Argument of setName needs to be a string")
    if (name.length < 1) throw new Error("Argument of setName needs to be at least 1 char long")
    if (!name.match(/^[a-z0-9_]+$/i)) throw new Error("Argument of setName should contain only chars A-z, 0-9 and _")
    this.argName = name
    return this
  }

  /**
   * Sets an Argument as optional
   * if the argument has not been parsed successful it will use the first argument which has been given inside this method
   * @param fallback the default value which should be set if this parameter has not been found
   * @param displayDefault wether it should display the default value when called with the #getUsage method
   */
  optional(fallback?: any, displayDefault: boolean = true) {
    this.argDisplayDefault = displayDefault
    this.argDefault = fallback
    this.argOptional = true
    return this
  }

  /** retrieves the default value if it had been set */
  getDefault() {
    return this.argDefault
  }

  /** checks if the Argument has a default value */
  hasDefault(): boolean {
    return this.argDefault !== undefined
  }

  /** gets the manual of a command */
  getManual() {
    if (this.isOptional()) {
      if (this.argDisplayDefault && this.hasDefault()) {
        return `[${this.argDisplay}=${this.getDefault()}]`
      } else {
        return `[${this.argDisplay}]`
      }
    } else {
      return `<${this.argDisplay}>`
    }
  }

  /** checks if the Argument is optional */
  isOptional(): boolean {
    return this.argOptional
  }

  /**
   * Retrieves the name of the Argument
   * @returns retrieves the arguments name
   */
  getName() {
    return this.argName
  }
}