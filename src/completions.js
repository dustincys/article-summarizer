import axios from "axios";
import OpenAI from "openai";
import cliSpinners from "cli-spinners";
import { oraPromise } from "ora";
import { logger } from "./logger.js";

/**
 *
 * @param {string} prompt
 * @param {"text-davinci-003"|"text-curie-001"} model - Davinci is the most powerful model, but it's also the most expensive
 * @returns
 */


// 设置一个最大值
// 设置openai 和 deepseek 切换开关

async function createCompletion(articleText) {
    // logger.log("createCompletion");
    // logger.log(articleText);
    if (!articleText?.trim()) {
        return ""; // 直接返回空字符串
    }

    try {

        logger.log("apikey");
        logger.log(process.env.APIKEY);
        logger.log("baseurl");
        logger.log(process.env.BASEURL);


        const client = new OpenAI(
            {
                apiKey: process.env.APIKEY,
                baseURL: process.env.BASEURL,
            }
        );

        logger.log("prompt");
        logger.log(process.env.PROMPT);

        const completion = await client.chat.completions.create({
            model: process.env.MODEL,
            messages: [
                {
                    role: "system",
                    content: process.env.PROMPT,
                },
                {
                    role: "user",
                    content: articleText,
                },
            ],
        });

        logger.log("completion");
        logger.log(completion);

        logger.log("get response");
        logger.log(completion?.choices[0].message?.content?.trim());

        return completion?.choices[0].message?.content?.trim() || "";
    } catch (error) {
        if (axios.default.isAxiosError(error) && error.response) {
            logger.error("Error getting completion:");
            logger.error(error.response.data.error?.message);
        } else {
            throw error;
        }
        process.exit(1);
    }
}


// trim the articles //////////////////////////////////////////////////////////
function trimTheContent(articles) {
    return articles.map(item => ({
        ...item, // 使用展开运算符保留其他字段
        content: item.content
            ? item.content.trim().slice(0, process.env.MAX_ARTICLE_LENGTH,) // 先trim再截断
            : '' // 防御性处理空值
    }));
}

export async function getCompletion({ articles }) {
    const articlesTrimed = trimTheContent(articles);
    // logger.log(articlesTrimed.map(article => article.content));

    const articleRequests =
        articlesTrimed.map((article, index) =>
            oraPromise(
                async () => {
                    const response = await createCompletion(
                        article.content
                    );
                    return { index, response };
                },
                {
                    spinner: cliSpinners.earth,
                    text: "Generating response...",
                }
            )
        );

    const resolvedRequests = await Promise.all(articleRequests);

    // Preserve the order of the content completions
    const responses = resolvedRequests
          .sort((a, b) => a.index - b.index);

    return responses;
}
