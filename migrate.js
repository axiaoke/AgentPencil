/**
 * WordPress 数据迁移脚本
 * 从 WordPress wp_posts 表迁移文章到新博客系统
 *
 * 使用方法：
 * 1. 配置 .env 中的 WP_DB_* 和目标数据库变量
 * 2. 运行: node migrate.js            (默认转换为 Markdown)
 * 3. 运行: node migrate.js --html     (保留原始 HTML 格式)
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const TurndownService = require('turndown');

// 解析命令行参数：--html 表示保留 HTML 格式不转换
const keepHtml = process.argv.includes('--html');

const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-'
});

// 清洗 WordPress 内容（移除短代码和 Gutenberg 注释）
function cleanWPContent(html) {
    if (!html) return '';

    let content = html;

    // 移除 WordPress 短代码 [shortcode attr="val"]...[/shortcode]
    content = content.replace(/\[\/?[a-zA-Z_-]+[^\]]*\]/g, '');

    // 移除 WordPress 特殊注释（Gutenberg 块标记）
    content = content.replace(/<!--\s*\/?wp:[\s\S]*?-->/g, '');

    // 移除空行过多
    content = content.replace(/\n{3,}/g, '\n\n');

    return content.trim();
}

// 将 HTML 转为 Markdown
function convertToMarkdown(html) {
    try {
        return turndown.turndown(html);
    } catch (e) {
        // 如果转换失败，返回原始去标签内容
        return html.replace(/<[^>]+>/g, '');
    }
}

// 生成 URL 友好的 slug
function generateSlug(postName, id) {
    if (postName && /^[a-zA-Z0-9-]+$/.test(postName)) {
        return postName.toLowerCase();
    }
    return `post-${id}`;
}

async function migrate() {
    const formatLabel = keepHtml ? 'HTML（保留原始格式）' : 'Markdown（自动转换）';
    console.log('📦 WordPress 数据迁移开始...');
    console.log(`📋 存储格式: ${formatLabel}\n`);

    // 连接 WordPress 数据库
    const wpPool = mysql.createPool({
        host: process.env.WP_DB_HOST || 'localhost',
        port: process.env.WP_DB_PORT || 3306,
        user: process.env.WP_DB_USER || 'root',
        password: process.env.WP_DB_PASSWORD || '',
        database: process.env.WP_DB_NAME || 'wordpress',
        charset: 'utf8mb4'
    });

    // 连接新博客数据库
    const blogPool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'blog',
        charset: 'utf8mb4'
    });

    try {
        const prefix = process.env.WP_TABLE_PREFIX || 'wp_';

        // 1. 读取 WordPress 文章
        console.log('📖 正在读取 WordPress 文章...');
        const [wpPosts] = await wpPool.query(
            `SELECT ID, post_date, post_content, post_title, post_excerpt, 
              post_name, post_modified, post_status
       FROM ${prefix}posts 
       WHERE post_status = 'publish' AND post_type = 'post'
       ORDER BY post_date ASC`
        );

        console.log(`   找到 ${wpPosts.length} 篇已发布文章\n`);

        if (wpPosts.length === 0) {
            console.log('⚠️  没有找到需要迁移的文章');
            return;
        }

        // 2. 逐篇迁移
        let successCount = 0;
        let failCount = 0;
        const contentFormat = keepHtml ? 'html' : 'markdown';

        for (const wp of wpPosts) {
            try {
                const title = wp.post_title || '无标题';

                // 清洗 WordPress 特有标记
                const cleanedHtml = cleanWPContent(wp.post_content);

                // 根据模式决定是否转换为 Markdown
                const content = keepHtml ? cleanedHtml : convertToMarkdown(cleanedHtml);

                const excerpt = wp.post_excerpt
                    ? wp.post_excerpt.substring(0, 300)
                    : content.replace(/<[^>]+>/g, '').substring(0, 200).replace(/\n/g, ' ');
                const slug = generateSlug(wp.post_name, wp.ID);
                const createdAt = wp.post_date;
                const publishedAt = wp.post_date;

                // 检查 slug 是否已存在
                const [existing] = await blogPool.query(
                    'SELECT id FROM posts WHERE slug = ?', [slug]
                );

                if (existing.length > 0) {
                    console.log(`   ⏭️  跳过: "${title}" (slug "${slug}" 已存在)`);
                    continue;
                }

                await blogPool.query(
                    `INSERT INTO posts (title, slug, content, content_format, excerpt, keywords, cover_image, status, created_at, published_at) 
           VALUES (?, ?, ?, ?, ?, '', '', 'published', ?, ?)`,
                    [title, slug, content, contentFormat, excerpt, createdAt, publishedAt]
                );

                successCount++;
                console.log(`   ✅ 迁移成功: "${title}" → /post/${slug}.html`);
            } catch (err) {
                failCount++;
                console.log(`   ❌ 迁移失败: "${wp.post_title}" - ${err.message}`);
            }
        }

        console.log(`\n📊 迁移完成: 成功 ${successCount} 篇, 失败 ${failCount} 篇, 共 ${wpPosts.length} 篇`);
        console.log(`📋 存储格式: ${contentFormat}`);

    } catch (err) {
        console.error('❌ 迁移出错:', err.message);
    } finally {
        await wpPool.end();
        await blogPool.end();
    }
}

migrate();
