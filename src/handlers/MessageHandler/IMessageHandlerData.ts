import * as Discord from "discord.js";

export interface IMessageHandlerData
{
    msg: Discord.Message
    botUser: Discord.ClientUser;
}