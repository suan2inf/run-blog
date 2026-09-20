import { computed, ref } from 'vue'
// 构建期生成的文章元数据清单（标题/日期/摘要/标签/阅读时长/字数），见 plugins/articles-manifest.js
import manifest from 'virtual:articles-manifest'
import { parseFrontmatter, toSlug } from './text-utils'

/**
 * 数据层：元数据随主 bundle 走（构建期内嵌），正文懒加载。
 *
 * 早先版本是 import.meta.glob(..., { eager: true }) 把全部 md 正文打进主 JS，
 * 文章一多首屏就得为没读到的文章买单。现在每篇 .md 是独立 chunk：
 *   - 打开文章页 → 只拉那一篇的正文（loadArticleContent）
 *   - 博客页用到全文搜索 → 一次性把全部正文拉下来（ensureFullTextIndex）
 * 元数据（含阅读时长、字数）始终在本地，列表/首页渲染不需要任何网络请求。
 *
 * 一篇文章的结构（Article）：
 *   slug     文件名（不含 .md），同时是 URL 里的标识，建议用英文
 *   title    标题，取 frontmatter 的 title
 *   date     日期字符串 YYYY-MM-DD
 *   summary  摘要，取 frontmatter 的 summary，没写就构建时自动截正文
 *   category 分类名（可选，仅作文案展示）
 *   tags     标签数组（可选，可在博客页按标签筛选）
 *   readTime 预估阅读分钟数（构建时算好）
 *   wordCount 估算字数（构建时算好，中文字 + 西文词）
 * 注意：文章对象上没有 content 字段了，正文走 loadArticleContent(slug)。
 */

// 正文加载器：非 eager 的 glob，每篇 md 一个独立 chunk
const CONTENT_LOADERS = import.meta.glob('../../content/articles/*.md', {
  query: '?raw',
  import: 'default',
})

const contentCache = new Map()

/** 拉取某篇文章的正文（不含 frontmatter），带缓存。 */
export async function loadArticleContent(slug) {
  if (contentCache.has(slug)) return contentCache.get(slug)

  const entry = Object.entries(CONTENT_LOADERS).find(([path]) => toSlug(path) === slug)
  if (!entry) return ''

  const raw = await entry[1]()
  const { content } = parseFrontmatter(String(raw))
  contentCache.set(slug, content)
  return content
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
   正文是懒加载的，所以全文索引也是：第一次搜索时把所有正文拉下来。
   fullTextReady 是响应式的，就绪后搜索结果会自动补全「正文命中」的文章。 */
export const fullTextReady = ref(false)
let fullTextLoading = null

export function ensureFullTextIndex() {
  if (fullTextReady.value) return Promise.resolve()
  if (!fullTextLoading) {
    fullTextLoading = Promise.all(
      allArticles.value.map(article => loadArticleContent(article.slug))
    ).then(() => {
      fullTextReady.value = true
    })
  }
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
    if (fullTextReady.value) fields.push(contentCache.get(article.slug) || '')
    return fields.join('\n').toLowerCase().includes(query)
  })
}
