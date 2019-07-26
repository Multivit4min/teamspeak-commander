import { TeamSpeak } from "ts3-nodejs-library"
import { Commander } from "./src/Commander"

const commander = new Commander({ prefix: "!" })
commander.register("ping")
  .checkPermission(async ev => {
    return true
  })
  .run(ev => {
    ev.reply("pong!")
  })


TeamSpeak.connect({})
  .then(teamspeak => commander.addInstance(teamspeak))