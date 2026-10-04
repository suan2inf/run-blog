import { renderToString } from 'vue/server-renderer'
import { createApp } from './app'
import { allArticles } from './data/articles'
import { pageHead } from './head'

/**
 * 预渲染入口：只在构建时由 scripts/prerender.js 调用，不会进浏览器。
 * render(url) 返回页面主体 HTML 和 <head> 信息。
 */
export async function render(url) {
  const { app, router } = createApp({ hydrate: true })
  await router.push(url)
  await router.isReady()

  const html = await renderToString(app)
  const route = router.currentRoute.value
  return { html, head: pageHead(route), route: { name: route.name, params: { ...route.params } } }
}

/** 需要预渲染的页面路径（不含 base）。 */
export function prerenderRoutes() {
  return ['/', '/blog', '/about', ...allArticles.value.map(article => `/article/${article.slug}`)]
}

// 站点 base（如 '/run-blog/'），预渲染脚本拼地址用
export const base = import.meta.env.BASE_URL
