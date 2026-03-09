/**
 * 博客后台管理 Vue 应用
 */
const { createApp, ref, reactive, computed, onMounted, watch, nextTick } = Vue;

const adminApp = createApp({
    setup() {
        // --- Auth State ---
        const isLoggedIn = ref(false);
        const token = ref('');
        const adminInfo = reactive({});
        const loginForm = reactive({ username: '', password: '', captcha_answer: '' });
        const loginLoading = ref(false);
        const requiresCaptcha = ref(false);
        const captchaId = ref('');
        const captchaQuestion = ref('');

        // --- View State ---
        const currentView = ref('dashboard');
        const sidebarOpen = ref(false);
        const viewTitles = {
            dashboard: '仪表盘',
            posts: '文章管理',
            editor: '编辑文章',
            categories: '分类管理',
            comments: '评论管理',
            settings: '站点设置',
            about: '关于页面'
        };

        // --- Dashboard ---
        const dashboard = reactive({ stats: {}, recentPosts: [], recentComments: [] });

        // --- Posts ---
        const postsList = ref([]);
        const postsSearch = ref('');
        const postsStatusFilter = ref('');
        const postsPagination = reactive({ page: 1, pageSize: 10, total: 0, totalPages: 0 });

        // --- Editor ---
        const editorForm = reactive({
            id: null,
            title: '',
            slug: '',
            content: '',
            content_format: 'markdown',
            excerpt: '',
            keywords: '',
            category_id: null,
            cover_image: '',
            status: 'draft'
        });
        const saving = ref(false);
        const editorMode = ref('markdown'); // 'markdown' | 'html'
        let vditorInstance = null;
        let quillInstance = null;
        const turndownService = typeof TurndownService !== 'undefined' ? new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            emDelimiter: '*'
        }) : null;

        if (turndownService) {
            // Keep alignment and specific attributes
            turndownService.addRule('align', {
                filter: (node) => {
                    return (node.nodeName === 'P' || node.nodeName === 'DIV') &&
                        (node.classList.contains('ql-align-center') ||
                            node.classList.contains('ql-align-right') ||
                            node.style.textAlign === 'center' ||
                            node.style.textAlign === 'right');
                },
                replacement: (content, node) => {
                    const tag = node.nodeName.toLowerCase();
                    const style = node.getAttribute('style') || '';
                    const cls = node.getAttribute('class') || '';
                    return `\n\n<${tag}${cls ? ' class="' + cls + '"' : ''}${style ? ' style="' + style + '"' : ''}>${content}</${tag}>\n\n`;
                }
            });
        }

        // --- Comments ---
        const commentsList = ref([]);
        const commentsSearch = ref('');
        const commentsStatusFilter = ref('');
        const commentsPagination = reactive({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
        const statusLabels = { pending: '待审核', approved: '已通过', rejected: '已驳回' };

        // --- Categories ---
        const categoriesList = ref([]);
        const categoryForm = reactive({ id: null, name: '', slug: '', description: '' });

        // --- About ---
        let vditorAbout = null;

        // --- Settings ---
        const siteSettings = reactive({});
        const settingsSaving = ref(false);
        const passwordForm = reactive({ oldPassword: '', newPassword: '' });

        // --- Toast ---
        const toast = reactive({ show: false, message: '', type: '' });
        function showToast(msg, type = '') {
            toast.message = msg;
            toast.type = type;
            toast.show = true;
            setTimeout(() => { toast.show = false; }, 3000);
        }

        // --- Format Date ---
        function formatDate(dateStr) {
            if (!dateStr) return '-';
            const d = new Date(dateStr);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }

        // --- API Helper ---
        async function api(url, options = {}) {
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };
            if (token.value) {
                headers['Authorization'] = `Bearer ${token.value}`;
            }
            const res = await fetch(url, { ...options, headers });
            if (res.status === 401) {
                logout();
                throw new Error('登录已过期');
            }
            return res.json();
        }

        // --- Auth ---
        async function loadCaptcha() {
            try {
                const res = await api('/api/admin/captcha');
                if (res.code === 0) {
                    captchaId.value = res.data.captcha_id;
                    captchaQuestion.value = res.data.question;
                }
            } catch (e) { }
        }

        async function login() {
            if (!loginForm.username || !loginForm.password) {
                showToast('请输入用户名和密码', 'error');
                return;
            }
            if (requiresCaptcha.value && !loginForm.captcha_answer) {
                showToast('请输入验证码', 'error');
                return;
            }

            loginLoading.value = true;
            try {
                const res = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...loginForm,
                        captcha_id: captchaId.value
                    })
                });
                const data = await res.json();
                if (data.code === 0) {
                    token.value = data.data.token;
                    Object.assign(adminInfo, data.data.admin);
                    isLoggedIn.value = true;
                    localStorage.setItem('blog_token', token.value);
                    localStorage.setItem('blog_admin', JSON.stringify(data.data.admin));
                    loadDashboard();
                    showToast('登录成功', 'success');
                } else {
                    showToast(data.message, 'error');
                    if (data.requiresCaptcha) {
                        requiresCaptcha.value = true;
                        loadCaptcha();
                    }
                }
            } catch (e) {
                showToast('网络错误', 'error');
            } finally {
                loginLoading.value = false;
            }
        }

        function logout() {
            isLoggedIn.value = false;
            token.value = '';
            Object.keys(adminInfo).forEach(k => delete adminInfo[k]);
            localStorage.removeItem('blog_token');
            localStorage.removeItem('blog_admin');
        }

        function checkAuth() {
            const savedToken = localStorage.getItem('blog_token');
            const savedAdmin = localStorage.getItem('blog_admin');
            if (savedToken) {
                token.value = savedToken;
                try {
                    Object.assign(adminInfo, JSON.parse(savedAdmin));
                } catch (e) { }
                isLoggedIn.value = true;
                return true;
            }
            return false;
        }

        // --- Dashboard ---
        async function loadDashboard() {
            try {
                const res = await api('/api/admin/dashboard');
                if (res.code === 0) {
                    Object.assign(dashboard, res.data);
                }
            } catch (e) {
                console.error(e);
            }
        }

        // --- Posts ---
        async function loadPosts(page = 1) {
            try {
                const params = new URLSearchParams({
                    page,
                    pageSize: postsPagination.pageSize,
                    search: postsSearch.value,
                    status: postsStatusFilter.value
                });
                const res = await api(`/api/admin/posts?${params}`);
                if (res.code === 0) {
                    postsList.value = res.data.list;
                    Object.assign(postsPagination, res.data.pagination);
                }
            } catch (e) {
                showToast('加载失败', 'error');
            }
        }

        function createNewPost() {
            const defaultMode = siteSettings.default_editor || 'markdown';
            Object.assign(editorForm, {
                id: null,
                title: '',
                slug: '',
                content: '',
                content_format: defaultMode,
                excerpt: '',
                keywords: '',
                category_id: null,
                cover_image: '',
                status: 'published'
            });
            editorMode.value = defaultMode;
            currentView.value = 'editor';
            if (defaultMode === 'markdown') {
                nextTick(() => initVditor(''));
            } else {
                nextTick(() => initQuill(''));
            }
        }

        async function editPost(id) {
            try {
                const res = await api(`/api/admin/posts/${id}`);
                if (res.code === 0) {
                    const p = res.data;
                    const format = p.content_format || 'markdown';
                    Object.assign(editorForm, {
                        id: p.id,
                        title: p.title,
                        slug: p.slug,
                        content: p.content,
                        content_format: format,
                        excerpt: p.excerpt,
                        keywords: p.keywords,
                        category_id: p.category_id,
                        cover_image: p.cover_image,
                        status: p.status
                    });
                    editorMode.value = format;
                    currentView.value = 'editor';
                    if (format === 'markdown') {
                        nextTick(() => initVditor(p.content));
                    } else {
                        nextTick(() => {
                            initQuill(p.content);
                            if (quillInstance) {
                                quillInstance.root.innerHTML = p.content;
                            }
                        });
                    }
                }
            } catch (e) {
                showToast('加载文章失败', 'error');
            }
        }


        async function deletePost(id, title) {
            if (!confirm(`确认删除文章「${title}」？此操作不可撤销。`)) return;
            try {
                const res = await api(`/api/admin/posts/${id}`, { method: 'DELETE' });
                if (res.code === 0) {
                    showToast('文章已删除', 'success');
                    loadPosts(postsPagination.page);
                } else {
                    showToast(res.message, 'error');
                }
            } catch (e) {
                showToast('删除失败', 'error');
            }
        }

        // --- Vditor Editor ---
        function initVditor(content) {
            if (vditorInstance) {
                vditorInstance.destroy();
                vditorInstance = null;
            }

            const vditorEl = document.getElementById('vditor');
            if (!vditorEl) return;

            vditorInstance = new Vditor('vditor', {
                height: '100%',
                mode: 'ir', // 即时渲染模式
                placeholder: '开始写作...',
                theme: 'classic',
                icon: 'material',
                lang: 'zh_CN',
                cache: { enable: false },
                toolbar: [
                    { name: "headings", tip: "标题" },
                    { name: "bold", tip: "加粗" },
                    { name: "italic", tip: "斜体" },
                    { name: "strike", tip: "中划线" },
                    "|",
                    { name: "list", tip: "无序列表" },
                    { name: "ordered-list", tip: "有序列表" },
                    { name: "check", tip: "任务列表" },
                    "|",
                    { name: "quote", tip: "引用" },
                    { name: "code", tip: "代码块" },
                    { name: "inline-code", tip: "内联代码" },
                    "|",
                    { name: "upload", tip: "上传图片" },
                    { name: "link", tip: "链接" },
                    { name: "table", tip: "表格" },
                    "|",
                    { name: "undo", tip: "撤销" },
                    { name: "redo", tip: "重做" },
                    "|",
                    { name: "preview", tip: "预览" },
                    { name: "outline", tip: "大纲" },
                    { name: "fullscreen", tip: "全屏" }
                ],
                upload: {
                    url: '/api/admin/upload',
                    fieldName: 'file',
                    headers: { 'Authorization': `Bearer ${token.value}` },
                    format: (files, responseText) => {
                        try {
                            const res = JSON.parse(responseText);
                            if (res.code === 0) {
                                return JSON.stringify({
                                    msg: '',
                                    code: 0,
                                    data: {
                                        errFiles: [],
                                        succMap: { [files[0].name]: res.data.url }
                                    }
                                });
                            }
                        } catch (e) { }
                        return responseText;
                    }
                },
                after: () => {
                    if (content) {
                        vditorInstance.setValue(content);
                    }
                }
            });
        }

        function initQuill(html) {
            const container = document.getElementById('quill-editor');
            if (!container) return;

            if (quillInstance && container.classList.contains('ql-container')) {
                if (html !== undefined && html !== null) {
                    quillInstance.root.innerHTML = html;
                }
                return;
            }

            // Clean up old toolbar if it somehow stuck around outside the container
            const existingToolbar = container.parentElement ? container.parentElement.querySelector('.ql-toolbar') : null;
            if (existingToolbar) {
                existingToolbar.remove();
            }

            quillInstance = new Quill('#quill-editor', {
                theme: 'snow',
                placeholder: '开始 HTML 写作...',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        ['blockquote', 'code-block'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        [{ 'align': [] }],
                        [{ 'color': [] }, { 'background': [] }],
                        ['link', 'image', 'video'],
                        ['clean']
                    ]
                }
            });

            if (html !== undefined && html !== null) {
                quillInstance.root.innerHTML = html;
            }
        }

        function initAboutVditor(content) {
            if (vditorAbout) {
                vditorAbout.destroy();
                vditorAbout = null;
            }

            const vditorEl = document.getElementById('vditor-about');
            if (!vditorEl) return;

            vditorAbout = new Vditor('vditor-about', {
                height: '100%',
                mode: 'ir',
                placeholder: '编辑关于页面的内容...',
                theme: 'classic',
                lang: 'zh_CN',
                cache: { enable: false },
                toolbar: [
                    { name: "headings", tip: "标题" },
                    { name: "bold", tip: "加粗" },
                    { name: "italic", tip: "斜体" },
                    { name: "strike", tip: "中划线" },
                    "|",
                    { name: "list", tip: "无序列表" },
                    { name: "ordered-list", tip: "有序列表" },
                    { name: "check", tip: "任务列表" },
                    "|",
                    { name: "quote", tip: "引用" },
                    { name: "code", tip: "代码块" },
                    { name: "inline-code", tip: "内联代码" },
                    "|",
                    { name: "upload", tip: "上传图片" },
                    { name: "link", tip: "链接" },
                    { name: "table", tip: "表格" },
                    "|",
                    { name: "undo", tip: "撤销" },
                    { name: "redo", tip: "重做" },
                    "|",
                    { name: "preview", tip: "预览" }
                ],
                upload: {
                    url: '/api/admin/upload',
                    fieldName: 'file',
                    headers: { 'Authorization': `Bearer ${token.value}` },
                    format: (files, responseText) => {
                        try {
                            const res = JSON.parse(responseText);
                            if (res.code === 0) {
                                return JSON.stringify({
                                    msg: '', code: 0, data: { errFiles: [], succMap: { [files[0].name]: res.data.url } }
                                });
                            }
                        } catch (e) { }
                        return responseText;
                    }
                },
                after: () => {
                    if (content) {
                        vditorAbout.setValue(content);
                    }
                }
            });
        }

        // --- Cover Upload ---
        async function uploadCover(event) {
            const file = event.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await fetch('/api/admin/upload', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token.value}` },
                    body: formData
                });
                const data = await res.json();
                if (data.code === 0) {
                    editorForm.cover_image = data.data.url;
                    showToast('封面图已上传', 'success');
                } else {
                    showToast(data.message, 'error');
                }
            } catch (e) {
                showToast('上传失败', 'error');
            }
            event.target.value = '';
        }

        // --- AI Generate ---
        async function aiGenerate(type) {
            const content = vditorInstance ? vditorInstance.getValue() : editorForm.content;
            if (!content) {
                showToast('请先输入文章内容', 'error');
                return;
            }

            const current_title = editorForm.title || '';
            const current_keywords = editorForm.keywords || '';
            const current_description = editorForm.excerpt || '';

            showToast('AI 正在生成...', '');
            try {
                const res = await api('/api/admin/ai/generate', {
                    method: 'POST',
                    body: JSON.stringify({ type, content, current_title, current_keywords, current_description })
                });
                if (res.code === 0 && res.data?.result) {
                    if (type === 'all') {
                        try {
                            const resultJson = JSON.parse(res.data.result);
                            if (resultJson.title !== null && resultJson.title !== "") {
                                editorForm.title = resultJson.title;
                            }
                            if (resultJson.keywords !== null && resultJson.keywords !== "") {
                                editorForm.keywords = resultJson.keywords;
                            }
                            if (resultJson.description !== null && resultJson.description !== "") {
                                editorForm.excerpt = resultJson.description;
                            }
                        } catch (e) {
                            console.error('Failed to parse AI JSON response:', e, res.data.result);
                            showToast('AI 生成结果解析失败', 'error');
                            return;
                        }
                    } else {
                        showToast('无效的生成类型', 'error');
                        return;
                    }
                    showToast('AI 生成成功', 'success');
                } else {
                    showToast(res.message || 'AI 生成失败', 'error');
                }
            } catch (e) {
                showToast('AI 调用失败', 'error');
            }
        }

        // --- Comments ---
        async function loadComments(page = 1) {
            try {
                const params = new URLSearchParams({
                    page,
                    pageSize: commentsPagination.pageSize,
                    search: commentsSearch.value,
                    status: commentsStatusFilter.value
                });
                const res = await api(`/api/admin/comments?${params}`);
                if (res.code === 0) {
                    commentsList.value = res.data.list;
                    Object.assign(commentsPagination, res.data.pagination);
                }
            } catch (e) {
                showToast('加载评论失败', 'error');
            }
        }

        async function updateCommentStatus(id, status) {
            try {
                const res = await api(`/api/admin/comments/${id}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({ status })
                });
                if (res.code === 0) {
                    showToast(res.message, 'success');
                    loadComments(commentsPagination.page);
                } else {
                    showToast(res.message, 'error');
                }
            } catch (e) {
                showToast('操作失败', 'error');
            }
        }

        async function deleteComment(id) {
            if (!confirm('确认删除此评论？')) return;
            try {
                const res = await api(`/api/admin/comments/${id}`, { method: 'DELETE' });
                if (res.code === 0) {
                    showToast('评论已删除', 'success');
                    loadComments(commentsPagination.page);
                } else {
                    showToast(res.message, 'error');
                }
            } catch (e) {
                showToast('删除失败', 'error');
            }
        }

        // --- Categories ---
        async function loadCategories() {
            try {
                const res = await api('/api/admin/categories');
                if (res.code === 0) categoriesList.value = res.data;
            } catch (e) { }
        }

        async function saveCategory() {
            if (!categoryForm.name) {
                showToast('请输入分类名称', 'error');
                return;
            }
            try {
                const method = categoryForm.id ? 'PUT' : 'POST';
                const url = categoryForm.id ? `/api/admin/categories/${categoryForm.id}` : '/api/admin/categories';
                const res = await api(url, { method, body: JSON.stringify(categoryForm) });
                if (res.code === 0) {
                    showToast('保存成功', 'success');
                    categoryForm.id = null;
                    categoryForm.name = '';
                    categoryForm.slug = '';
                    categoryForm.description = '';
                    loadCategories();
                } else {
                    showToast(res.message, 'error');
                }
            } catch (e) {
                showToast('保存失败', 'error');
            }
        }

        function editCategory(cat) {
            categoryForm.id = cat.id;
            categoryForm.name = cat.name;
            categoryForm.slug = cat.slug;
            categoryForm.description = cat.description;
        }

        async function deleteCategory(id) {
            if (!confirm('确认删除此分类？')) return;
            try {
                const res = await api(`/api/admin/categories/${id}`, { method: 'DELETE' });
                if (res.code === 0) {
                    showToast('分类已删除', 'success');
                    loadCategories();
                } else {
                    showToast(res.message, 'error');
                }
            } catch (e) {
                showToast('删除失败', 'error');
            }
        }

        // --- Settings ---
        async function loadSettings() {
            try {
                const res = await api('/api/admin/settings');
                if (res.code === 0) {
                    Object.assign(siteSettings, res.data);
                }
            } catch (e) {
                console.error(e);
            }
        }

        async function saveSettings() {
            settingsSaving.value = true;
            try {
                if (currentView.value === 'about' && vditorAbout) {
                    siteSettings.about_content = vditorAbout.getValue();
                }
                const res = await api('/api/admin/settings', {
                    method: 'PUT',
                    body: JSON.stringify(siteSettings)
                });
                if (res.code === 0) {
                    showToast('设置已保存', 'success');
                } else {
                    showToast(res.message, 'error');
                }
            } catch (e) {
                showToast('保存失败', 'error');
            } finally {
                settingsSaving.value = false;
            }
        }

        async function savePost() {
            if (!editorForm.title) {
                showToast('请输入文章标题');
                return;
            }

            // Sync content from active editor and set format
            if (editorMode.value === 'markdown' && vditorInstance) {
                editorForm.content = vditorInstance.getValue();
                editorForm.content_format = 'markdown';
            } else if (editorMode.value === 'html' && quillInstance) {
                editorForm.content = quillInstance.root.innerHTML;
                editorForm.content_format = 'html';
            }

            saving.value = true;
            try {
                const url = editorForm.id ? `/api/admin/posts/${editorForm.id}` : '/api/admin/posts';
                const method = editorForm.id ? 'PUT' : 'POST';
                const res = await api(url, {
                    method,
                    body: JSON.stringify(editorForm)
                });
                if (res.code === 0) {
                    showToast(editorForm.id ? '更新成功' : '发布成功', 'success');
                    switchView('posts');
                } else {
                    showToast(res.message || '保存失败');
                }
            } catch (e) {
                showToast('保存出错');
            } finally {
                saving.value = false;
            }
        }

        function toggleEditMode(mode) {
            if (editorMode.value === mode) return;

            if (mode === 'html') {
                // Switching from Markdown to HTML
                let md = '';
                if (vditorInstance) {
                    md = vditorInstance.getValue();
                } else {
                    md = editorForm.content;
                }
                const html = typeof marked !== 'undefined' ? marked.parse(md) : md;
                editorForm.content_format = 'html';

                editorMode.value = 'html';
                nextTick(() => {
                    initQuill(html);
                    if (quillInstance) {
                        quillInstance.root.innerHTML = html;
                    }
                });
            } else {
                // Switching from HTML to Markdown
                if (quillInstance && turndownService) {
                    const html = quillInstance.root.innerHTML;
                    const md = turndownService.turndown(html);
                    editorForm.content = md;
                }
                editorForm.content_format = 'markdown';

                editorMode.value = 'markdown';
                nextTick(() => initVditor(editorForm.content));
            }
        }

        async function uploadSiteFile(type) {
            const refName = type === 'favicon' ? 'faviconInput' : 'logoInput';
            // Get file from the ref in the component's template context
            const inputEl = document.querySelector(`input[ref="${refName}"]`)
                || (type === 'favicon'
                    ? document.querySelectorAll('input[type="file"]')[0]
                    : document.querySelectorAll('input[type="file"]')[1]);

            // Use event handling instead
            return;
        }

        async function changePassword() {
            if (!passwordForm.oldPassword || !passwordForm.newPassword) {
                showToast('请填写密码', 'error');
                return;
            }
            try {
                const res = await api('/api/admin/password', {
                    method: 'PUT',
                    body: JSON.stringify(passwordForm)
                });
                if (res.code === 0) {
                    showToast('密码已更新', 'success');
                    passwordForm.oldPassword = '';
                    passwordForm.newPassword = '';
                } else {
                    showToast(res.message, 'error');
                }
            } catch (e) {
                showToast('更新失败', 'error');
            }
        }

        // --- Site File Upload Handler ---
        function handleSiteFileUpload(type, event) {
            const file = event.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);

            fetch('/api/admin/upload/site', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token.value}` },
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code === 0) {
                        if (type === 'favicon') {
                            siteSettings.site_favicon = data.data.url;
                        } else if (type === 'logo') {
                            siteSettings.site_logo = data.data.url;
                        } else if (type === 'avatar') {
                            siteSettings.admin_avatar = data.data.url;
                        }
                        showToast('上传成功', 'success');
                    } else {
                        showToast(data.message, 'error');
                    }
                })
                .catch(() => showToast('上传失败', 'error'));

            event.target.value = '';
        }

        async function generateSEO() {
            showToast('正在生成 SEO 文件...', '');
            try {
                const res = await api('/api/admin/seo/generate', { method: 'POST' });
                if (res.code === 0) {
                    showToast('SEO 文件生成成功', 'success');
                } else {
                    showToast(res.message, 'error');
                }
            } catch (e) {
                showToast('生成失败', 'error');
            }
        }

        // --- Navigation ---
        function switchView(view) {
            sidebarOpen.value = false;
            currentView.value = view;
            if (view === 'dashboard') loadDashboard();
            if (view === 'posts') {
                loadPosts(1);
                loadCategories(); // reload categories for select
            }
            if (view === 'comments') loadComments(1);
            if (view === 'settings') loadSettings();
            if (view === 'categories') loadCategories();
            if (view === 'about') {
                loadSettings().then(() => {
                    nextTick(() => initAboutVditor(siteSettings.about_content));
                });
            }
        }

        function visitSite() {
            window.open('/', '_blank');
        }

        function toggleSidebar() {
            sidebarOpen.value = !sidebarOpen.value;
        }

        // --- Init ---
        onMounted(() => {
            if (checkAuth()) {
                loadDashboard();
            }
        });

        return {
            // Auth
            isLoggedIn, token, adminInfo, loginForm, loginLoading,
            login, logout,
            // View
            currentView, viewTitles, switchView, sidebarOpen, toggleSidebar,
            // Dashboard
            dashboard, loadDashboard,
            // Posts
            postsList, postsSearch, postsStatusFilter, postsPagination,
            loadPosts, createNewPost, editPost, savePost, deletePost,
            // Editor
            editorForm, saving, uploadCover, aiGenerate,
            // Comments
            commentsList, commentsSearch, commentsStatusFilter, commentsPagination,
            statusLabels, loadComments, updateCommentStatus, deleteComment,
            // Categories
            categoriesList, categoryForm, loadCategories, saveCategory, editCategory, deleteCategory,
            // Settings
            siteSettings, settingsSaving, passwordForm, generateSEO,
            loadSettings, saveSettings, changePassword,
            uploadSiteFile: handleSiteFileUpload,
            // Utils
            requiresCaptcha,
            captchaQuestion,
            loadCaptcha,
            formatDate, showToast, toast, visitSite,
            window,
            editorMode,
            toggleEditMode
        };
    }
});

adminApp.mount('#admin-app');
