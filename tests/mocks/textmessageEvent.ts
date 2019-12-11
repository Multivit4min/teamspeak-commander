import { CommanderTextMessage } from "../../src/util/types"
import { TextMessageTargetMode } from "ts3-nodejs-library"

export const textmessageEvent = (mock: (...args: any) => any): CommanderTextMessage => ({
  invoker: <any>{ nick: "foo", isQuery: () => false },
  msg: "!test 123",
  targetmode: TextMessageTargetMode.CHANNEL,
  reply: mock,
  teamspeak: <any>{},
  arguments: {}
})