/**
 * 分类数据模型 - 纯数据库 CRUD
 */
const pool = require('./db');

const Category = {
    /**
     * 获取所有分类（按排序值）
     */
    async findAll() {
        const [rows] = await pool.query('SELECT * FROM categories ORDER BY sort_order ASC, id ASC');
        return rows;
    },

    /**
     * 根据 ID 获取分类
     */
    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
        return rows[0] || null;
    },

    /**
     * 根据 slug 获取分类
     */
    async findBySlug(slug) {
        const [rows] = await pool.query('SELECT * FROM categories WHERE slug = ?', [slug]);
        return rows[0] || null;
    },

    /**
     * 创建分类
     */
    async create({ name, slug, sort_order }) {
        const [result] = await pool.query(
            'INSERT INTO categories (name, slug, sort_order) VALUES (?, ?, ?)',
            [name, slug, sort_order || 0]
        );
        return result.insertId;
    },

    /**
     * 更新分类
     */
    async update(id, { name, slug, sort_order }) {
        await pool.query(
            'UPDATE categories SET name = ?, slug = ?, sort_order = ? WHERE id = ?',
            [name, slug, sort_order || 0, id]
        );
    },

    /**
     * 删除分类
     */
    async delete(id) {
        await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    },

    /**
     * 根据名称查询分类（不区分大小写）
     */
    async findByName(name) {
        const [rows] = await pool.query('SELECT * FROM categories WHERE name = ? LIMIT 1', [name]);
        return rows[0] || null;
    }
};

module.exports = Category;
