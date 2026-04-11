/**
 * SEO 服务层
 * - generateFiles: 生成 robots.txt / sitemap.xml
 * - buildPostHtml: 文章页服务端渲染
 * - buildHomeHtml: 首页服务端渲染（含分页）
 * - buildProfileHtml: 关于我页面服务端渲染
 */
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const db = require('../models/db');
const Post = require('../models/Post');
const Setting = require('../models/Setting');
const config = require('../config');
const {
    indexHtmlPath,
    indexHtmlTemplate,
    escapeHtmlAttr,
    getBaseUrl,
    applyCommonMeta,
    replaceEmptyState
} = require('../utils/seoHelpers');

const seoService = {

    // ============================================================
    // 生成 robots.txt / sitemap.xml
    // ============================================================
    async generateFiles() {
        try {
            const publicPath = path.join(__dirname, '../public');
            const robotsPath = path.join(publicPath, 'robots.txt');
            const sitemapPath = path.join(publicPath, 'sitemap.xml');

            const robotsContent = `User-agent: *
Allow: /
Allow: /post/
Allow: /api/
Allow: /images/

Disallow: /admin/
Disallow: /api/admin/

Sitemap: /sitemap.xml`;

            fs.writeFileSync(robotsPath, robotsContent);

            const [posts] = await db.query('SELECT slug, published_at FROM posts WHERE status = "published" ORDER BY published_at DESC');
            const [settings] = await db.query('SELECT setting_value FROM site_settings WHERE setting_key = "site_url"');
            const baseUrl = settings.length > 0 && settings[0].setting_value
                ? settings[0].setting_value
                : 'http://localhost:8086';

            let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseUrl}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${baseUrl}/profile</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`;

            for (const post of posts) {
                const date = post.published_at
                    ? new Date(post.published_at).toISOString()
                    : new Date().toISOString();
                sitemapContent += `
    <url>
        <loc>${baseUrl}/post/${post.slug}.html</loc>
        <lastmod>${date}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>`;
            }

            sitemapContent += `\n</urlset>`;
            fs.writeFileSync(sitemapPath, sitemapContent);

            return { code: 0, message: 'SEO 文件生成成功' };
        } catch (error) {
            console.error('SEO Generation error:', error);
            return { code: 500, error: '生成失败', details: error.message };
        }
    },

    // ============================================================
    // 文章页：注入文章 meta + 预渲染文章内容
    // ============================================================
    async buildPostHtml(req, slug) {
        const [post, settings] = await Promise.all([
            Post.findBySlug(slug),
            Setting.getAll()
        ]);

        if (!post) return null;

        const e = escapeHtmlAttr;
        const siteTitle = settings.site_title || '博客';
        const description = post.excerpt || post.title || '';
        const keywords = [post.keywords, settings.site_keywords].filter(Boolean).join(',');
        const baseUrl = getBaseUrl(req);
        const canonicalUrl = `${baseUrl}/post/${post.slug}.html`;
        const rawCover = post.cover_image || settings.site_logo || '/images/logo.png';
        const coverImage = rawCover.startsWith('http') ? rawCover : `${baseUrl}${rawCover}`;

        const jsonLd = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description,
            image: coverImage,
            datePublished: post.published_at || post.created_at,
            author: { '@type': 'Person', name: post.author_name || settings.site_author || '博主' },
            publisher: {
                '@type': 'Organization',
                name: siteTitle,
                logo: { '@type': 'ImageObject', url: `${baseUrl}${settings.site_logo || '/images/logo.png'}` }
            },
            url: canonicalUrl
        });

        let html = applyCommonMeta(indexHtmlTemplate, {
            title: `${post.title} - ${siteTitle}`,
            description,
            keywords,
            canonicalUrl,
            ogImage: coverImage,
            ogType: 'article'
        });

        const headInject = [
            `  <meta name="author" content="${e(post.author_name || settings.site_author || '')}">`,
            `  <script type="application/ld+json">${jsonLd}</script>`
        ].join('\n') + '\n';
        html = html.replace('</head>', headInject + '</head>');

        // 渲染文章内容
        let contentHtml;
        try {
            contentHtml = post.content_format === 'html'
                ? post.content
                : marked.parse(post.content || '');
            contentHtml = contentHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        } catch (err) {
            contentHtml = post.content || '';
        }

        const publishDate = post.published_at || post.created_at || '';
        const authorName = e(post.author_name || settings.site_author || '');
        const categoryName = post.category_name ? `<span class="post-item-cat">${e(post.category_name)}</span>` : '';

        const ssrArticle = `<div v-else-if="!loading"><div class="post-detail">
        <div class="post-header">
          <h1 class="post-title">${e(post.title)}</h1>
          <div class="post-meta">
            <span class="post-author">${authorName}</span>
            <time datetime="${e(publishDate)}">${e(publishDate ? publishDate.toString().slice(0, 10) : '')}</time>
            ${categoryName}
          </div>
        </div>
        <article class="post-content">${contentHtml}</article>
      </div></div>`;

        return replaceEmptyState(html, ssrArticle);
    },

    // ============================================================
    // 首页：注入站点 meta + 预渲染文章列表（支持分页和分类筛选）
    // ============================================================
    async buildHomeHtml(req) {
        // 读取分页和分类参数，确保源码中的文章列表与当前页一致
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = config.pagination.pageSize;
        const offset = (page - 1) * pageSize;
        const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : null;

        const categoryWhere = categoryId ? 'p.category_id = ?' : '1=1';
        const categoryParams = categoryId ? [categoryId] : [];

        const [settings, posts] = await Promise.all([
            Setting.getAll(),
            Post.findPublished(pageSize, offset, categoryWhere, categoryParams)
        ]);

        const e = escapeHtmlAttr;
        const baseUrl = getBaseUrl(req);
        const canonicalUrl = `${baseUrl}/`;
        const siteTitle = settings.site_title || '博客';
        const rawLogo = settings.site_logo || '/images/logo.png';
        const logoUrl = rawLogo.startsWith('http') ? rawLogo : `${baseUrl}${rawLogo}`;

        let html = applyCommonMeta(indexHtmlTemplate, {
            title: siteTitle,
            description: settings.site_description || '',
            keywords: settings.site_keywords || '',
            canonicalUrl,
            ogImage: logoUrl
        });

        // 预渲染文章列表，保留 v-else-if 指令维持 Vue 条件链
        let postListHtml;
        if (posts.length > 0) {
            const items = posts.map(post => {
                const pubDate = post.published_at || post.created_at || '';
                const dateStr = pubDate ? pubDate.toString().slice(0, 10) : '';
                const postUrl = `/post/${e(post.slug)}.html`;
                return `<li class="post-item">
          <div class="post-item-inner">
            <div class="post-item-body">
              <h2 class="post-item-title"><a href="${postUrl}">${e(post.title)}</a></h2>
              ${post.excerpt ? `<p class="post-item-excerpt">${e(post.excerpt)}</p>` : ''}
              <div class="post-item-meta">
                <span>${e(post.author_name || settings.site_author || '')}</span>
                <time datetime="${e(dateStr)}">${e(dateStr)}</time>
                ${post.category_name ? `<span>${e(post.category_name)}</span>` : ''}
              </div>
            </div>
          </div>
        </li>`;
            }).join('\n');
            postListHtml = `<div v-else-if="!loading"><ul class="post-list">\n${items}\n      </ul></div>`;
        } else {
            postListHtml = `<div class="empty-state" v-else-if="!loading"><p>还没有文章</p></div>`;
        }

        return replaceEmptyState(html, postListHtml);
    },

    // ============================================================
    // 关于我页面：注入独立 meta + 预渲染页面内容
    // ============================================================
    async buildProfileHtml(req) {
        const settings = await Setting.getAll();
        const e = escapeHtmlAttr;
        const baseUrl = getBaseUrl(req);
        const canonicalUrl = `${baseUrl}/profile`;
        const siteTitle = settings.site_title || '博客';
        const aboutTitle = settings.about_title || '关于我';
        const rawLogo = settings.site_logo || '/images/logo.png';
        const logoUrl = rawLogo.startsWith('http') ? rawLogo : `${baseUrl}${rawLogo}`;

        let html = applyCommonMeta(indexHtmlTemplate, {
            title: `${aboutTitle} - ${siteTitle}`,
            description: settings.about_description || settings.site_description || '',
            keywords: settings.about_keywords || settings.site_keywords || '',
            canonicalUrl,
            ogImage: logoUrl
        });

        let aboutContentHtml = '';
        try {
            aboutContentHtml = settings.about_content
                ? marked.parse(settings.about_content)
                : '';
            aboutContentHtml = aboutContentHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        } catch (err) {
            aboutContentHtml = settings.about_content || '';
        }

        const profileHtml = `<div v-else-if="!loading"><div class="post-detail">
        <div class="post-header">
          <h1 class="post-title">${e(aboutTitle)}</h1>
        </div>
        <article class="post-content">${aboutContentHtml}</article>
      </div></div>`;

        return replaceEmptyState(html, profileHtml);
    }
};

module.exports = seoService;
