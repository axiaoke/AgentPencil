/**
 * 分类业务逻辑服务
 */
const Category = require('../models/Category');

const categoryService = {
    /**
     * 获取所有分类
     */
    async getAll() {
        return await Category.findAll();
    },

    /**
     * 根据 slug 获取分类
     */
    async getBySlug(slug) {
        return await Category.findBySlug(slug);
    },

    /**
     * 管理后台 - 获取列表
     */
    async getAdminList() {
        return await Category.findAll();
    },

    /**
     * 管理后台 - 创建分类
     */
    async create(data) {
        if (!data.name || !data.slug) {
            return { error: '分类名称和别名不能为空', code: 400 };
        }
        const exists = await Category.findBySlug(data.slug);
        if (exists) {
            return { error: '别名已存在', code: 400 };
        }
        const id = await Category.create(data);
        return { id };
    },

    /**
     * 管理后台 - 更新分类
     */
    async update(id, data) {
        if (!data.name || !data.slug) {
            return { error: '分类名称和别名不能为空', code: 400 };
        }
        const exists = await Category.findBySlug(data.slug);
        if (exists && exists.id !== parseInt(id)) {
            return { error: '别名已存在', code: 400 };
        }
        await Category.update(id, data);
        return { message: '更新成功' };
    },

    /**
     * 管理后台 - 删除分类
     */
    async delete(id) {
        await Category.delete(id);
        return { message: '删除成功' };
    }
};

module.exports = categoryService;
