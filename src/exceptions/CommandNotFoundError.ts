/** class representing a SubCommandNotFound */
export class SubCommandNotFound extends Error {
  constructor(err: string) {
      super(err)
  }
}