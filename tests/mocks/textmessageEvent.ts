import { Commander, CommanderTextMessage } from "../../src"
import { TeamSpeakClient, TextMessageTargetMode, TextMessageEvent } from "ts3-nodejs-library"

interface Mocks {
  sendTextMessage?: jest.Mock
}

const TeamSpeak = (mocks: Mocks): any => ({
  sendTextMessage(...args: any[]) {
    if (mocks.sendTextMessage) mocks.sendTextMessage(...args)
  }
})

const clientlistProps: any = {
  clientNickname: "foo",
  clid: "1337",
  cid: "1338"
}

export const textmessageEvent = (commander: Commander, mocks: Mocks = {}): CommanderTextMessage => {
  const teamspeak = TeamSpeak(mocks)
  const invoker = new TeamSpeakClient(teamspeak, clientlistProps)
  const teamspeakChatMessage: TextMessageEvent = {
    targetmode: TextMessageTargetMode.CHANNEL,
    invoker,
    msg: "!test 123",
  }
  return {
    reply: commander.getReplyFunction(teamspeakChatMessage),
    teamspeak,
    args: {},
    ...teamspeakChatMessage
  }
}