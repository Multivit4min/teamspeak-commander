import { CommanderTextMessage } from "../../src/util/types"
import { TeamSpeakClient, TextMessageTargetMode } from "ts3-nodejs-library"

const teamspeak: any = {}
const clientlistProps: any = {
  client_nickname: "foo",
  clid: 1337,
  cid: 1338
}
const invoker = new TeamSpeakClient(teamspeak, clientlistProps)

export const textmessageEvent = (mock: (...args: any) => any): CommanderTextMessage => ({
  invoker,
  msg: "!test 123",
  targetmode: TextMessageTargetMode.CHANNEL,
  reply: mock,
  teamspeak,
  args: {}
})