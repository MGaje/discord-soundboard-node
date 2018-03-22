import * as https from "https";
import * as http from "http";
import * as fs from "fs";
import * as child_process from "child_process";
import * as path from "path";

import * as Discord from "discord.js";
import * as Winston from "winston";
import * as ytdl from "ytdl-core";

/**
 * Holds various functions that may be useful app-wide.
 */
export class Utility
{
    /**
     * Download a file given a url.
     * @param {string} url The url where the file is located.
     * @param {string} filename The filename of the output file.
     * @returns {Promise<string>} A promise containing the file that was written (in string form).
     */
    public static downloadFile(url: string, filename: string): Promise<string>
    {
        const localFile: string = path.join(__dirname, `../../${filename}`)

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

                    const file: fs.WriteStream = fs.createWriteStream(localFile);
                    response.pipe(file);

                    file.on('finish', () => resolve(filename));
                }
                else
                {
                    Winston.error(`Something went wrong downloading file ${filename} (Status Code: ${response.statusCode})`);
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
     * Rip audio from youtube video and save it as an mp3.
     * @param {string} url The url of the youtube video.
     * @param {string} title The title to associate the new audio file with.
     * @returns {Promise<string>} Promise containing local filename.
     */
    public static downloadFromYoutube(url: string, title: string): Promise<string>
    {        
        const filename: string = `${title}.wav`;
        const localFile: string = path.join(__dirname, `../../${filename}`);

        return new Promise((resolve, reject) => 
        {
            const stream = ytdl(url, { filter: 'audioonly' });
            
            const file: fs.WriteStream = fs.createWriteStream(localFile);
            stream.pipe(file);

            file.on('finish', () => resolve(filename));
        });
    }

    /**
     * Check to determine if the effect name already exists.
     * @param effect The effect name to check.
     * @returns {boolean} True if name already exists and false otherwise.
     */
    public static effectNameExists(effect: string): Promise<boolean>
    {
        const filename: string = path.join(__dirname, `../../effects-normalized/${effect}`);
        
        return new Promise<boolean>((resolve, reject) =>
        {
            fs.stat(filename, error =>
            {
                if (!error)
                {
                    resolve(true);
                }
                else
                {
                    resolve(false);
                }
            });
        });
    }
}