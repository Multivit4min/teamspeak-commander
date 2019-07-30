import { StringArgument } from "../src/arguments/StringArgument"
import { ParseError } from "../src/exceptions/ParseError"

describe("Integration", () => {
  let arg: StringArgument

  beforeEach(() => {
    arg = new StringArgument()
  })

  it("should parse a string successfully", () => {
    expect(arg.validate("foo")).toEqual(["foo", ""])
  })

  it("should parse a string with additional parameters successfully", () => {
    expect(arg.validate("foo bar baz")).toEqual(["foo", "bar baz"])
  })

  describe("#match()", () => {
    it("should throw an error", () => {
      expect(() => arg.match(/bar/i).validate("foo")).toThrow(ParseError)
    })
    it("should parse successfully", () => {
      expect(arg.match(/bar/i).validate("bar")).toEqual(["bar", ""])
    })
  })

  describe("#minimum()", () => {
    it("should throw an error", () => {
      expect(() => arg.minimum(3).validate("fo")).toThrow(ParseError)
    })
    it("should parse successfully", () => {
      expect(arg.minimum(3).validate("foo")).toEqual(["foo", ""])
    })
  })

  describe("#maximum()", () => {
    it("should throw an error", () => {
      expect(() => arg.maximum(2).validate("foo")).toThrow(ParseError)
    })
    it("should parse successfully", () => {
      expect(arg.maximum(2).validate("fo")).toEqual(["fo", ""])
    })
  })

  describe("#forceUpperCase()", () => {
    it("should parse successfully", () => {
      expect(arg.forceUpperCase().validate("fOo bAr")).toEqual(["FOO", "bAr"])
    })
  })

  describe("#forceLowerCase()", () => {
    it("should parse successfully", () => {
      expect(arg.forceLowerCase().validate("fOo bAr")).toEqual(["foo", "bAr"])
    })
  })

  describe("#allow()", () => {
    it("should throw an error", () => {
      expect(() => arg.allow(["foo", "bar"]).validate("baz")).toThrow(ParseError)
    })
    it("should parse successfully", () => {
      expect(arg.allow(["foo", "bar"]).validate("foo")).toEqual(["foo", ""])
    })
  })

})