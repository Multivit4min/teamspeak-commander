import { Commander } from "../src/Commander"
import { Throttle } from "../src/util/Throttle"
import { textmessageEvent } from "./mocks/textmessageEvent"
import { CommandNotFoundError } from "../src/exceptions/CommandNotFoundError"
import { ParseError } from "../src/exceptions/ParseError"
import { ThrottleError } from "../src/exceptions/ThrottleError"
import { TooManyArgumentsError } from "../src/exceptions/TooManyArgumentsError"
import { BaseCommand } from "../src/command/BaseCommand"
import { TranslationStringGetter } from "../src/util/types"
import { PermissionError } from "../src/exceptions/PermissionError"
import { TextMessageTargetMode } from "ts3-nodejs-library"
const replyMock = jest.fn()

describe("Command", () => {
  let commander: Commander
  let textEvent: ReturnType<typeof textmessageEvent>

  beforeEach(() => {
    commander = new Commander({ prefix: "!" })
    textEvent = textmessageEvent(replyMock)
    replyMock.mockClear()
    replyMock.mockResolvedValue(null)
  })

  describe("createThrottle()", () => {
    it("should return an instance of Throttle", () => {
      expect(Commander.createThrottle()).toBeInstanceOf(Throttle)
    })
  })

  describe("getTranslator()", () => {
    it("it should check the parsed string of COMMAND_NOT_FOUND", () => {
      const teamspeak: any = {}
      const translator = commander["getTranslator"](textEvent, teamspeak)
      expect(translator(commander.config.COMMAND_NOT_FOUND))
        .toBe("no command found")
    })

    it("it should check the parsed string of COMMAND_NO_PERMISSION", () => {
      const teamspeak: any = {}
      const translator = commander["getTranslator"](textEvent, teamspeak)
      expect(translator(commander.config.COMMAND_NO_PERMISSION))
        .toBe(`You do not have permissions to use this command!\nTo get a list of available commands see [b]${commander.prefix()}help[/b]`)
    })

    it("it should check the parsed string of SUBCOMMAND_NOT_FOUND", () => {
      const teamspeak: any = {}
      const translator = commander["getTranslator"](textEvent, teamspeak)
      const props = {
        commander,
        error: new CommandNotFoundError("not found"),
        cmd: commander.createCommandGroup("foo")
      }
      expect(translator(commander.config.SUBCOMMAND_NOT_FOUND, props))
        .toBe(`${props.error.message}\nFor Command usage see ${commander.prefix()}man ${props.cmd.getCommandName()}\n`)
    })

    it("it should check the parsed string of COMMAND_PARSE_ERROR", () => {
      const teamspeak: any = {}
      const argument: any = {}
      const translator = commander["getTranslator"](textEvent, teamspeak)
      const props = {
        commander,
        error: new ParseError("parse error", argument),
        cmd: commander.createCommandGroup("foo")
      }
      expect(translator(commander.config.COMMAND_PARSE_ERROR, props))
        .toBe(`Invalid Command usage! For Command usage see [b]${commander.prefix()}man ${props.cmd.getCommandName()}[/b]\n`)
    })

    it("it should check the parsed string of COMMAND_THROTTLE_ERROR", () => {
      const teamspeak: any = {}
      const translator = commander["getTranslator"](textEvent, teamspeak)
      const props = {
        commander,
        error: new ThrottleError("throttle error"),
        cmd: commander.createCommandGroup("foo")
      }
      expect(translator(commander.config.COMMAND_THROTTLE_ERROR, props))
        .toBe(props.error.message)
    })

    it("it should check the parsed string of COMMAND_TOO_MANY_ARGUMENTS_ERROR", () => {
      const teamspeak: any = {}
      const translator = commander["getTranslator"](textEvent, teamspeak)
      const props = {
        commander,
        error: new TooManyArgumentsError("throttle error"),
        cmd: commander.createCommandGroup("foo")
      }
      expect(translator(commander.config.COMMAND_TOO_MANY_ARGUMENTS_ERROR, props))
        .toBe(`Too many Arguments received for this Command!\nInvalid Command usage! For Command usage see [b]${commander.prefix()}man ${props.cmd.getCommandName()}[/b]`)
    })
  
  })

  describe("prefix()", () => {
    it("should get the correct default prefix", () => {
      expect(commander.prefix()).toBe("!")
    })
  })

  describe("isPossibleCommand()", () => {
    it("should find a possible command successfully", () => {
      expect(commander.isPossibleCommand("!foo")).toBe(true)
    })
    it("should not find a possible command", () => {
      expect(commander.isPossibleCommand("$foo")).toBe(false)
    })
    it("should find a custom prefix on a command", () => {
      commander.createCommand("foo").prefix("$")
      expect(commander.isPossibleCommand("$foo")).toBe(true)
    })
  })

  describe("runCommand()", () => {
    let cmd: BaseCommand
    let translate: TranslationStringGetter
    let teamspeak: any = {}
    let handleRequestMock: jest.Mock

    beforeEach(() => {
      cmd = commander.createCommand("foo")
      handleRequestMock = jest.fn()
      cmd["handleRequest"] = handleRequestMock
      translate = commander["getTranslator"](textEvent, teamspeak)
    })

    describe("error handling", () => {
      it("should catch a CommandNotFoundError", async () => {
        expect.assertions(1)
        handleRequestMock.mockRejectedValue(new CommandNotFoundError("not found"))
        await commander["runCommand"](cmd, "", textEvent, translate)
        expect(replyMock).toBeCalledTimes(1)
      })
      it("should catch a PermissionError", async () => {
        expect.assertions(1)
        handleRequestMock.mockRejectedValue(new PermissionError("permission error"))
        await commander["runCommand"](cmd, "", textEvent, translate)
        expect(replyMock).toBeCalledTimes(1)
      })
      it("should catch a ParseError", async () => {
        const argument: any = {}
        expect.assertions(1)
        handleRequestMock.mockRejectedValue(new ParseError("parse error", argument))
        await commander["runCommand"](cmd, "", textEvent, translate)
        expect(replyMock).toBeCalledTimes(1)
      })
      it("should catch a ThrottleError", async () => {
        expect.assertions(1)
        handleRequestMock.mockRejectedValue(new ThrottleError("throttle error"))
        await commander["runCommand"](cmd, "", textEvent, translate)
        expect(replyMock).toBeCalledTimes(1)
      })
      it("should catch a TooManyArgumentsError", async () => {
        expect.assertions(1)
        handleRequestMock.mockRejectedValue(new TooManyArgumentsError("too many arguments error"))
        await commander["runCommand"](cmd, "", textEvent, translate)
        expect(replyMock).toBeCalledTimes(1)
      })
      it("should throw a generic error", async () => {
        expect.assertions(2)
        const error = new Error("generic error")
        handleRequestMock.mockRejectedValue(error)
        await expect(commander["runCommand"](cmd, "", textEvent, translate)).rejects.toEqual(error)
        expect(replyMock).toBeCalledTimes(0)
      })
    })
  })

  describe("getReplyOutput()", () => {
    let sendTextMessageMock: jest.Mock
    const teamspeak: any = {
    }

    beforeEach(() => {
      sendTextMessageMock = jest.fn()
      teamspeak.sendTextMessage = sendTextMessageMock
    })

    it("should retrieve the correct function to reply to a client", async () => {
      expect.assertions(2)
      textEvent.targetmode = TextMessageTargetMode.CLIENT
      await Commander.getReplyFunction(textEvent, teamspeak)("foo")
      expect(sendTextMessageMock).toHaveBeenCalledTimes(1)
      expect(sendTextMessageMock).toBeCalledWith(1337, TextMessageTargetMode.CLIENT, "foo")
    })

    it("should retrieve the correct function to reply to a channel", async () => {
      expect.assertions(2)
      textEvent.targetmode = TextMessageTargetMode.CHANNEL
      await Commander.getReplyFunction(textEvent, teamspeak)("foo")
      expect(sendTextMessageMock).toHaveBeenCalledTimes(1)
      expect(sendTextMessageMock).toBeCalledWith(1338, TextMessageTargetMode.CHANNEL, "foo")
    })

    it("should retrieve the correct function to reply to a server", async () => {
      expect.assertions(2)
      textEvent.targetmode = TextMessageTargetMode.SERVER
      await Commander.getReplyFunction(textEvent, teamspeak)("foo")
      expect(sendTextMessageMock).toHaveBeenCalledTimes(1)
      expect(sendTextMessageMock).toBeCalledWith(0, TextMessageTargetMode.SERVER, "foo")
    })
  })

  describe("addInstance()", () => {
    let teamspeak: any = {
      on: jest.fn(),
      registerEvent: jest.fn()
    }

    beforeEach(() => {
      teamspeak.on.mockClear()
      teamspeak.registerEvent.mockClear()
      teamspeak.registerEvent.mockResolvedValue(0)
    })

    it("should add a teamspeak instance without registering commands", async () => {
      expect.assertions(2)
      await commander.addInstance(teamspeak, false)
      expect(teamspeak.on).toBeCalledTimes(1)
      expect(teamspeak.registerEvent).toBeCalledTimes(0)
    })

    it("should add a teamspeak instance with registering commands", async () => {
      expect.assertions(2)
      await commander.addInstance(teamspeak)
      expect(teamspeak.on).toBeCalledTimes(1)
      expect(teamspeak.registerEvent).toBeCalledTimes(3)
    })
  })
})