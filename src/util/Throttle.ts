import { TeamSpeakClient } from "ts3-nodejs-library/lib/node/Client"

export class Throttle {
  private throttled: Record<string, Throttle.ThrottleInterface> = {}
  private penalty = 1
  private initial = 1
  private restore = 1
  private tickrate = 1000

  /* clears all timers */
  stop() {
    Object.values(this.throttled)
      .forEach(({ timeout }) => clearTimeout(<NodeJS.Timeout>timeout))
    return this
  }

  /**
   * Defines how fast points will get restored
   * @param duration time in ms how fast points should get restored
   */
  tickRate(duration: number) {
    this.tickrate = duration
    return this
  }

  /**
   * The amount of points a command request costs
   * @param amount the amount of points that should be reduduced
   */
  penaltyPerCommand(amount: number) {
    this.penalty = amount
    return this
  }

  /**
   * The Amount of Points that should get restored per tick
   * @param amount the amount that should get restored
   */
  restorePerTick(amount: number) {
    this.restore = amount
    return this
  }

  /**
   * Sets the initial Points a user has at beginning
   * @param initial the Initial amount of Points a user has
   */
  initialPoints(initial: number) {
    this.initial = initial
    return this
  }

  /**
   * Reduces the given points for a Command for the given Client
   * @param client the client which points should be removed
   */
  throttle(client: TeamSpeakClient) {
    this.reducePoints(client.uniqueIdentifier)
    return this.isThrottled(client)
  }

  /**
   * Restores points from the given id
   * @param id the identifier for which the points should be stored
   */
  private restorePoints(id: string) {
    const throttle = this.throttled[id]
    if (throttle === undefined) return
    throttle.points += this.restore
    if (throttle.points >= this.initial) {
      Reflect.deleteProperty(this.throttled, id)
    } else {
      this.refreshTimeout(id)
    }
  }

  /**
   * Resets the timeout counter for a stored id
   * @param id the identifier which should be added
   */
  private refreshTimeout(id: string) {
    if (this.throttled[id] === undefined) return
    clearTimeout(<NodeJS.Timeout>this.throttled[id].timeout)
    this.throttled[id].timeout = setTimeout(this.restorePoints.bind(this, id), this.tickrate)
    this.throttled[id].next = Date.now() + this.tickrate
  }

  /**
   * Removes points from an id
   * @param id the identifier which should be added
   */
  private reducePoints(id: string) {
    const throttle = this.createIdIfNotExists(id)
    throttle.points -= this.penalty
    this.refreshTimeout(id)
  }

  /**
   * creates the identifier in the throttled object
   * @param id the identifier which should be added
   */
  private createIdIfNotExists(id: string) {
    if (Object.keys(this.throttled).includes(id)) return this.throttled[id]
    this.throttled[id] = { points: this.initial, next: 0 }
    return this.throttled[id]
  }

  /**
   * Checks if the given Client is affected by throttle limitations
   * @param client the TeamSpeak Client which should get checked
   */
  isThrottled(client: TeamSpeakClient) {
    const throttle = this.throttled[client.uniqueIdentifier]
    if (throttle === undefined) return false
    return throttle.points <= 0
  }

  /**
   * retrieves the time in milliseconds until a client can send his next command
   * @param client the client which should be checked
   * @returns returns the time a client is throttled in ms
   */
  timeTillNextCommand(client: TeamSpeakClient) {
    if (this.throttled[client.uniqueIdentifier] === undefined) return 0
    return this.throttled[client.uniqueIdentifier].next - Date.now()
  }
}

export namespace Throttle {
  export interface ThrottleInterface {
    points: number
    next: number
    timeout?: NodeJS.Timeout
  }
}