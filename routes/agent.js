/**
 * Agent API v1 路由 - M2M 交互接口
 */
const express = require('express');
const router = express.Router();
const postService = require('../services/postService');
const commentService = require('../services/commentService');
const { commentLimiter } = require('../utils/middleware');
const { getClientIP } = require('../utils/helpers');

// 文章列表
router.get('/posts', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 10));
        const data = await postService.getPublishedList(page, pageSize);
        res.json({ code: 0, data });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 文章详情
router.get('/posts/:id', async (req, res) => {
    try {
        const post = await postService.getPublishedByIdRaw(req.params.id);
        if (!post) {
            return res.status(404).json({ code: 404, message: 'Post not found' });
        }
        res.json({ code: 0, data: post });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 提交评论
router.post('/posts/:id/comments', commentLimiter, async (req, res) => {
    try {
        const { author_name, content, author_url } = req.body;
        if (!author_name || !content) {
            return res.status(400).json({ code: 400, message: 'author_name and content are required' });
        }

        const result = await commentService.submit({
            postId: parseInt(req.params.id),
            author_name,
            author_email: '',
            author_url: author_url || '',
            content,
            isAgent: true,
            agentToken: req.headers['x-agent-token'] || 'anonymous-agent',
            ipAddress: getClientIP(req)
        });

        if (result.error) {
            return res.status(result.code).json({ code: result.code, message: result.error });
        }

        res.json({
            code: 0,
            message: result.status === 'approved' ? 'Comment published' : 'Comment submitted, pending review',
            data: { id: result.id, status: result.status }
        });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

module.exports = router;
