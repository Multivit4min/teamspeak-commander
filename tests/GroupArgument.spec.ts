import { GroupArgument } from "../src/arguments/GroupArgument"

describe("GroupArgumnet", () => {

  it("should parse a OR group successfully", () => {
    const arg = new GroupArgument(GroupArgument.Type.OR)
      .addArgument(({ number }) => number.name("number"))
      .addArgument(({ string }) => string.name("string"))
    expect(arg.validate("10 bar")).toEqual([{ number: 10 }, "bar"])
    expect(arg.validate("foo bar")).toEqual([{ string: "foo" }, "bar"])
  })

  it("should parse a AND group successfully", () => {
    const arg = new GroupArgument(GroupArgument.Type.AND)
      .addArgument(({ number }) => number.name("number"))
      .addArgument(({ string }) => string.name("string"))
    expect(arg.validate("10 bar")).toEqual([{ number: 10, string: "bar" }, ""])
  })

})