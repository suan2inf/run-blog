import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { autoSummary, countWords, estimateReadTime, parseFrontmatter } from '../src/data/text-utils.js'

/**
 * 构建期生成「文章元数据清单」虚拟模块（virtual:articles-manifest）。
 *
 * 为什么需要它：正文实现懒加载后，每篇文章的 .md 是独立 chunk、按需拉取，
 * 但列表页/首页需要标题、日期、摘要、阅读时长这些元数据——它们必须在主 bundle 里。
 * 清单在构建时从 .md 的 frontmatter + 正文统计出来，只含元数据，不含正文。
 *
 * 前端用法：import manifest from 'virtual:articles-manifest'
 * dev 模式下 content/articles/ 里的 .md 增删改会触发整页刷新（full-reload）。
 */
const VIRTUAL_ID = 'virtual:articles-manifest'
const RESOLVED_ID = '\0' + VIRTUAL_ID

// 导出给 feed 插件复用（RSS 需要同一套元数据）
export function buildManifest(articlesDir) {
  let files = []
  try {
    files = readdirSync(articlesDir).filter(name => name.endsWith('.md'))
  } catch {
    return []
  }

  return files
    .map(name => {
      const raw = readFileSync(join(articlesDir, name), 'utf8')
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
  return {
    name: 'run-blog:articles-manifest',

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },

    load(id) {
      if (id !== RESOLVED_ID) return
      const articles = buildManifest(join(process.cwd(), 'content', 'articles'))
      return `export default ${JSON.stringify(articles)}`
    },

    // dev 模式：文章文件增删改 → 让虚拟模块失效并整页刷新。
    // （首页/列表页的元数据没有细粒度 HMR 通道，full-reload 最简单可靠）
    configureServer(server) {
      const dir = join(process.cwd(), 'content', 'articles')

      const invalidate = file => {
        const normalized = String(file || '').replace(/\\/g, '/')
        if (!normalized.includes('/content/articles/') || !normalized.endsWith('.md')) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }

      server.watcher.add(dir)
      server.watcher.on('add', invalidate)
      server.watcher.on('change', invalidate)
      server.watcher.on('unlink', invalidate)
    },
  }
}
