/**
 * 通用辅助函数
 */

/**
 * 生成 URL 友好的 slug
 */
function generateSlug(title) {
    return `post-${Date.now().toString(36)}`;
}

/**
 * 清除 WordPress 短代码
 */
function stripShortcodes(content) {
    return content.replace(/\[\/?\w+[^\]]*\]/g, '');
}

/**
 * 获取客户端真实 IP
 */
function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.headers['x-real-ip']
        || req.connection?.remoteAddress
        || req.ip;
}

/**
 * 格式化日期
 */
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

module.exports = {
    generateSlug,
    stripShortcodes,
    getClientIP,
    formatDate
};
