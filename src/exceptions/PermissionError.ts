/** class representing a PermissionError */
export class PermissionError extends Error {
  constructor(err: string) {
      super(err)
  }
}