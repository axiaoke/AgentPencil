/**
 * 前台 SSR 路由 - 服务端注入 SEO 元标签和预渲染内容
 * 处理文章页、关于我页、首页及所有 SPA 路由
 */
const express = require('express');
const router = express.Router();
const seoService = require('../services/seoService');
const { indexHtmlPath } = require('../utils/seoHelpers');

// 文章详情页
router.get('/post/:slug.html', async (req, res) => {
    try {
        const html = await seoService.buildPostHtml(req, req.params.slug);
        if (!html) return res.sendFile(indexHtmlPath);
        res.type('html').send(html);
    } catch (err) {
        console.error('Post SEO injection failed:', err.message);
        res.sendFile(indexHtmlPath);
    }
});

// 关于我页面
router.get('/profile', async (req, res) => {
    try {
        const html = await seoService.buildProfileHtml(req);
        res.type('html').send(html);
    } catch (err) {
        console.error('Profile SEO injection failed:', err.message);
        res.sendFile(indexHtmlPath);
    }
});

// 首页及其他所有前台 SPA 路由（含分页：/?page=2&categoryId=3）
// 含 . 的路径（静态资源）和 /api/ 路径直接跳过，由后续中间件处理
router.get('*', async (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.includes('.')) {
        return next();
    }
    try {
        const html = await seoService.buildHomeHtml(req);
        res.type('html').send(html);
    } catch (err) {
        console.error('Home SEO injection failed:', err.message);
        res.sendFile(indexHtmlPath);
    }
});

module.exports = router;
