import { ParseError } from "../src/exceptions/ParseError"
import { CommandDisabledError } from "../src/exceptions/CommandDisabledError"
import { CommandNotFoundError } from "../src/exceptions/CommandNotFoundError"
import { PermissionError } from "../src/exceptions/PermissionError"
import { ThrottleError } from "../src/exceptions/ThrottleError"
import { TooManyArgumentsError } from "../src/exceptions/TooManyArgumentsError"

import { StringArgument } from "../src/arguments/StringArgument"

describe("Exceptions", () => {


  describe("ParseError", () => {
    it("should test parameters of the error", () => {
      const arg = new StringArgument().setName("foo")
      const error = new ParseError("something bad happened", arg)
      expect(error.argument).toEqual(arg)
    })
  })

  describe("CommandDisabledError", () => {
    it("should test parameters of the error", () => {
      const error = new CommandDisabledError("foobar")
      expect(error.message).toEqual("foobar")
    })
  })

  describe("CommandNotFoundError", () => {
    it("should test parameters of the error", () => {
      const error = new CommandNotFoundError("foobar")
      expect(error.message).toEqual("foobar")
    })
  })

  describe("PermissionError", () => {
    it("should test parameters of the error", () => {
      const error = new PermissionError("foobar")
      expect(error.message).toEqual("foobar")
    })
  })

  describe("ThrottleError", () => {
    it("should test parameters of the error", () => {
      const error = new ThrottleError("foobar")
      expect(error.message).toEqual("foobar")
    })
  })

  describe("TooManyArgumentsError", () => {
    it("should test parameters of the error", () => {
      const arg = new StringArgument().setName("foo")
      const parseError = new ParseError("something bad happened", arg)
      const error = new TooManyArgumentsError("foobar", parseError)
      expect(error.parseError).toEqual(parseError)
    })
  })

})