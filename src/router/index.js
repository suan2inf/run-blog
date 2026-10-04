import { START_LOCATION, createMemoryHistory, createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Blog from '../views/Blog.vue'
import Article from '../views/Article.vue'
import About from '../views/About.vue'
import NotFound from '../views/NotFound.vue'
import { getArticle, loadArticleContent } from '../data/articles'
import { applyHead } from '../head'

/**
 * 路由用普通路径（/run-blog/article/dspark），不再是 hash（/#/article/dspark）。
 * 构建时每个页面都预渲染成真实的 .html（见 scripts/prerender.js），GitHub Pages 直接按路径返回，
 * 所以刷新、直接打开任何链接都不会 404；旧的 #/ 链接由 index.html 里的内联脚本跳转到新地址。
 *
 * 页面组件都是静态 import：几个页面加起来很小，好处是预渲染出来的 HTML 首屏就有全部样式，
 * 不会出现「正文先裸奔、等 JS 拉完样式才到位」的闪烁。
 */
const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/blog', name: 'blog', component: Blog, meta: { title: '文章' } },
  { path: '/article/:slug', name: 'article', component: Article },
  { path: '/about', name: 'about', component: About, meta: { title: '关于' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound, meta: { title: '页面不存在' } },
]

export function createAppRouter() {
  const base = import.meta.env.BASE_URL
  const router = createRouter({
    // 预渲染在 Node 里跑，没有 window.history，用内存历史
    history: import.meta.env.SSR ? createMemoryHistory(base) : createWebHistory(base),
    routes,
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) return savedPosition
      // 文章页内只改 hash（点标题锚点）时不滚，滚动由点击处理自己做
      if (to.path === from.path && to.name === 'article') return false
      // 带 #小节 的链接：滚到对应标题，上方留一点空。
      // 直接打开链接时瞬间定位，不要从页首「平滑」滑一大段下去
      if (to.hash) {
        return { el: to.hash, top: 24, behavior: from === START_LOCATION ? 'instant' : undefined }
      }
      return { top: 0 }
    },
  })

  // 进入文章页之前先把正文拉下来：组件可以同步渲染，预渲染和浏览器水合拿到的是同一份内容
  router.beforeResolve(async to => {
    if (to.name !== 'article' || !getArticle(to.params.slug)) return
    try {
      await loadArticleContent(to.params.slug)
    } catch (error) {
      // 浏览器里最常见的原因是站点刚重新部署、旧的 chunk 文件名已经不存在了：
      // 直接整页打开目标地址（拿到的是新版本的预渲染页面）
      if (import.meta.env.SSR) throw error
      window.location.assign(router.resolve(to).href)
      return false
    }
  })

  if (!import.meta.env.SSR) {
    router.afterEach(to => applyHead(to))
  }

  return router
}
