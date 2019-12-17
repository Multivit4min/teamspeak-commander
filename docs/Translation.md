This is an example on how to do Translation within your application,
this example has been writen in typescript and tested with `teamspeak-commander` version 0.1.1

```typescript
import { TeamSpeak } from "ts3-nodejs-library"
import {
  Commander,
  CommandGroup, 
  BaseTranslationProps,
  TranslationString } from "teamspeak-commander"
import i18next, { i18n, TOptions, StringMap } from "i18next"

const resources = {
  en: {
    translation: {
      "help": {
        "help": "displays this text",
        "manual": [
          "Displays a list of useable commands",
          "you can search/filter for a specific commands by adding a keyword"
        ],
        "exec": {
          "no_commands_found": "No Commands to display a help texts has been found!",
          "command_found": "{{count}} Command found:",
          "command_found_plural": "{{count}} Commands found:"
        }
      },
      "manual": {
        "help": "Displays detailed help about a command if available",
        "manual": [
          "Displays detailed usage help for a specific command",
          "Arguments with Arrow Brackets (eg. < > ) are mandatory arguments",
          "Arguments with Square Brackets (eg. [ ] ) are optional arguments"
        ],
        "exec": {
          "no_manual": "no manual found!",
          "no_manual_for_command": "No command with name [b]{{command}}[/b] found! Did you misstype the command?",
          "usage": "\nManual for command: [b]{{command}}[/b]\n[b]Usage:[/b] {{usage}}",
          "usage_group": "\n[b]Usage:[/b] {{usage}}"
        }
      },
      "roll": {
        "help": "rolls a number",
        "exec": {
          "rolled": "Rolled a {{roll}} (from 1-{{max}})"
        }
      }
    }
  },
  de: {
    translation: {
      "help": {
        "help": "zeigt diesen text an",
        "manual": [
          "zeigt eine liste von nutzbaren Kommandos an",
          "du kannst nach speziellen commands suchen/filtern in dem du es hinter diesen Kommand anfügst"
        ],
        "exec": {
          "no_commands_found": "Keine Hilfetexte für diese Suche gefunden!",
          "command_found": "{{count}} Kommando gefunden:",
          "command_found_plural": "{{count}} Kommandos gefunden:"
        }
      },
      "manual": {
        "help": "Zeigt detailierte hilfe texte an",
        "manual": [
          "Zeigt detailierte hilfe texte über einen speziellen Kommand an",
          "Argumente in Pfeil Klammnern (zb. < > ) sind benötigte argumente",
          "Argumente in Eckigen Klammern (zb. [ ] ) sind optionale argumente"
        ],
        "exec": {
          "no_manual": "Keine Anleitung gefunden",
          "no_manual_for_command": "Kein Kommando mit dem namen [b]{{command}}[/b] gefunden! Wurde das Kommando falsch geschrieben?",
          "usage": "\nAnleitung für Kommando: [b]{{command}}[/b]\n[b]Nutzung:[/b] {{usage}}",
          "usage_group": "\n[b]Nutzung:[/b] {{usage}}"
        }
      },
      "roll": {
        "help": "würfelt eine zahl",
        "exec": {
          "rolled": "Du würfelst eine {{roll}} (von 1-{{max}})"
        }
      }
    }
  }
}

interface ITranslator {
  (callback: string, options?: TOptions<StringMap>): TranslationString<any>
  (callback: (props: BaseTranslationProps & { i18n: i18n }) => string, options?: never): TranslationString<any>
}

async function useTranslation(i18n: i18n, languages: Record<string, string[]>): Promise<ITranslator> {
  const findTranslationByCountry = (country: string) => {
    return Object.keys(languages).find(lang => languages[lang].includes(country.toLowerCase()))
  }
  return function translator(callback, options) {
    return (event: BaseTranslationProps) => {
      const instance = i18n.cloneInstance({
        lng: findTranslationByCountry("at" ||event.client.country || "en")
      })
      if (typeof callback === "string") return instance.t(callback, options)
      return callback({ ...event, i18n: instance })
    }
  }
}

;(async () => {

  const i18n = i18next.createInstance({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escape: str => str
    }
  })

  await i18n.init()

  const translator = await useTranslation(i18n, {
    "de": ["de", "at", "ch"]
  })

  const commander = new Commander({ prefix: "!" })

  commander.createCommand("help")
    .help(translator("help.help"))
    .manual(translator("help.manual.0"))
    .manual(translator("help.manual.1"))
    .addArgument(arg => arg.rest.name("filter").optional())
    .run(async ({ invoker, args, reply }) => {
      const cmds = await commander.getAvailableCommandsWithPermission(invoker, args.filter)
      if (cmds.length === 0) return reply(translator("help.exec.no_commands_found"))
      const help: string[][] = []
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
      reply(translator("help.exec.command_found", { count: help.length }))
      return help.forEach(([ cmd, help ]) => reply(`[b]${cmd}[/b] ${help}`))
    })
  
commander.createCommand("man")
  .help(translator("manual.help"))
  .manual(translator("manual.manual.0"))
  .manual(translator("manual.manual.1"))
  .manual(translator("manual.manual.2"))
  .addArgument(arg => arg.string.name("command").minimum(1))
  .addArgument(arg => arg.string.name("subcommand").minimum(1).optional(false, false))
  .run(async ({ args, reply, invoker }) => {
    const getManual = (cmd) => {
      if (cmd.hasManual()) return cmd.getManual(invoker)
      if (cmd.hasHelp()) return cmd.getHelp()
      return translator("manual.exec.no_manual")
    }
    const { command, subcommand } = args
    const commands = await commander.checkPermissions(commander.getAvailableCommands(command), invoker)
    if (commands.length !== 1) return reply(translator("manual.exec.no_manual_for_command", { command }))
    const cmd = commands[0]
    if (cmd instanceof CommandGroup) {
      if (subcommand) {
        (await cmd.getAvailableSubCommands(invoker, subcommand)).forEach(sub => {
          reply(translator("manual.exec.usage_group", { usage: `${cmd.getFullCommandName()} ${sub.getUsage()}\n${getManual(sub)}` }))
        })
      } else {
        reply(`[b]${cmd.getFullCommandName()}[/b] ${getManual(cmd)}`)
        ;(await cmd.getAvailableSubCommands(invoker)).forEach(sub => {
          reply(`[b]${cmd.getFullCommandName()} ${sub.getUsage()}[/b] ${sub.getHelp(invoker)}`)
        })
      }
    } else {
      reply(translator("manual.exec.usage", {
        command: cmd.getFullCommandName(),
        usage: `${cmd.getUsage()}\n${getManual(cmd)}`
      }))
    }
  })

  commander.createCommand("roll")
    .help(translator("roll.help"))
    .addArgument(arg => arg.number.name("max").optional(6))
    .run(({ reply, args }) => {
      reply(translator("roll.exec.rolled", {
        roll: Math.floor(Math.random() * args.max) + 1,
        max: args.max
      }))
    })

  const teamspeak = await TeamSpeak.connect({
    host: "127.0.0.1",
    queryport: 10011,
    serverport: 9987,
    username: "foo",
    password: "W1YKObY+",
    nickname: "teamspeak-commander"
  })


  commander.addInstance(teamspeak)

  console.log("initialized")


})()
```