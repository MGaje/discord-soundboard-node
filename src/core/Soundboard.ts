import * as Discord from "discord.js"

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
    public run()
    {
        // TODO: Implement.
    }
}