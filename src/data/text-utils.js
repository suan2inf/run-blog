/**
 * 纯文本工具：不依赖 Vue、不依赖浏览器 API，
 * 前端（articles.js）和构建侧（plugins/articles-manifest.js、plugins/sitemap.js）共用。
 * 改动这里的解析规则，构建产物和运行时行为会一起变。
 */

const WORDS_PER_MINUTE = 400
const CN_CHARS_PER_MINUTE = 400

/** 解析 frontmatter，只支持 key: value 和 [a, b] 两种写法，够用且无依赖。 */
export function parseFrontmatter(raw) {
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

/** 从文件路径/文件名取 slug（文件名去掉 .md）。 */
export function toSlug(path) {
  return path.split('/').pop().replace(/\.md$/i, '')
}

/** 去掉不该计入阅读量的东西：HTML 注释、代码块、LaTeX 公式。 */
export function stripNonProse(text) {
  return String(text)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$\n]*\$/g, ' ')
}

/** 估算正文规模：中文字 + 西文词。阅读时长和字数共用这份统计。 */
export function countWords(content) {
  const prose = stripNonProse(content)
  const cjk = (prose.match(/[一-龥]/g) || []).length
  const latin = (prose.match(/[A-Za-z0-9]+/g) || []).length
  return { cjk, latin, total: cjk + latin }
}

export function estimateReadTime(content) {
  const { cjk, latin } = countWords(content)
  // 中文按字算、西文按词算，两个速度不同，各自除完再相加
  const minutes = cjk / CN_CHARS_PER_MINUTE + latin / WORDS_PER_MINUTE
  return Math.max(1, Math.round(minutes))
}

export function autoSummary(content) {
  return stripNonProse(content)
    .replace(/^#{1,6}\s+.*$/gm, ' ')
    .replace(/[#*`>\-\[\]()!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
}
