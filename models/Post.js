/**
 * 文章数据模型 - 纯数据库 CRUD
 */
const pool = require('./db');

const Post = {
    /**
     * 查询已发布文章总数
     */
    async countPublished(where = '1=1', params = []) {
        const queryParams = ['published', ...params];
        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM posts p WHERE p.status = ? AND ${where}`, queryParams
        );
        return total;
    },

    /**
     * 查询文章总数（支持筛选）
     */
    async count(where = '1=1', params = []) {
        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM posts WHERE ${where}`, params
        );
        return total;
    },

    /**
     * 分页查询已发布文章列表
     */
    async findPublished(pageSize, offset, where = '1=1', params = []) {
        const queryParams = ['published', ...params, pageSize, offset];
        const [rows] = await pool.query(
            `SELECT p.id, p.title, p.slug, p.excerpt, p.keywords, p.cover_image, p.view_count, p.comment_count, 
              p.content_format, p.created_at, p.published_at, c.name as category_name, c.slug as category_slug,
              a.nickname as author_name, a.avatar as author_avatar
       FROM posts p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN admins a ON p.author_id = a.id
       WHERE p.status = ? AND ${where} ORDER BY p.published_at DESC LIMIT ? OFFSET ?`,
            queryParams
        );
        return rows;
    },

    /**
     * 分页查询文章列表（管理后台，支持筛选）
     */
    async findAll(where, params, pageSize, offset) {
        const [rows] = await pool.query(
            `SELECT p.id, p.title, p.slug, p.excerpt, p.keywords, p.cover_image, p.status, p.view_count, p.comment_count, 
              p.created_at, p.updated_at, p.published_at, c.name as category_name, a.nickname as author_name, a.avatar as author_avatar
       FROM posts p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN admins a ON p.author_id = a.id
       WHERE ${where.replace(/title/g, 'p.title').replace(/keywords/g, 'p.keywords').replace(/status/g, 'p.status')} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
            [...params, pageSize, offset]
        );
        return rows;
    },

    /**
     * 根据 slug 查询已发布文章
     */
    async findBySlug(slug) {
        const [rows] = await pool.query(
            `SELECT p.id, p.title, p.slug, p.content, p.content_format, p.excerpt, p.keywords, p.cover_image, p.category_id,
              p.view_count, p.comment_count, p.created_at, p.published_at, c.name as category_name, c.slug as category_slug,
              a.nickname as author_name, a.avatar as author_avatar
       FROM posts p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN admins a ON p.author_id = a.id
       WHERE p.slug = ? AND p.status = ?`,
            [slug, 'published']
        );
        return rows[0] || null;
    },

    /**
     * 根据 ID 查询已发布文章
     */
    async findPublishedById(id) {
        const [rows] = await pool.query(
            `SELECT p.id, p.title, p.slug, p.content, p.content_format, p.excerpt, p.keywords, p.cover_image, p.category_id,
              p.view_count, p.comment_count, p.created_at, p.published_at, c.name as category_name, c.slug as category_slug,
              a.nickname as author_name, a.avatar as author_avatar
       FROM posts p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN admins a ON p.author_id = a.id
       WHERE p.id = ? AND p.status = ?`,
            [id, 'published']
        );
        return rows[0] || null;
    },

    /**
     * 根据 ID 查询文章（不限状态，管理后台用）
     */
    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [id]);
        return rows[0] || null;
    },

    /**
     * 检查已发布文章是否存在
     */
    async existsPublished(id) {
        const [rows] = await pool.query(
            'SELECT id FROM posts WHERE id = ? AND status = ?', [id, 'published']
        );
        return rows.length > 0;
    },

    /**
     * 增加阅读次数
     */
    async incrementViewCount(id) {
        await pool.query('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [id]);
    },

    /**
     * 创建文章
     */
    async create({ title, slug, content, content_format, excerpt, keywords, cover_image, status, published_at, category_id, author_id }) {
        const [result] = await pool.query(
            `INSERT INTO posts (title, slug, content, content_format, excerpt, keywords, cover_image, status, published_at, category_id, author_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, slug, content, content_format || 'markdown', excerpt || '', keywords || '', cover_image || '', status || 'draft', published_at, category_id || null, author_id || 1]
        );
        return result.insertId;
    },

    /**
     * 更新文章
     */
    async update(id, data) {
        await pool.query(
            `UPDATE posts SET title = ?, slug = ?, content = ?, content_format = ?, excerpt = ?, keywords = ?, 
              cover_image = ?, status = ?, published_at = ?, category_id = ?, author_id = ? WHERE id = ?`,
            [data.title, data.slug, data.content, data.content_format || 'markdown', data.excerpt, data.keywords, data.cover_image, data.status, data.published_at, data.category_id || null, data.author_id || 1, id]
        );
    },

    /**
     * 删除文章
     */
    async delete(id) {
        await pool.query('DELETE FROM posts WHERE id = ?', [id]);
    },

    /**
     * 更新评论数（+1 / -1）
     */
    async incrementCommentCount(id) {
        await pool.query('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?', [id]);
    },

    async decrementCommentCount(id) {
        await pool.query('UPDATE posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = ?', [id]);
    },

    /**
     * 最近文章（仪表盘）
     */
    async findRecent(limit = 5) {
        const [rows] = await pool.query(
            'SELECT id, title, slug, view_count, comment_count, created_at FROM posts ORDER BY created_at DESC LIMIT ?',
            [limit]
        );
        return rows;
    },

    /**
     * 统计数据（仪表盘）
     */
    async getStats() {
        const [[{ postCount }]] = await pool.query('SELECT COUNT(*) as postCount FROM posts');
        const [[{ publishedCount }]] = await pool.query('SELECT COUNT(*) as publishedCount FROM posts WHERE status = ?', ['published']);
        const [[{ totalViews }]] = await pool.query('SELECT IFNULL(SUM(view_count), 0) as totalViews FROM posts');
        return { postCount, publishedCount, totalViews };
    },

    /**
     * 搜索文章
     */
    async search(keyword, limit = 20) {
        const [rows] = await pool.query(
            `SELECT p.id, p.title, p.slug, p.excerpt, p.cover_image, p.view_count, p.comment_count,
              p.created_at, p.published_at, c.name as category_name, a.nickname as author_name, a.avatar as author_avatar
       FROM posts p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN admins a ON p.author_id = a.id
       WHERE p.status = 'published' AND (p.title LIKE ? OR p.content LIKE ? OR p.excerpt LIKE ? OR p.keywords LIKE ?)
       ORDER BY p.published_at DESC LIMIT ?`,
            [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, limit]
        );
        return rows;
    }
};

module.exports = Post;
