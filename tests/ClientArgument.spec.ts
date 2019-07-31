import { ClientArgument } from "../src/arguments/ClientArgument"
import { ParseError } from "../src/exceptions/ParseError"


describe("Argument", () => {
  let arg: ClientArgument
  
  beforeEach(() => {
    arg = new ClientArgument()
  })

  it("should find an url", () => {
    expect(arg.validate("[URL=client://3/NF61yPIiDvYuOJ/Bbeod84bw6dE=~FooBar]FooBar[/URL] foo bar"))
      .toEqual(["NF61yPIiDvYuOJ/Bbeod84bw6dE=", "foo bar"])
  })

  it("should find an uid", () => {
    expect(arg.validate("NF61yPIiDvYuOJ/Bbeod84bw6dE= foo bar"))
      .toEqual(["NF61yPIiDvYuOJ/Bbeod84bw6dE=", "foo bar"])
  })

  it("should throw an error on invalid input", () => {
    expect(() => arg.validate("foo bar"))
      .toThrowError(ParseError)
  })
})