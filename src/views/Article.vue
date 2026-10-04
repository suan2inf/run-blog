<template>
  <div class="article-page">
    <template v-if="article">
      <!-- 阅读进度条：页面最顶上一条细线 -->
      <div class="progress-bar" aria-hidden="true">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>

      <div class="article-layout">
        <article class="article">
          <header class="article-header">
            <h1>{{ article.title }}</h1>
            <p class="article-meta">
              <time :datetime="article.date">{{ formatDate(article.date) }}</time>
              <span aria-hidden="true">·</span>
              <span>约 {{ formatCount(article.wordCount) }} 字</span>
              <span aria-hidden="true">·</span>
              <span>{{ article.readTime }} 分钟读完</span>
              <template v-if="article.category">
                <span aria-hidden="true">·</span>
                <span>{{ article.category }}</span>
              </template>
            </p>
            <div class="article-tags" v-if="article.tags.length">
              <router-link
                v-for="tag in article.tags"
                :key="tag"
                :to="{ path: '/blog', query: { tag } }"
              >#{{ tag }}</router-link>
            </div>
          </header>

          <!-- 正文是构建时渲染好的 HTML（公式、代码高亮都已就绪），这里只负责放进来。
               标题锚点「#」和代码块「复制」按钮也在 HTML 里，点击统一在 onContentClick 处理。 -->
          <div class="markdown-body" ref="contentRef" v-html="html" @click="onContentClick"></div>

          <!-- 上一篇 / 下一篇 -->
          <nav class="prev-next" v-if="prevNext.prev || prevNext.next" aria-label="文章导航">
            <router-link
              v-if="prevNext.prev"
              class="pn-link"
              :to="`/article/${prevNext.prev.slug}`"
              @mouseenter="loadArticleContent(prevNext.prev.slug)"
              @focus="loadArticleContent(prevNext.prev.slug)"
            >
              <span class="pn-label">上一篇</span>
              <span class="pn-title">{{ prevNext.prev.title }}</span>
            </router-link>
            <span v-else aria-hidden="true"></span>
            <router-link
              v-if="prevNext.next"
              class="pn-link next"
              :to="`/article/${prevNext.next.slug}`"
              @mouseenter="loadArticleContent(prevNext.next.slug)"
              @focus="loadArticleContent(prevNext.next.slug)"
            >
              <span class="pn-label">下一篇</span>
              <span class="pn-title">{{ prevNext.next.title }}</span>
            </router-link>
          </nav>

          <div class="article-footer">
            <router-link to="/blog">← 全部文章</router-link>
            <a
              :href="`${REPO_URL}/edit/main/content/articles/${article.slug}.md`"
              target="_blank"
              rel="noopener noreferrer"
            >在 GitHub 上编辑此页</a>
          </div>
        </article>

        <!-- 宽屏：目录放在正文右侧的留白里，正文位置和其他页面完全一致 -->
        <aside class="article-toc" v-if="toc.length" aria-label="文章目录">
          <p class="toc-title">目录</p>
          <ArticleToc :items="toc" :activeId="activeId" @navigate="goToHeading" />
        </aside>
      </div>

      <!-- 浮动按钮：回到顶部（全宽度）+ 目录（仅窄屏，宽屏有侧栏目录） -->
      <div class="float-actions">
        <button
          v-if="toc.length"
          type="button"
          class="fab toc-fab"
          @click="tocOpen = true"
          aria-label="打开文章目录"
          title="目录"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4.5" cy="6" r="1.3" fill="currentColor" stroke="none" />
            <circle cx="4.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
            <circle cx="4.5" cy="18" r="1.3" fill="currentColor" stroke="none" />
          </svg>
        </button>
        <button
          type="button"
          class="fab top-fab"
          :class="{ show: showTopFab }"
          @click="scrollToTop"
          aria-label="回到顶部"
          title="回到顶部"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 19V5" />
            <path d="M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>

      <!-- 窄屏目录抽屉。Teleport 到 body 避免被外壳的布局影响定位；
           只在浏览器里挂载（预渲染时没有 body 可传送，也不需要） -->
      <Teleport to="body" v-if="mounted">
        <div class="toc-overlay" v-if="tocOpen" @click="tocOpen = false"></div>
        <div class="toc-drawer" v-if="tocOpen" role="dialog" aria-modal="true" aria-label="文章目录">
          <div class="toc-drawer-head">
            <span>目录</span>
            <button type="button" class="toc-close" @click="tocOpen = false" aria-label="关闭目录">×</button>
          </div>
          <div class="toc-drawer-body">
            <ArticleToc :items="toc" :activeId="activeId" @navigate="onDrawerNavigate" />
          </div>
        </div>
      </Teleport>
    </template>

    <div class="container not-found" v-else>
      <h1 class="page-title">文章不存在</h1>
      <p>链接可能打错了，或者文章已经改名。</p>
      <router-link to="/blog">← 全部文章</router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArticle, getArticleContent, getPrevNext, loadArticleContent } from '../data/articles'
import { formatCount, formatDate } from '../utils/format'
import { REPO_URL } from '../site'
import ArticleToc from '../components/ArticleToc.vue'
// 公式已经在构建时渲染成 HTML，浏览器这边只需要 KaTeX 的样式和字体（字体用到才下载）
import 'katex/dist/katex.min.css'

const route = useRoute()
const router = useRouter()
const contentRef = ref(null)
const mounted = ref(false)

// 元数据在构建时内嵌；正文由路由守卫在进入页面前加载好，这里同步读
const article = computed(() => getArticle(route.params.slug))
const prevNext = computed(() => getPrevNext(route.params.slug))
const content = computed(() => getArticleContent(route.params.slug))
const html = computed(() => content.value?.html || '')
const toc = computed(() => content.value?.toc || [])

// --- 阅读进度条 & 回到顶部 & 当前小节高亮 ---
const progress = ref(0)
const showTopFab = ref(false)
const activeId = ref('')
let scrollTicking = false

function updateProgress() {
  const doc = document.documentElement
  const total = doc.scrollHeight - doc.clientHeight
  progress.value = total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0
}

/** 当前小节 = 最后一个已经滚到视口顶部附近的标题。 */
function updateActiveHeading() {
  let current = ''
  for (const item of toc.value) {
    const el = document.getElementById(item.id)
    if (!el) continue
    if (el.getBoundingClientRect().top <= 48) current = item.id
    else break
  }
  activeId.value = current || toc.value[0]?.id || ''
}

function onScroll() {
  showTopFab.value = window.scrollY > 400
  if (scrollTicking) return
  scrollTicking = true
  requestAnimationFrame(() => {
    updateProgress()
    updateActiveHeading()
    scrollTicking = false
  })
}

function scrollToTop() {
  // 不传 behavior，跟随 CSS 的 scroll-behavior（已在 reduced-motion 时自动关闭平滑）
  window.scrollTo({ top: 0 })
}

// --- 目录跳转 ---
function goToHeading(id) {
  const el = document.getElementById(id)
  if (!el) return
  // 地址栏同步成 #小节（replace，不新增历史记录；同页改 hash 不会触发路由滚动）
  router.replace({ query: route.query, hash: `#${id}` })
  // 标题上方的留白由全局样式的 scroll-margin-top 控制
  el.scrollIntoView({ block: 'start' })
}

// --- 窄屏目录抽屉 ---
const tocOpen = ref(false)

function onDrawerNavigate(id) {
  // 先同步恢复 body 滚动，否则紧接着的跳转滚动会被 overflow:hidden 挡掉
  document.body.style.overflow = ''
  tocOpen.value = false
  goToHeading(id)
}

watch(tocOpen, open => {
  document.body.style.overflow = open ? 'hidden' : ''
})

function onKeydown(event) {
  if (event.key === 'Escape') tocOpen.value = false
}

// 切换文章：关掉抽屉、重算进度和当前小节（内容高度变了）
watch(
  () => route.params.slug,
  () => {
    tocOpen.value = false
    nextTick(() => {
      updateProgress()
      updateActiveHeading()
    })
  }
)

onMounted(() => {
  mounted.value = true
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKeydown)
  updateProgress()
  updateActiveHeading()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})

/* ---------- 正文里的交互（事件委托，正文 HTML 是构建时生成的） ---------- */
function onContentClick(event) {
  const anchor = event.target.closest?.('.heading-anchor')
  if (anchor) {
    event.preventDefault()
    shareHeading(anchor)
    return
  }
  const copyButton = event.target.closest?.('.code-copy')
  if (copyButton) copyCode(copyButton)
}

/** 标题锚点：跳到这一节，并把本节链接复制到剪贴板。 */
async function shareHeading(anchor) {
  const id = anchor.getAttribute('href').slice(1)
  goToHeading(id)
  const url = new URL(router.resolve({ path: route.path, hash: `#${id}` }).href, location.origin).href
  flash(anchor, await copyText(url), { ok: '✓', fail: '×', idle: '#' })
}

async function copyCode(button) {
  const code = button.parentElement?.querySelector('pre code')?.textContent ?? ''
  flash(button, await copyText(code), { ok: '已复制', fail: '复制失败', idle: '复制' })
}

/** 按钮上 1.2 秒的成功/失败反馈。 */
function flash(el, ok, labels) {
  el.textContent = ok ? labels.ok : labels.fail
  el.classList.add(ok ? 'copied' : 'copy-failed')
  setTimeout(() => {
    el.textContent = labels.idle
    el.classList.remove('copied', 'copy-failed')
  }, 1200)
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // clipboard API 要安全上下文或授权，失败走 execCommand 兜底
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const ok = document.execCommand('copy')
      textarea.remove()
      return ok
    } catch {
      return false
    }
  }
}
</script>

<style scoped>
/* ---------- 布局 ----------
   正文列和导航、首页用同一个宽度（--site-width），左边缘对齐。
   屏幕够宽时用三列 grid：两侧等宽留白，目录放在右侧留白里，正文位置不因目录而偏移。 */
.article-layout {
  max-width: var(--site-width);
  margin: 0 auto;
  padding: 0 var(--gutter);
}

.article-toc {
  display: none;
}

@media (min-width: 1480px) {
  .article-layout {
    display: grid;
    grid-template-columns: 1fr minmax(0, calc(var(--site-width) - 2 * var(--gutter))) 1fr;
    max-width: none;
  }

  .article {
    grid-column: 2;
    grid-row: 1;
  }

  .article-toc {
    display: block;
    grid-column: 3;
    grid-row: 1;
    position: sticky;
    top: 32px;
    align-self: start;
    /* 初始位置和正文第一节大致齐平；吸住以后离顶部 32px */
    margin-top: 196px;
    max-width: 280px;
    max-height: calc(100vh - 64px);
    overflow-y: auto;
    padding: 0 16px 0 40px;
    font-size: 13.5px;
    line-height: 1.6;
  }
}

.toc-title {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 8px;
}

/* 阅读进度条 */
.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  z-index: 110;
  pointer-events: none;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.1s linear;
}

/* ---------- 文章头 ---------- */
.article-header {
  padding: 40px 0 28px;
  margin-bottom: 36px;
  border-bottom: 1px solid var(--border);
}

.article-header h1 {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: -0.005em;
  color: var(--heading);
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
  font-size: 14px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 10px;
  font-size: 14px;
}

.article-tags a {
  color: var(--muted);
  transition: color 0.15s;
}

.article-tags a:hover {
  color: var(--accent);
}

/* ---------- 正文排版 ---------- */
.markdown-body {
  font-size: 17px;
  /* 中文正文行高 1.8 左右最舒服；2.0 在 17px 下显得散 */
  line-height: 1.85;
  color: var(--text);
  /* 长串（URL、长公式、长标识符）不撑破正文 */
  overflow-wrap: break-word;
}

/* 正文第一个元素（通常是 h2）不要再叠一层上边距，头部已经有分隔线和间距了 */
.markdown-body > :deep(:first-child) {
  margin-top: 0;
}

.markdown-body :deep(p) {
  margin-bottom: 1.15em;
  /* 不要 text-align: justify：中文混排行内公式、英文术语时两端对齐会拉出明显空洞 */
  text-wrap: pretty;
}

.markdown-body :deep(h2) {
  font-size: 23px;
  font-weight: 700;
  line-height: 1.4;
  margin: 2.2em 0 0.8em;
  color: var(--heading);
}

.markdown-body :deep(h3) {
  font-size: 19px;
  font-weight: 650;
  line-height: 1.45;
  margin: 1.9em 0 0.6em;
  color: var(--heading);
}

.markdown-body :deep(h4) {
  font-size: 17px;
  font-weight: 650;
  margin: 1.6em 0 0.5em;
  color: var(--heading);
}

.markdown-body :deep(strong) {
  font-weight: 650;
  color: var(--heading);
}

.markdown-body :deep(a) {
  color: var(--accent);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  text-decoration-color: color-mix(in srgb, var(--accent) 45%, transparent);
  transition: text-decoration-color 0.15s;
}

.markdown-body :deep(a:hover) {
  text-decoration-color: var(--accent);
}

/* 站外链接的小箭头标识（构建时加的 class） */
.markdown-body :deep(a.external-link)::after {
  content: '↗';
  display: inline-block;
  font-size: 0.72em;
  margin-left: 2px;
  opacity: 0.7;
  text-decoration: none;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin-bottom: 1.15em;
  padding-left: 1.6em;
}

.markdown-body :deep(li) {
  margin-bottom: 0.35em;
}

.markdown-body :deep(li::marker) {
  color: var(--muted);
}

.markdown-body :deep(li > ul),
.markdown-body :deep(li > ol) {
  margin: 0.35em 0 0;
}

.markdown-body :deep(blockquote) {
  margin: 1.4em 0;
  padding: 2px 0 2px 18px;
  border-left: 3px solid var(--border);
  color: var(--muted);
}

.markdown-body :deep(blockquote > :last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--border);
  margin: 2.4em 0;
}

.markdown-body :deep(img) {
  display: block;
  height: auto;
  margin: 1.6em auto;
  border-radius: var(--radius);
}

/* 公式：长公式只在必要时横向滚动 */
.markdown-body :deep(.katex-display) {
  margin: 1.3em 0;
  padding: 4px 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.markdown-body :deep(.katex) {
  font-size: 1.04em;
}

/* 表格外层负责横向滚动，表格本身保持 table 语义 */
.markdown-body :deep(.table-wrap) {
  margin: 1.4em 0;
  overflow-x: auto;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  font-size: 15px;
  line-height: 1.6;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  padding: 9px 14px;
  border: 1px solid var(--border);
  text-align: left;
}

.markdown-body :deep(th) {
  background: var(--surface);
  font-weight: 600;
  color: var(--heading);
}

/* ---------- 代码 ---------- */
.markdown-body :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.86em;
}

/* 行内代码（代码块里的 code 不吃这套底色） */
.markdown-body :deep(:not(pre) > code) {
  padding: 0.15em 0.4em;
  border-radius: 4px;
  background: var(--surface);
  color: var(--heading);
}

.markdown-body :deep(.code-block) {
  position: relative;
  margin: 1.4em 0;
}

.markdown-body :deep(pre) {
  padding: 16px 20px;
  border-radius: var(--radius);
  background: var(--surface);
  overflow-x: auto;
  font-size: 15px;
  line-height: 1.65;
}

/* Shiki 双主题：每个 token 带着亮/暗两套颜色变量，跟随站点主题切换 */
.markdown-body :deep(.shiki),
.markdown-body :deep(.shiki span) {
  color: var(--shiki-light, var(--text));
}

[data-theme='dark'] .markdown-body :deep(.shiki),
[data-theme='dark'] .markdown-body :deep(.shiki span) {
  color: var(--shiki-dark, var(--text));
}

/* 右上角：平时显示语言名，悬停/聚焦时换成「复制」按钮 */
.markdown-body :deep(.code-block[data-lang])::before {
  content: attr(data-lang);
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--muted);
  pointer-events: none;
  transition: opacity 0.15s;
}

.markdown-body :deep(.code-copy) {
  position: absolute;
  top: 6px;
  right: 8px;
  z-index: 1;
  padding: 1px 9px;
  font-size: 12px;
  color: var(--muted);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
}

.markdown-body :deep(.code-block:hover .code-copy),
.markdown-body :deep(.code-copy:focus-visible),
.markdown-body :deep(.code-copy.copied),
.markdown-body :deep(.code-copy.copy-failed) {
  opacity: 1;
}

.markdown-body :deep(.code-block:hover)::before {
  opacity: 0;
}

.markdown-body :deep(.code-copy:hover) {
  color: var(--heading);
}

.markdown-body :deep(.code-copy.copied) {
  color: #15803d;
}

.markdown-body :deep(.code-copy.copy-failed) {
  color: #b91c1c;
}

/* 触屏设备没有悬停，复制按钮常驻 */
@media (hover: none) {
  .markdown-body :deep(.code-copy) {
    opacity: 1;
  }

  .markdown-body :deep(.code-block[data-lang])::before {
    display: none;
  }
}

/* ---------- 标题锚点：挂在标题左外侧，悬停标题才露面 ---------- */
.markdown-body :deep(:is(h1, h2, h3, h4, h5, h6)) {
  position: relative;
}

.markdown-body :deep(a.heading-anchor) {
  /* 只在 ≥1200px 的宽屏启用：按钮挂在标题左外侧的留白里，窄屏没有这块地方 */
  display: none;
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  padding: 2px 8px;
  font-size: 0.8em;
  line-height: 1;
  color: var(--muted);
  text-decoration: none;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
}

@media (min-width: 1200px) {
  .markdown-body :deep(a.heading-anchor) {
    display: block;
  }
}

.markdown-body :deep(:is(h1, h2, h3, h4, h5, h6):hover a.heading-anchor),
.markdown-body :deep(a.heading-anchor:focus-visible) {
  opacity: 1;
}

.markdown-body :deep(a.heading-anchor:hover) {
  color: var(--accent);
}

.markdown-body :deep(a.heading-anchor.copied) {
  opacity: 1;
  color: #15803d;
}

.markdown-body :deep(a.heading-anchor.copy-failed) {
  opacity: 1;
  color: #b91c1c;
}

/* ---------- 上一篇 / 下一篇 ---------- */
.prev-next {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 64px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.pn-link {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.pn-link.next {
  text-align: right;
}

.pn-label {
  font-size: 13px;
  color: var(--muted);
}

.pn-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--heading);
  transition: color 0.15s;
}

.pn-link:hover .pn-title {
  color: var(--accent);
}

.article-footer {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 40px;
  font-size: 14px;
}

.article-footer a {
  color: var(--muted);
  transition: color 0.15s;
}

.article-footer a:hover {
  color: var(--accent);
}

/* ---------- 浮动按钮 ---------- */
.float-actions {
  position: fixed;
  right: 24px;
  bottom: 28px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 90;
}

.fab {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--bg);
  color: var(--muted);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: color 0.15s, opacity 0.2s, transform 0.2s;
}

.fab:hover {
  color: var(--heading);
}

/* 没滚动一段距离之前不显示「回到顶部」 */
.top-fab {
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
}

.top-fab.show {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}

/* 宽屏有侧栏目录，目录浮动按钮只在窄屏出现（断点和侧栏目录一致） */
@media (min-width: 1480px) {
  .toc-fab {
    display: none;
  }
}

/* ---------- 窄屏目录抽屉（Teleport 到 body，scoped 样式仍然生效） ---------- */
.toc-overlay {
  position: fixed;
  inset: 0;
  z-index: 140;
  background: rgba(0, 0, 0, 0.32);
  animation: toc-fade-in 0.2s ease;
}

.toc-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(320px, 85vw);
  z-index: 150;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  border-left: 1px solid var(--border);
  animation: toc-slide-in 0.22s ease;
}

.toc-drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  font-size: 15px;
  font-weight: 600;
  color: var(--heading);
}

.toc-close {
  padding: 0 4px;
  border: none;
  background: none;
  font-size: 24px;
  line-height: 1;
  color: var(--muted);
  cursor: pointer;
}

.toc-close:hover {
  color: var(--heading);
}

.toc-drawer-body {
  overflow-y: auto;
  padding: 14px 20px 24px;
  font-size: 14px;
  line-height: 1.65;
}

@keyframes toc-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes toc-slide-in {
  from { transform: translateX(100%); }
  to { transform: none; }
}

/* ---------- 窄屏 ---------- */
@media (max-width: 640px) {
  .article-header {
    padding-top: 24px;
  }

  .article-header h1 {
    font-size: 25px;
  }

  .markdown-body {
    font-size: 16px;
  }

  .markdown-body :deep(h2) {
    font-size: 21px;
  }

  .markdown-body :deep(h3) {
    font-size: 18px;
  }

  .markdown-body :deep(pre) {
    padding: 14px 16px;
    font-size: 14px;
  }

  .prev-next {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .pn-link.next {
    text-align: left;
  }

  .float-actions {
    right: 16px;
    bottom: 20px;
  }
}

.not-found {
  padding-top: 72px;
  color: var(--muted);
}

.not-found p {
  margin: 12px 0 20px;
}

.not-found a {
  color: var(--accent);
}
</style>
