export interface FfmpegOperable
{
    normalize(file: string): Promise<string>;
}