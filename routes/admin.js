/**
 * 管理后台路由 - 需要 JWT 认证
 */
const express = require('express');
const router = express.Router();
const adminService = require('../services/adminService');
const postService = require('../services/postService');
const commentService = require('../services/commentService');
const aiService = require('../services/aiService');
const uploadService = require('../services/uploadService');
const categoryService = require('../services/categoryService');
const seoService = require('../services/seoService');
const Setting = require('../models/Setting');
const Admin = require('../models/Admin');
const { authMiddleware, upload } = require('../utils/middleware');

// ============================================
// 登录与验证
// ============================================
router.post('/login', async (req, res) => {
    try {
        const { username, password, captcha_id, captcha_answer } = req.body;
        if (!username || !password) {
            return res.status(400).json({ code: 400, message: '请输入用户名和密码' });
        }

        const result = await adminService.login(req.ip, username, password, captcha_id, captcha_answer);
        if (result.error) {
            return res.status(result.code).json({
                code: result.code,
                message: result.error,
                requiresCaptcha: result.requiresCaptcha
            });
        }

        res.json({ code: 0, data: result });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

router.get('/captcha', async (req, res) => {
    try {
        const captcha = await adminService.getCaptcha();
        res.json({ code: 0, data: captcha });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// ============================================
// 以下接口均需认证
// ============================================
router.use(authMiddleware);

// --- 修改密码 ---
router.put('/password', async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const result = await adminService.changePassword(req.admin.id, oldPassword, newPassword);
        if (result.error) {
            return res.status(result.code).json({ code: result.code, message: result.error });
        }
        res.json({ code: 0, message: result.message });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// --- 仪表盘 ---
router.get('/dashboard', async (req, res) => {
    try {
        const data = await adminService.getDashboard();
        res.json({ code: 0, data });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// --- 站点设置 ---
router.get('/settings', async (req, res) => {
    try {
        const settings = await Setting.getAll();
        const adminData = await Admin.findById(req.admin.id);
        if (adminData) {
            settings.admin_avatar = adminData.avatar;
        }
        res.json({ code: 0, data: settings });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

router.put('/settings', async (req, res) => {
    try {
        const body = { ...req.body };
        if (body.admin_avatar !== undefined) {
            await Admin.updateAvatar(req.admin.id, body.admin_avatar);
            delete body.admin_avatar;
        }
        await Setting.updateBatch(body);
        res.json({ code: 0, message: '设置已保存' });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// --- 文件上传 ---
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ code: 400, message: '未选择文件' });
    }
    const url = `/images/uploads/${req.file.filename}`;
    res.json({ code: 0, data: { url, filename: req.file.filename } });
});

router.post('/upload/base64', async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ code: 400, message: '未提供图片数据' });
        }
        const result = await uploadService.uploadBase64(image);
        if (result.error) {
            return res.status(result.code).json({ code: result.code, message: result.error });
        }
        res.json({ code: 0, data: result });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

router.post('/upload/site', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ code: 400, message: '未选择文件' });
        }
        const result = await uploadService.uploadSiteFile(req.file, req.body.type);
        if (result.error) {
            return res.status(result.code).json({ code: result.code, message: result.error });
        }
        res.json({ code: 0, data: result });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// --- 文章管理 ---
router.get('/posts', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 10));
        const data = await postService.getAdminList({
            page,
            pageSize,
            search: req.query.search || '',
            status: req.query.status || ''
        });
        res.json({ code: 0, data });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

router.get('/posts/:id', async (req, res) => {
    try {
        const post = await postService.getById(req.params.id);
        if (!post) {
            return res.status(404).json({ code: 404, message: '文章不存在' });
        }
        res.json({ code: 0, data: post });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

router.post('/posts', async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ code: 400, message: '标题和内容不能为空' });
        }
        // Force the author_id to be current user
        req.body.author_id = req.admin.id;
        const id = await postService.create(req.body);

        // 自动生成SEO文件（如果状态为发布）
        if (req.body.status === 'published') {
            seoService.generateFiles().catch(err => console.error('Auto SEO generation failed:', err));
        }

        res.json({ code: 0, data: { id }, message: '文章已创建' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ code: 400, message: 'Slug 已存在，请使用其他别名' });
        }
        res.status(500).json({ code: 500, message: err.message });
    }
});

router.put('/posts/:id', async (req, res) => {
    try {
        // Update author_id to the user modifying it
        req.body.author_id = req.admin.id;
        const result = await postService.update(req.params.id, req.body);
        if (!result) {
            return res.status(404).json({ code: 404, message: '文章不存在' });
        }

        // 自动重新生成SEO文件
        seoService.generateFiles().catch(err => console.error('Auto SEO generation failed:', err));

        res.json({ code: 0, message: '文章已更新' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ code: 400, message: 'Slug 已存在' });
        }
        res.status(500).json({ code: 500, message: err.message });
    }
});

router.delete('/posts/:id', async (req, res) => {
    try {
        await postService.delete(req.params.id);

        // 自动重新生成SEO文件
        seoService.generateFiles().catch(err => console.error('Auto SEO generation failed:', err));

        res.json({ code: 0, message: '文章已删除' });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// --- 评论管理 ---
router.get('/comments', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 10));
        const data = await commentService.getAdminList({
            page,
            pageSize,
            search: req.query.search || '',
            status: req.query.status || ''
        });
        res.json({ code: 0, data });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

router.put('/comments/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ code: 400, message: '无效状态' });
        }
        const result = await commentService.updateStatus(req.params.id, status);
        if (result.error) {
            return res.status(result.code).json({ code: result.code, message: result.error });
        }
        res.json({ code: 0, message: result.message });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

router.delete('/comments/:id', async (req, res) => {
    try {
        const result = await commentService.delete(req.params.id);
        if (result.error) {
            return res.status(result.code).json({ code: result.code, message: result.error });
        }
        res.json({ code: 0, message: result.message });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// --- 分类管理 ---
router.get('/categories', async (req, res) => {
    try {
        const data = await categoryService.getAdminList();
        res.json({ code: 0, data });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

router.post('/categories', async (req, res) => {
    try {
        const result = await categoryService.create(req.body);
        if (result.error) {
            return res.status(result.code).json({ code: result.code, message: result.error });
        }
        res.json({ code: 0, message: '分类已创建' });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

router.put('/categories/:id', async (req, res) => {
    try {
        const result = await categoryService.update(req.params.id, req.body);
        if (result.error) {
            return res.status(result.code).json({ code: result.code, message: result.error });
        }
        res.json({ code: 0, message: '分类已更新' });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        const result = await categoryService.delete(req.params.id);
        res.json({ code: 0, message: '分类已删除' });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// --- AI 生成 ---
router.post('/ai/generate', async (req, res) => {
    try {
        const { type, content, current_title, current_keywords, current_description } = req.body;
        const result = await aiService.generate(type, content, current_title, current_keywords, current_description);
        if (result.error) {
            return res.status(result.code).json({ code: result.code, message: result.error });
        }
        res.json({ code: 0, data: result });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// --- SEO 生成 ---
router.post('/seo/generate', async (req, res) => {
    try {
        const result = await seoService.generateFiles();
        if (result.error) {
            return res.status(result.code).json({ code: result.code, message: result.error });
        }
        res.json({ code: 0, message: '生成成功' });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

module.exports = router;
