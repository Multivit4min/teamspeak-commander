import { Commander, CommanderTextMessage } from "../src/Commander"
import { TextMessageTargetMode } from "ts3-nodejs-library"
import { ArgType } from "../src/command/Command"
const runCallback = jest.fn()
const replyCallback = jest.fn()

const event: CommanderTextMessage = {
  invoker: <any>{ nick: "foo", isQuery: () => false },
  msg: "!test 123",
  targetmode: TextMessageTargetMode.CHANNEL,
  reply: replyCallback,
  teamspeak: <any>{},
  arguments: {}
}

describe("Integration", () => {
  let commander: Commander
  let dummyEvent: CommanderTextMessage

  beforeEach(() => {
    commander = new Commander({ prefix: "!" })
    dummyEvent = { ...event }
    runCallback.mockClear()
    replyCallback.mockClear()
    replyCallback.mockResolvedValue(null)
  })

  it("should test a simple command", () => {
    return new Promise(fulfill => {
      commander
        .createCommand("test")
        .run(runCallback)

      commander["textMessageHandler"]({ ...dummyEvent, msg: "!test" })
      
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

  it("should test a simple command with a string argument", () => {
    return new Promise(fulfill => {
      commander
        .createCommand("test")
        .addArgument((arg: ArgType) => arg.string.setName("param"))
        .run(runCallback)

      commander["textMessageHandler"]({ ...dummyEvent, msg: "!test 123" })

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

  it("should test a simple command with a number argument", () => {
    return new Promise(fulfill => {
      commander
        .createCommand("test")
        .addArgument((arg: ArgType) => arg.number.setName("param"))
        .run(runCallback)

      commander["textMessageHandler"]({ ...dummyEvent, msg: "!test 123" })

      setImmediate(() => {
        expect(replyCallback).toBeCalledTimes(0)
        expect(runCallback).toBeCalledTimes(1)
        expect(runCallback.mock.calls[0][0].invoker.nick).toBe("foo")
        expect(runCallback.mock.calls[0][0].msg).toBe("!test 123")
        expect(runCallback.mock.calls[0][0].arguments).toEqual({ param: 123 })
        fulfill()
      })
    })
  })

  describe("client argument", () => {
    it("should test with an uid", () => {
      return new Promise(fulfill => {
        commander
          .createCommand("test")
          .addArgument((arg: ArgType) => arg.client.setName("param"))
          .run(runCallback)
  
        commander["textMessageHandler"]({ ...dummyEvent, msg: "!test NF61yPIiDvYuOJ/Bbeod84bw6dE=" })
  
        setImmediate(() => {
          expect(replyCallback).toBeCalledTimes(0)
          expect(runCallback).toBeCalledTimes(1)
          expect(runCallback.mock.calls[0][0].invoker.nick).toBe("foo")
          expect(runCallback.mock.calls[0][0].msg).toBe("!test NF61yPIiDvYuOJ/Bbeod84bw6dE=")
          expect(runCallback.mock.calls[0][0].arguments).toEqual({ param: "NF61yPIiDvYuOJ/Bbeod84bw6dE=" })
          fulfill()
        })
      })
    })

    it("should test with a client url", () => {
      return new Promise(fulfill => {
        const msg = "!test [URL=client://1/NF61yPIiDvYuOJ/Bbeod84bw6dE=~Foo%20Bar]Foo Bar[/URL]"

        commander
          .createCommand("test")
          .addArgument((arg: ArgType) => arg.client.setName("param"))
          .run(runCallback)
  
        commander["textMessageHandler"]({ ...event,  msg })

        setImmediate(() => {
          expect(replyCallback).toBeCalledTimes(0)
          expect(runCallback).toBeCalledTimes(1)
          expect(runCallback.mock.calls[0][0].invoker.nick).toBe("foo")
          expect(runCallback.mock.calls[0][0].msg).toBe(msg)
          expect(runCallback.mock.calls[0][0].arguments).toEqual({ param: "NF61yPIiDvYuOJ/Bbeod84bw6dE=" })
          fulfill()
        })
      })
    })
  })

})