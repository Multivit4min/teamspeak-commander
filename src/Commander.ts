import { TeamSpeak } from "ts3-nodejs-library"
import { TextMessage } from "ts3-nodejs-library/lib/types/Events"
import { Command } from "./Command"


export interface CommanderOptions {
  prefix: string
}

export class Commander {

  readonly config: CommanderOptions
  private instances: TeamSpeak[]
  private commands: Command[]

  constructor(config: Partial<CommanderOptions> = {}) {
    this.config = {
      prefix: "!",
      ...config
    }
  }

  private textMessageHandler(event: TextMessage) {
    
  }

  register(command: string) {
    const cmd = new Command(command)
    this.commands.push(cmd)
    return cmd
  }

  addInstance(teamspeak: TeamSpeak) {
    this.instances.push(teamspeak)
    teamspeak.on("textmessage", this.textMessageHandler.bind(this))
    return this
  }
}