import { parseWithPlaywright } from "./parse-url.js";
import { trimTheContent } from "./completions.js";
import * as fs from 'fs';

const [inputFile, outputFile] = process.argv.slice(2);
const urls = fs.readFileSync(inputFile, 'utf-8').split('\n').filter(Boolean);
const articles = await parseWithPlaywright(urls);

fs.writeFileSync(outputFile, JSON.stringify(trimTheContent(articles), null, 2));


