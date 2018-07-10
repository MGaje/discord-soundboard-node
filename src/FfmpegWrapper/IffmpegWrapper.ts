export interface IffmpegWrapper
{
    normalize(file: string): Promise<string>;
}