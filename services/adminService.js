/**
 * 管理员业务逻辑服务
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Setting = require('../models/Setting');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const config = require('../config');

// --- In-memory state (resets on server restart) ---
const loginAttempts = new Map(); // { ip: { count: N, lastAt: timestamp, bannedUntil: timestamp } }
const captchas = new Map(); // { id: { answer: string, expires: timestamp } }

const adminService = {
    /**
     * 获取验证码 (Math CAPTCHA)
     */
    async getCaptcha() {
        const id = Math.random().toString(36).substring(2, 10);
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        const result = a + b;

        captchas.set(id, {
            answer: result.toString(),
            expires: Date.now() + 5 * 60 * 1000 // 5 min
        });

        return { captcha_id: id, question: `请回答：${a} + ${b} = ?` };
    },

    /**
     * 校验登录限制
     */
    async checkLoginLimit(ip) {
        const attempt = loginAttempts.get(ip);
        if (!attempt) return { requiresCaptcha: false };

        // Check ban
        if (attempt.bannedUntil && attempt.bannedUntil > Date.now()) {
            const minutesLeft = Math.ceil((attempt.bannedUntil - Date.now()) / 60000);
            return { error: `登录太频繁，请 ${minutesLeft} 分钟后再试`, code: 403 };
        }

        // Reset if window passed (30 min)
        if (attempt.lastAt < Date.now() - 30 * 60 * 1000) {
            loginAttempts.delete(ip);
            return { requiresCaptcha: false };
        }

        return {
            requiresCaptcha: attempt.count >= 5,
            count: attempt.count
        };
    },

    /**
     * 记录/更新登录尝试
     */
    async recordAttempt(ip, success) {
        let attempt = loginAttempts.get(ip) || { count: 0, lastAt: Date.now() };

        if (success) {
            loginAttempts.delete(ip);
        } else {
            attempt.count += 1;
            attempt.lastAt = Date.now();

            if (attempt.count >= 10) {
                attempt.bannedUntil = Date.now() + 60 * 60 * 1000; // 1 hour
            }

            loginAttempts.set(ip, attempt);
        }
    },

    /**
     * 管理员登录
     */
    async login(ip, username, password, captchaId, captchaAnswer) {
        // 1. Check IP limit
        const limit = await this.checkLoginLimit(ip);
        if (limit.error) return limit;

        // 2. Check Captcha if needed
        if (limit.requiresCaptcha) {
            if (!captchaId || !captchaAnswer) {
                return { error: '请输入验证码', code: 400, requiresCaptcha: true };
            }
            const stored = captchas.get(captchaId);
            if (!stored || stored.expires < Date.now() || stored.answer !== captchaAnswer) {
                captchas.delete(captchaId);
                return { error: '验证码错误或已过期', code: 400, requiresCaptcha: true };
            }
            captchas.delete(captchaId);
        }

        const admin = await Admin.findByUsername(username);
        if (!admin) {
            await this.recordAttempt(ip, false);
            return { error: '用户名或密码错误', code: 401 };
        }

        const valid = await bcrypt.compare(password, admin.password);
        if (!valid) {
            await this.recordAttempt(ip, false);
            const newLimit = await this.checkLoginLimit(ip);
            return {
                error: '用户名或密码错误',
                code: 401,
                requiresCaptcha: newLimit.requiresCaptcha
            };
        }

        // Login Success
        await this.recordAttempt(ip, true);
        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        return {
            token,
            admin: { id: admin.id, username: admin.username, nickname: admin.nickname }
        };
    },

    /**
     * 修改密码
     */
    async changePassword(adminId, oldPassword, newPassword) {
        const admin = await Admin.findById(adminId);
        if (!admin || !(await bcrypt.compare(oldPassword, admin.password))) {
            return { error: '原密码错误', code: 400 };
        }

        const hash = await bcrypt.hash(newPassword, 10);
        await Admin.updatePassword(adminId, hash);
        return { message: '密码已更新' };
    },

    /**
     * 获取仪表盘数据
     */
    async getDashboard() {
        const postStats = await Post.getStats();
        const commentStats = await Comment.getStats();
        const recentPosts = await Post.findRecent(12);
        const recentComments = await Comment.findRecent(12);

        return {
            stats: { ...postStats, ...commentStats },
            recentPosts,
            recentComments
        };
    }
};

module.exports = adminService;

