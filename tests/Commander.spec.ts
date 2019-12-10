import { Commander } from "../src/Commander"

describe("Command", () => {
  let commander: Commander

  beforeEach(() => {
    commander = new Commander({ prefix: "!" })
  })

  describe("prefix()", () => {
    it("should get the correct default prefix", () => {
      expect(commander.prefix()).toBe("!")
    })
  })
})