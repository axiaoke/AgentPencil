/**
 * 文章业务逻辑服务
 */
const Post = require('../models/Post');
const Admin = require('../models/Admin');
const Category = require('../models/Category');
const config = require('../config');
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
    },

    /**
     * Agent - 解析作者 ID（按昵称查找，找不到则返回默认 ID=1）
     */
    async _resolveAuthorId(nickname) {
        const name = nickname || config.agent.defaultAuthorNickname;
        const admin = await Admin.findByNickname(name);
        return admin ? admin.id : 1;
    },

    /**
     * Agent - 解析分类 ID（按名称查找，找不到则返回 null）
     */
    async _resolveCategoryId(categoryName) {
        const name = categoryName || config.agent.defaultCategoryName;
        const category = await Category.findByName(name);
        return category ? category.id : null;
    },

    /**
     * 校验 slug 格式：小写字母、数字、连字符，不能以连字符开头或结尾
     */
    _isValidSlug(slug) {
        return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
    },

    /**
     * Agent - 发布新文章
     * data: { title, content, slug?, excerpt, keywords, category_name, author_nickname, status }
     * - slug 可选，不传则自动生成；传入时需格式合法且全局唯一
     * - content 必须为 Markdown 格式
     * - status 默认 'published'
     * - author 默认 axiaoke
     * - category 默认 技术文档
     */
    async agentCreate(data) {
        if (!data.title || !data.content) {
            return { error: 'title and content are required', code: 400 };
        }

        let slug;
        if (data.slug) {
            if (!this._isValidSlug(data.slug)) {
                return { error: 'Invalid slug: use lowercase letters, numbers, and hyphens only (no leading/trailing hyphens)', code: 400 };
            }
            const exists = await Post.existsBySlug(data.slug);
            if (exists) {
                return { error: `Slug "${data.slug}" is already in use`, code: 409 };
            }
            slug = data.slug;
        } else {
            slug = generateSlug(data.title);
        }

        const authorId = await this._resolveAuthorId(data.author_nickname);
        const categoryId = await this._resolveCategoryId(data.category_name);
        const status = data.status === 'draft' ? 'draft' : 'published';
        const publishedAt = status === 'published' ? new Date() : null;

        const id = await Post.create({
            title: data.title,
            slug,
            content: data.content,
            content_format: 'markdown',
            excerpt: data.excerpt || '',
            keywords: data.keywords || '',
            cover_image: data.cover_image || '',
            category_id: categoryId,
            author_id: authorId,
            status,
            published_at: publishedAt
        });

        return { id, slug, status };
    },

    /**
     * Agent - 编辑文章（只更新传入的字段）
     * data.slug 可选：传入时需格式合法且不与其他文章重复
     */
    async agentUpdate(id, data) {
        const existing = await Post.findById(id);
        if (!existing) {
            return { error: 'Post not found', code: 404 };
        }

        let slug = existing.slug;
        if (data.slug !== undefined) {
            if (!this._isValidSlug(data.slug)) {
                return { error: 'Invalid slug: use lowercase letters, numbers, and hyphens only (no leading/trailing hyphens)', code: 400 };
            }
            const exists = await Post.existsBySlug(data.slug, id);
            if (exists) {
                return { error: `Slug "${data.slug}" is already in use`, code: 409 };
            }
            slug = data.slug;
        }

        let categoryId = existing.category_id;
        if (data.category_name !== undefined) {
            categoryId = await this._resolveCategoryId(data.category_name);
        }

        let authorId = existing.author_id;
        if (data.author_nickname !== undefined) {
            authorId = await this._resolveAuthorId(data.author_nickname);
        }

        let publishedAt = existing.published_at;
        const status = data.status || existing.status;
        if (status === 'published' && existing.status !== 'published') {
            publishedAt = new Date();
        }

        await Post.update(id, {
            title: data.title !== undefined ? data.title : existing.title,
            slug,
            content: data.content !== undefined ? data.content : existing.content,
            content_format: 'markdown',
            excerpt: data.excerpt !== undefined ? data.excerpt : existing.excerpt,
            keywords: data.keywords !== undefined ? data.keywords : existing.keywords,
            cover_image: data.cover_image !== undefined ? data.cover_image : existing.cover_image,
            category_id: categoryId,
            author_id: authorId,
            status,
            published_at: publishedAt
        });

        return { id, slug, status };
    }
};

module.exports = postService;
