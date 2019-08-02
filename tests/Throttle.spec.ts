import { Throttle } from "../src/util/Throttle"

describe("Throttle", () => {
  const client: any = { uniqueIdentifier: "foo=" }
  let throttle: Throttle
  
  beforeEach(() => {
    throttle = new Throttle()
    throttle
      .initialPoints(8)
      .tickRate(1000)
      .penaltyPerCommand(5)
      .restorePerTick(1)
  })

  afterEach(() => {
    throttle.stop()
  })

  describe("tickRate()", () => {
    it("set parameters correctly", () => {
      expect(throttle.tickRate(10)["tickrate"]).toBe(10)
    })
  })

  describe("penaltyPerCommand()", () => {
    it("set parameters correctly", () => {
      expect(throttle.penaltyPerCommand(10)["penalty"]).toBe(10)
    })
  })

  describe("restorePerTick()", () => {
    it("set parameters correctly", () => {
      expect(throttle.restorePerTick(10)["restore"]).toBe(10)
    })
  })

  describe("initialPoints()", () => {
    it("set parameters correctly", () => {
      expect(throttle.initialPoints(10)["initial"]).toBe(10)
    })
  })

  describe("throttle()", () => {
    it("throttle a client successfully", () => {
      expect(throttle.throttle(client)).toBe(false)
      expect(throttle.throttle(client)).toBe(true)
    })
  })

  describe("timeTillNextCommand()", () => {
    it("should retrieve the correct time", () => {
      expect(throttle.throttle(client)).toBe(false)
      expect(throttle.throttle(client)).toBe(true)
      expect(throttle.timeTillNextCommand(client)).toBeCloseTo(1000, -1)
    })
    it("should retrieve the correct time when a client does not exist", () => {
      expect(throttle.timeTillNextCommand(client)).toBe(0)
    })
  })

  describe("isThrottled()", () => {
    it("should check if a client is throttled when the client does not exist", () => {
      expect(throttle.isThrottled(client)).toBe(false)
    })
  })

  describe("refreshTimeout()", () => {
    it("should test refresh when the object does not exist anymore", () => {
      expect(throttle["refreshTimeout"](client)).toBe(undefined)
    })
  })

  describe("restorePoints()", () => {
    it("should test the restoration of points correctly", () => {
      expect(throttle.throttle(client)).toBe(false)
      throttle["restorePoints"](client.uniqueIdentifier)
      expect(throttle["throttled"][client.uniqueIdentifier].points).toBe(4)
    })
    it("should test the deletion of the throttled object correctly", () => {
      expect(throttle.throttle(client)).toBe(false)
      throttle.restorePerTick(5)
      throttle["restorePoints"](client.uniqueIdentifier)
      expect(Object.values(throttle["throttled"]).length).toBe(0)
    })
  })
})