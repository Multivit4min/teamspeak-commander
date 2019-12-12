## A list of example commands in order to use with teamspeak-commander
----------------------------------------------------------------------

It is recommended to implement the `help` and `man` command within your bot in order to get an overview of available commands

```javascript
const { TeamSpeak } = require("ts3-nodejs-library")
const { Commander, CommandGroup } = require("teamspeak-commander")

const commander = new Commander({ prefix: "!" })

commander.createCommand("help")
  .help("displays this text")
  .manual(`Displays a list of useable commands`)
  .manual(`you can search/filter for a specific commands by adding a keyword`)
  .addArgument(arg => arg.rest.name("filter").optional())
  .run(async ({ invoker, args, reply }) => {
    const cmds = await commander.getAvailableCommandsWithPermission(invoker, args.filter)
    if (cmds.length === 0) return reply("No Commands to display a help texts has been found!")
    const help = []
    await Promise.all(cmds.map(async cmd => {
      if (cmd instanceof CommandGroup) {
        const subcommands = await cmd.getAvailableSubCommands(invoker)
        return subcommands.forEach(sub => {
          help.push([`${cmd.getFullCommandName()} ${sub.getCommandName()}`, sub.getHelp(invoker)])
        })
      } else {
        help.push([cmd.getFullCommandName(), cmd.getHelp(invoker)])
      }
    }))
    reply(`${help.length} Command${help.length === 1 ? "" : "s"} found:`)
    return help.forEach(([ cmd, help ]) => reply(`[b]${cmd}[/b] ${help}`))
  })


commander.createCommand("man")
  .help(() => "Displays detailed help about a command if available")
  .manual(`Displays detailed usage help for a specific command`)
  .manual(`Arguments with Arrow Brackets (eg. < > ) are mandatory arguments`)
  .manual(`Arguments with Square Brackets (eg. [ ] ) are optional arguments`)
  .addArgument(arg => arg.string.name("command").minimum(1))
  .addArgument(arg => arg.string.name("subcommand").minimum(1).optional(false, false))
  .run(async ({ args, reply, invoker }) => {
    const getManual = (cmd) => {
      if (cmd.hasManual()) return cmd.getManual(invoker)
      if (cmd.hasHelp()) return cmd.getHelp()
      return "No manual available"
    }
    const { command, subcommand } = args
    const commands = await commander.checkPermissions(commander.getAvailableCommands(command), invoker)
    if (commands.length !== 1) return reply(`No command with name [b]${command}[/b] found! Did you misstype the command?`)
    const cmd = commands[0]
    if (cmd instanceof CommandGroup) {
      if (subcommand) {
        (await cmd.getAvailableSubCommands(invoker, subcommand)).forEach(sub => {
          reply(`\n[b]Usage:[/b] ${cmd.getFullCommandName()} ${sub.getUsage()}\n${getManual(sub)}`)
        })
      } else {
        reply(`[b]${cmd.getFullCommandName()}[/b] ${getManual(cmd)}`)
        ;(await cmd.getAvailableSubCommands(invoker)).forEach(sub => {
          reply(`[b]${cmd.getFullCommandName()} ${sub.getUsage()}[/b] ${sub.getHelp(invoker)}`)
        })
      }
    } else {
      reply(`\nManual for command: [b]${cmd.getFullCommandName()}[/b]\n[b]Usage:[/b] ${cmd.getUsage()}\n${getManual(cmd)}`)
    }
  })

commander.createCommand("ping")
  .help("responds with pong")
  .run(({ reply }) => {
    reply("pong")
  })

commander.createCommand("roll")
  .help("rolls a number")
  .addArgument(arg => arg.number.name("max").optional(6))
  .run(({ reply, args }) => {
    const random = Math.floor(Math.random() * args.max) + 1
    reply(`Rolled a ${random} (from 1-${args.max})`)
  })

TeamSpeak.connect({
  host: "127.0.0.1",
  queryport: 10011,
  serverport: 9987,
  username: "serveradmin",
  password: "secret",
  nickname: "teamspeak-commander"
}).then(teamspeak => {
  commander.addInstance(teamspeak)
})
```