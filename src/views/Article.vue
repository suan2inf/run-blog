<template>
  <div class="article-shell" ref="shellRef">
    <template v-if="article">
      <aside class="article-toc" aria-label="文章目录">
        <p class="toc-title">目录</p>
        <MdCatalog
          :editorId="EDITOR_ID"
          :scrollElement="scrollElement"
          :mdHeadingId="headingId"
          :catalogMaxDepth="3"
          :offsetTop="88"
        />
      </aside>

      <article class="article-detail">
        <header class="article-header">
          <h1>{{ article.title }}</h1>
          <div class="article-meta">
            <span>{{ formatDate(article.date) }}</span>
            <span v-if="article.category" class="meta-category">{{ article.category }}</span>
          </div>
        </header>
        <div class="paper">
          <div class="markdown-body">
            <MdPreview :id="EDITOR_ID" :modelValue="article.content" :mdHeadingId="headingId" />
          </div>
        </div>
        <div class="article-footer">
          <router-link to="/blog" class="back-link">← 返回文章列表</router-link>
        </div>
      </article>
    </template>

    <div class="error" v-else>
      <p>文章不存在</p>
      <router-link to="/blog" class="back-link">← 返回文章列表</router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getArticle } from '../data/articles'
import { MdPreview, MdCatalog } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'

// MdPreview 和 MdCatalog 靠这个 id 配对；没有它目录不会渲染
const EDITOR_ID = 'article-preview'

const route = useRoute()
const shellRef = ref(null)
const scrollElement = ref()

// 文章已经在构建时全部读进内存，同步按 slug 查表即可，没有加载态
const article = computed(() => getArticle(route.params.slug))

// 给标题生成稳定 id，顺序不能变（同一次渲染里同一个标题必须拿到同一个 id）
function headingId(text, index) {
  return `h-${index}`
}

// MdCatalog 会在 scrollElement 上加滚动监听、并调用它的 querySelector，
// 所以必须传元素，不能传 window（会直接抛错）。
// 页面本身是 window 滚动的，documentElement 就是它的滚动元素。
function resolveScrollElement() {
  scrollElement.value = document.documentElement
}

onBeforeUnmount(() => {
  document.title = '算不尽的博客'
})

watch(
  article,
  current => {
    resolveScrollElement()
    document.title = current ? `${current.title} · 算不尽的博客` : '算不尽的博客'
    setMeta('description', current?.summary || '')
    setMeta('og:title', current?.title || '算不尽的博客', 'property')
    setMeta('og:description', current?.summary || '', 'property')
  },
  { immediate: true }
)

function setMeta(name, content, attr = 'name') {
  if (!content) return
  let tag = document.head.querySelector(`meta[${attr}="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<style scoped>
/* 正文宽度：改这一个数字就能调宽窄。
   1040px 下正文约 950px，一行约 55 个汉字；技术长文带公式和表格时这个宽度更合适。
   想收回紧凑阅读体验就写 780px。 */
.article-shell {
  --article-width: 1040px;
  --toc-width: 230px;
  --shell-gap: 44px;
  width: 100%;
  max-width: var(--article-width);
  margin: 0 auto;
}

.article-detail {
  width: 100%;
}

/* 没有目录（窄屏）时目录容器整个不显示 */
.article-toc {
  display: none;
}

/* 只有"目录 + 正文"能排下、两侧还留得下边距时才让目录出场。
   这样窄屏不会白留一列空白。:has() 不支持的浏览器会一直走单列，正文照样居中。 */
@media (min-width: 1460px) {
  .article-shell:has(.article-toc) {
    display: grid;
    /* 内容列锁死正文宽度，别让 grid 把正文拉宽 */
    grid-template-columns: var(--toc-width) minmax(0, var(--article-width));
    gap: var(--shell-gap);
    justify-content: center;
    max-width: none;
  }

  .article-toc {
    display: block;
    position: sticky;
    top: 88px;
    align-self: start;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    font-size: 13px;
    line-height: 1.7;
    padding-right: 4px;
  }
}

.toc-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  text-transform: uppercase;
  margin-bottom: 10px;
  padding-left: 12px;
}

/* MdCatalog 生成的目录链接 */
.article-toc :deep(.md-editor-catalog-link) {
  display: block;
  padding: 4px 0 4px 12px;
  border-left: 2px solid var(--border);
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.15s, border-color 0.15s;
}

.article-toc :deep(.md-editor-catalog-link:hover) {
  color: var(--accent);
}

.article-toc :deep(.md-editor-catalog-active > .md-editor-catalog-link) {
  color: var(--accent);
  border-left-color: var(--accent);
}

/* 三级标题往里缩一档 */
.article-toc :deep(.md-editor-catalog-link[data-level='3']) {
  padding-left: 24px;
}

/* 长标题在目录里换行，不要撑破侧栏 */
.article-toc :deep(span) {
  display: inline;
}

.article-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border);
}

.article-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: var(--heading);
  line-height: 1.3;
  margin-bottom: 16px;
}

.article-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: var(--text-secondary);
  flex-wrap: wrap;
}

.meta-category {
  background: var(--accent-bg);
  color: var(--accent);
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
}

/* 正文不再套独立的背景层。
   之前这里是米黄底 + 边框 + 阴影，等于在白底页面上贴了一张"纸"，
   正文和正文之外是两种颜色，怎么调都不协调。现在让它直接落在页面底色上，
   只保留左右内边距，避免文字紧贴容器边缘。 */
.paper {
  padding: 8px 24px 0;
}

.markdown-body {
  font-size: 17px;
  /* 中文正文行高 1.8 左右最舒服；2.0 在 17px 下显得散 */
  line-height: 1.85;
  color: var(--paper-text);
  /* 长串（URL、长公式、长标识符）不撑破正文 */
  overflow-wrap: break-word;
}

/* 长公式/长代码不撑破正文，只在必要时横向滚动 */
.markdown-body :deep(.katex-display) {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 0;
}

/* 行内公式跟中文之间留一点呼吸，避免挤在一起 */
.markdown-body :deep(.katex) {
  font-size: 1.02em;
}

/* md-editor-v3 预览样式覆盖 */
.markdown-body :deep(.md-editor-preview) {
  background: transparent;
}

.markdown-body :deep(h2) {
  font-size: 24px;
  margin: 48px 0 20px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--paper-border);
  color: var(--paper-heading);
  font-weight: 600;
}

.markdown-body :deep(h3) {
  font-size: 20px;
  margin: 36px 0 14px;
  color: var(--paper-heading);
  font-weight: 600;
}

.markdown-body :deep(p) {
  margin-bottom: 20px;
  /* 不要 text-align: justify。
     中文段落两端对齐后，遇到行内公式、英文术语、行内代码这些不可断开的片段，
     浏览器只能靠拉伸字间距把行撑满，行内会出现很明显的空洞。
     左对齐（默认）在混排场景下稳定得多。 */
  text-align: left;
  text-wrap: pretty;
}

.markdown-body :deep(pre) {
  background: var(--paper-code-bg);
  padding: 18px 22px;
  border-radius: 4px;
  border: 1px solid var(--paper-border);
  overflow-x: auto;
  margin: 20px 0;
}

.markdown-body :deep(code) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  color: var(--paper-text);
}

.markdown-body :deep(p code),
.markdown-body :deep(li code) {
  background: var(--paper-code-bg);
  padding: 2px 6px;
  border-radius: 3px;
}

.markdown-body :deep(blockquote) {
  border-left: 3px solid var(--paper-blockquote-border);
  background: var(--paper-blockquote-bg);
  padding: 14px 18px;
  color: var(--paper-secondary);
  margin: 20px 0;
  border-radius: 0 4px 4px 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin-bottom: 20px;
  padding-left: 28px;
}

.markdown-body :deep(li) {
  margin-bottom: 6px;
}

.markdown-body :deep(a) {
  color: var(--accent);
  border-bottom: 1px solid var(--accent);
}

.markdown-body :deep(a:hover) { opacity: 0.8; }

.markdown-body :deep(img) {
  border-radius: var(--radius);
  display: block;
  margin: 24px auto;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--paper-border);
  margin: 32px 0;
}

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--paper-border);
  padding: 10px 14px;
  text-align: left;
}

.markdown-body :deep(th) {
  background: var(--paper-code-bg);
  font-weight: 600;
}

.article-footer {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.back-link {
  font-size: 15px;
  color: var(--text-secondary);
  transition: color 0.15s;
}

.back-link:hover { color: var(--accent); }

@media (max-width: 767px) {
  .paper {
    padding: 8px 4px 0;
  }
  .article-header h1 { font-size: 24px; }
}

.loading, .error {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-secondary);
}
</style>
