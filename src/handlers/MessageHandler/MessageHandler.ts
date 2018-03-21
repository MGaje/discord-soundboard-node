import * as path from "path";
import * as fs from "fs";

import * as Discord from "discord.js";
import * as Winston from "winston";

import { DataStore } from "../../core/DataStore";
import { Handler } from "../../interfaces/Handler";
import { MessageHandlerData } from "./MessageHandlerData";
import { VoiceStatus } from "../../util/Constants";
import { Utility } from "../../util/Util";

/**
 * Handler for incoming Discord messages.
 */
export class MessageHandler implements Handler<MessageHandlerData>
{
    private static effectsPath: string = path.resolve(__dirname, "../../../effects-normalized");

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

        // Ignore bot messages.
        if (data.msg.author.id === data.botUser.id)
        {
            return;
        }

        // If the message is in a DM, handle new file upload.
        if (data.msg.guild === null)
        {
            this.handleUpload(data.msg);

            return;
        }

        // Check for mention of the bot.
        if (data.msg.mentions.users.some(x => x.id === data.botUser.id))
        {
            // TODO:
            // If/When commands are implemented, only check voice status if the "play" command
            // is used.
            // --
            // Ensure voice connection is good.
            if (!data.voiceConnection || data.voiceConnection.status !== VoiceStatus.Ready)
            {
                throw new Error("Non-existant or invalid voice connection found.");
            }

            // Parse the message into the following format:
            // parsedMessage[0] = mentioned bot user.
            // parsedMessage[1] = command.
            // parsedMessage[n where n > 1] = arguments to the command.
            const parsedMessage: string[] = data.msg.content.split(" ");
            const args: string[] = parsedMessage.slice(2);

            this.handleCommand(parsedMessage[1], args, data.voiceConnection);
        }
    }

    /**
     * Handle the command sent to the bot via a Discord message.
     * @param {string} cmd The command to handle.
     * @param {string[]} args The arguments to the command.
     * @param {Discord.VoiceConnection} voiceConnection The voice connection to use to play sound.
     */
    private handleCommand(cmd: string, args: string[], voiceConnection: Discord.VoiceConnection)
    {
        if (!cmd || cmd.length === 0)
        {
            throw new Error("Command cannot be null or empty.");
        }

        // TODO
        // ---
        // This method doesn't really handle "commands" as it does just use the command name
        // as a wav file title. In the future, I hope to incorporate a "play" command that will
        // facilitate the actual wav file playing. However, the behavior now is the behavior
        // seen in the .NET version of the bot.

        switch (cmd.toLowerCase())
        {
            case "play":
                return this.handlePlay(args[0], voiceConnection);

            default:
                break;
        }
    }

    /**
     * 
     * @param toPlay 
     * @param voiceConnection 
     */
    private handlePlay(toPlay: string, voiceConnection: Discord.VoiceConnection)
    {
        if (!toPlay || toPlay.length === 0)
        {
            throw new Error("toPlay cannot be null or empty.")
        }

        // Play local file.
        const effectFile: string = path.join(MessageHandler.effectsPath, `${toPlay}.wav`);
        voiceConnection.playFile(effectFile);
    }

    /**
     * Handle the file uploads.
     * @param {Discord.Message} discordMessage The Discord message that contains the files.
     */
    private async handleUpload(discordMessage: Discord.Message)
    {
        let localFile: string = null;
        if (discordMessage.attachments.size === 0)
        {
            const youtubeRe: RegExp = /^(https:\/\/www\.youtube\.com\/watch\?v=[\w-]+) (\w+)$/;
            if (youtubeRe.test(discordMessage.content))
            {
                Winston.info("Downloading from youtube...");
                discordMessage.channel.send(`Downloading from youtube.`);

                const matches: RegExpMatchArray = discordMessage.content.match(youtubeRe);
                localFile = await Utility.downloadFromYoutube(matches[1], matches[2]);
                
                Winston.info("Download complete from youtube.");
                discordMessage.channel.send(`Download complete.`);
            }
        }
        else
        {
            // TODO:
            // -Add support for multiple attachments.
            // -Add support for youtube links.
            const attachment: Discord.MessageAttachment = discordMessage.attachments.first();

            Winston.debug(`Attempting to download file "${attachment.filename}".`);
            discordMessage.channel.send(`Downloading '${attachment.filename}'.`);

            // Download file onto local disk for processing.
            //const localFile: string = path.join(__dirname, `../../__${attachment.filename}`)
            localFile = await Utility.downloadFile(attachment.url, attachment.filename);

            Winston.debug(`Downloaded file "${localFile}".`);
            discordMessage.channel.send(`Downloaded file '${localFile}'.`);
        }

        Winston.debug(`Attempting to normalize file.`);
        discordMessage.channel.send(`Processing file.`);

        // Normalize (and extract if it's a video file) the audio and convert to mp3.
        const soundboardFile: string = await Utility.normalizeMediaFile(localFile);
        
        Winston.debug(`Normalized file.`);
        discordMessage.channel.send(`Processing complete. You may now play "${soundboardFile}" in the voice channel.`);
    }
}