import * as fs from "fs";
import * as child_process from "child_process";
import * as path from "path";

import { FfmpegOperable } from "./FfmpegOperable";

export class FfmpegWrapper implements FfmpegOperable
{
    /**
     * Normalize specified media file.
     * @param {string} file The audio file to normalize.
     * @returns {Promise<string>} Promise containing soundboard filename.
     */
    public normalize(file: string): Promise<string>
    {
        const localFile: string = path.join(__dirname, `../../${file}`)

        return new Promise<string>((resolve, reject) =>
        {
            if (!file || file.length === 0)
            {
                reject("file cannot be null or empty.");
            }

            // Do some parsing to get the right filename (the first two characters should be underscores).
            const dotLoc: number = file.lastIndexOf(".");
            const soundboardFile: string = file.substr(0, dotLoc);
            const outputFile: string = path.join(__dirname, `../../effects-normalized/${file.substr(0, dotLoc + 1) + "wav"}`);

            const ffmpeg: child_process.ChildProcess = child_process.spawn(path.resolve(__dirname, "../../node_modules/.bin/ffmpeg.cmd"), 
            [
                '-i', localFile, 
                '-vn',
                '-analyzeduration', '0',
                '-loglevel', '0',
                '-ar', '44100',
                '-map', 'a',
                '-filter:a', 'loudnorm',
                outputFile
            ]);

            ffmpeg.on('error', e => 
            {
                fs.unlink(localFile, () => reject(e.toString()));
            });

            ffmpeg.on('close', () => 
            {
                fs.unlink(localFile, () => resolve(soundboardFile));
            });
        });
    }
}