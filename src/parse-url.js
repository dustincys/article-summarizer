import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { firefox } from "playwright";

export async function parseWithPlaywright(urls) {

    const browser = await firefox.launch({
        headless: true,
        firefoxUserPrefs: {
            "javascript.enabled": true,
            "permissions.default.image": 2,  // 禁止加载图片
            "network.http.redirection-limit": 32,  // 允许更多重定向
            "media.volume_scale": "0.0"            // 静音
        },
        args: [
            '--disable-gpu',
            '--disable-software-rasterizer'
        ]
    });

    const results = [];

    try {
        for (const [index, url] of urls.entries()) {

            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:90.0) Gecko/20100101 Firefox/90.0'
            });
            // 在上下文中设置随机时区
            await context.addInitScript(() => {
                Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', {
                    value: function () {
                        const result = Reflect.apply(this, this, arguments);
                        result.timeZone = 'Asia/Shanghai';
                        return result;
                    }
                });
            });

            const page = await context.newPage();
            await page.setViewportSize({
                width: 1280 + Math.floor(Math.random() * 100),
                height: 800 + Math.floor(Math.random() * 100)
            });


            let article = null;

            try {
                // 智能等待策略
                await page.goto(url, {
                    waitUntil: 'domcontentloaded',
                    timeout: 25000
                });

                // 等待主要内容区域（根据目标网站调整选择器）
                await page.waitForSelector('article, .main-content, #content', {
                    state: 'attached',
                    timeout: 15000
                });

                // 获取完整渲染后的 HTML
                const dynamicHtml = await page.content();

                const dom = new JSDOM(dynamicHtml, {
                    url: url
                });

                article = new Readability(dom.window.document).parse();

                if (!article) {
                    results.push({
                        order: index + 1,
                        url,
                        status: 'fail',
                        title: '',
                        content: '',
                        excerpt: '',
                        length: 0
                    });
                } else {
                    const cleanText = article.textContent
                        .replace(/\u00a0/g, ' ')    // 替换 &nbsp;
                        .replace(/\s+[\r\n]\s+/g, '\n')  // 清理多余换行
                        .trim();

                    results.push({
                        order: index + 1,
                        url,
                        status: 'success',
                        title: article.title,
                        content: cleanText,
                        excerpt: article.excerpt,
                        length: cleanText.length
                    });
                }
            } catch (error) {
                results.push({
                    order: index + 1,
                    url,
                    status: 'error',
                    title: '',
                    content: '',
                    excerpt: '',
                    length: 0
                });
            } finally {
                await context.close();  // 关闭上下文释放资源
            }
        }
    } finally {
        await browser.close();
    }

    return results.sort((a, b) => a.order - b.order);
}
