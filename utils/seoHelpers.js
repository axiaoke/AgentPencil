/**
 * SEO 辅助工具函数
 * 纯函数，无副作用，供服务层调用
 */
const fs = require('fs');
const path = require('path');
const config = require('../config');

// 启动时读取模板，避免每次请求重新读取
const indexHtmlPath = path.join(config.paths.public, 'index.html');
const indexHtmlTemplate = fs.readFileSync(indexHtmlPath, 'utf-8');

/**
 * 转义 HTML 属性值中的特殊字符
 */
function escapeHtmlAttr(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * 从反向代理头中取真实协议和域名，去除标准端口
 */
function getBaseUrl(req) {
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const host = (req.headers['x-forwarded-host'] || req.get('host') || '')
        .replace(/:80$/, '')
        .replace(/:443$/, '');
    return `${proto}://${host}`;
}

/**
 * 将 SEO meta 信息注入 HTML 模板
 * @param {string} html - HTML 模板字符串
 * @param {object} meta - { title, description, keywords, canonicalUrl, ogImage, ogType? }
 */
function applyCommonMeta(html, { title, description, keywords, canonicalUrl, ogImage, ogType }) {
    const e = escapeHtmlAttr;
    html = html.replace(/<title[^>]*>[\s\S]*?<\/title>/, `<title>${e(title)}</title>`);
    html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" id="page-description" content="${e(description)}">`);
    html = html.replace(/<meta name="keywords"[^>]*>/, `<meta name="keywords" id="page-keywords" content="${e(keywords)}">`);
    if (ogType) {
        html = html.replace(/<meta property="og:type"[^>]*>/, `<meta property="og:type" content="${e(ogType)}">`);
    }
    html = html.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" id="og-title" content="${e(title)}">`);
    html = html.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" id="og-description" content="${e(description)}">`);
    html = html.replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" id="og-image" content="${e(ogImage)}">`);
    html = html.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" id="og-url" content="${e(canonicalUrl)}">`);
    html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" id="canonical-url" href="${e(canonicalUrl)}">`);
    return html;
}

/**
 * 用预渲染内容替换 Empty State 占位符
 * 必须保留外层 v-else-if 指令，否则 Vue 条件链断裂
 */
function replaceEmptyState(html, contentHtml) {
    return html.replace(
        /[ \t]*<!-- Empty State -->[\s\S]*?<div class="empty-state" v-else-if="!loading">[\s\S]*?<\/div>/,
        contentHtml
    );
}

module.exports = {
    indexHtmlPath,
    indexHtmlTemplate,
    escapeHtmlAttr,
    getBaseUrl,
    applyCommonMeta,
    replaceEmptyState
};
