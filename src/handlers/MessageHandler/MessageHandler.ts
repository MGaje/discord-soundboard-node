import * as path from "path";

import * as Discord from "discord.js";
import * as Winston from "winston";

import { DataStore } from "../../core/DataStore";
import { Handler } from "../../interfaces/Handler";
import { MessageHandlerData } from "./MessageHandlerData";
import { VoiceStatus } from "../../util/Constants";

/**
 * Handler for incoming Discord messages.
 */
export class MessageHandler implements Handler<MessageHandlerData>
{
    private static effectsPath: string = path.resolve(__dirname, "../../../effects");

    private dataStore: DataStore;

    /**
     * MessageHandler constructor.
     * @constructor
     * @param {DataStore} dataStore (Optional) Reference to the data store.
     */
    constructor(dataStore?: DataStore)
    {
        this.dataStore = dataStore;
    }

    /**
     * Handle incoming messages from Discord.
     * @param {MessageHandlerData} data Specified data that may be needed for a command.
     */
    public async handle(data: MessageHandlerData)
    {
        if (!data)
        {
            throw new Error("Data cannot be null/undefined.");
        }

        // Ensure voice connection is good.
        if (!data.voiceConnection || data.voiceConnection.status !== VoiceStatus.Ready)
        {
            throw new Error("Non-existant or invalid voice connection found.");
        }

        // Check for mention of the bot.
        if (data.msg.mentions.users.some(x => x.id === data.botUser.id))
        {
            // Parse the message into the following format:
            // parsedMessage[0] = mentioned bot user.
            // parsedMessage[1] = command or sound to play.
            const parsedMessage: string[] = data.msg.content.split(" ");

            this.handleCommand(parsedMessage[1], data.voiceConnection);
        }
    }

    /**
     * Handle the command sent to the bot via a Discord message.
     * @param {string} cmd The command to handle.
     * @param {Discord.VoiceConnection} voiceConnection The voice connection to use to play sound.
     */
    private async handleCommand(cmd: string, voiceConnection: Discord.VoiceConnection)
    {
        if (cmd.length === 0)
        {
            throw new Error("Command cannot be empty.");
        }

        // TODO
        // ---
        // This method doesn't really handle "commands" as it does just use the command name
        // as a wav file title. In the future, I hope to incorporate a "play" command that will
        // facilitate the actual wav file playing. However, the behavior now is the behavior
        // seen in the .NET version of the bot.

        const effectFile: string = path.join(MessageHandler.effectsPath, `${cmd}.wav`);
        voiceConnection.playFile(effectFile);
    }
}