/** class representing a ThrottleError */
export class ThrottleError extends Error {
  constructor(err: string) {
      super(err)
  }
}