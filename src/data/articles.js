import { computed, ref } from 'vue'
// 构建期生成的文章元数据清单（标题/日期/摘要/标签/阅读时长/字数），见 plugins/articles-manifest.js
import manifest from 'virtual:articles-manifest'
import { toSlug } from './text-utils'

/**
 * 数据层：元数据随主 bundle 走（构建期内嵌），正文按篇懒加载。
 *
 * 正文是构建时已经渲染好的 HTML（plugins/markdown.js），每篇一个 chunk：
 *   - 路由守卫在进入文章页之前 await loadArticleContent，所以组件里同步读缓存就行，
 *     预渲染（服务端）和浏览器水合拿到的是同一份数据，不会出现「先空白再出正文」
 *   - 博客页用到全文搜索 → 拉一次 virtual:search-index（纯文本，独立 chunk）
 *
 * 一篇文章的元数据（Article）：
 *   slug / title / date(YYYY-MM-DD) / summary / category / tags / readTime / wordCount
 * 正文（ArticleContent）：
 *   html  渲染好的正文 HTML
 *   toc   目录 [{ id, text, depth }]，depth 0 是最浅一级
 */

// 正文加载器：非 eager 的 glob，?article 由 articles-manifest 插件转成 { html, toc }
const CONTENT_LOADERS = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../content/articles/*.md', { query: '?article', import: 'default' })
  ).map(([path, loader]) => [toSlug(path), loader])
)

const contentCache = new Map()

/** 拉取某篇文章的正文 { html, toc }，带缓存；不存在的 slug 返回 null。 */
export async function loadArticleContent(slug) {
  if (contentCache.has(slug)) return contentCache.get(slug)
  const loader = CONTENT_LOADERS[slug]
  if (!loader) return null
  const content = await loader()
  contentCache.set(slug, content)
  return content
}

/** 同步读已加载的正文（路由守卫保证进入文章页时已经加载好）。 */
export function getArticleContent(slug) {
  return contentCache.get(slug) || null
}

/** 全部文章（元数据），按日期由新到旧——构建清单时已经排好，这里只是防手滑。 */
export const allArticles = computed(() =>
  [...manifest].sort((a, b) => {
    if (a.date === b.date) return a.slug.localeCompare(b.slug)
    return a.date < b.date ? 1 : -1
  })
)

export function getArticles(limit) {
  return typeof limit === 'number' ? allArticles.value.slice(0, limit) : allArticles.value
}

export function getArticle(slug) {
  return allArticles.value.find(article => article.slug === slug) || null
}

/**
 * 上一篇/下一篇。列表按日期由新到旧排，
 * 所以「上一篇」是更新的那篇（索引 -1），「下一篇」是更旧的（索引 +1）。
 */
export function getPrevNext(slug) {
  const list = allArticles.value
  const index = list.findIndex(article => article.slug === slug)
  if (index === -1) return { prev: null, next: null }
  return {
    prev: index > 0 ? list[index - 1] : null,
    next: index < list.length - 1 ? list[index + 1] : null,
  }
}

/** 全部标签及文章数，按数量降序，给博客页的标签筛选用。 */
export const allTags = computed(() => {
  const counts = new Map()
  for (const article of allArticles.value) {
    for (const tag of article.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
})

/* ---------- 全文搜索索引 ----------
   第一次搜索时拉 virtual:search-index（slug → 正文纯文本）。
   fullTextReady 是响应式的，就绪后搜索结果会自动补全「正文命中」的文章。 */
export const fullTextReady = ref(false)
let searchIndex = {}
let fullTextLoading = null

export function ensureFullTextIndex() {
  if (fullTextReady.value) return Promise.resolve()
  fullTextLoading ||= import('virtual:search-index').then(module => {
    searchIndex = module.default
    fullTextReady.value = true
  })
  return fullTextLoading
}

/**
 * 纯前端搜索：标题、摘要、分类、标签匹配；全文索引就绪后还包括正文。
 * fullTextReady 为 false 时退化为只搜元数据（索引马上就好，差别转瞬即逝）。
 */
export function searchArticles(keyword) {
  const query = String(keyword || '').trim().toLowerCase()
  if (!query) return allArticles.value

  return allArticles.value.filter(article => {
    const fields = [article.title, article.summary, article.category, article.tags.join(' ')]
    if (fullTextReady.value) fields.push(searchIndex[article.slug] || '')
    return fields.join('\n').toLowerCase().includes(query)
  })
}
