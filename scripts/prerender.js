/**
 * 预渲染：把每个页面渲染成真实的静态 HTML，写进 dist/。
 *
 * 由 `npm run build` 在两次 Vite 构建之后调用：
 *   1. vite build                → dist/        浏览器产物（index.html 模板 + JS/CSS）
 *   2. vite build --ssr …        → dist-ssr/    同一套 Vue 代码的 Node 版，用来在构建时渲染
 *   3. node scripts/prerender.js → 逐个路由渲染，生成 index.html / blog.html / article/xxx.html …
 *
 * 好处：页面 HTML 里直接就有标题和正文，搜索引擎能收录，微信/QQ 等链接预览能读到每篇文章
 * 自己的标题和摘要；浏览器拿到 HTML 立刻能看，JS 加载完再「接管」（水合）成单页应用。
 *
 * GitHub Pages 会把 /run-blog/article/dspark 自动对应到 article/dspark.html。
 * 404.html 是不带预渲染内容的空壳：未知地址由前端路由显示 404 页，兜底用。
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { SITE_TITLE, siteUrlFor } from '../src/site.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(root, 'dist')
const ssrDir = join(root, 'dist-ssr')

const HEAD_BLOCK = /<!--head:start-->[\s\S]*?<!--head:end-->/
const APP_PLACEHOLDER = '<!--app-html-->'

function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** /article/dspark → article/dspark.html；/ → index.html */
function outputFileFor(path) {
  if (path === '/') return 'index.html'
  return `${path.replace(/^\/+|\/+$/g, '')}.html`
}

function pageUrl(siteUrl, path) {
  return path === '/' ? siteUrl : `${siteUrl}${path.replace(/^\/+/, '')}`
}

function headTags(head, { url, siteUrl, preload }) {
  const tags = [
    `<title>${escapeAttr(head.title)}</title>`,
    `<meta name="description" content="${escapeAttr(head.description)}" />`,
  ]

  if (head.noindex) {
    tags.push('<meta name="robots" content="noindex" />')
  } else {
    tags.push(`<link rel="canonical" href="${escapeAttr(url)}" />`)
  }

  // 分享卡片。github.io 下所有文章共用一张封面图，标题和摘要是每篇自己的
  tags.push(
    `<meta property="og:type" content="${head.type || 'website'}" />`,
    `<meta property="og:site_name" content="${escapeAttr(SITE_TITLE)}" />`,
    `<meta property="og:title" content="${escapeAttr(head.ogTitle || head.title)}" />`,
    `<meta property="og:description" content="${escapeAttr(head.description)}" />`,
    `<meta property="og:url" content="${escapeAttr(url)}" />`,
    `<meta property="og:image" content="${siteUrl}og-cover.png" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta name="twitter:card" content="summary_large_image" />'
  )

  if (head.type === 'article') {
    if (head.published) {
      tags.push(`<meta property="article:published_time" content="${escapeAttr(head.published)}" />`)
    }
    // 结构化数据：让搜索引擎知道这是一篇博客文章（标题、日期、作者）
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: head.ogTitle,
      description: head.description,
      datePublished: head.published || undefined,
      url,
      author: { '@type': 'Person', name: '算不尽', url: siteUrl },
    }
    tags.push(
      `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`
    )
  }

  // 文章正文 chunk 提前并行下载，水合时不用再等一轮请求
  for (const href of preload) {
    tags.push(`<link rel="modulepreload" crossorigin href="${href}" />`)
  }

  return tags.join('\n    ')
}

function fillTemplate(template, { head, appHtml }) {
  // 用函数做替换：正文里可能有 $ 符号，字符串替换会把 $& $1 之类当成特殊模式
  return template
    .replace(HEAD_BLOCK, () => head)
    .replace(APP_PLACEHOLDER, () => appHtml)
}

async function main() {
  const templatePath = join(distDir, 'index.html')
  const entryPath = join(ssrDir, 'entry-server.js')
  if (!existsSync(templatePath) || !existsSync(entryPath)) {
    throw new Error('缺少构建产物：请通过 npm run build 运行（需要先完成两次 vite build）')
  }

  const template = readFileSync(templatePath, 'utf8')
  if (!HEAD_BLOCK.test(template) || !template.includes(APP_PLACEHOLDER)) {
    throw new Error('dist/index.html 里找不到 <!--head:start--> / <!--app-html--> 标记')
  }

  const manifestPath = join(distDir, '.vite', 'manifest.json')
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {}

  const { render, prerenderRoutes, base } = await import(pathToFileURL(entryPath).href)
  const siteUrl = siteUrlFor(base)

  // 文章 slug → 正文 chunk 的地址（manifest 的键形如 content/articles/dspark.md?article）
  const contentChunk = slug => {
    const key = Object.keys(manifest).find(k => k.startsWith(`content/articles/${slug}.md`))
    return key ? [`${base}${manifest[key].file}`] : []
  }

  const routes = prerenderRoutes()
  for (const path of routes) {
    const { html, head, route } = await render(path)
    if (route.name === 'not-found') {
      throw new Error(`预渲染路由 ${path} 落到了 404，检查路由表`)
    }

    const preload = route.name === 'article' ? contentChunk(route.params.slug) : []
    const url = pageUrl(siteUrl, path)
    const page = fillTemplate(template, {
      head: headTags(head, { url, siteUrl, preload }),
      appHtml: html,
    })

    const file = join(distDir, outputFileFor(path))
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, page)
    console.log(`  prerender  ${outputFileFor(path).padEnd(32)} ${(page.length / 1024).toFixed(1)} KB`)
  }

  // 404.html：空壳，前端路由按实际地址渲染（未知地址 → 404 页）
  const notFound = fillTemplate(template, {
    head: headTags(
      { title: `页面不存在 · ${SITE_TITLE}`, description: '', noindex: true },
      { url: siteUrl, siteUrl, preload: [] }
    ),
    appHtml: '',
  })
  writeFileSync(join(distDir, '404.html'), notFound)
  console.log(`  prerender  404.html（空壳）`)

  // 清理只在构建过程中用到的东西：manifest 不需要部署，SSR 产物也不需要
  rmSync(join(distDir, '.vite'), { recursive: true, force: true })
  rmSync(ssrDir, { recursive: true, force: true })

  console.log(`  ✓ 预渲染完成：${routes.length} 个页面 + 404.html`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
