import { config } from "dotenv";
import { parseWithPlaywright } from "./parse-url.js";
import { getCompletion } from "./completions.js";
import { logger } from "./logger.js";
import * as fs from 'fs';

config({
    path: "~/.env",
    override: false,
});

const [inputFile, outputFile] = process.argv.slice(2);
const urls = fs.readFileSync(inputFile, 'utf-8').split('\n').filter(Boolean);
const articles = await parseWithPlaywright(urls);
const responses = await getCompletion({ articles });

fs.writeFileSync(outputFile, JSON.stringify(responses, null, 2));

logger.success("done");
