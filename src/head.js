import { getArticle } from './data/articles'
import { SITE_DESCRIPTION, SITE_TITLE } from './site'

/**
 * 每个页面的 <head> 信息（标题、摘要、分享卡片）。
 *
 * 同一份函数用在两个地方：
 *   - 构建时预渲染（scripts/prerender.js）写进每个 .html，搜索引擎和微信/QQ 的链接预览读的是这个
 *   - 浏览器里站内跳转时（router.afterEach）同步更新 document.title 等
 */
export function pageHead(route) {
  if (route.name === 'article') {
    const article = getArticle(route.params.slug)
    if (article) {
      return {
        title: `${article.title} · ${SITE_TITLE}`,
        ogTitle: article.title,
        description: article.summary || SITE_DESCRIPTION,
        type: 'article',
        published: article.date,
      }
    }
    return { title: `文章不存在 · ${SITE_TITLE}`, description: SITE_DESCRIPTION, noindex: true }
  }

  const pageTitle = route.meta?.title
  return {
    title: pageTitle ? `${pageTitle} · ${SITE_TITLE}` : SITE_TITLE,
    ogTitle: pageTitle || SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: 'website',
    noindex: route.name === 'not-found',
  }
}

/** 浏览器端：站内跳转后同步标题和摘要（分享卡片只对预渲染的 HTML 有意义，这里顺手保持一致）。 */
export function applyHead(route) {
  const head = pageHead(route)
  document.title = head.title
  setMeta('name', 'description', head.description)
  setMeta('property', 'og:title', head.ogTitle || head.title)
  setMeta('property', 'og:description', head.description)
}

function setMeta(attr, key, content) {
  const tag = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (tag && content) tag.setAttribute('content', content)
}
