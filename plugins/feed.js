import { join } from 'node:path'
import { buildManifest } from './articles-manifest.js'

/**
 * 构建时生成 RSS 2.0 订阅源（feed.xml）。
 *
 * 和 sitemap 一样只能生在构建产物里；文章元数据直接复用
 * articles-manifest 插件的 buildManifest，两份数据不会打架。
 *
 * 注意：路由是 hash 模式，item 链接是 …/#/article/slug 的形式。
 * RSS 阅读器把它当普通链接处理，点开能到文章页，没有问题。
 */
const SITE_OWNER = 'suan2inf'
const SITE_ORIGIN = `${SITE_OWNER}.github.io`

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
    apply: 'build',
    configResolved(config) {
      const repo = String(config.base || '/').replace(/^\/|\/$/g, '')
      siteUrl = repo ? `https://${SITE_ORIGIN}/${repo}/` : `https://${SITE_ORIGIN}/`
    },
    generateBundle() {
      const articles = buildManifest(join(process.cwd(), 'content', 'articles'))
      const now = new Date().toUTCString()

      const items = articles
        .map(
          a => `  <item>
    <title>${escapeXml(a.title)}</title>
    <link>${siteUrl}#/article/${a.slug}</link>
    <guid isPermaLink="true">${siteUrl}#/article/${a.slug}</guid>
    <pubDate>${a.date ? new Date(`${a.date}T00:00:00Z`).toUTCString() : now}</pubDate>
    <description>${escapeXml(a.summary)}</description>
  </item>`
        )
        .join('\n')

      const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>算不尽的博客</title>
  <link>${siteUrl}</link>
  <description>一名普通大学生的学习笔记：论文精读、技术分享、踩坑记录。</description>
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
