TeamSpeak Command Interface for TS3-NodeJS-Library
===

## This is still work in progress

Usage:

```javascript
const { TeamSpeak } = require("ts3-nodejs-library")
const { Commander } = require("./src/Commander")

const commander = new Commander({ prefix: "!" })

//command !ping
commander.createCommand("ping")
  .setHelp("sends pong as response")
  .run(event => {
    event.reply("Pong!")
  })

//command !roll 10 -> rolls a number between 1 and 10
//command !roll -> rolls a number between 1 and 6
commander.createCommand("roll")
  .setHelp("rolls a number")
  .addArgument(arg => arg.number.setName("max").optional(6))
  .run(event => {
    const random = Math.floor(Math.random() * event.arguments.max) + 1
    event.reply(`Rolled a ${random} (from 1-${event.arguments.max})`)
  })

TeamSpeak.connect({
  host: "....",
}).then(teamspeak => {
  commander.addInstance(teamspeak)
})
```