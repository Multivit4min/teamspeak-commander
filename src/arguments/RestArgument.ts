import { StringArgument } from "./StringArgument"

export class RestArgument extends StringArgument {

  /**
   * Validates the given String to the RestArgument
   * @param args the remaining args
   */
  validate(args: string) {
      return super._validate(args, "")
  }
}