import * as path from "path";
import * as fs from "fs";

import * as Discord from "discord.js";

import { IAudioEngine } from "../../AudioEngine/IAudioEngine";
import { IffmpegWrapper } from "../../FfmpegWrapper/IffmpegWrapper";
import { FfmpegWrapper } from "../../FfmpegWrapper/FfmpegWrapper";
import { Storable } from "../../DataStore/Storable";
import { Handler } from "../../handlers/Handler";
import { IMessageHandlerData } from "./IMessageHandlerData";
import { DataStoreKeys } from "../../util/Constants";
import { Utility } from "../../util/Util";

/**
 * Handler for incoming Discord messages.
 */
export class MessageHandler implements Handler<IMessageHandlerData>
{
    private dataStore: Storable;
    private audioEngine: IAudioEngine;

    /**
     * MessageHandler constructor.
     * @constructor
     * @param {DataStore} dataStore (Optional) Reference to the data store.
     */
    constructor(dataStore?: Storable)
    {
        this.dataStore = dataStore;
    }

    /**
     * Handle incoming messages from Discord.
     * @param {MessageHandlerData} data Specified data that may be needed for a command.
     */
    public async handle(data: IMessageHandlerData)
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

        // Grab audio engine instance from the data store if it isn't available.
        if (!this.audioEngine)
        {
            this.audioEngine = this.dataStore.get<IAudioEngine>(DataStoreKeys.AudioEngineKey);
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
            // Parse the message into the following format:
            // parsedMessage[0] = mentioned bot user.
            // parsedMessage[1] = command.
            // parsedMessage[n where n > 1] = arguments to the command.
            const parsedMessage: string[] = data.msg.content.split(" ");

            this.handleCommand(parsedMessage[1], parsedMessage.slice(2));
        }
    }

    /**
     * Handle the command sent to the bot via a Discord message.
     * @param {string} cmd The command to handle.
     * @param {string[]} args The arguments to the command.
     */
    private handleCommand(cmd: string, args: string[])
    {
        if (!cmd || cmd.length === 0)
        {
            throw new Error("Command cannot be null or empty.");
        }

        switch (cmd.toLowerCase())
        {
            case "play":
                return this.audioEngine.play(args[0]);

            default:
                break;
        }
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
                console.log("Downloading from youtube...");
                discordMessage.channel.send(`Downloading from youtube.`);

                const matches: RegExpMatchArray = discordMessage.content.match(youtubeRe);

                if (!await Utility.effectNameExists(`${matches[2]}.wav`))
                {
                    // Specified name is available. Continue on.
                    localFile = await Utility.downloadFromYoutube(matches[1], matches[2]);
                
                    console.log("Download complete from youtube.");
                    discordMessage.channel.send(`Download complete.`);
                }
                else
                {
                    // Specified name is taken. Prompt the user to try again with a different name and stop executing the
                    // rest of the function.
                    console.log(`Effect "${matches[2]}" already exists. Prompted user to try again with a different name.`);
                    discordMessage.channel.send(`The name "${matches[2]}" is already in use. Please try again with a different name.`);
                    return;
                }
            }
        }
        else
        {
            // TODO:
            // -Add support for multiple attachments.
            const attachment: Discord.MessageAttachment = discordMessage.attachments.first();

            console.log(`Attempting to download file "${attachment.filename}".`);
            discordMessage.channel.send(`Downloading '${attachment.filename}'.`);

            if (!await Utility.effectNameExists(attachment.filename))
            {
                // Specified name is available. Continue on.

                // Download file onto local disk for processing.
                localFile = await Utility.downloadFile(attachment.url, attachment.filename);

                console.log(`Downloaded file "${localFile}".`);
                discordMessage.channel.send(`Downloaded file '${localFile}'.`);
            }
            else
            {
                // Specified name is taken. Prompt the user to try again with a different name and stop executing the
                // rest of the function.
                const nameWithoutType: string = attachment.filename.substr(0, attachment.filename.lastIndexOf("."));
                console.log(`Effect "${nameWithoutType}" already exists. Prompted user to try again with a different name.`);
                discordMessage.channel.send(`The name "${nameWithoutType}" is already in use. Please try again with a different name.`);
                return;
            }            
        }

        console.log(`Attempting to normalize file.`);
        discordMessage.channel.send(`Processing file.`);

        // Normalize (and extract if it's a video file) the audio and convert to mp3.
        const ffmpegWrapper: IffmpegWrapper = new FfmpegWrapper();
        const soundboardFile: string = await ffmpegWrapper.normalize(localFile);
        
        console.log(`Normalized file.`);
        discordMessage.channel.send(`Processing complete. You may now play "${soundboardFile}" in the voice channel.`);
    }
}