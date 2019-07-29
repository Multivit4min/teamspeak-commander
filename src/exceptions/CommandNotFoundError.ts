/** class representing a SubCommandNotFound */
export class CommandNotFoundError extends Error {
  constructor(err: string) {
      super(err)
  }
}