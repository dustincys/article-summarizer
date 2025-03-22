import { parseWithPlaywright } from "./parse-url.js";
import { trimTheContent } from "./completions.js";
import { getCompletion } from "./completions.js";
import { logger } from "./logger.js";
import * as fs from 'fs';

const [inputFile, outputFile] = process.argv.slice(2);
const urls = fs.readFileSync(inputFile, 'utf-8').split('\n').filter(Boolean);
const articles = await parseWithPlaywright(urls);
const responses = await getCompletion({ articles });

fs.writeFileSync(outputFile, JSON.stringify(trimTheContent(responses), null, 2));

logger.success("done");
