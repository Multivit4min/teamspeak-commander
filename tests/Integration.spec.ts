import { Commander } from "../src/Commander"
import { TextMessageTargetMode } from "ts3-nodejs-library"
import { ArgType } from "../src/Command"
const runCallback = jest.fn()
const replyCallback = jest.fn()

describe("Integration", () => {
  let commander: Commander

  beforeEach(() => {
    commander = new Commander({ prefix: "!" })
    runCallback.mockClear()
    replyCallback.mockClear()
    replyCallback.mockResolvedValue(null)
  })

  it("should test a simple command", () => {
    return new Promise(fulfill => {
      commander
        .createCommand("test")
        .setHelp("sometext")
        .run(runCallback)

      commander["textMessageHandler"]({
        invoker: <any>{ nick: "foo", isQuery: () => false },
        msg: "!test",
        targetmode: TextMessageTargetMode.CHANNEL,
        reply: replyCallback,
        teamspeak: <any>{},
        arguments: {}
      })
      
      setImmediate(() => {
        expect(replyCallback).toBeCalledTimes(0)
        expect(runCallback).toBeCalledTimes(1)
        expect(runCallback.mock.calls[0][0].invoker.nick).toBe("foo")
        expect(runCallback.mock.calls[0][0].msg).toBe("!test")
        expect(runCallback.mock.calls[0][0].arguments).toEqual({})
        fulfill()
      })
    })
  })

  it("should test a simple command", () => {
    return new Promise(fulfill => {
      commander
        .createCommand("test")
        .setHelp("sometext")
        .addArgument((arg: ArgType ) => {
          return arg.string.setName("param").min(1)
        })
        .run(runCallback)

      commander["textMessageHandler"]({
        invoker: <any>{ nick: "foo", isQuery: () => false },
        msg: "!test 123",
        targetmode: TextMessageTargetMode.CHANNEL,
        reply: replyCallback,
        teamspeak: <any>{},
        arguments: {}
      })

      setImmediate(() => {
        expect(replyCallback).toBeCalledTimes(0)
        expect(runCallback).toBeCalledTimes(1)
        expect(runCallback.mock.calls[0][0].invoker.nick).toBe("foo")
        expect(runCallback.mock.calls[0][0].msg).toBe("!test 123")
        expect(runCallback.mock.calls[0][0].arguments).toEqual({ param: "123" })
        fulfill()
      })
    })
  })

})