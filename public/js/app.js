/**
 * 博客前台 Vue 应用
 */
const { createApp, ref, reactive, computed, onMounted, watch, nextTick } = Vue;

const app = createApp({
    setup() {
        // --- State ---
        const currentView = ref('home'); // 'home' | 'post'
        const loading = ref(true);
        const settings = reactive({});
        const categories = ref([]);
        const currentCategory = ref(null);
        const posts = ref([]);
        const pagination = reactive({ page: 1, pageSize: CONFIG.PAGE_SIZE, total: 0, totalPages: 0 });
        const currentPost = reactive({});
        const comments = ref([]);
        const submittingComment = ref(false);
        const commentForm = reactive({ author_name: '', author_email: '', content: '' });
        const toast = reactive({ show: false, message: '' });
        const zoomImage = ref(null);
        const imageZoomScale = ref(1);

        watch(zoomImage, (newVal) => {
            if (newVal) {
                imageZoomScale.value = 1;
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        const showBackToTop = ref(false);
        const showAIModal = ref(false);
        const aiModalData = reactive({ status: '', review: '', message: '' });
        const isDark = ref(false);
        const currentLayout = ref('wide'); // narrow, wide, full
        const layoutModes = {
            narrow: { tip: '切换至宽屏 (1200px)' },
            wide: { tip: '切换至全屏' },
            full: { tip: '切换至窄屏 (720px)' }
        };

        // --- Theme & Layout ---
        const initTheme = () => {
            const savedTheme = localStorage.getItem('theme');
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
                isDark.value = true;
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                isDark.value = false;
                document.documentElement.setAttribute('data-theme', 'light');
            }

            // Layout
            const savedLayout = localStorage.getItem('layout') || 'wide';
            currentLayout.value = savedLayout;
            document.body.className = `layout-${savedLayout}`;
        };

        const toggleTheme = () => {
            isDark.value = !isDark.value;
            const theme = isDark.value ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        };

        const cycleLayout = () => {
            const modes = ['narrow', 'wide', 'full'];
            let idx = modes.indexOf(currentLayout.value);
            idx = (idx + 1) % modes.length;
            currentLayout.value = modes[idx];
            applyBodyClasses();
            localStorage.setItem('layout', currentLayout.value);
        };

        function applyBodyClasses() {
            const classes = [`layout-${currentLayout.value}`];
            const theme = settings.site_theme || 'default';
            if (theme !== 'default') {
                classes.push(`theme-${theme}`);
            }
            document.body.className = classes.join(' ');
        }

        // --- Computed ---
        const renderedContent = computed(() => {
            if (!currentPost.content) return '';
            // If content_format is 'html', render directly
            if (currentPost.content_format === 'html') {
                return currentPost.content;
            }
            try {
                return marked.parse(currentPost.content);
            } catch (e) {
                return currentPost.content;
            }
        });

        const renderedAboutContent = computed(() => {
            if (!settings.about_content) return '';
            try {
                return marked.parse(settings.about_content);
            } catch (e) {
                return settings.about_content;
            }
        });

        // --- API Helpers ---
        async function api(url, options = {}) {
            const res = await fetch(CONFIG.API_BASE + url, {
                headers: { 'Content-Type': 'application/json', ...options.headers },
                ...options
            });
            return res.json();
        }

        // --- Toast ---
        function showToast(msg, duration = 2500) {
            toast.message = msg;
            toast.show = true;
            setTimeout(() => { toast.show = false; }, duration);
        }

        // --- Search ---
        const showSearch = ref(false);
        const searchQuery = ref('');
        const searchResults = ref([]);
        const searchLoading = ref(false);
        let searchTimer = null;

        function openSearch() {
            showSearch.value = true;
            searchQuery.value = '';
            searchResults.value = [];
            nextTick(() => {
                const input = document.querySelector('.search-modal-input');
                if (input) input.focus();
            });
        }

        function closeSearch() {
            showSearch.value = false;
            searchQuery.value = '';
            searchResults.value = [];
        }

        function handleSearchInput() {
            clearTimeout(searchTimer);
            const q = searchQuery.value.trim();
            if (!q) {
                searchResults.value = [];
                return;
            }
            searchLoading.value = true;
            searchTimer = setTimeout(async () => {
                try {
                    const res = await api(`/api/posts/search?q=${encodeURIComponent(q)}`);
                    if (res.code === 0) {
                        searchResults.value = res.data;
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    searchLoading.value = false;
                }
            }, 300);
        }

        function selectSearchResult(post) {
            closeSearch();
            openPost(post);
        }

        // --- Format Date ---
        function formatDate(dateStr) {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }

        // --- Load Settings ---
        async function loadSettings() {
            try {
                initTheme();
                const res = await api('/api/settings');
                if (res.code === 0) {
                    Object.assign(settings, res.data);
                    document.title = settings.site_title || '博客';
                    updateMeta('page-title', settings.site_title);
                    updateMeta('page-description', settings.site_description, 'content');
                    updateMeta('page-keywords', settings.site_keywords, 'content');
                    updateMeta('og-title', settings.site_title, 'content');
                    updateMeta('og-description', settings.site_description, 'content');
                    const defaultImg = settings.site_logo || '/images/logo.png';
                    const absoluteDefaultImg = defaultImg.startsWith('http') ? defaultImg : window.location.origin + defaultImg;
                    updateMeta('og-image', absoluteDefaultImg, 'content');
                    updateMeta('wechat-share-img', absoluteDefaultImg, 'src');

                    // Apply theme
                    const theme = settings.site_theme || 'default';

                    // If Lime theme and no saved layout, default to wide
                    if (theme === 'lime' && !localStorage.getItem('layout')) {
                        currentLayout.value = 'wide';
                    }

                    applyBodyClasses();

                    if (settings.hover_color) {
                        const styleEl = document.getElementById('dynamic-style-container');
                        if (styleEl) {
                            styleEl.innerHTML = `<style>
                           :root {
                             --custom-hover-color: ${settings.hover_color};
                             --custom-link-color: ${settings.link_color || 'var(--accent)'};
                           }
                           </style>`;
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to load settings:', e);
            }
        }

        function updateMeta(id, value, attr = 'textContent') {
            const el = document.getElementById(id);
            if (el && value) {
                if (attr === 'content') {
                    el.setAttribute('content', value);
                } else {
                    el[attr] = value;
                }
            }
        }

        function updateCanonical(url) {
            const el = document.getElementById('canonical-url');
            if (el) el.href = url;
        }

        // --- Load Categories ---
        async function loadCategories() {
            try {
                const res = await api('/api/categories');
                if (res.code === 0) {
                    categories.value = res.data;
                }
            } catch (e) {
                console.error('Failed to load categories:', e);
            }
        }

        // --- Load Posts ---
        async function loadPosts(page = 1, categoryId = null) {
            loading.value = true;
            try {
                let url = `/api/posts?page=${page}&pageSize=${pagination.pageSize}`;
                if (categoryId) url += `&categoryId=${categoryId}`;
                const res = await api(url);
                if (res.code === 0) {
                    posts.value = res.data.list;
                    Object.assign(pagination, res.data.pagination);
                }
            } catch (e) {
                console.error('Failed to load posts:', e);
            } finally {
                loading.value = false;
            }
        }

        // --- Open Post ---
        async function openPost(post) {
            try {
                const slug = post.slug;
                const res = await api(`/api/posts/slug/${slug}`);
                if (res.code === 0) {
                    Object.assign(currentPost, res.data);
                    currentView.value = 'post';

                    // Update URL (pseudo-static)
                    const newUrl = `/post/${slug}.html`;
                    if (window.location.pathname !== newUrl) {
                        history.pushState({ slug }, '', newUrl);
                    } else {
                        history.replaceState({ slug }, '', newUrl);
                    }

                    // Update page meta for SEO and social sharing
                    document.title = `${currentPost.title} - ${settings.site_title || '博客'}`;
                    updateMeta('page-description', currentPost.excerpt || '', 'content');
                    updateMeta('page-keywords', currentPost.keywords || '', 'content');
                    updateMeta('og-title', currentPost.title, 'content');
                    updateMeta('og-description', currentPost.excerpt || currentPost.title, 'content');
                    const shareImg = currentPost.cover_image || settings.site_logo || '/images/logo.png';
                    const absoluteShareImg = shareImg.startsWith('http') ? shareImg : window.location.origin + shareImg;
                    updateMeta('og-image', absoluteShareImg, 'content');
                    updateMeta('wechat-share-img', absoluteShareImg, 'src');
                    updateMeta('og-url', window.location.href, 'content');
                    updateCanonical(window.location.href);

                    // Load comments
                    loadComments(currentPost.id);
                    // Scroll to top instantly after DOM updates
                    window.scrollTo(0, 0);
                    nextTick(() => {
                        window.scrollTo(0, 0);
                    });

                    // Handle image zooming in post content
                    // Handle image zooming in post content
                    nextTick(() => {
                        setTimeout(() => {
                            const postContentEl = document.querySelector('.post-content');
                            if (postContentEl) {
                                const imgs = postContentEl.querySelectorAll('img');
                                imgs.forEach(img => {
                                    img.style.cursor = 'zoom-in';
                                    img.addEventListener('click', (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        zoomImage.value = e.target.src;
                                    });
                                });
                            }
                        }, 200);
                    });
                }
            } catch (e) {
                showToast('加载文章失败');
            }
        }

        // --- Load Comments ---
        async function loadComments(postId) {
            try {
                const res = await api(`/api/posts/${postId}/comments`);
                if (res.code === 0) {
                    comments.value = res.data;
                }
            } catch (e) {
                console.error('Failed to load comments:', e);
            }
        }
        const replyTo = ref(null);

        function setReply(comment) {
            replyTo.value = comment;
            nextTick(() => {
                const el = document.getElementById('commentForm_content');
                if (el) el.focus();
            });
        }

        function cancelReply() {
            replyTo.value = null;
        }

        const flattenedComments = computed(() => {
            const map = {};
            const roots = [];
            comments.value.forEach(c => {
                c.replies = [];
                map[c.id] = c;
            });
            comments.value.forEach(c => {
                if (c.parent_id && map[c.parent_id]) {
                    map[c.parent_id].replies.push(c);
                } else {
                    roots.push(c);
                }
            });
            const result = [];
            function traverse(node, depth, isLast, isFirstReply, activePaths) {
                node.depth = depth;
                node.isLast = isLast;
                node.isFirstReply = isFirstReply;
                node.activePaths = [...activePaths];
                result.push(node);

                const len = node.replies.length;
                const nextPaths = [...activePaths];
                // 如果当前节点不是所在的最后一项，则它的所有子孙节点都需要在当前深度画一条垂直线
                if (!isLast && depth > 0) {
                    nextPaths.push(depth);
                }

                node.replies.forEach((r, idx) => {
                    traverse(r, depth + 1, idx === len - 1, idx === 0, nextPaths);
                });
            }
            const rootLen = roots.length;
            roots.forEach((r, idx) => traverse(r, 0, idx === rootLen - 1, true, []));
            return result;
        });


        // --- Submit Comment ---
        async function submitComment() {
            if (!commentForm.author_name.trim() || !commentForm.content.trim()) {
                showToast('请填写名字和评论内容');
                return;
            }

            const author = commentForm.author_name.trim();
            const content = commentForm.content.trim();
            const commentKey = `sub_comment_${currentPost.id}_${author.replace(/\s+/g, '_')}_${content.substring(0, 20).replace(/\s+/g, '_')}`;
            const lastSubmitted = localStorage.getItem(commentKey);
            const tenMinutes = 10 * 60 * 1000;

            if (lastSubmitted && Date.now() - parseInt(lastSubmitted) < tenMinutes) {
                showToast('相同内容的评论10分钟内只能提交一次哦，请稍后再试');
                return;
            }

            submittingComment.value = true;
            try {
                const res = await api(`/api/posts/${currentPost.id}/comments`, {
                    method: 'POST',
                    body: JSON.stringify({
                        parent_id: replyTo.value?.id || null,
                        author_name: author,
                        author_email: commentForm.author_email.trim(),
                        content: content
                    })
                });

                if (res.code === 0) {
                    // Record submission timestamp on success
                    localStorage.setItem(commentKey, Date.now().toString());

                    showToast('评论提交成功' + (res.data.status === 'approved' ? '' : '，等待审核'), 'success');
                    Object.keys(commentForm).forEach(k => commentForm[k] = '');
                    replyTo.value = null;
                    if (res.data.status) {
                        aiModalData.status = res.data.status;
                        aiModalData.review = res.data.ai_review || (res.data.status === 'approved' ? 'AI 审核通过：内容积极健康，感谢您的分享！' : 'AI 正在深度审核中，请耐心等待管理员复核。');
                        aiModalData.message = res.message;
                        showAIModal.value = true;

                        // Auto close after 3 seconds if approved
                        if (res.data.status === 'approved') {
                            setTimeout(() => {
                                showAIModal.value = false;
                            }, 3000);
                        }
                    }
                    loadComments(currentPost.id);
                } else {
                    showToast(res.message || '提交失败');
                }
            } catch (e) {
                showToast('网络错误，请重试');
            } finally {
                submittingComment.value = false;
            }
        }

        // --- URL Update Context ---
        function updateUrlParams() {
            if (currentView.value !== 'home') return;
            const params = new URLSearchParams();
            if (currentCategory.value) {
                params.set('category', currentCategory.value);
            }
            if (pagination.page > 1) {
                params.set('page', pagination.page);
            }
            const query = params.toString();
            const newUrl = query ? `/?${query}` : '/';
            if (window.location.pathname + window.location.search !== newUrl) {
                history.pushState({}, '', newUrl);
            } else {
                history.replaceState({}, '', newUrl);
            }
        }

        // --- Navigation ---
        function goHome() {
            currentView.value = 'home';
            currentCategory.value = null;
            pagination.page = 1;
            updateUrlParams();
            document.title = settings.site_title || '博客';
            updateMeta('page-description', settings.site_description || '', 'content');
            updateMeta('page-keywords', settings.site_keywords || '', 'content');
            updateMeta('og-title', settings.site_title, 'content');
            updateMeta('og-description', settings.site_description, 'content');
            const defaultImg = settings.site_logo || '/images/logo.png';
            const absoluteDefaultImg = defaultImg.startsWith('http') ? defaultImg : window.location.origin + defaultImg;
            updateMeta('og-image', absoluteDefaultImg, 'content');
            updateMeta('wechat-share-img', absoluteDefaultImg, 'src');
            updateCanonical(window.location.origin + '/');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            loadPosts(1);
        }

        function filterCategory(id) {
            currentCategory.value = id;
            currentView.value = 'home';
            pagination.page = 1;
            updateUrlParams();
            loadPosts(1, id);
        }

        function openAbout() {
            currentView.value = 'about';
            currentCategory.value = null;
            if (window.location.pathname !== '/profile') {
                history.pushState({}, '', '/profile');
            } else {
                history.replaceState({}, '', '/profile');
            }
            document.title = (settings.about_title || '个人简介') + ' - ' + (settings.site_title || '博客');
            updateMeta('page-keywords', settings.about_keywords || '', 'content');
            updateMeta('page-description', settings.about_description || '', 'content');
            const defaultImg = settings.site_logo || '/images/logo.png';
            const absoluteDefaultImg = defaultImg.startsWith('http') ? defaultImg : window.location.origin + defaultImg;
            updateMeta('og-image', absoluteDefaultImg, 'content');
            updateMeta('wechat-share-img', absoluteDefaultImg, 'src');
            updateCanonical(window.location.origin + '/profile');
        }

        function changePage(page) {
            if (page < 1 || page > pagination.totalPages) return;
            pagination.page = page;
            updateUrlParams();
            loadPosts(page, currentCategory.value);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // --- Copy Link ---
        function copyLink() {
            const url = window.location.href;
            navigator.clipboard.writeText(url).then(() => {
                showToast('链接已复制');
            }).catch(() => {
                // Fallback
                const input = document.createElement('input');
                input.value = url;
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
                showToast('链接已复制');
            });
        }

        function getPoliceCode(str) {
            if (!str) return '';
            const match = String(str).match(/\d+/);
            return match ? match[0] : '';
        }

        // --- Keyboard Shortcuts ---
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                openSearch();
            }
        });

        // --- Scroll Events ---
        window.addEventListener('scroll', () => {
            showBackToTop.value = window.scrollY > window.innerHeight;
        });

        function scrollToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // --- Handle Browser Back/Forward ---
        window.addEventListener('popstate', (e) => {
            const path = window.location.pathname;
            if (path.startsWith('/post/') && path.endsWith('.html')) {
                const slug = path.replace('/post/', '').replace('.html', '');
                openPost({ slug });
            } else if (path === '/profile') {
                openAbout();
            } else {
                currentView.value = 'home';
                const urlParams = new URLSearchParams(window.location.search);
                currentCategory.value = urlParams.get('category') ? parseInt(urlParams.get('category')) : null;
                pagination.page = urlParams.get('page') ? parseInt(urlParams.get('page')) : 1;
                loadPosts(pagination.page, currentCategory.value);
            }
        });

        // --- Init ---
        onMounted(async () => {
            await loadSettings();
            await loadCategories();

            // Check URL for direct post access
            const path = window.location.pathname;
            if (path.startsWith('/post/') && path.endsWith('.html')) {
                const slug = path.replace('/post/', '').replace('.html', '');
                await openPost({ slug });
            } else if (path === '/profile') {
                openAbout();
            } else {
                const urlParams = new URLSearchParams(window.location.search);
                currentCategory.value = urlParams.get('category') ? parseInt(urlParams.get('category')) : null;
                pagination.page = urlParams.get('page') ? parseInt(urlParams.get('page')) : 1;
                await loadPosts(pagination.page, currentCategory.value);
            }

            // Hide loading screen
            nextTick(() => {
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) {
                    loadingScreen.classList.add('fade-out');
                    setTimeout(() => { loadingScreen.remove(); }, 400);
                }
            });
        });
        return {
            ICONS,
            currentView,
            loading,
            settings,
            categories,
            currentCategory,
            posts,
            pagination,
            currentPost,
            comments,
            commentForm,
            submittingComment,
            replyTo,
            setReply,
            cancelReply,
            flattenedComments,
            toast,
            renderedContent,
            renderedAboutContent,
            showAIModal,
            aiModalData,
            isDark,
            toggleTheme,
            currentLayout,
            layoutModes,
            cycleLayout,
            getPoliceCode,
            formatDate,
            openPost,
            filterCategory,
            openAbout,
            goHome,
            changePage,
            submitComment,
            copyLink,
            showToast,
            zoomImage,
            imageZoomScale,
            showBackToTop,
            scrollToTop,
            showSearch,
            searchQuery,
            searchResults,
            searchLoading,
            openSearch,
            closeSearch,
            handleSearchInput,
            selectSearchResult
        };
    }
});

app.mount('#app');
