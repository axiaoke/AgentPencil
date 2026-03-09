/**
 * 中间件集合
 */
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const config = require('../config');

// ============================================
// 确保上传目录存在
// ============================================
if (!fs.existsSync(config.upload.dir)) {
    fs.mkdirSync(config.upload.dir, { recursive: true });
}

// ============================================
// JWT 认证中间件
// ============================================
function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ code: 401, message: '未登录' });
    }
    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ code: 401, message: '登录已过期' });
    }
}

// ============================================
// 评论限流中间件
// ============================================
const commentLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    keyGenerator: (req) => {
        return req.headers['x-agent-token'] || req.ip;
    },
    message: { code: 429, message: '评论过于频繁，请稍后再试 (限制: 5条/分钟)' }
});

// ============================================
// 图片上传 (multer)
// ============================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, config.upload.dir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
        cb(null, name);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: config.upload.maxFileSize },
    fileFilter: (req, file, cb) => {
        const ext = config.upload.allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mime = config.upload.allowedTypes.test(file.mimetype.split('/')[1]);
        if (ext && mime) {
            cb(null, true);
        } else {
            cb(new Error('仅支持图片文件'));
        }
    }
});

module.exports = {
    authMiddleware,
    commentLimiter,
    upload
};
