import { Command } from "../src/command/Command"
import { Commander } from "../src/Commander"
import { textmessageEvent } from "./mocks/textmessageEvent"

describe("Command", () => {
  let command: Command
  let commander: Commander
  let textEvent: ReturnType<typeof textmessageEvent>

  beforeEach(() => {
    commander = new Commander({ prefix: "!" })
    command = new Command("test", commander)
    textEvent = textmessageEvent(jest.fn())
  })

  describe("getPrefix()", () => {
    it("should test with default prefix", () => {
      expect(command.getPrefix()).toBe("!")
    })
  
    it("should test with a custom prefix", () => {
      command.prefix("$")
      expect(command.getPrefix()).toBe("$")
    })
  })

  describe("getHelp()", () => {
    it("should test an empty help text", () => {
      expect(command.getHelp(textEvent.invoker)).toBe("")
    })
  
    it("should test a custom help text", () => {
      command.help("foobar")
      expect(command.getHelp(textEvent.invoker)).toBe("foobar")
    })
  })

  describe("getManual()", () => {
    it("should test an empty manual text", () => {
      expect(command.getManual(textEvent.invoker)).toBe("")
    })
  
    it("should test a single line manual text", () => {
      command.manual("foo")
      expect(command.getManual(textEvent.invoker)).toBe("foo")
    })
  
    it("should test a multiline line manual text", () => {
      command.manual("foo").manual("bar")
      expect(command.getManual(textEvent.invoker)).toBe("foo\r\nbar")
    })
  
    it("should clear a manual", () => {
      command.manual("foo").manual("bar").clearManual()
      expect(command.getManual(textEvent.invoker)).toBe("")
    })
  })

  describe("isEnabled()", () => {
    it("should test if the command is enabled by default", () => {
      expect(command.isEnabled()).toBe(true)
    })
  
    it("should test disabling a command", () => {
      command.disable()
      expect(command.isEnabled()).toBe(false)
    })
  
    it("should test reenabling a command", () => {
      command.disable().enable()
      expect(command.isEnabled()).toBe(true)
    })
  })

  describe("getFullCommandName()", () => {
    it("should test with default prefix", () => {
      expect(command.getFullCommandName()).toBe("!test")
    })
  
    it("should test with a custom prefix", () => {
      command.prefix("$")
      expect(command.getFullCommandName()).toBe("$test")
    })
  })

  describe("hasPermission()", () => {
    it("should check permission and resolve to true when no handlers are set", async () => {
      expect(await command.hasPermission(<any>{})).toBe(true)
    })
    it("should check permission and resolve to true when one handler is set", async () => {
      command.checkPermission(() => true)
      expect(await command.hasPermission(<any>{})).toBe(true)
    })
    it("should check permission and resolve to false when one handler is set", async () => {
      command.checkPermission(() => false)
      expect(await command.hasPermission(<any>{})).toBe(false)
    })
    it("should check permission and resolve to false when multiple handlers are set", async () => {
      command.checkPermission(() => true)
      command.checkPermission(() => false)
      command.checkPermission(() => true)
      expect(await command.hasPermission(<any>{})).toBe(false)
    })
  })

})