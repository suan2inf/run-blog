import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * 构建时生成 sitemap.xml 和 robots.txt。
 *
 * 纯静态站没有服务端，这两样只能是构建产物。文章列表直接扫 content/articles/，
 * 所以加了新文章、改了日期，只要重新构建就会同步，不需要手工维护。
 *
 * 站点地址从 vite.config.js 的 base 推出来：base 是 '/run-blog/'，那就是项目站点
 * https://<用户>.github.io/run-blog/。换成自定义域名时，把 SITE_ORIGIN 改成域名、
 * base 改成 '/'，这里同样能推对。
 */
const SITE_OWNER = 'suan2inf'
const SITE_ORIGIN = `${SITE_OWNER}.github.io`

function readArticles(articlesDir) {
  let files = []
  try {
    files = readdirSync(articlesDir).filter(name => name.endsWith('.md'))
  } catch {
    return []
  }

  return files
    .map(name => {
      const raw = readFileSync(join(articlesDir, name), 'utf8')
      const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)
      const front = {}

      if (match) {
        for (const line of match[1].split(/\r?\n/)) {
          const sep = line.indexOf(':')
          if (sep > 0) {
            front[line.slice(0, sep).trim()] = line
              .slice(sep + 1)
              .trim()
              .replace(/^["']|["']$/g, '')
          }
        }
      }

      return {
        slug: name.replace(/\.md$/i, ''),
        date: /^\d{4}-\d{2}-\d{2}$/.test(front.date || '') ? front.date : '',
      }
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function sitemapPlugin() {
  let siteUrl = '/'

  return {
    name: 'run-blog:sitemap',
    apply: 'build',
    configResolved(config) {
      const repo = String(config.base || '/').replace(/^\/|\/$/g, '')
      siteUrl = repo ? `https://${SITE_ORIGIN}/${repo}/` : `https://${SITE_ORIGIN}/`
    },
    generateBundle() {
      const articles = readArticles(join(process.cwd(), 'content', 'articles'))
      const today = new Date().toISOString().slice(0, 10)

      const urls = [
        { loc: siteUrl, lastmod: today, priority: '1.0' },
        { loc: `${siteUrl}#/blog`, lastmod: today, priority: '0.8' },
        { loc: `${siteUrl}#/about`, lastmod: today, priority: '0.5' },
        ...articles.map(a => ({
          loc: `${siteUrl}#/article/${a.slug}`,
          lastmod: a.date || today,
          priority: '0.7',
        })),
      ]

      const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map(
          u =>
            `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`
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
