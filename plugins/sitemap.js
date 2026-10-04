import { buildManifest } from './articles-manifest.js'
import { siteUrlFor } from '../src/site.js'

/**
 * 构建时生成 sitemap.xml 和 robots.txt。
 *
 * 纯静态站没有服务端，这两样只能是构建产物。文章列表复用 articles-manifest 的 buildManifest，
 * 加了新文章、改了日期，只要重新构建就会同步。
 *
 * 站点地址 = src/site.js 的 SITE_ORIGIN + vite.config.js 的 base。
 * 以前是 hash 路由（…/#/article/x），搜索引擎会把 # 后面全部忽略，整个 sitemap 等于只有首页一条；
 * 现在每篇文章都有独立的真实地址。
 */
export function sitemapPlugin() {
  let siteUrl = '/'

  return {
    name: 'run-blog:sitemap',
    // 只在浏览器产物的构建里生成；预渲染用的 SSR 构建不需要
    apply: (config, env) => env.command === 'build' && !env.isSsrBuild,
    configResolved(config) {
      siteUrl = siteUrlFor(config.base)
    },
    generateBundle() {
      const articles = buildManifest()
      const latest = articles[0]?.date || new Date().toISOString().slice(0, 10)
      const isDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value)

      const urls = [
        { loc: siteUrl, lastmod: latest },
        { loc: `${siteUrl}blog`, lastmod: latest },
        { loc: `${siteUrl}about` },
        ...articles.map(a => ({
          loc: `${siteUrl}article/${encodeURIComponent(a.slug)}`,
          lastmod: isDate(a.date) ? a.date : undefined,
        })),
      ]

      const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map(
          u => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`
        ),
        '</urlset>',
        '',
      ].join('\n')

      const robots = ['User-agent: *', 'Allow: /', `Sitemap: ${siteUrl}sitemap.xml`, ''].join('\n')

      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })

      console.log(`  sitemap.xml  ${urls.length} 条 URL  (${siteUrl})`)
    },
  }
}
