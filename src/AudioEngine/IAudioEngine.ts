import * as Discord from "discord.js";

export interface IAudioEngine
{
    resetVoiceConnection(voiceChannel?: Discord.VoiceChannel): void;
    play(toPlay: string): void;
}