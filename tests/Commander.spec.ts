import { Commander } from "../src/Commander"

describe("Command", () => {
  let commander: Commander

  beforeEach(() => {
    commander = new Commander({ prefix: "!" })
  })

  describe("defaultPrefix()", () => {
    it("should get the correct default prefix", () => {
      expect(commander.defaultPrefix()).toBe("!")
    })
  })
})