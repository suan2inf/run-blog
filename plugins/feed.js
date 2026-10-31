import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildManifest } from './articles-manifest.js'
import { createRenderer } from './markdown.js'
import { AUTHOR, SITE_DESCRIPTION, SITE_TITLE, siteUrlFor } from '../src/site.js'
import { parseFrontmatter } from '../src/data/text-utils.js'

/**
 * 构建时生成全文 RSS 2.0 订阅源（feed.xml）。
 * 文章元数据复用 articles-manifest 插件的 buildManifest，正文复用同一套 Markdown 渲染器。
 */
function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** HTML 放进 CDATA，正文中即使出现 ]]> 也不会提前结束 CDATA。 */
function cdata(value) {
  return `<![CDATA[${String(value).replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
}

/** 无日期就不伪造 pubDate，避免旧文章在每次构建后都被阅读器当成新文章。 */
function rssDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return ''
  const date = new Date(`${value}T00:00:00+08:00`)
  return Number.isNaN(date.getTime()) ? '' : date.toUTCString()
}

/** 阅读器不在文章页上下文中，站内图片、相对链接和 #章节链接都必须改成绝对地址。 */
function absolutizeUrls(html, articleUrl) {
  return String(html).replace(
    /\s(href|src|poster)=(["'])([^"']*)\2/g,
    (match, attribute, quote, value) => {
      if (!value || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) return match
      return ` ${attribute}=${quote}${new URL(value, articleUrl).href}${quote}`
    }
  )
}

export function feedPlugin() {
  let siteUrl = '/'
  let base = '/'

  return {
    name: 'run-blog:feed',
    // 只在浏览器产物的构建里生成；预渲染用的 SSR 构建不需要
    apply: (config, env) => env.command === 'build' && !env.isSsrBuild,
    configResolved(config) {
      base = config.base || '/'
      siteUrl = siteUrlFor(base)
    },
    async generateBundle() {
      const articles = buildManifest()
      const render = await createRenderer({ base })
      const now = new Date().toUTCString()
      const items = []

      for (const article of articles) {
        const link = `${siteUrl}article/${encodeURIComponent(article.slug)}`
        const file = join(process.cwd(), 'content', 'articles', `${article.slug}.md`)
        const { content } = parseFrontmatter(readFileSync(file, 'utf8'))
        const { html } = await render(content)
        const pubDate = rssDate(article.date)
        const categories = [...new Set([article.category, ...article.tags].filter(Boolean))]

        items.push(`  <item>
    <title>${escapeXml(article.title)}</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>
    ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ''}
    <dc:creator>${escapeXml(AUTHOR)}</dc:creator>
    ${categories.map(category => `<category>${escapeXml(category)}</category>`).join('\n    ')}
    <description>${escapeXml(article.summary)}</description>
    <content:encoded>${cdata(absolutizeUrls(html, link))}</content:encoded>
  </item>`)
      }

      const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
  <title>${escapeXml(SITE_TITLE)}</title>
  <link>${siteUrl}</link>
  <atom:link href="${siteUrl}feed.xml" rel="self" type="application/rss+xml" />
  <description>${escapeXml(SITE_DESCRIPTION)}</description>
  <language>zh-CN</language>
  <lastBuildDate>${now}</lastBuildDate>
${items.join('\n')}
</channel>
</rss>
`

      this.emitFile({ type: 'asset', fileName: 'feed.xml', source: feed })
      console.log(`  feed.xml     ${articles.length} 篇文章（全文）`)
    },
  }
}
