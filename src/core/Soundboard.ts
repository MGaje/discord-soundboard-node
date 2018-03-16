import * as path from "path";

import * as Discord from "discord.js"
import * as Winston from "winston";

import { DataStore } from "./DataStore";
import { Config } from "./Config";
import { CommandHandler } from "../handlers/CommandHandler/CommandHandler";

export class Soundboard
{
    private botClient: Discord.Client;
    private voiceConnection: Discord.VoiceConnection;
    private isVoiceConnected: boolean;
    private config: Config;
    private dataStore: DataStore;
    private commandHandler: CommandHandler;
    private stdin: NodeJS.Socket;

    /**
     * Default constructor.
     * @constructor
     */
    constructor() 
    {
        this.botClient = new Discord.Client();
        this.config = require("../../config.json");
        this.dataStore = new DataStore();
        this.commandHandler = new CommandHandler(this.dataStore);
        this.isVoiceConnected = false;
    }

    /**
     * Run the bot.
     */
    public async run(): Promise<void>
    {
        Winston.debug("Setting up event listeners.");
        this.setupListeners();

        Winston.info("Attempting to login.");
        await this.botClient.login(this.config.botToken);
    }

    /**
     * Sets up event listeners.
     */
    private setupListeners()
    {
        // Upon successful Discord connection.
        this.botClient.on("ready", () =>
        {
            Winston.info("Connected to Discord. Ready.");
            Winston.info("Attempting to join voice channel.");
            this.connectToVoice();
        });

        // Open user input stream in the console.
        this.stdin = process.openStdin();
        this.stdin.addListener("data", d =>
        {
            const input: string = d.toString().trim();
            this.commandHandler.handle({ command: input, discordClient: this.botClient, stdin: this.stdin });
        });
    }

    /**
     * Connect to the voice channel as specified in the config.
     */
    private async connectToVoice(): Promise<void>
    {
        const voiceChannel: Discord.VoiceChannel = this.botClient.channels.find(x => x.id === this.config.voiceChannel) as Discord.VoiceChannel;
        if (!voiceChannel)
        {
            Winston.error(`Cannot find voice channel with id ${this.config.voiceChannel}`);
            throw new Error("Cannot find specified voice channel.");
        }

        this.voiceConnection = await voiceChannel.join();
        this.voiceConnection.on("debug", msg => 
        {
            Winston.debug(`[Voice Connection Debug] ${msg}`);
        });
        this.voiceConnection.on("disconnect", () =>
        {
            Winston.info("Disconnected from the voice channel.");
            this.voiceConnection.removeAllListeners();
            this.voiceConnection.disconnect();
            this.voiceConnection = null;
            this.isVoiceConnected = false;
        });
        this.voiceConnection.on("error", e =>
        {
            Winston.error(`Voice connection error: ${e.message}`);
            this.voiceConnection.removeAllListeners();
            this.voiceConnection.disconnect();
            this.voiceConnection = null;
            this.isVoiceConnected = false;
        });
        this.voiceConnection.on("failed", e =>
        {
            Winston.error(`Failed to connect to voice: ${e.message}`);
            this.voiceConnection.removeAllListeners();
            this.voiceConnection.disconnect();
            this.voiceConnection = null;
            this.isVoiceConnected = false;
        });

        const effectsPath: string = path.resolve(__dirname, "../../effects");
        const effectFile: string = path.join(effectsPath, "boop.wav");

        const d: any = this.voiceConnection.playFile(effectFile);
    }
}