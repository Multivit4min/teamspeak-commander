
/** class representing a CommandDisabledError */
export class CommandDisabledError extends Error {
  constructor(err: string) {
    super(err)
  }
}