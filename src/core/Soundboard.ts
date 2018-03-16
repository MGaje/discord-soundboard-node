import * as Discord from "discord.js"
import * as Winston from "winston";

import { DataStore } from "./DataStore";
import { Config } from "./Config";

export class Soundboard
{
    private botClient: Discord.Client;
    private config: Config;
    private dataStore: DataStore;

    /**
     * Default constructor.
     * @constructor
     */
    constructor() 
    {
        this.botClient = new Discord.Client();
        this.config = require("../../config.json");
        this.dataStore = new DataStore();
    }

    /**
     * Run the bot.
     */
    public async run(): Promise<void>
    {
        Winston.debug("Setting up event listeners.");
        this.setupListeners();

        Winston.debug("Attempting to login.");
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
            Winston.debug("Connected to Discord.");
        });
    }
}