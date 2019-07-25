import { TeamSpeak } from "ts3-nodejs-library"
import { TeamSpeakClient } from "ts3-nodejs-library/lib/node/Client"

export interface execEvent {
  reply: (message: string) => void
  invoker: TeamSpeakClient
  message: string
  teamspeak: TeamSpeak
}
type execHandler = (event: execEvent) => void
type permissionHandler = (event: execEvent) => Promise<boolean>|boolean

export class Command {
  private name: string
  private enabled: boolean = true
  private help: string = ""
  private manual: string[] = []
  private permissionHandler: permissionHandler[] = []
  private runHandler: execHandler[] = []

  constructor(cmd: string) {
    this.name = cmd
  }

  checkPermission(callback: permissionHandler) {
    this.permissionHandler.push(callback)
    return this
  }

  run(callback: execHandler) {
    this.runHandler.push(callback)
    return this
  }
}