import { BaseCommand } from "../command/BaseCommand"
import { TeamSpeakClient } from "ts3-nodejs-library"

export class CommandCollector<T extends BaseCommand = BaseCommand> {
  
  readonly commands: T[]

  constructor(commands: T[] = []) {
    this.commands = commands
  }

  /**
   * adds a command to the collector
   * @param cmd command to add
   */
  addCommand(cmd: T) {
    this.commands.push(cmd)
    return this
  }

  /**
   * gets a list of useable commnads for the requesting client
   * @param invoker client which requests
   */
  getUseableCommands(invoker: TeamSpeakClient) {
    return this.getEnabled().getCommandsWithPermission(invoker)
  }

  /** gets all commands with a specific name */
  withName(name: string) {
    return new CommandCollector<T>(this.commands.filter(cmd => (
      cmd.getCommandName() === name ||
      cmd.getFullCommandName() === name
    )))
  }

  /** gets all commands whitch matches a specific name */
  withNameLike(name: string, client: TeamSpeakClient) {
    return new CommandCollector<T>(this.commands.filter(cmd => {
      const regex = new RegExp(name, "i")
      return (
        regex.test(cmd.getFullCommandName()) ||
        regex.test(cmd.getHelp(client))
      )
    }))
  }

  /**
   * retrieves all commands which are enabled
   */
  getEnabled() {
    return new CommandCollector<T>(this.commands.filter(cmd => cmd.isEnabled()))
  }

  /** gets a new collector with all commands a client has permission to */
  async getCommandsWithPermission(invoker: TeamSpeakClient) {
    const cmds = await Promise.all(this.commands.map(cmd => cmd.hasPermission(invoker)))
    return new CommandCollector<T>(this.commands.filter((_, i) => cmds[i]))
  }
}