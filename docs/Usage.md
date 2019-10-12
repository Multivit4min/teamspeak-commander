Create a new `Commander` instance.
Configuration options are:

name   | type   | default
-------|--------|--------
prefix | string | `"!"`

```javascript
const { Commander } = require("teamspeak-commander")
const commander = new Commander({ prefix: "!" })
```

next step is creating a command

```javascript
//creates a command with the name "ping"
commander.createCommand("ping")
  //sets the response help text when using the "help" command
  .setHelp("responds with pong")
  //adds an argument to the ping instance
  .addArgument(arg => arg.number.setName("amount").positive().optional())
  //executes the command and response with "!pong"
  .run(ev => ev.reply("Pong!"))
```

add a teamspeak instance to the command instance

```javascript
TeamSpeak.connect({
  username: "serveradmin",
  password: "igT7PM8+",
  serverport: 9987
}).then(async teamspeak => {
  //adds the teamspeak instnace to the created commander
  await commander.addInstance(teamspeak)
  console.log("Connected")
}).catch(e => {
  console.log(e)
})
```