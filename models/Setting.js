/**
 * 站点设置数据模型 - 纯数据库 CRUD
 */
const pool = require('./db');

const Setting = {
    /**
     * 获取所有设置（键值对）
     */
    async getAll() {
        const [rows] = await pool.query('SELECT setting_key, setting_value FROM site_settings');
        const settings = {};
        rows.forEach(row => { settings[row.setting_key] = row.setting_value; });
        return settings;
    },

    /**
     * 批量更新设置
     * @param {Object} settings - { key: value, ... }
     */
    async updateBatch(settings) {
        for (const [key, value] of Object.entries(settings)) {
            await pool.query(
                `INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE setting_value = ?`,
                [key, value, value]
            );
        }
    },

    /**
     * 更新单个设置
     */
    async updateOne(key, value) {
        await pool.query(
            `INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE setting_value = ?`,
            [key, value, value]
        );
    }
};

module.exports = Setting;
