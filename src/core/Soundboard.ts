import * as Discord from "discord.js"
import * as Winston from "winston";

import { DataStore } from "./DataStore";
import { Config } from "./Config";
import { CommandHandler } from "../handlers/CommandHandler/CommandHandler";
import { MessageHandler } from "../handlers/MessageHandler/MessageHandler";
import { DataStoreKeys } from "../util/Constants";
import { AudioEngine } from "../core/AudioEngine";

export class Soundboard
{
    private botClient: Discord.Client;
    private isVoiceConnected: boolean;
    private config: Config;
    private dataStore: DataStore;
    private commandHandler: CommandHandler;
    private messageHandler: MessageHandler;
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
        this.messageHandler = new MessageHandler(this.dataStore);
        this.isVoiceConnected = false;
    }

    /**
     * Run the bot.
     */
    public async run(): Promise<void>
    {
        Winston.debug("Setting up event listeners.");
        await this.setupListeners();

        Winston.info("Attempting to login.");
        await this.botClient.login(this.config.botToken);
    }

    /**
     * Sets up event listeners.
     */
    private async setupListeners()
    {
        // Upon successful Discord connection.
        this.botClient.on("ready", async () =>
        {
            Winston.info("Connected to Discord. Ready.");

            Winston.info("Attempting to join voice channel.");
            await this.connectToVoice();
            Winston.info("Connected to voice channel.");
        });

        // Upon receiving a Discord message.
        this.botClient.on("message", async msg =>
        {
            try
            {
                await this.messageHandler.handle({ msg: msg, botUser: this.botClient.user });
            }
            catch (error)
            {
                Winston.error(error.toString());
                throw error;
            }
        });

        // Open user input stream in the console.
        this.stdin = process.openStdin();
        this.stdin.addListener("data", d =>
        {
            try
            {
                const input: string = d.toString().trim();
                this.commandHandler.handle({ command: input, discordClient: this.botClient, stdin: this.stdin });
            }
            catch (error)
            {
                Winston.error(error.toString());
                throw error;
            }
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
            return;
        }

        try
        {
            // Create and store the audio engine in the data store.
            this.dataStore.set(DataStoreKeys.AudioEngineKey, new AudioEngine(await voiceChannel.join()));
        }
        catch (error)
        {
            Winston.error(error.toString());
            throw error;
        }
    }
}