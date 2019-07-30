import { StringArgument } from "../src/arguments/StringArgument"


describe("Argument", () => {
  let arg: StringArgument
  
  beforeEach(() => {
    arg = new StringArgument()
  })

  it("should validate #getDefault(), #isOptional() and #hasDefault()", () => {
    arg.optional("default value")
    expect(arg.getDefault()).toBe("default value")
    expect(arg.isOptional()).toBe(true)
    expect(arg.hasDefault()).toBe(true)
  })

  it("should validate #getName()", () => {
    arg.setName("foobar")
    expect(arg.getName()).toBe("foobar")
  })

  describe("getManual()", () => {
    it("should validate #getManual() on an optional argument without display parameter", () => {
      arg.setName("foobar").optional(false)
      expect(arg.getManual()).toBe("[foobar=false]")
    })
  
    it("should validate #getManual() on an optional argument with display parameter", () => {
      arg.setName("foobar", "foo").optional(false, false)
      expect(arg.getManual()).toBe("[foo]")
    })
  
    it("should validate #getManual() on an optional argument with display parameter", () => {
      arg.setName("foobar")
      expect(arg.getManual()).toBe("foobar")
    })
  })
})