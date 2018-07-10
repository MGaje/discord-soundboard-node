import * as Discord from "discord.js";

export interface AudioEngineInterface
{
    resetVoiceConnection(voiceChannel?: Discord.VoiceChannel): void;
    play(toPlay: string): void;
}