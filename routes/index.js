/**
 * 路由汇总 - 统一挂载所有路由模块
 */
const apiRoutes = require('./api');
const adminRoutes = require('./admin');
const agentRoutes = require('./agent');
const frontendRoutes = require('./frontend');

function mountRoutes(app) {
    // 公开 API（前台）
    app.use('/api', apiRoutes);

    // 管理后台 API
    app.use('/api/admin', adminRoutes);

    // Agent API v1
    app.use('/api/v1', agentRoutes);

    // 前台 SSR 路由（SEO 元标签注入 + 内容预渲染）
    // 静态资源路径（含 .）会自动 next() 交给 express.static 处理
    app.use(frontendRoutes);
}

module.exports = mountRoutes;
