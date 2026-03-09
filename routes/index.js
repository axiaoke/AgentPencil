/**
 * 路由汇总 - 统一挂载所有路由模块
 */
const apiRoutes = require('./api');
const adminRoutes = require('./admin');
const agentRoutes = require('./agent');

function mountRoutes(app) {
    // 公开 API（前台）
    app.use('/api', apiRoutes);

    // 管理后台 API
    app.use('/api/admin', adminRoutes);

    // Agent API v1
    app.use('/api/v1', agentRoutes);
}

module.exports = mountRoutes;
