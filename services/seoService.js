const fs = require('fs');
const path = require('path');
const db = require('../models/db');

const seoService = {
    async generateFiles() {
        try {
            const publicPath = path.join(__dirname, '../public');
            const robotsPath = path.join(publicPath, 'robots.txt');
            const sitemapPath = path.join(publicPath, 'sitemap.xml');

            // --- Generate robots.txt ---
            const robotsContent = `User-agent: *
Allow: /
Allow: /post/
Allow: /api/
Allow: /images/

Disallow: /admin/
Disallow: /api/admin/

Sitemap: /sitemap.xml`;

            fs.writeFileSync(robotsPath, robotsContent);

            // --- Generate sitemap.xml ---
            // Fetch published posts
            const [posts] = await db.query('SELECT slug, published_at FROM posts WHERE status = "published" ORDER BY published_at DESC');

            // Retrieve site settings base URL
            const [settings] = await db.query('SELECT setting_value FROM site_settings WHERE setting_key = "site_url"');
            const baseUrl = settings.length > 0 && settings[0].setting_value ? settings[0].setting_value : 'http://localhost:8086'; // Adjust base URL logic

            let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- Home page -->
    <url>
        <loc>${baseUrl}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <!-- About profile -->
    <url>
        <loc>${baseUrl}/profile</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`;

            for (const post of posts) {
                const date = post.published_at ? new Date(post.published_at).toISOString() : new Date().toISOString();
                sitemapContent += `
    <!-- Post: ${post.slug} -->
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
    }
};

module.exports = seoService;
