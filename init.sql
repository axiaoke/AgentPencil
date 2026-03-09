-- ============================================
-- 博客系统数据库初始化脚本
-- 适用于 MySQL 5.7+
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------
-- 管理员表
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL COMMENT 'bcrypt 加密',
  `nickname` VARCHAR(100) DEFAULT '' COMMENT '显示昵称',
  `avatar` VARCHAR(500) DEFAULT '' COMMENT '头像路径',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- 插入默认管理员 (密码: admin123，部署后请立即修改)
INSERT INTO `admins` (`username`, `password`, `nickname`) VALUES
('admin', '$2a$10$zsX2NnECz2Sp3YWNXaVeZOSu4nq8IU1mFtxVDjHmbxkkEcPo3u/tK', '站长');

-- -------------------------------------------
-- 站点设置表 (键值对形式)
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT COMMENT '设置值',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='站点设置表';

-- 默认站点设置
INSERT INTO `site_settings` (`setting_key`, `setting_value`) VALUES
('site_title', '我的博客'),
('site_keywords', '博客,技术,生活'),
('site_description', '一个极简、极速的个人博客'),
('site_logo', '/images/logo.png'),
('site_favicon', '/favicon.ico'),
('icp_number', ''),
('police_number', ''),
('site_author', '站长'),
('site_url', 'https://blog.axiaoke.cn'),
('hover_color', '#1e90ff'),
('link_color', ''),
('default_editor', 'markdown'),
('site_theme', 'default'),
('about_title', '关于我们'),
('about_content', '这里是关于我的介绍...'),
('about_keywords', '关于,简介'),
('about_description', '个人简介页面');

-- -------------------------------------------
-- 分类表
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '分类名称',
  `slug` VARCHAR(100) NOT NULL COMMENT '别名',
  `description` TEXT COMMENT '分类描述',
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- -------------------------------------------
-- 文章表
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS `posts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` INT UNSIGNED DEFAULT NULL COMMENT '分类ID',
  `author_id` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '作者ID',
  `title` VARCHAR(500) NOT NULL COMMENT '文章标题',
  `slug` VARCHAR(200) NOT NULL COMMENT 'URL 友好别名',
  `content` LONGTEXT NOT NULL COMMENT '文章内容',
  `content_format` VARCHAR(10) NOT NULL DEFAULT 'markdown' COMMENT '内容格式: markdown 或 html',
  `excerpt` TEXT COMMENT '文章描述/摘要',
  `keywords` VARCHAR(500) DEFAULT '' COMMENT '关键词',
  `cover_image` VARCHAR(500) DEFAULT '' COMMENT '封面图路径',
  `status` ENUM('draft', 'published') NOT NULL DEFAULT 'draft' COMMENT '状态',
  `view_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '阅读次数',
  `comment_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '评论数量',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `published_at` DATETIME DEFAULT NULL COMMENT '发布时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_slug` (`slug`),
  KEY `idx_status` (`status`),
  KEY `idx_published_at` (`published_at`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_category_id` (`category_id`),
  CONSTRAINT `fk_post_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章表';

-- -------------------------------------------
-- 评论表
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS `comments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `post_id` INT UNSIGNED NOT NULL COMMENT '关联文章ID',
  `author_name` VARCHAR(100) NOT NULL COMMENT '评论者名称',
  `author_email` VARCHAR(200) DEFAULT '' COMMENT '评论者邮箱',
  `author_url` VARCHAR(500) DEFAULT '' COMMENT '评论者网址',
  `content` TEXT NOT NULL COMMENT '评论内容',
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' COMMENT '审核状态',
  `is_agent` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否来自 Agent',
  `agent_token` VARCHAR(200) DEFAULT '' COMMENT 'Agent Token',
  `ip_address` VARCHAR(45) DEFAULT '' COMMENT '评论者 IP',
  `ai_review` TEXT COMMENT 'AI 审核反馈',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_post_id` (`post_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_ip_address` (`ip_address`),
  CONSTRAINT `fk_comment_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

SET FOREIGN_KEY_CHECKS = 1;
