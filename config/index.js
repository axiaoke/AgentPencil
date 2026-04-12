/**
 * 集中配置管理
 */
const path = require('path');

module.exports = {
    // 服务端口
    port: process.env.PORT || 8086,

    // 数据库配置
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'blog',
        charset: 'utf8mb4',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        timezone: '+08:00'
    },

    // JWT 配置
    jwt: {
        secret: process.env.JWT_SECRET || 'change-me',
        expiresIn: '7d'
    },

    // 百炼 API 配置
    bailian: {
        apiKey: process.env.BAILIAN_API_KEY || '',
        generateAppId: process.env.BAILIAN_GENERATE_APP_ID || '',
        auditAppId: process.env.BAILIAN_AUDIT_APP_ID || ''
    },

    // 上传配置
    upload: {
        dir: path.join(__dirname, '..', 'public', 'images', 'uploads'),
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: /jpeg|jpg|png|gif|webp|svg|ico/
    },

    // 路径配置
    paths: {
        public: path.join(__dirname, '..', 'public'),
        skills: path.join(__dirname, '..', 'skills.md')
    },

    // 前台分页配置（需与 public/js/config.js 中的 PAGE_SIZE 保持一致）
    pagination: {
        pageSize: 12
    },

    // Agent 写入配置
    agent: {
        // 写操作鉴权 Token，设置为空则禁用写 API
        writeToken: process.env.AGENT_WRITE_TOKEN || '',
        // 默认作者昵称（在 admins 表中查找）
        defaultAuthorNickname: process.env.AGENT_DEFAULT_AUTHOR || 'axiaoke',
        // 默认分类名称（在 categories 表中查找）
        defaultCategoryName: process.env.AGENT_DEFAULT_CATEGORY || '技术文档'
    }
};
