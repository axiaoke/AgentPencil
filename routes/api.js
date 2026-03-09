/**
 * 公开 API 路由 - 前台访客接口
 */
const express = require('express');
const router = express.Router();
const postService = require('../services/postService');
const commentService = require('../services/commentService');
const categoryService = require('../services/categoryService');
const Setting = require('../models/Setting');
const { commentLimiter } = require('../utils/middleware');
const { getClientIP } = require('../utils/helpers');

// 站点设置
router.get('/settings', async (req, res) => {
    try {
        const settings = await Setting.getAll();
        res.json({ code: 0, data: settings });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 分类列表
router.get('/categories', async (req, res) => {
    try {
        const categories = await categoryService.getAll();
        res.json({ code: 0, data: categories });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 文章列表（分页）
router.get('/posts', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 10));
        const categoryId = req.query.categoryId || null;
        const data = await postService.getPublishedList(page, pageSize, categoryId);
        res.json({ code: 0, data });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 搜索文章
router.get('/posts/search', async (req, res) => {
    try {
        const keyword = req.query.q || '';
        if (!keyword.trim()) {
            return res.json({ code: 0, data: [] });
        }
        const results = await postService.search(keyword);
        res.json({ code: 0, data: results });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 文章详情（通过 slug）
router.get('/posts/slug/:slug', async (req, res) => {
    try {
        const slug = req.params.slug.replace('.html', '');
        const post = await postService.getBySlug(slug);
        if (!post) {
            return res.status(404).json({ code: 404, message: '文章不存在' });
        }
        res.json({ code: 0, data: post });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 文章详情（通过 ID）
router.get('/posts/:id', async (req, res) => {
    try {
        const post = await postService.getPublishedById(req.params.id);
        if (!post) {
            return res.status(404).json({ code: 404, message: '文章不存在' });
        }
        res.json({ code: 0, data: post });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 文章评论列表
router.get('/posts/:id/comments', async (req, res) => {
    try {
        const comments = await commentService.getByPostId(req.params.id);
        res.json({ code: 0, data: comments });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 提交评论（含 AI 审核 + 限流）
router.post('/posts/:id/comments', commentLimiter, async (req, res) => {
    try {
        const { author_name, author_email, author_url, content } = req.body;
        if (!author_name || !content) {
            return res.status(400).json({ code: 400, message: '名称和内容不能为空' });
        }

        const result = await commentService.submit({
            postId: parseInt(req.params.id),
            author_name,
            author_email,
            author_url,
            content,
            isAgent: !!req.headers['x-agent-token'],
            agentToken: req.headers['x-agent-token'] || '',
            ipAddress: getClientIP(req)
        });

        if (result.error) {
            return res.status(result.code).json({ code: result.code, message: result.error });
        }

        res.json({
            code: 0,
            message: result.message,
            data: {
                id: result.id,
                status: result.status,
                ai_review: result.ai_review
            }
        });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

module.exports = router;
