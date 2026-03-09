# 🚀 AgentPencil (知己笔) v1.1.4

[简体中文](./README.md) | **English**

A minimalist, lightning-fast, AI/Agent-native modern blog system. "知己笔" (Zhijibi - meaning a close, understanding friend's pen) implies that it is not just a publishing tool, but a smart creative companion that understands you.

Built with Node.js + MySQL, the frontend uses Vue 3 + native CSS. No complex build tools are required—it works right out of the box. Its core is centered on the **AI-Native experience**, featuring built-in LLM intelligent assistance, dual-mode editors (Markdown / HTML), an Agent API, fully automated SEO, and a smooth theme system.

[![Live Demo - Default Theme](https://img.shields.io/badge/Live_Demo-Default_Theme-brightgreen?style=for-the-badge&logo=vercel)](https://blog.axiaoke.cn/)
[![Live Demo - Lime Theme](https://img.shields.io/badge/Live_Demo-Lime_Theme-A3E635?style=for-the-badge&logo=vercel)](https://www.bluedance.cn/)

## ✨ Core Features

### 🤖 Deep AI Integration
- **One-Click AI Metadata Generation**: Seamlessly generate highly accurate and compliant article titles, core keywords (comma-separated), and article descriptions with just one click based on your context. It smartly fills in missing blanks.
- **AI Smart Comment Moderation**: Integrated with the Alibaba Cloud Bailian Large Language Model (e.g., Qwen), automatically auditing comment context and instantly displaying AI review results in the frontend.

### 📝 Article Management
- **Dual-Mode Editor**: Built with dual WYSIWYG engines: Markdown (Vditor) and modern Rich Text (Quill). Each article can freely choose a format, and default preferences can be set globally.
- **Independent Storage & Seamless Conversion**: Format storage is entirely independent. If switched mid-way, the content bidirectionally converts flawlessly between Markdown ↔ HTML.
- **Cover Image Pool**: Flexible support for uploading article covers. Beautifully layouts thumbnails on the homepage and list pages, while keeping the reading page ad-free by auto-hiding unnecessary covers.
- **Article Categories**: Supports multi-category management and article filtering.

### 🔍 Full-Site Search
- **Millisecond Anti-Shake Query**: Search through article titles, content, summaries, and keywords with a 300ms anti-shake experience for blazing-fast queries.
- **Stunning Visuals & Hotkeys**: Modern immersive glassmorphism search modal popup, globally callable via hotkey `Ctrl+K` / `Cmd+K`.

### 🎨 Fluid Themes & Layouts
- **Dynamic System Match**: Supports auto light/dark theme-switching based on OS theme tracking, or manual preference saving, persistent on the local end.
- **Dual Dynamic Theme Styles**:
  - **Default**: A pure, elegant classic single-column list layout.
  - **Lime**: A lively multi-column fluid card layout (seamlessly expanding from a 2-column mobile layout to full-screen responsive columns).
- **Extreme Responsive Polish**: Built to perfectly adapt cross-platform (Narrow 720px, Wide 1200px, Fullscreen Adapting).

### 💬 Comment System
- Supports visitor comments (requires Name + Email + Content).
- **AI Moderation Sync**: Besides automated AI pass/fail actions, borderline edge cases automatically route to the "Pending Confirmation" admin queue.
- Hardcore Rate-Limiting Protection (Single IP limits per minute filtering to prevent spam bomb attacks).

### 🤖 Agent / API Core
- M2M protocol enforced, offering standardized RESTful Agent APIs.
- Supports third-party Agents freely browsing posts and submitting feedback comments.
- Open directory inclusion of a `/skills.md` capabilities declaration port.
- Highly secure numeric `X-Agent-Token` identifier lifecycle management.

### 🛡️ Stability & Security Features
- Powerful persistent frontend login validation bundled with JWT Tokens.
- Comprehensive brute-force defense in the Admin portal: Per IP 30-minute attempt trackers.
- Fallback high-security Captcha triggers if attempt limits are tripped, escalating to 60-minute hard IP bans on malicious loops.
- Industry-grade irreversible `bcrypt` password masking encryption.

### ⚙️ Ultimate Admin Dashboard
- **All-Platform Responsive**: Fluid grid panels and touch-drawer interactions fully adapted for mobile devices and desktops alike.
- **Dashboard Stats**: Quick data oversight directly managing post counts, new comments, site-wide reading stats, and latest interactions.
- **Article Manager**: Complex state filtering operations, full CRUD manipulation across timezone timestamps (Creation & Updated nodes).
- **Instant Auto SEO Updates**: Any publication changes (Add/Remove/Update) silently recreate and push freshly built `robots.txt` and `sitemap.xml` site maps. Manual trigger accessible.
- **Global Settings**: Easily define site title abbreviations, descriptions, Favicons, NavBar Logos, and Admin avatars.
- **High-Performance Image Cropping (Sharp)**: Dynamic upload compression pipelines. Invoke commands like `?w=360` to auto-fetch cropped images. Features universal light-box gallery support for ultra-high-definition previewing.

---

## 🏗️ Technical Stack

| Category | Technology | Description |
|------|------|------|
| **Backend Runtime** | Node.js (≥ 18) | Stable and efficient Server JavaScript environment |
| **Framework Base** | Express 4.x | Classic, lightweight Node Web framework |
| **Database Structure** | MySQL (5.7+/8.0) | Highly reliable relational database |
| **Frontend Views** | Vue 3 (CDN) | Extremely efficient progressive view framework with zero-build configurations |
| **Editors** | Vditor / Quill | Industry-leading Markdown and HTML rich-text solutions |
| **AI Brain** | Alibaba Cloud Bailian | AI Agents powering system generations and risk-control filtration |
| **Graphics Engine** | Sharp | Blazing-fast Node image scaling and cropping tool |

---

## 📁 Project Structure

```text
blog/
├── config/
│   └── index.js             # Centralized configuration management
├── models/
│   ├── db.js                # Database connection pool
│   ├── Admin.js             # Admin model
│   ├── Category.js          # Category model
│   ├── Comment.js           # Comment model
│   ├── Post.js              # Post model
│   └── Setting.js           # Site setting model
├── routes/
│   ├── index.js             # Route mount entry
│   ├── api.js               # Frontend public API
│   ├── admin.js             # Admin backoffice API (JWT Auth)
│   └── agent.js             # Agent M2M API
├── services/
│   ├── adminService.js      # Admin business logic (Login/Security)
│   ├── aiService.js         # AI service (Bailian API)
│   ├── categoryService.js   # Category business logic
│   ├── commentService.js    # Comment logic + AI moderation
│   ├── postService.js       # Post business logic
│   ├── seoService.js        # SEO file generator
│   └── uploadService.js     # File upload handler
├── utils/
│   ├── bailian.js           # Bailian API wrapper
│   ├── helpers.js           # Utility helpers
│   └── middleware.js        # JWT middleware + rate limiters
├── public/
│   ├── index.html           # Frontend SPA entry
│   ├── css/style.css        # Frontend styling
│   ├── js/
│   │   ├── app.js           # Frontend Vue app
│   │   ├── config.js        # Frontend configurations
│   │   └── icons.js         # SVG icon sets
│   ├── lib/                 # Third-party libraries (Localized)
│   │   ├── vue/             # Vue 3
│   │   ├── vditor/          # Vditor Markdown Editor
│   │   ├── quill/           # Quill HTML Editor
│   │   ├── marked.min.js    # Marked.js
│   │   └── turndown.js      # Turndown.js
│   ├── admin/               # Admin Backoffice
│   │   ├── index.html       # Admin SPA entry
│   │   ├── css/admin.css    # Admin styling
│   │   └── js/admin.js      # Admin Vue app
│   └── images/uploads/      # Uploaded image directory
├── server.js                # Server entry point
├── init.sql                 # Database initialization script
├── migrate.js               # WordPress migration script
├── skills.md                # Agent capabilities declaration
├── .env.example             # Environment variables example
└── package.json
```

---

## 🖥️ Environmental Requirements

- **OS**: Linux / macOS / Windows (Ubuntu 22.04 LTS recommended)
- **Node.js**: ≥ 18.0.0 (Highly recommend 20.x LTS)
- **Database**: MySQL ≥ 5.7.0 (8.0 recommended for advanced capability support)

---

## 🚀 Rapid Deployment Guide

### 1. Get Source Code
```bash
git clone https://github.com/axiaoke/agentpencil.git
cd agentpencil
```

### 2. Initialize Project
```bash
npm install
cp .env.example .env
```

### 3. Modify Environment Config (`.env`)
Edit environmental parameters based on your localized setup:
```env
PORT=8086
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=blog
JWT_SECRET=your_random_hashing_string

# Alibaba Cloud Bailian AI Models (Mandatory for Agent smart-capabilities to function)
BAILIAN_API_KEY=your_bailian_api_key
BAILIAN_GENERATE_APP_ID=your_ai_generate_app
BAILIAN_AUDIT_APP_ID=your_ai_audit_app
```

### 4. Database First Load
```bash
# Enter MySQL
mysql -u root -p
# Create Database
CREATE DATABASE blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
# Import base tables and default structural data
mysql -u root -p blog < init.sql
```

### 5. Start Execution
```bash
npm run dev

# For production environment running, pm2 is highly recommended:
npm start
```
At this point, you can access your personal knowledge space:
- 🌐 Blog Frontend: `http://localhost:8086`
- ⚙️ **Admin Backoffice**: `http://localhost:8086/admin` (Default super account is `admin` / `admin123`. For paramount security, please explicitly **change this upon your first login**)

---

## 🧠 Alibaba Cloud Bailian Agent Setup Guide

This system's core AI strength depends on the Alibaba Cloud Bailian Platform (Bailian) to provide **1-click article metadata generation** and **comment AI moderation**. You need to create two "Basic LLM Applications" (Agents) in the Bailian console and insert their App IDs into your `.env` file.

### 1. Metadata Generation Agent (`BAILIAN_GENERATE_APP_ID`)
We have tightly integrated dynamic system prompts inside the backend code. Because of this, you only need to create a new **Blank Agent, Name it yourself** on Bailian, and configure the following basic settings:
- **Model Selection**: Recommend models with robust reasoning (Like `qwen-max` or `qwen-plus`).
- **Prompt (Role Instructions)**:
  > 你是一个专业的智能内容提炼助手，请绝对严格地遵循用户发送给你的格式要求和逻辑判断，必须且只能输出合法的纯 JSON 格式数据，禁止输出任何多余的解释性文字和 markdown 代码块标签。
  *(Note: Keep this prompt exactly in Chinese for precise function parsing).*
- **Model Parameters**: Ensure you lower the Temperature to roughly `0.1` (Extremely critical. A high temperature forces the LLM to output unpredictable loose characters. Keeping it at `0.1` guarantees strict JSON format constraint parsing).

### 2. Comment Moderation Agent (`BAILIAN_AUDIT_APP_ID`)
Comment moderation relies on structural assessment matrices. Create a new Agent project, select highly cost-effective models like `qwen-plus` or `qwen-flash`, and copy the exact markdown segment below into the **Prompt (Role Instructions)** space:

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

## 🔄 Migrate from WordPress

AgentPencil *(Zhijibi)* embeds an extremely intelligent and scalable WordPress migrator tool: `migrate.js`. Say goodbye to clunky WordPress data sizes and hello to seamless migration!

### Prerequisites

- The blog system is fully deployed (Database initialized).
- You have database access via MySQL to your old WordPress instance.
- The corresponding `wp_posts` table is actively accessible.

### Steps

#### Step 1: Link WP Database credentials
Append the relevant WordPress source configurations natively to your `.env` document:

```env
# WordPress Connection (For runtime migration only)
WP_DB_HOST=localhost          
WP_DB_PORT=3306               
WP_DB_USER=root               
WP_DB_PASSWORD=your_wp_pass   
WP_DB_NAME=wordpress          
WP_TABLE_PREFIX=wp_           
```

#### Step 2: Assure Target Database is primed
```bash
mysql -u root -p blog < init.sql
```

#### Step 3: Execute Migration
Trigger migration formats depending on visual desires:

```bash
# Mode 1: Convert to Markdown (Default)
npm run migrate

# Mode 2: Preserve original HTML tags (Maintains CSS fidelity formats natively)
node migrate.js --html
```
Migration automations trigger formatting data cleanup (stripping out Shortcodes mappings and Gutenberg injections), generating friendly Slugs, pulling excerpts, and locking timelines perfectly.

#### Step 4: Validate Result Outcomes
Ensure posts accurately render natively via `http://localhost:8086`.

### Relocating Images Manually
Images attached traditionally under Media pools via WP won't auto-migrate natively under MySQL. Easily replicate this via terminal:

```bash
# 1. Transport WP media content structures
cp -r /path/to/wordpress/wp-content/uploads/* ./public/images/uploads/
```

```sql
-- 2. Bulk format mappings for DB updates in MySQL
UPDATE posts
SET content = REPLACE(content, 'wp-content/uploads', 'images/uploads')
WHERE content LIKE '%wp-content/uploads%';
```

---

## 🌐 Production Deployment Suggestions

### Use PM2 Process Management

```bash
npm install -g pm2
pm2 start server.js --name blog
pm2 save
pm2 startup
```

### Nginx Reverse Proxy Map

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

### Handle HTTPS Certificates (Let's Encrypt)
```bash
certbot --nginx -d blog.example.com
```

---

## 📡 API Documents

### Public Endpoints `/api/`

| Method | Path | Description |
|------|------|------|
| GET | `/api/settings` | Obtain Site Settings |
| GET | `/api/categories` | Pull Active Categories |
| GET | `/api/posts?page=1&pageSize=10` | Render Listing views |
| GET | `/api/posts/search?q=Keyword` | Deep site text Query |
| GET | `/api/posts/slug/:slug` | SEO Post Data Query |
| GET | `/api/posts/:id` | Post ID Query |
| GET | `/api/posts/:id/comments` | Comments fetch lists |
| POST | `/api/posts/:id/comments` | Submit Comment requests |

### Agent API `/api/v1/`

| Method | Path | Description |
|------|------|------|
| GET | `/api/v1/posts` | M2M Posts Arrays |
| GET | `/api/v1/posts/:id` | M2M Render Target |
| POST | `/api/v1/posts/:id/comments` | M2M Submit Posts (requires X-Agent-Token) |

### Admin Interface `/api/admin/` (Requires JWT)

| Method | Path | Description |
|------|------|------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/dashboard` | Dashboard statistical matrices |
| GET/PUT | `/api/admin/settings` | Root configuration updates |
| GET/POST | `/api/admin/posts` | List / Compose |
| GET/PUT/DELETE | `/api/admin/posts/:id` | Core edit mechanisms |
| GET | `/api/admin/comments` | Pool validation |
| PUT | `/api/admin/comments/:id/status` | Flow State Update mechanisms |
| DELETE | `/api/admin/comments/:id` | Comment execution / Delete |
| GET/POST/PUT/DELETE | `/api/admin/categories` | Taxonomy modifications |
| POST | `/api/admin/upload` | Base File Handlers |
| POST | `/api/admin/seo/generate` | Sitemap Matrix rebuilding |

---

## 📄 Open Source License

MIT License

Thank you for choosing **AgentPencil (Zhijibi)**, turning your digital universe into brilliant reflections of thoughts and code mappings.

---

## 🙏 Credits

- [Vue.js](https://vuejs.org/) - The Progressive JavaScript Framework
- [Vditor](https://b3log.org/vditor/) - Browser-friendly Markdown editor
- [Quill](https://quilljs.com/) - Modern Rich Text editor
- [Marked](https://marked.js.org/) - Markdown parser
- [Express](https://expressjs.com/) - Fast Node.js Web Framework
- [Sharp](https://sharp.pixelplumbing.com/) - High-performance Node JS image manipulation
- [Alibaba Cloud Bailian](https://bailian.console.alibabacloud.com/) - AI foundation models platform
