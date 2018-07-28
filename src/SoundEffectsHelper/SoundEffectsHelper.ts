import * as fs from "fs";
import * as path from "path";

import { ISoundEffectsHelper } from "./ISoundEffectsHelper";

export class SoundEffectsHelper implements ISoundEffectsHelper
{
    public list(): Promise<string[]>
    {   
        return new Promise<string[]>(async (resolve, reject) =>
        {
            await fs.readdir(path.join(__dirname, `../../effects-normalized/`), (err, files) =>
            {
                if (err) reject(err);
                
                resolve(files.map(x => path.parse(x).name));
            });
        });
        
    }
}