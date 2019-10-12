export interface TeamSpeak {
  sendTextMessage(target: number, targetmode: TextMessageTargetMode, msg: string): Promise<any>
  registerEvent(event: string, id?: number): Promise<any>
  on(event: "textmessage", listener: (event: TextMessage) => void): this
}

export interface TeamSpeakClient {
  clid: number
  uniqueIdentifier: string
  cid: number
  isQuery(): boolean
}

export interface TextMessage {
  invoker: TeamSpeakClient
  msg: string
  targetmode: TextMessageTargetMode
}

export enum TextMessageTargetMode {
  /** target is a client */
  CLIENT = 1,
  /** target is a channel */
  CHANNEL = 2,
  /** target is a virtual server */
  SERVER = 3
}