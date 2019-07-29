import { Argument } from "./Argument"
import { ParseError } from "../exceptions/ParseError"

export class ClientArgument extends Argument {

  /**
   * Tries to validate a TeamSpeak Client URL or UID
   * @param args the input from where the client gets extracted
   */
  validate(args: string) {
    const match = args.match(/^(\[URL=client:\/\/\d*\/(?<url_uid>[\/+a-z0-9]{27}=)~.*\].*\[\/URL\]|(?<uid>[\/+a-z0-9]{27}=)) *(?<rest>.*)$/i)
    if (!match || !match.groups) throw new ParseError("Client not found!", this)
    return [match.groups.url_uid || match.groups.uid, match.groups.rest]
  }
}