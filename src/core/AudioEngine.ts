import * as https from "https";
import * as http from "http";
import * as fs from "fs";
import * as child_process from "child_process";
import * as path from "path";

import * as Discord from "discord.js";
import * as ytdl from "ytdl-core";

import { VoiceStatus } from "../util/Constants";

/**
 * The audio engine handles all things audio, which is really just playing and normalizing.
 */
export class AudioEngine
{
    private static readonly EffectsPath: string = path.resolve(__dirname, "../../effects-normalized");

    private voiceConnection: Discord.VoiceConnection;

    /**
     * Constructor for AudioEngine.
     * @constructor
     * @param {Discord.VoiceConnection} voiceConnection The newly formed voice connection.
     */
    constructor(voiceConnection: Discord.VoiceConnection)
    {
        this.setVoiceConnection(voiceConnection);
    }

    /**
     * Reset voice channel connection
     * @param {Discord.VoiceChannel} voiceChannel (Optional) The voice channel to connect to.
     */
    public async resetVoiceConnection(voiceChannel?: Discord.VoiceChannel)
    {
        if (this.voiceConnection)
        {
            this.setVoiceConnection(await this.voiceConnection.channel.join());
        }
        else if (voiceChannel)
        {
            this.setVoiceConnection(await voiceChannel.join());
        }
    }

    /**
     * Play file through voice connection.
     * @param {string} toPlay The file to play.
     */
    public play(toPlay: string)
    {
        // Ensure voice connection is good.
        if (!this.voiceConnection || this.voiceConnection.status !== VoiceStatus.Ready)
        {
            throw new Error("Non-existant or invalid voice connection found.");
        }

        const effectFile: string = path.join(AudioEngine.EffectsPath, `${toPlay}.wav`);
        this.voiceConnection.playFile(effectFile);
    }

    /**
     * Normalize specified media file.
     * @param {string} file The audio file to normalize.
     * @returns {Promise<string>} Promise containing soundboard filename.
     */
    public normalize(file: string): Promise<string>
    {
        const localFile: string = path.join(__dirname, `../../${file}`)

        return new Promise<string>((resolve, reject) =>
        {
            if (!file || file.length === 0)
            {
                reject("file cannot be null or empty.");
            }

            // Do some parsing to get the right filename (the first two characters should be underscores).
            const dotLoc: number = file.lastIndexOf(".");
            const soundboardFile: string = file.substr(0, dotLoc);
            const outputFile: string = path.join(__dirname, `../../effects-normalized/${file.substr(0, dotLoc + 1) + "wav"}`);

            const ffmpeg: child_process.ChildProcess = child_process.spawn(path.resolve(__dirname, "../../node_modules/.bin/ffmpeg.cmd"), 
            [
                '-i', localFile, 
                '-vn',
                '-analyzeduration', '0',
                '-loglevel', '0',
                '-ar', '44100',
                '-map', 'a',
                '-filter:a', 'loudnorm',
                outputFile
            ]);

            ffmpeg.on('error', e => 
            {
                fs.unlink(localFile, () => reject(e.toString()));
            });

            ffmpeg.on('close', () => 
            {
                fs.unlink(localFile, () => resolve(soundboardFile));
            });
        });
    }

    public getInfo(file: string): Promise<string[]>
    {
        const localFile: string = path.join(__dirname, `../../effects-normalized/${file}`);

        return new Promise<string[]>((resolve, reject) => 
        {
            const ffprobe: child_process.ChildProcess = child_process.spawn(path.resolve(__dirname, "../../node_modules/.bin/ffprobe.cmd"),
            [
                '-v',
                'error',
                '-show_entries',
                'format=duration',
                '-of',
                'default=noprint_wrappers=1:nokey=1',
                localFile
            ]);

            const probeData: string[] = [];

            ffprobe.stdout.setEncoding('utf8');
            ffprobe.stderr.setEncoding('utf8');

            ffprobe.stdout.on('data', data => {
                probeData.push(data as string)
            });

            ffprobe.stderr.on('data', data => {
                probeData.push(data as string)
            });

            ffprobe.on('error', e =>
            {
                reject(e.toString());
            });

            ffprobe.on('close', () =>
            {
                resolve(probeData);
            });
        });        
    }

    /**
     * Utility method for setting up a voice connection.
     * @param {Discord.VoiceConnection} voiceConnection The newly formed voice connection.
     */
    private setVoiceConnection(voiceConnection: Discord.VoiceConnection)
    {
        this.voiceConnection = voiceConnection;

        // These events don't seem to be emitted?
        this.voiceConnection.on("debug", msg => 
        {
            console.log(`[Voice Connection Debug] ${msg}`);
        });
        this.voiceConnection.on("disconnect", () =>
        {
            console.log("Disconnected from the voice channel.");
            this.voiceConnection.removeAllListeners();
            this.voiceConnection.disconnect();
            this.voiceConnection = null;
        });
        this.voiceConnection.on("error", e =>
        {
            console.error(`Voice connection error: ${e.message}`);
            this.voiceConnection.removeAllListeners();
            this.voiceConnection.disconnect();
        });
        this.voiceConnection.on("failed", e =>
        {
            console.error(`Failed to connect to voice: ${e.message}`);
            this.voiceConnection.removeAllListeners();
            this.voiceConnection.disconnect();
            this.voiceConnection = null;
        });
    }
}