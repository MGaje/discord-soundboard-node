import * as Discord from "discord.js";

export interface ICommandHandlerData
{
    command: string;
    discordClient: Discord.Client;
    stdin: NodeJS.Socket;
}