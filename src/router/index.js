import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'

// 用 hash 模式，URL 形如 /#/blog。GitHub Pages 是纯静态托管，
// 没有服务端路由，hash 模式不需要任何额外配置，刷新任何链接都不会 404。
const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/blog', name: 'blog', component: () => import('../views/Blog.vue') },
  { path: '/article/:slug', name: 'article', component: () => import('../views/Article.vue') },
  { path: '/about', name: 'about', component: () => import('../views/About.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

export default router
