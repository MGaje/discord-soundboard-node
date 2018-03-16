import * as Winston from "winston";

import { Soundboard } from "./core/Soundboard";

// Configure Winston logger.
Winston.configure({
    level: "debug",
    transports: [
        new Winston.transports.Console({
            colorize: true
        })
    ]
});

const bot: Soundboard = new Soundboard();
bot.run();