import axios from "axios";
import OpenAI from "openai";
import cliSpinners from "cli-spinners";
import { oraPromise } from "ora";
import { logger } from "./logger.js";


async function createCompletion(articleText) {
    if (!articleText?.trim()) {
        return "";
    }

    try {
        const client = new OpenAI(
            {
                apiKey: process.env.APIKEY,
                baseURL: process.env.BASEURL,
            }
        );

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
export function trimTheContent(articles) {
    return articles.map(item => ({
        ...item, // 使用展开运算符保留其他字段
        content: item.content
            ? item.content.trim().slice(0, process.env.MAX_ARTICLE_LENGTH,) // 先trim再截断
            : '' // 防御性处理空值
    }));
}

export async function getCompletion({ articles }) {
    const articlesTrimed = trimTheContent(articles);

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

    const responses = resolvedRequests
        .sort((a, b) => a.index - b.index);

    const articlesWithResponses = articlesTrimed.map((article, index) => ({
        ...article,
        response: responses[index].response
    }));

    return articlesWithResponses;
}
