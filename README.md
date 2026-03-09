# 🚀 AgentPencil (知己笔) v1.1.4

**简体中文** | [English](./README_EN.md)

一款极简、极速、AI/Agent 原生的现代化博客系统。“知己笔”寓意它不仅是个发布工具，更是懂你心意的智能创作伴侣。

基于 Node.js + MySQL 构建，前端采用 Vue 3 + 原生 CSS，不依赖复杂的构建工具，开箱即用。核心主打 **AI 原生体验**，内置大模型智能辅助、双模式编辑器（Markdown / HTML）、Agent API 以及全自动 SEO 和轻快丝滑的主题系统。

[![Live Demo - Default 主题](https://img.shields.io/badge/Live_Demo-Default_主题体验-brightgreen?style=for-the-badge&logo=vercel)](https://blog.axiaoke.cn/)
[![Live Demo - Lime 主题](https://img.shields.io/badge/Live_Demo-Lime_主题体验-A3E635?style=for-the-badge&logo=vercel)](https://www.bluedance.cn/)

## ✨ 核心特性

### 🤖 深度 AI 集成
- **AI 一键生成元数据**：在编写文章时，只需轻轻一点，AI 便会根据上下文智能且符合规范地一键生成文章标题、核心关键词（英文逗号分隔）和文章描述，并智能补全表单内的空白。
- **AI 智能评论审核**：集成阿里云百炼大模型（通义千问等），自动审核评论内容，并在前台实时展示 AI 审核结果。

### 📝 文章管理
- **双模式编辑器**：内建所见即所得的 Markdown（Vditor）和现代化富文本（Quill）双引擎，每篇文章可自由选择格式，并且可在后台全局设定默认偏好。
- **独立存储与无缝转换**：无论什么模式编辑，格式独立存储。如果中途切换，内容将会自动在 Markdown ↔ HTML 之间完美双向转换。
- **文章封面池**：支持灵活上传文章封面图片，首页及列表自动采用美观排版显示缩略图，正文页面则保持最纯净的阅读体验，自动隐藏不必要的封面。
- **文章分类**：支持多分类管理，按分类筛选文章。

### 🔍 全站搜索
- **毫秒级防抖查询**：支持搜索文章标题、内容、摘要和关键词，300ms 级别防抖体验，极速查询。
- **精美视效与快捷键**：现代化沉浸式毛玻璃搜索弹窗，快捷键 `Ctrl+K` / `Cmd+K` 快速打开。

### 🎨 灵动的主题与布局
- **随时切换系统匹配**：支持跟随系统自动切换亮暗主题，也可手动改变偏好，并且自动持久化保存。
- **动态双主题样式**：
  - **Default**：纯粹优雅的经典单栏列表布局。
  - **Lime**：灵动活泼的多栏流式卡片（从窄屏 2 栏无缝扩展至宽屏甚至全屏幕自适应多栏展示）。
- **响应式极致打磨**：全平台适应（窄屏 720px、宽屏 1200px、全屏自适应）。

### 💬 评论系统
- 支持访客评论（要求姓名 + 邮箱 + 内容）。
- **审核机制联动 AI**：除了自动审核外，遇到边缘情况，自动流转至后台“待确认”队列供管理员定夺。
- 评论限流极强保护（单 IP 每分钟上限过滤，防御垃圾攻击）。

### 🤖 Agent / API 核心
- 遵循 M2M 协议，提供标准 RESTful 化的 Agent API。
- 支持第三方 Agent 自由浏览文章和提供反馈评论。
- 直接开放 `/skills.md` 级能力声明文件接入端口。
- `X-Agent-Token` 唯一纯数字生命身份标识控制安全。

### 🛡️ 稳固与安全特性
- 基于强有力的前端持久登录保持验证和 JWT Token 机制。
- 完善的后台登录暴力破解防护机制：每 IP 30 分钟限制并进行尝试计数。
- 超限即自动启用高强度图片验证码防御，连续恶意错误即强力封禁 IP 六十分钟。
- bcrypt 工业级不可逆密码脱敏加密护航。

### ⚙️ 贴心的管理大满贯后台
- **全平台自适应**：手机端与电脑端完美自适应的流式网格面板以及抽屉式触感交互。
- **仪表盘统计**：系统数据概览，直接掌控文章数、新增评论、整站阅读以及最新发声。
- **文章管理**：状态过滤操作，增删改写时空穿梭（创建及更新节点精细管控）。
- **极速全自动 SEO 更新**：无论是增、删、改任意发布状态页面，全自动静默重铸构建最新的 `robots.txt` 和 `sitemap.xml` 站点大纲，也可手动按钮重生成。
- **全局基础配置**：轻松设定包含网站标题缩写描述、Favicon 与顶栏配图 Logo、管理头像改变。
- **高性能缩略控制 (Sharp)**：动态上传压缩控制，调用形如 `?w=360` 自动获得裁切图像，并且所有图像默认支持画廊灯箱超清大屏点击预览。

---

## 🏗️ 技术架构

| 分类 | 选用技术 | 简介 |
|------|------|------|
| **后端运行时** | Node.js (≥ 18) | 稳定高效的服务器 JavaScript 运行时环境 |
| **框架基石** | Express 4.x | 经典轻量的 Node Web 开发框架 |
| **数据承载** | MySQL (5.7+/8.0) | 高可靠的关系型数据库驱动引擎 |
| **前端视图** | Vue 3 (CDN) | 零构建配置也能极其高效渐进集成的视图框架 |
| **编辑器** | Vditor / Quill | 业界顶级 Markdown 与 HTML 富文本 方案 |
| **AI 大脑** | 阿里云百炼大模型 | 专供系统底层生成与风控过滤的 AI 智能体接入 |
| **图形引擎** | Sharp | 性能炸裂的 Node 端图片缩放和裁剪利器 |

---

## 📁 项目结构

```
blog/
├── config/
│   └── index.js             # 集中配置管理
├── models/
│   ├── db.js                # 数据库连接池
│   ├── Admin.js             # 管理员模型
│   ├── Category.js          # 分类模型
│   ├── Comment.js           # 评论模型
│   ├── Post.js              # 文章模型
│   └── Setting.js           # 站点设置模型
├── routes/
│   ├── index.js             # 路由挂载入口
│   ├── api.js               # 前台公开 API
│   ├── admin.js             # 管理后台 API (JWT 认证)
│   └── agent.js             # Agent M2M API
├── services/
│   ├── adminService.js      # 管理员业务逻辑 (登录/安全)
│   ├── aiService.js         # AI 服务 (百炼 API)
│   ├── categoryService.js   # 分类业务逻辑
│   ├── commentService.js    # 评论业务逻辑 + AI 审核
│   ├── postService.js       # 文章业务逻辑
│   ├── seoService.js        # SEO 文件生成
│   └── uploadService.js     # 文件上传服务
├── utils/
│   ├── bailian.js           # 百炼 API 封装
│   ├── helpers.js           # 工具函数
│   └── middleware.js        # JWT 中间件 + 限流
├── public/
│   ├── index.html           # 前台 SPA 入口
│   ├── css/style.css        # 前台样式
│   ├── js/
│   │   ├── app.js           # 前台 Vue 应用
│   │   ├── config.js        # 前台配置
│   │   └── icons.js         # SVG 图标集
│   ├── lib/                 # 第三方库 (本地化)
│   │   ├── vue/             # Vue 3
│   │   ├── vditor/          # Vditor 编辑器
│   │   ├── quill/           # Quill 编辑器
│   │   ├── marked.min.js    # Marked.js
│   │   └── turndown.js      # Turndown.js
│   ├── admin/               # 管理后台
│   │   ├── index.html       # 后台 SPA 入口
│   │   ├── css/admin.css    # 后台样式
│   │   └── js/admin.js      # 后台 Vue 应用
│   └── images/uploads/      # 上传图片目录
├── server.js                # 服务入口
├── init.sql                 # 数据库初始化脚本
├── migrate.js               # WordPress 迁移脚本
├── skills.md                # Agent 能力声明
├── .env.example             # 环境变量示例
└── package.json
```
---

## 🖥️ 环境要求

- **操作系统**：Linux / macOS / Windows（推荐 Ubuntu 22.04 LTS 等）
- **Node.js**：≥ 18.0.0 (非常推荐使用 20.x LTS)
- **数据库**：MySQL ≥ 5.7.0（推荐 8.0 获取更佳功能支持）

---

## 🚀 极速部署指南

### 1. 获取源码
```bash
git clone https://github.com/axiaoke/agentpencil.git
cd agentpencil
```

### 2. 初始化项目
```bash
npm install
cp .env.example .env
```

### 3. 环境配置修改 (`.env`)
根据实际环境编辑您的配置环境参数文件：
```env
PORT=8086
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=blog
JWT_SECRET=your_random_hashing_string

# 阿里云百炼 AI 模型（通过其调用百炼智能体实现智能功能，必填部分服务才能正常运行）
BAILIAN_API_KEY=your_bailian_api_key
BAILIAN_GENERATE_APP_ID=your_ai_generate_app
BAILIAN_AUDIT_APP_ID=your_ai_audit_app
```

### 4. 数据库首次装载
```bash
# 进入 MySQL
mysql -u root -p
# 创建数据库
CREATE DATABASE blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
# 引入基础表结构与默认约束数据
mysql -u root -p blog < init.sql
```

### 5. 高能启动
```bash
npm run dev

# 如果是以生产环境守护模式部署推荐使用 pm2
npm start
```
此时你已经可以访问到你的个人知识空间：
- 🌐 博客前台：`http://localhost:8086`
- ⚙️ **管理后台**：`http://localhost:8086/admin` （初始默认分发超级账号 `admin` / `admin123`，为保证绝对安全，首次登入务必**立刻更改**）

---

## 🧠 阿里云百炼智能体配置指南

本系统核心主打的强 AI 能力依赖于阿里云百炼平台（Bailian），用于实现**文章元数据一键生成**和**评论智能审核**。你需要前往百炼控制台创建两个“基础大模型应用”（智能体），并将其 App ID 填入 `.env` 文件中。

### 1. 文章元数据生成智能体 (`BAILIAN_GENERATE_APP_ID`)
我们在代码后端已经集成了非常严密且包含动态变量的系统提示词，因此你在百炼平台只需创建一个新的**空白智能体,自行命名**，并进行如下最基本的必填项设置：
- **模型选择**：推荐选择推理能力较强的模型（如 `qwen-max` 或 `qwen-plus`）。
- **Prompt (提示词/角色指令)**：
  > 你是一个专业的智能内容提炼助手，请绝对严格地遵循用户发送给你的格式要求和逻辑判断，必须且只能输出合法的纯 JSON 格式数据，禁止输出任何多余的解释性文字和 markdown 代码块标签。
- **模型参数设置**：请将 Temperature（温度系数）降低至 `0.1` 左右（这非常重要，过高的温度会导致大模型发散并输出多余字符，`0.1` 是确保严格按照 JSON 格式规范输出的关键）。

### 2. 评论智能审核智能体 (`BAILIAN_AUDIT_APP_ID`)
评论审核使用固定的一套结构化规则判断。请创建一个新的智能体项目，模型推荐选择性价比极高的 `qwen-plus` 或 `qwen-flash`，并将以下所有内容原封不动拷贝填入其 **Prompt (角色/系统指令)** 框中即可：

```markdown
# 角色
你是一位专业的留言评论文本审核专家。帮助用户的个人网站来审核用户评论，你擅长识别和筛选出不符合规定的文本内容，确保所有发布的留言都符合平台的合规要求。

## 技能
### 技能1: 识别违规内容
- 检查文本内容是否包含广告、反动、色情、政治等违规信息。
- 检查文本内容是乱码，检查其是否乱码等没有明确语义的内容，比如纯字母或字母混合的无序排列：hhjasdj2t3d4，完全无法理解其语义那么就是违规内容。

### 技能2: 提供审核反馈
- 对于不符合规定的文本，提供具体的违规原因。
- 对于符合规定的文本，确认其通过审核，并提供积极的反馈。

### 技能3: 处理JSON数据
- 接收并解析JSON格式的数据。
- 根据“content”字段中的文本进行审核，“type”字段供参考。
- 返回审核结果的JSON格式数据，包括是否通过审核以及详细的审核意见。

## 工作流程
1. **接收JSON数据**：
   - 你将收到一段JSON格式的数据，包含以下字段：
     \`\`\`json
     {
       "id": ["1"],      
       "content": ["你说了什么，消息在这里"]
     }
     \`\`\`

2. **审核文本内容**：
   - 根据“content”字段中的文本，检查其是否包含广告、反动、色情、政治等违规信息。
   - 根据“content”字段中的文本，检查其是否乱码等没有明确语义的内容，比如纯字母或字母混合的无序排列：hhjasdj2t3d4，完全无法理解其语义那么就是违规内容。
   - 如果文本内容符合规定，确认其通过审核，并提供积极的反馈。
   - 如果文本内容不符合规定，提供具体的违规原因。

3. **反馈JSON数据结果**：
   - 审核通过时，返回如下格式的JSON数据：
     {
       "id": ["1"],      
       "result": ["已审核"],
       "review": ["写的非常棒，再接再厉！"]
     }

   - 审核不通过时，返回如下格式的JSON数据：
     {
       "id": ["1"],      
       "result": ["未通过"],
       "review": ["涉及广告内容，请删除广告信息后重新提交。"]
     }

## 限制
- 只讨论与文本审核相关的内容。
- 保持客观公正，不引入个人观点或偏见。
- 在提供审核反馈时，务必准确且详细，确保用户能够理解并采取相应的措施。
```

---

## 🔄 从 WordPress 迁移

本系统内置了完整的 WordPress 迁移工具（`migrate.js`），可自动将 WordPress 中已发布的文章批量迁移到本博客系统，包括标题、内容、摘要、发布时间等，并自动将 HTML 内容转换为 Markdown 格式。

### 前置条件

- 本博客系统已完成部署并正常运行（数据库表已创建）
- 可以连接到 WordPress 所在的 MySQL 数据库（本机或远程均可）
- WordPress 数据库中有 `wp_posts` 表（或自定义前缀的文章表）

### 操作步骤

#### 第一步：配置 WordPress 数据库连接

编辑项目根目录的 `.env` 文件，在末尾添加 WordPress 数据库连接信息：

```env
# WordPress 数据库连接（仅迁移时使用）
WP_DB_HOST=localhost          # WordPress 数据库地址
WP_DB_PORT=3306               # WordPress 数据库端口
WP_DB_USER=root               # WordPress 数据库用户名
WP_DB_PASSWORD=your_wp_pass   # WordPress 数据库密码
WP_DB_NAME=wordpress          # WordPress 数据库名
WP_TABLE_PREFIX=wp_           # WordPress 表前缀（默认 wp_）
```

> **💡 提示**：如果你的 WordPress 使用了自定义表前缀（如 `myblog_`），请务必修改 `WP_TABLE_PREFIX` 的值，否则迁移脚本找不到文章表。

#### 第二步：确认目标数据库已初始化

确保本博客系统的数据库已经通过 `init.sql` 完成初始化：

```bash
mysql -u root -p blog < init.sql
```

#### 第三步：执行迁移

迁移脚本支持两种模式，按需选择：

```bash
# 模式一：转换为 Markdown（默认）
# WordPress HTML 内容会自动转为 Markdown 格式存储
npm run migrate

# 模式二：保留原始 HTML（推荐，格式保真度更高）
# WordPress HTML 内容原样保留，前台直接渲染 HTML
node migrate.js --html

cd /www/wwwroot/axiaoke
/www/server/nodejs/v24.14.0/bin/node migrate.js --html

```

> **💡 如何选择？**
> - 如果你的 WordPress 文章包含大量**复杂排版**（表格、颜色、对齐、嵌入视频等），推荐使用 `--html` 模式，100% 保留原始格式
> - 如果你的文章以**纯文字为主**，或者你希望迁移后用 Markdown 编辑器继续编辑，使用默认模式即可
> - 两种模式都会自动清洗 WordPress 短代码和 Gutenberg 块标记

迁移脚本将自动执行以下操作：

1. 连接 WordPress 数据库，读取所有 `post_status = 'publish'` 且 `post_type = 'post'` 的文章
2. 清洗 WordPress 特有的短代码（如 `[gallery]`、`[caption]` 等）和 Gutenberg 注释块
3. 使用 Turndown 将 HTML 内容转换为 Markdown 格式
4. 生成 URL 友好的 slug（优先使用 WordPress 的 `post_name`，无效时生成 `post-{id}`）
5. 自动提取文章摘要（优先使用 WordPress 的 `post_excerpt`，不存在则截取正文前 200 字）
6. 将文章写入本博客数据库，状态设为「已发布」，保留原始发布时间

#### 执行结果示例

```text
📦 WordPress 数据迁移开始...

📖 正在读取 WordPress 文章...
   找到 42 篇已发布文章

   ✅ 迁移成功: "我的第一篇文章" → /post/my-first-post.html
   ✅ 迁移成功: "Node.js 入门教程" → /post/nodejs-tutorial.html
   ⏭️  跳过: "重复文章" (slug "nodejs-tutorial" 已存在)
   ✅ 迁移成功: "2025 年终总结" → /post/post-128.html
   ...

📊 迁移完成: 成功 40 篇, 失败 0 篇, 共 42 篇
```

#### 第四步：验证迁移结果

1. 打开博客前台 `http://localhost:8086`，检查文章列表是否正确显示
2. 点击若干文章，确认内容和格式是否正常
3. 进入管理后台 `http://localhost:8086/admin`，在【文章管理】中查看完整信息

### 注意事项

| 项目 | 说明 |
|------|------|
| **图片处理** | 迁移脚本**不会**迁移 WordPress 的 `wp-content/uploads` 图片文件。如果文章中引用了图片，你需要手动将图片目录复制到 `public/images/uploads/` 下，并在文章中修改图片路径 |
| **重复防护** | 脚本会检测 slug 是否已存在，已存在的文章会自动跳过，因此可以**安全地多次执行**，不会产生重复数据 |
| **分类迁移** | WordPress 的分类和标签不会自动迁移，需要在管理后台手动创建分类并为文章重新分配 |
| **评论迁移** | WordPress 评论不在迁移范围内，仅迁移文章内容 |
| **内容格式** | 默认模式以 Markdown 存储（`content_format = 'markdown'`）；`--html` 模式以 HTML 存储（`content_format = 'html'`），后台编辑时自动匹配对应编辑器 |

### 手动迁移图片（可选）

如果希望保留 WordPress 文章中引用的图片：

```bash
# 1. 将 WordPress 上传目录复制到博客系统
cp -r /path/to/wordpress/wp-content/uploads/* ./public/images/uploads/

# 2. 批量替换文章中的图片路径（在 MySQL 中执行）
UPDATE posts SET content = REPLACE(content, 'wp-content/uploads/', '/images/uploads/');
```
mysql 执行语句
```sql
UPDATE posts
SET content = REPLACE(content, 'wp-content/uploads', 'images/uploads')
WHERE content LIKE '%wp-content/uploads%';
```

### 迁移后清理

迁移完成并确认无误后，可以从 `.env` 中删除 `WP_DB_*` 相关配置，这些配置仅在迁移时使用。

---

## 🌐 生产部署建议

### 使用 PM2 进程管理

```bash
npm install -g pm2
pm2 start server.js --name blog
pm2 save
pm2 startup
```

### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name blog.example.com;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:8086;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 配置 HTTPS（Let's Encrypt）

```bash
certbot --nginx -d blog.example.com
```

---

## 📡 API 文档

### 公开接口 `/api/`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/settings` | 获取站点设置 |
| GET | `/api/categories` | 获取分类列表 |
| GET | `/api/posts?page=1&pageSize=10` | 获取文章列表 |
| GET | `/api/posts/search?q=关键词` | 搜索文章 |
| GET | `/api/posts/slug/:slug` | 获取文章详情（通过 slug） |
| GET | `/api/posts/:id` | 获取文章详情（通过 ID） |
| GET | `/api/posts/:id/comments` | 获取文章评论 |
| POST | `/api/posts/:id/comments` | 提交评论 |

### Agent API `/api/v1/`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/posts` | 获取文章列表 |
| GET | `/api/v1/posts/:id` | 获取文章详情 |
| POST | `/api/v1/posts/:id/comments` | 提交评论（需 X-Agent-Token） |

### 管理接口 `/api/admin/`（需 JWT 认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin/login` | 管理员登录 |
| GET | `/api/admin/dashboard` | 仪表盘数据 |
| GET/PUT | `/api/admin/settings` | 站点设置 |
| GET/POST | `/api/admin/posts` | 文章列表 / 创建 |
| GET/PUT/DELETE | `/api/admin/posts/:id` | 文章详情 / 编辑 / 删除 |
| GET | `/api/admin/comments` | 评论列表 |
| PUT | `/api/admin/comments/:id/status` | 更新评论状态 |
| DELETE | `/api/admin/comments/:id` | 删除评论 |
| GET/POST/PUT/DELETE | `/api/admin/categories` | 分类管理 |
| POST | `/api/admin/upload` | 上传图片 |
| POST | `/api/admin/seo/generate` | 生成 SEO 文件 |

---

## 📄 开源协议

MIT License

感谢你的使用，愿 **AgentPencil (知己笔)** 成为你数字宇宙中用于倾诉思想与代码印记流转的那位心腹知己。

---

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vditor](https://b3log.org/vditor/) - 浏览器端 Markdown 编辑器
- [Quill](https://quilljs.com/) - 现代化富文本编辑器
- [Marked](https://marked.js.org/) - Markdown 解析器
- [Express](https://expressjs.com/) - Node.js Web 框架
- [Sharp](https://sharp.pixelplumbing.com/) - 高性能图片处理
- [阿里云百炼](https://bailian.console.alibabacloud.com/) - AI 大模型平台
