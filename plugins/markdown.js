import MarkdownIt from 'markdown-it'
import katex from 'katex'
import { bundledLanguages, createHighlighter } from 'shiki'

/**
 * 构建期 Markdown 渲染器：Markdown → { html, toc, text }。
 *
 * 以前是浏览器里用 md-editor-v3 的 MdPreview 现场渲染：
 *   - 首页也得下载 KaTeX（约 270KB），文章页再加 160KB 的编辑器运行时
 *   - 页面 HTML 里没有正文，搜索引擎和微信/QQ 的链接预览只能看到一个空壳
 * 现在渲染挪到构建时（dev 模式下由 Vite 插件按需调用），浏览器拿到的就是成品 HTML，
 * 公式、代码高亮都已经是静态标记，只需要 CSS。
 *
 * 支持的语法：CommonMark + 表格 + 删除线 + 自动链接 + 内联 HTML，
 * 以及 $行内公式$ / $$块级公式$$（KaTeX）和 ```lang 代码块（Shiki，亮/暗双主题）。
 */

const CODE_THEMES = { light: 'github-light', dark: 'github-dark' }
// 这些名字按纯文本处理，不走高亮
const PLAIN_LANGS = new Set(['', 'text', 'txt', 'plain', 'plaintext', 'output', 'log'])

let highlighterPromise = null

function getHighlighter() {
  // 语言按需加载（见 render 里的预扫描），这里只先把两个主题装好
  highlighterPromise ||= createHighlighter({ themes: Object.values(CODE_THEMES), langs: [] })
  return highlighterPromise
}

/**
 * 标题 id：完全由标题文本推导，同文本必然同 id，跟渲染顺序无关。
 * 规则和旧版（md-editor-v3 时期）保持一致，已经分享出去的小节链接 id 不会变。
 */
export function headingId(text) {
  const raw = String(text ?? '').trim()
  const slug = raw
    .toLowerCase()
    .replace(/[^\w一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (slug) {
    // 数字打头的 id 当 CSS 选择器是非法的，加个前缀
    return /^[0-9]/.test(slug) ? `s-${slug}` : slug
  }
  // 全是标点/数学符号时退化成文本哈希，仍然是确定性的
  let hash = 0
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) | 0
  }
  return `h-${(hash >>> 0).toString(36)}`
}

/* ---------- KaTeX ---------- */

function renderMath(content, displayMode) {
  // throwOnError: false —— 公式写错时显示红色源码而不是让整个构建失败
  return katex.renderToString(content, { displayMode, throwOnError: false, strict: false })
}

/** 行内：$...$；也接受段落里的 $$...$$（按块级样式渲染）。 */
function mathInline(state, silent) {
  const { src } = state
  const start = state.pos
  if (src.charCodeAt(start) !== 0x24 /* $ */) return false

  const display = src.charCodeAt(start + 1) === 0x24
  const marker = display ? '$$' : '$'
  const contentStart = start + marker.length

  let end = contentStart
  for (;;) {
    end = src.indexOf(marker, end)
    if (end === -1) return false
    // \$ 是转义的美元符，不算结束
    if (src.charCodeAt(end - 1) === 0x5c /* \ */) {
      end += 1
      continue
    }
    break
  }

  const content = src.slice(contentStart, end)
  if (!content) return false
  if (!display) {
    // 「价格 $5 到 $6」这种不是公式：开头结尾不能是空白，收尾 $ 后不能紧跟数字
    if (/^\s|\s$/.test(content) || /\d/.test(src[end + 1] || '')) return false
  }

  if (!silent) {
    const token = state.push(display ? 'math_inline_display' : 'math_inline', 'math', 0)
    token.content = content
    token.markup = marker
  }
  state.pos = end + marker.length
  return true
}

/** 块级：单行 $$...$$，或者 $$ 开头、$$ 结尾的多行。 */
function mathBlock(state, startLine, endLine, silent) {
  const lineStart = state.bMarks[startLine] + state.tShift[startLine]
  const lineEnd = state.eMarks[startLine]
  if (state.sCount[startLine] - state.blkIndent >= 4) return false
  if (state.src.slice(lineStart, lineStart + 2) !== '$$') return false

  const firstLine = state.src.slice(lineStart + 2, lineEnd).trim()
  let content
  let lastLine = startLine

  if (firstLine.endsWith('$$')) {
    content = firstLine.slice(0, -2)
  } else {
    const lines = firstLine ? [firstLine] : []
    let closed = false
    for (lastLine = startLine + 1; lastLine < endLine; lastLine += 1) {
      const line = state.src.slice(state.bMarks[lastLine] + state.tShift[lastLine], state.eMarks[lastLine])
      if (line.trim().endsWith('$$')) {
        lines.push(line.trim().slice(0, -2))
        closed = true
        break
      }
      lines.push(line)
    }
    if (!closed) return false
    content = lines.join('\n')
  }

  if (!content.trim()) return false
  if (silent) return true

  const token = state.push('math_block', 'math', 0)
  token.block = true
  token.content = content
  token.markup = '$$'
  token.map = [startLine, lastLine + 1]
  state.line = lastLine + 1
  return true
}

/* ---------- 工具 ---------- */

/** inline token 的纯文本（标题文字、目录、搜索索引用）。 */
function inlineText(token) {
  if (!token?.children) return token?.content || ''
  return token.children
    .map(child => {
      if (child.type === 'softbreak' || child.type === 'hardbreak') return ' '
      if (child.type === 'image') return inlineText(child)
      return ['text', 'code_inline', 'math_inline', 'math_inline_display'].includes(child.type)
        ? child.content
        : ''
    })
    .join('')
}

function withBase(base, path) {
  if (!path.startsWith('/') || path.startsWith('//')) return path
  if (path.startsWith(base)) return path
  return base + path.slice(1)
}

/* ---------- 渲染器 ---------- */

function createMarkdownIt({ base, highlighter }) {
  // html: true —— 内容只有作者本人写，允许内嵌 HTML（比如 <details>）
  const md = new MarkdownIt({ html: true, linkify: true, breaks: false })
  const { escapeHtml } = md.utils

  md.inline.ruler.before('escape', 'math_inline', mathInline)
  md.block.ruler.before('fence', 'math_block', mathBlock, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })

  md.renderer.rules.math_inline = (tokens, idx) => renderMath(tokens[idx].content, false)
  md.renderer.rules.math_inline_display = (tokens, idx) => renderMath(tokens[idx].content, true)
  md.renderer.rules.math_block = (tokens, idx) =>
    `<div class="math-block">${renderMath(tokens[idx].content, true)}</div>\n`

  // 标题：生成 id、去重、收集目录，并在标题末尾挂一个「#」锚点
  md.core.ruler.push('headings', state => {
    const { tokens, env } = state

    // 正文开头的一级标题通常就是文章标题本身，页面头部已经有了，去掉免得出现两遍
    if (tokens[0]?.type === 'heading_open' && tokens[0].tag === 'h1') {
      tokens.splice(0, 3)
    }

    const used = new Map()
    const headings = []
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i]
      if (token.type !== 'heading_open') continue

      const inline = tokens[i + 1]
      const text = inlineText(inline).trim()
      let id = headingId(text)
      const seen = used.get(id) || 0
      used.set(id, seen + 1)
      if (seen) id = `${id}-${seen}`

      token.attrSet('id', id)
      headings.push({ level: Number(token.tag.slice(1)), id, text })

      const anchor = new state.Token('html_inline', '', 0)
      anchor.content = `<a class="heading-anchor" href="#${escapeHtml(id)}" aria-label="本节链接">#</a>`
      inline.children.push(anchor)
    }

    // 目录只收最浅的两级（通常是 h2 / h3），depth 从 0 开始给样式缩进用
    const minLevel = Math.min(...headings.map(h => h.level))
    env.toc = headings
      .filter(h => h.level <= minLevel + 1)
      .map(h => ({ id: h.id, text: h.text, depth: h.level - minLevel }))
  })

  // 链接：站外链接新窗口打开 + 防 window.opener；站内绝对路径补上 base
  const renderToken = (tokens, idx, options, env, self) => self.renderToken(tokens, idx, options)
  const linkOpen = md.renderer.rules.link_open || renderToken
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const href = token.attrGet('href') || ''
    if (/^https?:\/\//i.test(href)) {
      token.attrSet('target', '_blank')
      token.attrSet('rel', 'noopener noreferrer')
      token.attrJoin('class', 'external-link')
    } else {
      token.attrSet('href', withBase(base, href))
    }
    return linkOpen(tokens, idx, options, env, self)
  }

  // 图片：/images/x.png 自动带上 base；懒加载
  const image = md.renderer.rules.image
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    token.attrSet('src', withBase(base, token.attrGet('src') || ''))
    token.attrSet('loading', 'lazy')
    token.attrSet('decoding', 'async')
    return image(tokens, idx, options, env, self)
  }

  // 表格外面包一层负责横向滚动，表格本身保持 table 语义（读屏软件友好）
  md.renderer.rules.table_open = () => '<div class="table-wrap">\n<table>\n'
  md.renderer.rules.table_close = () => '</table>\n</div>\n'

  // 代码块：Shiki 双主题高亮（颜色走 CSS 变量，跟随站点亮/暗切换）+ 复制按钮
  md.renderer.rules.fence = (tokens, idx) => {
    const token = tokens[idx]
    const lang = token.info.trim().split(/\s+/)[0].toLowerCase()
    const code = token.content.replace(/\n$/, '')

    const inner =
      !PLAIN_LANGS.has(lang) && highlighter.getLoadedLanguages().includes(lang)
        ? highlighter.codeToHtml(code, { lang, themes: CODE_THEMES, defaultColor: false })
        : `<pre class="shiki" tabindex="0"><code>${escapeHtml(code)}</code></pre>`

    const langAttr = lang && !PLAIN_LANGS.has(lang) ? ` data-lang="${escapeHtml(lang)}"` : ''
    return (
      `<div class="code-block"${langAttr}>` +
      `<button class="code-copy" type="button" aria-label="复制代码">复制</button>` +
      `${inner}</div>\n`
    )
  }

  return md
}

/** 搜索用的纯文本：所有段落、标题、列表、表格里的文字，加上代码块内容。 */
function collectText(tokens) {
  const parts = []
  for (const token of tokens) {
    if (token.type === 'inline') parts.push(inlineText(token))
    else if (token.type === 'fence' || token.type === 'code_block') parts.push(token.content)
  }
  return parts.join('\n')
}

/**
 * 创建渲染函数。base 是站点 base（如 '/run-blog/'），站内绝对链接和图片会自动带上。
 * 返回的 render(markdown) 是异步的：先扫一遍用到的代码语言，按需加载语法后再渲染。
 */
export async function createRenderer({ base = '/' } = {}) {
  const highlighter = await getHighlighter()
  const md = createMarkdownIt({ base, highlighter })
  const cache = new Map()

  return async function render(markdown) {
    const source = String(markdown)
    if (cache.has(source)) return cache.get(source)

    const env = {}
    const tokens = md.parse(source, env)

    const langs = new Set(
      tokens
        .filter(t => t.type === 'fence')
        .map(t => t.info.trim().split(/\s+/)[0].toLowerCase())
        .filter(lang => lang && !PLAIN_LANGS.has(lang) && lang in bundledLanguages)
    )
    const missing = [...langs].filter(lang => !highlighter.getLoadedLanguages().includes(lang))
    if (missing.length) await highlighter.loadLanguage(...missing)

    const result = {
      html: md.renderer.render(tokens, md.options, env),
      toc: env.toc || [],
      text: collectText(tokens),
    }
    cache.set(source, result)
    return result
  }
}
