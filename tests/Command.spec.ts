import { Command } from "../src/Command"
import { Commander } from "../src/Commander"

describe("Command", () => {
  let command: Command
  let commander: Commander

  beforeEach(() => {
    commander = new Commander({ prefix: "!" })
    command = new Command("test", commander)
  })

  describe("getPrefix()", () => {
    it("should test with default prefix", () => {
      expect(command.getPrefix()).toBe("!")
    })
  
    it("should test with a custom prefix", () => {
      command.setPrefix("$")
      expect(command.getPrefix()).toBe("$")
    })
  })

  describe("isEnabled()", () => {
    it("should test if the command is enabled by default", () => {
      expect(command.isEnabled()).toBe(true)
    })
  
    it("should test disabling a command", () => {
      command.enable(false)
      expect(command.isEnabled()).toBe(false)
    })
  
    it("should test reenabling a command", () => {
      command.enable(false)
      command.enable(true)
      expect(command.isEnabled()).toBe(true)
    })
  })

  describe("getFullCommandName()", () => {
    it("should test with default prefix", () => {
      expect(command.getFullCommandName()).toBe("!test")
    })
  
    it("should test with a custom prefix", () => {
      command.setPrefix("$")
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