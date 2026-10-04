import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { autoSummary, countWords, estimateReadTime, parseFrontmatter } from '../src/data/text-utils.js'
import { createRenderer } from './markdown.js'

/**
 * 文章内容插件，提供三样东西：
 *
 * 1. virtual:articles-manifest —— 文章元数据清单（标题/日期/摘要/标签/字数），随主 bundle 走，
 *    首页和列表页渲染不需要任何额外请求。
 * 2. content/articles/xxx.md?article —— 单篇文章的「成品」：{ html, toc }。
 *    Markdown 在构建时就渲染好（公式、代码高亮都是静态 HTML），每篇一个独立 chunk。
 * 3. virtual:search-index —— 全文搜索用的纯文本，独立 chunk，第一次搜索时才拉。
 *
 * dev 模式下 content/articles/ 里的 .md 增删改会触发整页刷新。
 */
const MANIFEST_ID = 'virtual:articles-manifest'
const SEARCH_ID = 'virtual:search-index'
const RESOLVED_MANIFEST = '\0' + MANIFEST_ID
const RESOLVED_SEARCH = '\0' + SEARCH_ID
const ARTICLE_QUERY = '?article'

function articlesDir() {
  return join(process.cwd(), 'content', 'articles')
}

function listArticleFiles(dir) {
  try {
    return readdirSync(dir).filter(name => name.endsWith('.md'))
  } catch {
    return []
  }
}

// 导出给 feed / sitemap 插件复用，几处的元数据保证是同一份
export function buildManifest(dir = articlesDir()) {
  return listArticleFiles(dir)
    .map(name => {
      const raw = readFileSync(join(dir, name), 'utf8')
      const { data, content } = parseFrontmatter(raw)
      const slug = name.replace(/\.md$/i, '')

      return {
        slug,
        title: data.title || slug,
        date: String(data.date || ''),
        summary: data.summary || autoSummary(content),
        category: data.category || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        readTime: estimateReadTime(content),
        wordCount: countWords(content).total,
      }
    })
    // 按日期由新到旧，同日按 slug 字典序（和 articles.js 的排序规则保持一致）
    .sort((a, b) => {
      if (a.date === b.date) return a.slug.localeCompare(b.slug)
      return a.date < b.date ? 1 : -1
    })
}

export function articlesManifestPlugin() {
  let renderPromise = null
  let base = '/'

  const getRender = () => (renderPromise ||= createRenderer({ base }))

  async function renderFile(file) {
    const { content } = parseFrontmatter(readFileSync(file, 'utf8'))
    const render = await getRender()
    return render(content)
  }

  return {
    name: 'run-blog:articles-manifest',

    configResolved(config) {
      base = config.base || '/'
    },

    resolveId(id) {
      if (id === MANIFEST_ID) return RESOLVED_MANIFEST
      if (id === SEARCH_ID) return RESOLVED_SEARCH
    },

    async load(id) {
      if (id === RESOLVED_MANIFEST) {
        return `export default ${JSON.stringify(buildManifest())}`
      }

      if (id === RESOLVED_SEARCH) {
        const dir = articlesDir()
        const index = {}
        for (const name of listArticleFiles(dir)) {
          const file = join(dir, name)
          this.addWatchFile(file)
          index[name.replace(/\.md$/i, '')] = (await renderFile(file)).text
        }
        return `export default ${JSON.stringify(index)}`
      }

      // dev 模式下 id 可能还带着 &import / &t=… 之类的附加查询，按参数名判断更稳
      const [file, query = ''] = id.split('?')
      if (file.endsWith('.md') && new URLSearchParams(query).has(ARTICLE_QUERY.slice(1))) {
        this.addWatchFile(file)
        const { html, toc } = await renderFile(file)
        return `export default ${JSON.stringify({ html, toc })}`
      }
    },

    // dev 模式：文章文件增删改 → 让虚拟模块失效并整页刷新。
    configureServer(server) {
      const invalidate = file => {
        const normalized = String(file || '').replace(/\\/g, '/')
        if (!normalized.includes('/content/articles/') || !normalized.endsWith('.md')) return
        for (const id of [RESOLVED_MANIFEST, RESOLVED_SEARCH]) {
          const mod = server.moduleGraph.getModuleById(id)
          if (mod) server.moduleGraph.invalidateModule(mod)
        }
        server.ws.send({ type: 'full-reload' })
      }

      server.watcher.add(articlesDir())
      server.watcher.on('add', invalidate)
      server.watcher.on('change', invalidate)
      server.watcher.on('unlink', invalidate)
    },
  }
}
