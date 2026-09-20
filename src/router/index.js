import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'

// 用 hash 模式，URL 形如 /#/blog。GitHub Pages 是纯静态托管，
// 没有服务端路由，hash 模式不需要任何额外配置，刷新任何链接都不会 404。
const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/blog', name: 'blog', component: () => import('../views/Blog.vue'), meta: { title: '博客' } },
  { path: '/article/:slug', name: 'article', component: () => import('../views/Article.vue') },
  { path: '/about', name: 'about', component: () => import('../views/About.vue'), meta: { title: '关于' } },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFound.vue'),
    meta: { title: '页面不存在' },
  },
]

const SITE_TITLE = '算不尽的博客'

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    // 文章页内只改查询参数（点标题锚点写 ?h=）时保持滚动位置，别弹回顶部。
    // 博客页翻页不在此列：翻页本来就该回到列表顶部。
    if (to.path === from.path && to.name === 'article') return false
    return { top: 0 }
  },
})

// 每个页面的标签页标题。文章页标题由 Article.vue 按文章再覆盖一次。
router.afterEach(to => {
  document.title = to.meta.title ? `${to.meta.title} · ${SITE_TITLE}` : SITE_TITLE
})

export default router
