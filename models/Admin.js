/**
 * 管理员数据模型 - 纯数据库 CRUD
 */
const pool = require('./db');

const Admin = {
    /**
     * 根据用户名查询管理员
     */
    async findByUsername(username) {
        const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
        return rows[0] || null;
    },

    /**
     * 根据 ID 查询管理员
     */
    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM admins WHERE id = ?', [id]);
        return rows[0] || null;
    },

    /**
     * 更新密码
     */
    async updatePassword(id, hashedPassword) {
        await pool.query('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, id]);
    },

    /**
     * 更新头像
     */
    async updateAvatar(id, avatarUrl) {
        await pool.query('UPDATE admins SET avatar = ? WHERE id = ?', [avatarUrl, id]);
    },

    /**
     * 根据昵称查询管理员
     */
    async findByNickname(nickname) {
        const [rows] = await pool.query('SELECT * FROM admins WHERE nickname = ? LIMIT 1', [nickname]);
        return rows[0] || null;
    }
};

module.exports = Admin;
