import * as Discord from "discord.js";

import { DataStore } from "../../core/DataStore";
import { Handler } from "../../interfaces/Handler";
import { CommandHandlerData } from "./CommandHandlerData";

/**
 * Handler for commands that originate from user input.
 */
export class CommandHandler implements Handler<CommandHandlerData>
{
    private readonly dataStore: DataStore;

    /**
     * CommandHandler constructor.
     * @constructor
     * @param {DataStore} dataStore (Optional) Reference to the data store.
     */
    constructor(dataStore?: DataStore)
    {
        this.dataStore = dataStore;
    }

    /**
     * Handle incoming commands from user input.
     * @param {CommandHandlerData} data Specified data that may be needed for a command.
     */
    public handle(data: CommandHandlerData)
    {
        if (!data)
        {
            throw new Error("Data cannot be null/undefined.");
        }

        switch (data.command.toLowerCase())
        {
            case "quit":
                return this.quit(data.stdin, data.discordClient);

            case "commands":
            case "cmds":
                return this.commandList();

            default:
                return this.unsupportedCommand(data.command);
        }
    }

    // =============================================================
    // Command methods.
    // =============================================================

    /**
     * Quit command method.
     * @param {NodeJS.Socket} stdin The user input stream.
     * @param {Discord.Client} discordClient Discord client.
     */
    private quit(stdin: NodeJS.Socket, discordClient: Discord.Client)
    {
        stdin.removeAllListeners();
        discordClient.destroy();

        process.exit();
    }

    /**
     * Command list method.
     */
    private commandList()
    {
        console.log("Supported commands: quit");
    }

    /**
     * Unsupported command method.
     * @param {string} cmd The command that isn't supported.
     */
    private unsupportedCommand(cmd: string)
    {
        console.log(`This bot does not support the "${cmd}" command.`);
    }
}