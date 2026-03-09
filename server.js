/**
 * 博客系统后端服务入口
 * 仅负责初始化和挂载路由模块
 * 端口: 8086
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const config = require('./config');
const mountRoutes = require('./routes');

const app = express();

// ============================================
// 全局中间件
// ============================================
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 🌐 增加全局日志中间件，确保客户端发起的每个请求都被宝塔(PM2)记录
app.use((req, res, next) => {
  // 排除前端页面的静态资源请求刷屏
  const ignorePrefixes = ['/images/', '/assets/', '/css/', '/js/', '/lib/', '/favicon.ico', '/wp-content/'];
  const shouldLog = !ignorePrefixes.some(prefix => req.url.startsWith(prefix));

  if (shouldLog) {
    // 转换为北京时间
    const beijingTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
    console.log(`[${beijingTime}] ${req.method} ${req.url}`);
  }
  next();
});

// ============================================
// skills.md - Agent 声明文件
// ============================================
const skillsPath = config.paths.skills;
const skillsContent = fs.existsSync(skillsPath)
  ? fs.readFileSync(skillsPath, 'utf-8')
  : '# Skills\n\nNo skills file found.';

app.get('/skills.md', (req, res) => {
  res.type('text/markdown').send(skillsContent);
});

// ============================================
// 挂载所有 API 路由
// ============================================
mountRoutes(app);

// ============================================
// HTML 伪静态路由 - 文章页面
// ============================================
app.get('/post/:slug.html', (req, res) => {
  res.sendFile(path.join(config.paths.public, 'index.html'));
});

// ============================================
// 静态文件服务 + 动态缩略图
// ============================================
app.get('/images/uploads/:filename', async (req, res, next) => {
  if (req.query.w) {
    try {
      const w = parseInt(req.query.w);
      const filepath = path.join(config.paths.public, 'images', 'uploads', req.params.filename);
      if (fs.existsSync(filepath)) {
        const sharp = require('sharp');
        res.type(`image/${path.extname(req.params.filename).substring(1) || 'jpeg'}`);
        return sharp(filepath).resize({ width: w }).pipe(res);
      }
    } catch (err) {
      console.error('Thumbnail generation failed:', err);
    }
  }
  next();
});

app.use(express.static(config.paths.public));

// SPA 兜底路由（后台）
app.get('/admin', (req, res) => {
  res.sendFile(path.join(config.paths.public, 'admin', 'index.html'));
});

app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(config.paths.public, 'admin', 'index.html'));
});

// SPA 兜底路由（前台）
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.includes('.')) {
    return next();
  }
  res.sendFile(path.join(config.paths.public, 'index.html'));
});

// ============================================
// 启动服务
// ============================================
app.listen(config.port, () => {
  console.log(`🚀 博客服务启动成功: http://localhost:${config.port}`);
  console.log(`📝 前台: http://localhost:${config.port}`);
  console.log(`⚙️  后台: http://localhost:${config.port}/admin`);
  console.log(`🤖 Agent API: http://localhost:${config.port}/api/v1/`);
  console.log(`📋 Skills: http://localhost:${config.port}/skills.md`);
});
