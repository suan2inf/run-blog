import { buildManifest } from './articles-manifest.js'
import { SITE_DESCRIPTION, SITE_TITLE, siteUrlFor } from '../src/site.js'

/**
 * 构建时生成 RSS 2.0 订阅源（feed.xml）。
 * 文章元数据复用 articles-manifest 插件的 buildManifest，几份数据不会打架。
 */
function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function feedPlugin() {
  let siteUrl = '/'

  return {
    name: 'run-blog:feed',
    // 只在浏览器产物的构建里生成；预渲染用的 SSR 构建不需要
    apply: (config, env) => env.command === 'build' && !env.isSsrBuild,
    configResolved(config) {
      siteUrl = siteUrlFor(config.base)
    },
    generateBundle() {
      const articles = buildManifest()
      const now = new Date().toUTCString()

      const items = articles
        .map(a => {
          const link = `${siteUrl}article/${encodeURIComponent(a.slug)}`
          return `  <item>
    <title>${escapeXml(a.title)}</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>
    <pubDate>${a.date ? new Date(`${a.date}T00:00:00+08:00`).toUTCString() : now}</pubDate>
    <description>${escapeXml(a.summary)}</description>
  </item>`
        })
        .join('\n')

      const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeXml(SITE_TITLE)}</title>
  <link>${siteUrl}</link>
  <atom:link href="${siteUrl}feed.xml" rel="self" type="application/rss+xml" />
  <description>${escapeXml(SITE_DESCRIPTION)}</description>
  <language>zh-CN</language>
  <lastBuildDate>${now}</lastBuildDate>
${items}
</channel>
</rss>
`

      this.emitFile({ type: 'asset', fileName: 'feed.xml', source: feed })
      console.log(`  feed.xml     ${articles.length} 篇文章`)
    },
  }
}
