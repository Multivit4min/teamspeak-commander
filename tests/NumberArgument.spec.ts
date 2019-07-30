import { NumberArgument } from "../src/arguments/NumberArgument"
import { ParseError } from "../src/exceptions/ParseError"

describe("Integration", () => {
  let arg: NumberArgument

  beforeEach(() => {
    arg = new NumberArgument()
  })

  it("should parse a number successfully", () => {
    expect(arg.validate("10")).toEqual([10, ""])
  })

  it("should parse a number with additional parameters successfully", () => {
    expect(arg.validate("10 foo bar")).toEqual([10, "foo bar"])
  })

  describe("#minimum()", () => {
    it("should throw an error", () => {
      expect(() => arg.minimum(10).validate("9")).toThrow(ParseError)
    })
    it("should parse successfully", () => {
      expect(arg.minimum(10).validate("10")).toEqual([10, ""])
    })
  })

  describe("#maximum()", () => {
    it("should throw an error", () => {
      expect(() => arg.maximum(10).validate("11")).toThrow(ParseError)
    })
    it("should parse successfully", () => {
      expect(arg.maximum(10).validate("10")).toEqual([10, ""])
    })
  })

  describe("#integer()", () => {
    it("should throw an error", () => {
      expect(() => arg.integer().validate("10.5")).toThrow(ParseError)
    })
    it("should parse successfully", () => {
      expect(arg.integer().validate("10")).toEqual([10, ""])
    })
  })

  describe("#positive()", () => {
    it("should throw an error", () => {
      expect(() => arg.positive().validate("-10")).toThrow(ParseError)
    })
    it("should parse successfully", () => {
      expect(arg.positive().validate("10")).toEqual([10, ""])
    })
  })

  describe("#negative()", () => {
    it("should throw an error", () => {
      expect(() => arg.negative().validate("10")).toThrow(ParseError)
    })
    it("should parse successfully", () => {
      expect(arg.negative().validate("-10")).toEqual([-10, ""])
    })
  })

})