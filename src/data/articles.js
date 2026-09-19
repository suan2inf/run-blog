import { computed } from 'vue'

/**
 * 数据层：构建时读取 content/articles/*.md，没有后端、没有运行时请求。
 *
 * 靠 Vite 的 import.meta.glob 在打包时把文件内容直接编进 JS，
 * 所以 npm run build 出来的就是纯粹的静态文件。
 *
 * 一篇文章的结构（Article）：
 *   slug     文件名（不含 .md），同时是 URL 里的标识，建议用英文
 *   title    标题，取 frontmatter 的 title
 *   date     日期字符串 YYYY-MM-DD
 *   summary  摘要，取 frontmatter 的 summary，没写就自动截正文
 *   category 分类名（可选，仅作文案展示，不再参与筛选）
 *   tags     标签数组（可选）
 *   content  正文 Markdown（不含 frontmatter）
 *   readTime 预估阅读分钟数
 */
const RAW_FILES = import.meta.glob('../../content/articles/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const WORDS_PER_MINUTE = 400
const CN_CHARS_PER_MINUTE = 400

/** 解析 frontmatter，只支持 key: value 和 [a, b] 两种写法，够用且无依赖。 */
function parseFrontmatter(raw) {
  const text = String(raw)
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text)

  if (!match) {
    return { data: {}, content: text.trim() }
  }

  const data = {}
  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const sep = trimmed.indexOf(':')
    if (sep === -1) continue

    const key = trimmed.slice(0, sep).trim()
    if (key.startsWith('#')) continue
    const value = trimmed.slice(sep + 1).trim()
    data[key] = parseValue(value)
  }

  return { data, content: text.slice(match[0].length).trim() }
}

function parseValue(value) {
  if (!value) return ''

  // [a, b, c]
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map(item => unquote(item.trim()))
      .filter(Boolean)
  }

  return unquote(value)
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

function toSlug(path) {
  return path.split('/').pop().replace(/\.md$/i, '')
}

/** 去掉不该计入阅读量的东西：HTML 注释、代码块、LaTeX 公式。 */
function stripNonProse(text) {
  return String(text)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$\n]*\$/g, ' ')
}

function estimateReadTime(content) {
  const prose = stripNonProse(content)
  const cjk = (prose.match(/[\u4e00-\u9fa5]/g) || []).length
  const latin = (prose.match(/[A-Za-z0-9]+/g) || []).length
  // 中文按字算、西文按词算，两个速度不同，各自除完再相加
  const minutes = cjk / CN_CHARS_PER_MINUTE + latin / WORDS_PER_MINUTE
  return Math.max(1, Math.round(minutes))
}

function autoSummary(content) {
  return stripNonProse(content)
    .replace(/^#{1,6}\s+.*$/gm, ' ')
    .replace(/[#*`>\-\[\]()!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
}

function buildArticle(path, raw) {
  const { data, content } = parseFrontmatter(raw)

  return {
    slug: toSlug(path),
    title: data.title || toSlug(path),
    date: String(data.date || ''),
    summary: data.summary || autoSummary(content),
    category: data.category || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    content,
    readTime: estimateReadTime(content),
  }
}

/** 全部文章，按日期由新到旧。 */
export const allArticles = computed(() =>
  Object.entries(RAW_FILES)
    .map(([path, raw]) => buildArticle(path, raw))
    .sort((a, b) => {
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

/** 纯前端搜索：标题、摘要、分类、正文全文匹配。 */
export function searchArticles(keyword) {
  const query = String(keyword || '').trim().toLowerCase()
  if (!query) return allArticles.value

  return allArticles.value.filter(article =>
    [article.title, article.summary, article.category, article.content]
      .join('\n')
      .toLowerCase()
      .includes(query)
  )
}
