/**
 * 评论数据模型 - 纯数据库 CRUD
 */
const pool = require('./db');

const Comment = {
    /**
     * 查询文章的已通过评论
     */
    async findApprovedByPostId(postId) {
        const [rows] = await pool.query(
            `SELECT id, post_id, parent_id, author_name, author_url, content, is_agent, created_at 
       FROM comments WHERE post_id = ? AND status = ? ORDER BY created_at ASC`,
            [postId, 'approved']
        );
        return rows;
    },

    /**
     * 创建评论
     */
    async create({ post_id, parent_id, author_name, author_email, author_url, content, status, is_agent, agent_token, ip_address, ai_review }) {
        const [result] = await pool.query(
            `INSERT INTO comments (post_id, parent_id, author_name, author_email, author_url, content, status, is_agent, agent_token, ip_address, ai_review) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [post_id, parent_id || null, author_name, author_email || '', author_url || '', content, status, is_agent, agent_token || '', ip_address || '', ai_review || '']
        );
        return result.insertId;
    },

    /**
     * 分页查询评论（管理后台，支持筛选）
     */
    async findAll(where, params, pageSize, offset) {
        const [rows] = await pool.query(
            `SELECT c.*, p.title as post_title, p.slug as post_slug
       FROM comments c 
       LEFT JOIN posts p ON c.post_id = p.id 
       WHERE ${where} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
            [...params, pageSize, offset]
        );
        return rows;
    },

    /**
     * 统计评论数量
     */
    async count(where = '1=1', params = []) {
        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM comments c WHERE ${where}`, params
        );
        return total;
    },

    /**
     * 根据 ID 查询评论
     */
    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [id]);
        return rows[0] || null;
    },

    /**
     * 更新评论状态
     */
    async updateStatus(id, status) {
        await pool.query('UPDATE comments SET status = ? WHERE id = ?', [status, id]);
    },

    /**
     * 删除评论
     */
    async delete(id) {
        await pool.query('DELETE FROM comments WHERE id = ?', [id]);
    },

    /**
     * 统计数据（仪表盘）
     */
    async getStats() {
        const [[{ commentCount }]] = await pool.query('SELECT COUNT(*) as commentCount FROM comments');
        const [[{ pendingCount }]] = await pool.query('SELECT COUNT(*) as pendingCount FROM comments WHERE status = ?', ['pending']);
        return { commentCount, pendingCount };
    },

    /**
     * 最近评论（仪表盘）
     */
    async findRecent(limit = 5) {
        const [rows] = await pool.query(
            `SELECT c.id, c.author_name, c.content, c.status, c.created_at, p.title as post_title 
       FROM comments c LEFT JOIN posts p ON c.post_id = p.id 
       ORDER BY c.created_at DESC LIMIT ?`,
            [limit]
        );
        return rows;
    }
};

module.exports = Comment;
