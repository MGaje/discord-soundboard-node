import * as https from "https";
import * as http from "http";
import * as fs from "fs";
import * as child_process from "child_process";
import * as path from "path";

import * as Winston from "winston";

/**
 * Holds various functions that may be useful app-wide.
 */
export class Utility
{
    /**
     * Download a file given a url.
     * @param {string} url The url where the file is located.
     * @param {string} filePath The filename of the file.
     * @returns {string} A promise containing the path and file that was written (in string form).
     */
    public static downloadFile(url: string, filePath: string): Promise<void>
    {
        return new Promise((resolve, reject) => 
        {
            const request: http.ClientRequest = https.get(url, response =>
            {
                // Ensure the url was valid.
                if (response.statusCode === 200)
                {
                    if (!url || url.length === 0)
                    {
                        reject("url cannot be null or empty.");
                    }

                    if (!filePath || filePath.length === 0)
                    {
                        reject("filePath cannot be null or empty.");
                    }

                    const file: fs.WriteStream = fs.createWriteStream(filePath);
                    response.pipe(file);

                    file.on('finish', () => resolve());
                }
                else
                {
                    Winston.error(`Something went wrong downloading file ${filePath} (Status Code: ${response.statusCode})`);
                    Winston.error(`Url: ${url}`);
                    reject(response.statusMessage);
                }                
            });

            request.setTimeout(12000, () => {
                Winston.warn(`Request timed out for url: ${url}`);
                request.abort();
            });
        });
    }

    /**
     * Normalize specified media file.
     * @param {string} file The audio file to normalize.
     * @returns {Promise<string>} Promise containing soundboard filename.
     */
    public static normalizeMediaFile(file: string): Promise<string>
    {
        return new Promise<string>((resolve, reject) =>
        {
            if (!file || file.length === 0)
            {
                reject("file cannot be null or empty.");
            }

            // Do some parsing to get the right filename (the first two characters should be underscores).
            const baseFile: string = path.basename(file).substr(2);
            const dotLoc: number = baseFile.lastIndexOf(".");
            const soundboardFile: string = baseFile.substr(0, dotLoc);
            const outputFile: string = path.join(__dirname, `../../sound-files/${baseFile.substr(0, dotLoc + 1) + "mp3"}`);

            const ffmpeg: child_process.ChildProcess = child_process.spawn(path.resolve(__dirname, "../../node_modules/.bin/ffmpeg.cmd"), 
            [
                '-i', file, 
                '-vn',
                '-acodec', 'libmp3lame',
                '-analyzeduration', '0',
                '-loglevel', '0', 
                '-ar', '44100',
                '-ac', '2',
                '-q:a', '0',
                '-map', 'a',
                '-filter:a', 'loudnorm',
                outputFile
            ]);

            ffmpeg.on('error', e => 
            {
                fs.unlink(file, () => reject(e.toString()));
            });

            ffmpeg.on('close', () => 
            {
                fs.unlink(file, () => resolve(soundboardFile));
            });
        });
    }
}