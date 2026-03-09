/**
 * 上传业务逻辑服务
 */
const path = require('path');
const fs = require('fs');
const config = require('../config');
const Setting = require('../models/Setting');

const uploadService = {
    /**
     * 处理 Base64 图片上传
     */
    async uploadBase64(imageData) {
        const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
            return { error: '图片格式不正确', code: 400 };
        }

        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        if (!/^(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(ext)) {
            return { error: '不支持的图片类型', code: 400 };
        }

        const data = Buffer.from(matches[2], 'base64');
        const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const filepath = path.join(config.upload.dir, filename);

        fs.writeFileSync(filepath, data);
        const url = `/images/uploads/${filename}`;
        return { url, filename };
    },

    /**
     * 处理站点文件上传（favicon / logo）
     */
    async uploadSiteFile(file, type) {
        let targetPath, url, settingKey;

        if (type === 'favicon') {
            targetPath = path.join(config.paths.public, 'favicon.ico');
            url = '/favicon.ico';
            settingKey = 'site_favicon';
        } else if (type === 'logo') {
            targetPath = path.join(config.paths.public, 'images', 'logo.png');
            url = '/images/logo.png';
            settingKey = 'site_logo';
        } else {
            return { error: '类型参数错误', code: 400 };
        }

        fs.copyFileSync(file.path, targetPath);
        fs.unlinkSync(file.path);

        // 同时更新站点设置
        await Setting.updateOne(settingKey, url);

        return { url };
    }
};

module.exports = uploadService;
