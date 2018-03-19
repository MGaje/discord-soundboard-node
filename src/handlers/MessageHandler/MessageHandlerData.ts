import * as Discord from "discord.js";

export interface MessageHandlerData
{
    msg: Discord.Message
    voiceConnection: Discord.VoiceConnection;
    botUser: Discord.ClientUser;
}