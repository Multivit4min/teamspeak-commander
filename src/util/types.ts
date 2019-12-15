import { TeamSpeak, TeamSpeakClient, TextMessageEvent } from "ts3-nodejs-library"
import { Commander } from "Commander"

/**
 * the commander text message event which extends the default teamspeak chat event
 */
export interface CommanderTextMessage extends TextMessageEvent {
  args: Record<string, any>
  teamspeak: TeamSpeak
  reply: (msg: string) => Promise<any>
}

/**
 * the basic translation props every translation callback gets
 */
export interface BaseTranslationProps {
  commander: Commander
  client: TeamSpeakClient,
  teamspeak: TeamSpeak
}

/**
 * a base function to retrieve string data internally
 */
export interface TranslationStringGetter {
  <T extends object>(data: TranslationString<T>, args: T): string
  <T extends undefined>(data: TranslationString<T>, args?: never): string
}
  

/**
 * this is being used as interface in order to get custom string for specific clients
 * for example to use in translations for specific clients
 */
export type TranslationString<T = {}> = string|((event: T & BaseTranslationProps) => string)