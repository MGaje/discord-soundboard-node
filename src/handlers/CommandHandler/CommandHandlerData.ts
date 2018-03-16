import * as Discord from "discord.js";

export interface CommandHandlerData
{
    command: string;
    discordClient: Discord.Client;
    stdin: NodeJS.Socket;
}