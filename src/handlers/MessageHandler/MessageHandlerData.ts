import * as Discord from "discord.js";

export interface MessageHandlerData
{
    msg: Discord.Message
    botUser: Discord.ClientUser;
}