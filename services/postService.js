/**
 * 文章业务逻辑服务
 */
const Post = require('../models/Post');
const { generateSlug } = require('../utils/helpers');

const postService = {
    /**
     * 获取已发布文章列表（分页）
     */
    async getPublishedList(page, pageSize, categoryId = null) {
        const offset = (page - 1) * pageSize;
        let where = '1=1';
        let params = [];
        if (categoryId) {
            where = 'p.category_id = ?';
            params.push(categoryId);
        }

        const total = await Post.countPublished(where, params);
        const list = await Post.findPublished(pageSize, offset, where, params);
        return {
            list,
            pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
        };
    },

    /**
     * 根据 slug 获取已发布文章（并增加阅读数）
     */
    async getBySlug(slug) {
        const post = await Post.findBySlug(slug);
        if (!post) return null;
        await Post.incrementViewCount(post.id);
        post.view_count += 1;
        return post;
    },

    /**
     * 根据 ID 获取已发布文章（并增加阅读数）
     */
    async getPublishedById(id) {
        const post = await Post.findPublishedById(id);
        if (!post) return null;
        await Post.incrementViewCount(post.id);
        post.view_count += 1;
        return post;
    },

    /**
     * 根据 ID 获取已发布文章（不增加阅读数，Agent 用）
     */
    async getPublishedByIdRaw(id) {
        return await Post.findPublishedById(id);
    },

    /**
     * 检查已发布文章是否存在
     */
    async existsPublished(id) {
        return await Post.existsPublished(id);
    },

    /**
     * 管理后台 - 获取文章列表（支持搜索/筛选）
     */
    async getAdminList({ page, pageSize, search, status }) {
        const offset = (page - 1) * pageSize;
        let where = '1=1';
        const params = [];

        if (search) {
            where += ' AND (title LIKE ? OR keywords LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (status) {
            where += ' AND status = ?';
            params.push(status);
        }

        const total = await Post.count(where, params);
        const list = await Post.findAll(where, params, pageSize, offset);
        return {
            list,
            pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
        };
    },

    /**
     * 管理后台 - 获取文章详情
     */
    async getById(id) {
        return await Post.findById(id);
    },

    /**
     * 管理后台 - 创建文章
     */
    async create(data) {
        const slug = data.slug || generateSlug(data.title);
        const publishedAt = data.status === 'published' ? new Date() : null;
        const id = await Post.create({
            title: data.title,
            slug,
            content: data.content,
            content_format: data.content_format || 'markdown',
            excerpt: data.excerpt,
            keywords: data.keywords,
            cover_image: data.cover_image,
            category_id: data.category_id,
            author_id: data.author_id,
            status: data.status || 'draft',
            published_at: publishedAt
        });
        return id;
    },

    /**
     * 管理后台 - 更新文章
     */
    async update(id, data) {
        const existing = await Post.findById(id);
        if (!existing) return null;

        let publishedAt = existing.published_at;
        if (data.status === 'published' && existing.status !== 'published') {
            publishedAt = new Date();
        }

        await Post.update(id, {
            title: data.title || existing.title,
            slug: data.slug || existing.slug,
            content: data.content !== undefined ? data.content : existing.content,
            content_format: data.content_format || existing.content_format || 'markdown',
            excerpt: data.excerpt !== undefined ? data.excerpt : existing.excerpt,
            keywords: data.keywords !== undefined ? data.keywords : existing.keywords,
            cover_image: data.cover_image !== undefined ? data.cover_image : existing.cover_image,
            category_id: data.category_id !== undefined ? data.category_id : existing.category_id,
            author_id: data.author_id !== undefined ? data.author_id : existing.author_id,
            status: data.status || existing.status,
            published_at: publishedAt
        });

        return true;
    },

    /**
     * 搜索文章
     */
    async search(keyword) {
        if (!keyword || keyword.trim().length === 0) return [];
        return await Post.search(keyword.trim());
    },

    /**
     * 管理后台 - 删除文章
     */
    async delete(id) {
        await Post.delete(id);
    }
};

module.exports = postService;
