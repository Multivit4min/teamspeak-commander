Create a new `Commander` instance.
Configuration options are:

name                             | type              | default
---------------------------------|-------------------|--------
prefix                           | string            | `"!"`
COMMAND_NOT_FOUND                | TranslationString |
COMMAND_NO_PERMISSION            | TranslationString |
SUBCOMMAND_NOT_FOUND             | TranslationString |
COMMAND_PARSE_ERROR              | TranslationString |
COMMAND_THROTTLE_ERROR           | TranslationString |
COMMAND_TOO_MANY_ARGUMENTS_ERROR | TranslationString |

```javascript
const { Commander } = require("teamspeak-commander")
const commander = new Commander({ prefix: "!" })
```

next step is creating a command

```javascript
//creates a command with the name "ping"
commander.createCommand("ping")
  //sets the response help text when using the "help" command
  .help("responds with pong")
  //adds an argument to the ping instance (optional number between 1 and 10)
  .addArgument(arg => arg.number.name("amount").positive().max(10).optional(1))
  //executes the command and response with "!pong"
  .run(ev => {
    let i = ev.arg.amount
    while (i-- > 0) {
      ev.reply("Pong!")
    }
  })
```

add a teamspeak instance to the command instance

```javascript
TeamSpeak.connect({
  username: "serveradmin",
  password: "secret",
  serverport: 9987
}).then(async teamspeak => {
  //adds the teamspeak instnace to the created commander
  await commander.addInstance(teamspeak)
}).catch(e => {
  console.log(e)
})
```