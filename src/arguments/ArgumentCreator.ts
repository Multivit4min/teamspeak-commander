import { StringArgument } from "../arguments/StringArgument"
import { NumberArgument } from "../arguments/NumberArgument"
import { RestArgument } from "../arguments/RestArgument"
import { ClientArgument } from "../arguments/ClientArgument"
import { Argument } from "../arguments/Argument"
import { GroupArgument } from "./GroupArgument"

export interface ArgType {
  string: StringArgument
  number: NumberArgument
  client: ClientArgument
  rest: RestArgument
  or: GroupArgument
  and: GroupArgument
}

export type createArgumentHandler = (arg: ArgType) => Argument

/** creates new object with argument options */
export function createArgumentLayer(): ArgType {
  return {
    string: new StringArgument(),
    number: new NumberArgument(),
    client: new ClientArgument(),
    rest: new RestArgument(),
    or: new GroupArgument(GroupArgument.Type.OR),
    and: new GroupArgument(GroupArgument.Type.AND),
  }
}