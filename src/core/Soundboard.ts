import * as Discord from "discord.js"
import * as Winston from "winston";

import { DataStore } from "./DataStore";
import { Config } from "./Config";
import { CommandHandler } from "../handlers/CommandHandler/CommandHandler";

export class Soundboard
{
    private botClient: Discord.Client;
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
            Winston.info("Connected to Discord.");
        });

        // Open user input stream in the console.
        this.stdin = process.openStdin();
        this.stdin.addListener("data", d =>
        {
            const input: string = d.toString().trim();
            this.commandHandler.handle({ command: input, discordClient: this.botClient, stdin: this.stdin });
        });
    }
}