/**
 * 评论业务逻辑服务
 */
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const config = require('../config');
const { callBailianAPI, parseAuditResult } = require('../utils/bailian');
const { getClientIP } = require('../utils/helpers');

const commentService = {
    /**
     * 获取文章的已通过评论
     */
    async getByPostId(postId) {
        return await Comment.findApprovedByPostId(postId);
    },

    /**
     * 提交评论（含 AI 审核）
     */
    async submit({ postId, parentId, author_name, author_email, author_url, content, isAgent, agentToken, ipAddress }) {
        // 检查文章是否存在
        const exists = await Post.existsPublished(postId);
        if (!exists) {
            return { error: '文章不存在', code: 404 };
        }

        // 检查父评论是否存在（如果是回复）
        if (parentId) {
            const parentComment = await Comment.findById(parentId);
            if (!parentComment || parentComment.post_id !== postId) {
                return { error: '父评论不存在', code: 404 };
            }
        }

        // AI 审核
        let status = 'pending';
        let aiReview = '';

        try {
            const auditAppId = config.bailian.auditAppId;
            if (auditAppId && config.bailian.apiKey) {
                const auditPrompt = JSON.stringify({
                    id: [String(postId)],
                    content: [content]
                });
                const auditResult = await callBailianAPI(auditAppId, auditPrompt);
                const parsed = parseAuditResult(auditResult);
                status = parsed.status;
                aiReview = parsed.review;
            }
        } catch (aiErr) {
            console.error('AI 审核失败:', aiErr.message);
        }

        const commentId = await Comment.create({
            post_id: postId,
            parent_id: parentId || null,
            author_name,
            author_email: author_email || '',
            author_url: author_url || '',
            content,
            status,
            is_agent: isAgent ? 1 : 0,
            agent_token: agentToken || '',
            ip_address: ipAddress || '',
            ai_review: aiReview
        });

        // 更新文章评论数
        if (status === 'approved') {
            await Post.incrementCommentCount(postId);
        }

        return {
            id: commentId,
            status,
            ai_review: aiReview,
            message: status === 'approved' ? '评论已发布' : '评论已提交，等待审核'
        };
    },

    /**
     * 管理后台 - 获取评论列表（支持搜索/筛选）
     */
    async getAdminList({ page, pageSize, search, status }) {
        const offset = (page - 1) * pageSize;
        let where = '1=1';
        const params = [];

        if (search) {
            where += ' AND (c.content LIKE ? OR c.author_name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (status) {
            where += ' AND c.status = ?';
            params.push(status);
        }

        const total = await Comment.count(where, params);
        const list = await Comment.findAll(where, params, pageSize, offset);
        return {
            list,
            pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
        };
    },

    /**
     * 管理后台 - 更新评论状态
     */
    async updateStatus(id, newStatus) {
        const comment = await Comment.findById(id);
        if (!comment) return { error: '评论不存在', code: 404 };

        const oldStatus = comment.status;
        await Comment.updateStatus(id, newStatus);

        // 更新文章评论数
        if (oldStatus !== 'approved' && newStatus === 'approved') {
            await Post.incrementCommentCount(comment.post_id);
        } else if (oldStatus === 'approved' && newStatus !== 'approved') {
            await Post.decrementCommentCount(comment.post_id);
        }

        return { message: `评论已${newStatus === 'approved' ? '通过' : '驳回'}` };
    },

    /**
     * 管理后台 - 删除评论
     */
    async delete(id) {
        const comment = await Comment.findById(id);
        if (!comment) return { error: '评论不存在', code: 404 };

        if (comment.status === 'approved') {
            await Post.decrementCommentCount(comment.post_id);
        }

        await Comment.delete(id);
        return { message: '评论已删除' };
    }
};

module.exports = commentService;
