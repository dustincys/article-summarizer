import { config } from "dotenv";
import { parseWithPlaywright } from "./parse-url.js";
import { logger } from "./logger.js";
import { getCompletion } from "./completions.js";

// Load .env file
// this file contains api key and prompt defined
config({
    path: "~/.env",
    override: false,
});

/**
 * 1. Get the main content of the URL
 */
///////////////////////////////////////////////////////////////////////////////
//     Here we have to get text one by one, to avoid the anti-spider scheme  //
///////////////////////////////////////////////////////////////////////////////

const urls = process.argv.slice(2);
const articles = await parseWithPlaywright(urls);
// logger.log(articles);

/**
 * 2. Run the prompt against the URL's content
 */
const responses = await getCompletion({ articles });

logger.success("Response ⤵️ ");

logger.log(responses);
