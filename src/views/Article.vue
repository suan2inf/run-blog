<template>
  <div class="article-shell" ref="shellRef">
    <template v-if="article">
      <!-- 阅读进度条：压在导航栏上面，宽屏窄屏都有 -->
      <div class="progress-bar" aria-hidden="true">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>

      <aside class="article-toc" aria-label="文章目录">
        <p class="toc-title">目录</p>
        <MdCatalog
          :editorId="EDITOR_ID"
          :scrollElement="scrollElement"
          :mdHeadingId="headingId"
          :catalogMaxDepth="3"
          :offsetTop="88"
          :scrollElementOffsetTop="80"
          :theme="theme"
        />
      </aside>

      <article class="article-detail">
        <header class="article-header">
          <h1>{{ article.title }}</h1>
          <div class="article-meta">
            <time :datetime="article.date">{{ formatDate(article.date) }}</time>
            <span>约 {{ formatCount(article.wordCount) }} 字</span>
            <span>{{ article.readTime }} 分钟读完</span>
            <span v-if="article.category" class="meta-category">{{ article.category }}</span>
          </div>
          <div class="article-tags" v-if="article.tags.length">
            <router-link
              v-for="tag in article.tags"
              :key="tag"
              class="article-tag"
              :to="{ path: '/blog', query: { tag } }"
            >#{{ tag }}</router-link>
          </div>
        </header>
        <div class="paper">
          <div class="markdown-body">
            <MdPreview
              :id="EDITOR_ID"
              :modelValue="articleContent"
              :mdHeadingId="headingId"
              :theme="theme"
              :showCodeRowNumber="true"
              @onHtmlChanged="onRendered"
            />
          </div>
        </div>

        <!-- 上一篇 / 下一篇 -->
        <nav class="prev-next" v-if="prevNext.prev || prevNext.next" aria-label="文章导航">
          <router-link
            v-if="prevNext.prev"
            class="pn-card"
            :to="`/article/${prevNext.prev.slug}`"
            @mouseenter="loadArticleContent(prevNext.prev.slug)"
          >
            <span class="pn-label">← 上一篇</span>
            <span class="pn-title">{{ prevNext.prev.title }}</span>
          </router-link>
          <span v-else class="pn-spacer" aria-hidden="true"></span>
          <router-link
            v-if="prevNext.next"
            class="pn-card next"
            :to="`/article/${prevNext.next.slug}`"
            @mouseenter="loadArticleContent(prevNext.next.slug)"
          >
            <span class="pn-label">下一篇 →</span>
            <span class="pn-title">{{ prevNext.next.title }}</span>
          </router-link>
        </nav>

        <div class="article-footer">
          <router-link to="/blog" class="back-link">← 返回文章列表</router-link>
          <a
            class="edit-link"
            :href="`https://github.com/suan2inf/run-blog/edit/main/content/articles/${article.slug}.md`"
            target="_blank"
            rel="noopener noreferrer"
          >在 GitHub 上编辑此页 ↗</a>
        </div>
      </article>

      <!-- 浮动按钮：回到顶部（全宽度）+ 目录（仅窄屏，宽屏有侧栏目录） -->
      <div class="float-actions">
        <button class="fab toc-fab" @click="tocOpen = true" aria-label="打开文章目录" title="目录">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4.5" cy="6" r="1.3" fill="currentColor" stroke="none" />
            <circle cx="4.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
            <circle cx="4.5" cy="18" r="1.3" fill="currentColor" stroke="none" />
          </svg>
        </button>
        <button
          class="fab top-fab"
          :class="{ show: showTopFab }"
          @click="scrollToTop"
          aria-label="回到顶部"
          title="回到顶部"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 19V5" />
            <path d="M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>

      <!-- 窄屏目录抽屉。Teleport 到 body 避免被外壳的布局/grid 影响定位。
           v-if 按需挂载：MdCatalog 挂载时会主动向预览组件要一次目录数据，晚挂载也能拿到 -->
      <Teleport to="body">
        <div class="toc-overlay" v-if="tocOpen" @click="tocOpen = false"></div>
        <div class="toc-drawer" v-if="tocOpen" role="dialog" aria-modal="true" aria-label="文章目录">
          <div class="toc-drawer-head">
            <span>目录</span>
            <button class="toc-close" @click="tocOpen = false" aria-label="关闭目录">×</button>
          </div>
          <div class="toc-drawer-body">
            <MdCatalog
              :editorId="EDITOR_ID"
              :scrollElement="scrollElement"
              :mdHeadingId="headingId"
              :catalogMaxDepth="3"
              :offsetTop="88"
              :scrollElementOffsetTop="80"
              :theme="theme"
              :onClick="onDrawerCatalogClick"
            />
          </div>
        </div>
      </Teleport>
    </template>

    <div class="error" v-else>
      <p>文章不存在</p>
      <router-link to="/blog" class="back-link">← 返回文章列表</router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArticle, getPrevNext, loadArticleContent } from '../data/articles'
import { formatCount, formatDate } from '../utils/format'
import { useTheme } from '../composables/useTheme'
import { MdPreview, MdCatalog } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'

// MdPreview 和 MdCatalog 靠这个 id 配对；没有它目录不会渲染
const EDITOR_ID = 'article-preview'

const route = useRoute()
const router = useRouter()
const shellRef = ref(null)
const scrollElement = ref()

// 当前主题，传给 MdPreview / MdCatalog（不然暗色模式下代码块还是亮色高亮）
const theme = useTheme()

// 元数据在构建时内嵌，同步按 slug 查表即可；正文是独立 chunk，按需异步拉取
const article = computed(() => getArticle(route.params.slug))
const prevNext = computed(() => getPrevNext(route.params.slug))
const articleContent = ref('')

watch(
  () => route.params.slug,
  async slug => {
    articleContent.value = ''
    if (!getArticle(slug)) return
    const content = await loadArticleContent(slug)
    // 等待 chunk 的间隙用户可能又点了别的文章，别把旧内容填进来
    if (route.params.slug === slug) articleContent.value = content
  },
  { immediate: true }
)

// --- 阅读进度条 & 回到顶部 ---
const progress = ref(0)
const showTopFab = ref(false)
let scrollTicking = false

function updateProgress() {
  const doc = document.documentElement
  const total = doc.scrollHeight - doc.clientHeight
  progress.value = total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0
}

function onScroll() {
  showTopFab.value = window.scrollY > 400
  if (!scrollTicking) {
    scrollTicking = true
    requestAnimationFrame(() => {
      updateProgress()
      scrollTicking = false
    })
  }
}

function scrollToTop() {
  // 不传 behavior，跟随 CSS 的 scroll-behavior（已在 reduced-motion 时自动关闭平滑）
  window.scrollTo({ top: 0 })
}

// --- 窄屏目录抽屉 ---
const tocOpen = ref(false)

function onDrawerCatalogClick() {
  // 先同步恢复 body 滚动：目录点击的跳转滚动紧随其后执行，
  // 如果等 Vue 下一拍重渲染再恢复，滚动会被 overflow:hidden 挡掉
  document.body.style.overflow = ''
  tocOpen.value = false
}

watch(tocOpen, open => {
  document.body.style.overflow = open ? 'hidden' : ''
})

function onKeydown(event) {
  if (event.key === 'Escape') tocOpen.value = false
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKeydown)
  updateProgress()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})

// 给标题生成稳定 id。
// 注意：不能依赖回调里的 index，库里传的是"已渲染标题数组的长度"，
// 只要有一个标题被跳过，后面所有序号就整体错位——目录里链接指向 #h-5，
// 而 DOM 上实际是 #h-6，getElementById 查不到，表现为"只有前几个能跳"。
// 改成完全由标题文本推导，同文本必然同 id，跟渲染顺序和次数都无关。
function headingId({ text }) {
  const raw = String(text ?? '').trim()
  const slug = raw
    .toLowerCase()
    .replace(/[^\w一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (slug) {
    // 纯数字开头时（"1 半自回归生成" → "1-半自回归生成"）加个前缀，
    // 免得 id 以数字打头——那样 getElementById 能查到，但当 CSS 选择器是非法的
    return /^[0-9]/.test(slug) ? `s-${slug}` : slug
  }
  // 全是标点/数学符号时退化成文本的哈希，仍然是确定性的
  let hash = 0
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) | 0
  }
  return `h-${(hash >>> 0).toString(36)}`
}

// MdCatalog 会在 scrollElement 上加滚动监听、并调用它的 querySelector，
// 所以必须传元素，不能传 window（会直接抛错）。
// 页面本身是 window 滚动的，documentElement 就是它的滚动元素。
function resolveScrollElement() {
  scrollElement.value = document.documentElement
}

watch(
  article,
  current => {
    resolveScrollElement()
    // 切换文章时关掉抽屉目录
    tocOpen.value = false
    document.title = current ? `${current.title} · 算不尽的博客` : '算不尽的博客'
    setMeta('description', current?.summary || '')
    setMeta('og:title', current?.title || '算不尽的博客', 'property')
    setMeta('og:description', current?.summary || '', 'property')
    // 换文章后重新算一次进度（内容高度变了）
    requestAnimationFrame(updateProgress)
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

/* ---------- 渲染后处理：标题锚点 + 外链新窗口 ----------

   MdPreview 每次渲染完（含切换文章、换主题重渲染）都会触发 onHtmlChanged，
   在这里统一做 DOM 增强。处理过的元素打 data 标记，重复触发不会重复加工。
*/
function onRendered() {
  nextTick(() => {
    const root = shellRef.value
    if (!root) return
    enhanceExternalLinks(root)
    enhanceHeadings(root)
    scrollToQueryHeading()
  })
}

/** 正文里的站外链接一律新窗口打开，并加 rel 防 window.opener 反钓。 */
function enhanceExternalLinks(root) {
  for (const link of root.querySelectorAll('.markdown-body a[href^="http"]')) {
    if (link.dataset.enhanced) continue
    link.dataset.enhanced = '1'
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.classList.add('external-link')
  }
}

/**
 * 标题锚点：hover 标题出现 # 按钮，点击把「这一节的链接」复制到剪贴板，
 * 同时写进地址栏（?h=标题id），别人打开链接会直接定位到这一节。
 *
 * 注意不能做成 <a href="#id">：路由是 hash 模式，# 后面是路由的地盘，
 * 真锚点会把路由搞坏，所以分享链接用查询参数带。
 */
function enhanceHeadings(root) {
  for (const heading of root.querySelectorAll('.markdown-body [id]')) {
    if (!/^H[1-6]$/.test(heading.tagName)) continue
    if (heading.querySelector('.heading-anchor')) continue

    const anchor = document.createElement('button')
    anchor.type = 'button'
    anchor.className = 'heading-anchor'
    anchor.textContent = '#'
    anchor.title = '复制本节链接'
    anchor.setAttribute('aria-label', `复制「${heading.textContent}」这一节的链接`)
    anchor.addEventListener('click', () => shareHeading(heading.id, anchor))
    heading.prepend(anchor)
  }
}

async function shareHeading(id, anchor) {
  // 地址栏同步出可分享的链接（replace，不新增历史记录；同页 query 变化不会触发滚动）
  router.replace({ query: { ...route.query, h: id } })

  const url = `${location.origin}${location.pathname}#/article/${route.params.slug}?h=${id}`
  const ok = await copyText(url)

  // 复制成功/失败都在按钮上给个 1.2 秒的反馈
  anchor.textContent = ok ? '✓' : '×'
  anchor.classList.add(ok ? 'copied' : 'copy-failed')
  setTimeout(() => {
    anchor.textContent = '#'
    anchor.classList.remove('copied', 'copy-failed')
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

/** 打开带 ?h= 的分享链接时，渲染完成后滚到对应标题（减去吸顶导航的高度）。 */
let scrolledForHeading = ''

function scrollToQueryHeading() {
  const id = route.query.h
  if (!id || !shellRef.value) return
  // 每次定位只滚一次：切换主题会触发重渲染，没有这句会把读者拽回锚点处
  const key = `${route.params.slug}#${id}`
  if (scrolledForHeading === key) return
  const el = shellRef.value.querySelector(`#${CSS.escape(String(id))}`)
  if (!el) return
  scrolledForHeading = key
  const top = el.getBoundingClientRect().top + window.scrollY - 80
  window.scrollTo({ top })
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

/* 阅读进度条 */
.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  /* 压在吸顶导航（z-index: 100）上面 */
  z-index: 110;
  background: transparent;
  pointer-events: none;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-soft));
  border-radius: 0 2px 2px 0;
  transition: width 0.1s linear;
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

/* MdCatalog 生成的目录链接（侧栏和窄屏抽屉共用这一套） */
.article-toc :deep(.md-editor-catalog-link),
.toc-drawer :deep(.md-editor-catalog-link) {
  display: block;
  padding: 4px 0 4px 12px;
  border-left: 2px solid var(--border);
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.15s, border-color 0.15s;
}

.article-toc :deep(.md-editor-catalog-link:hover),
.toc-drawer :deep(.md-editor-catalog-link:hover) {
  color: var(--accent);
}

.article-toc :deep(.md-editor-catalog-active > .md-editor-catalog-link),
.toc-drawer :deep(.md-editor-catalog-active > .md-editor-catalog-link) {
  color: var(--accent);
  border-left-color: var(--accent);
}

/* 三级标题往里缩一档 */
.article-toc :deep(.md-editor-catalog-link[data-level='3']),
.toc-drawer :deep(.md-editor-catalog-link[data-level='3']) {
  padding-left: 24px;
}

/* 长标题在目录里换行，不要撑破侧栏 */
.article-toc :deep(span),
.toc-drawer :deep(span) {
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
  font-size: 13.5px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  flex-wrap: wrap;
  align-items: center;
}

.meta-category {
  background: var(--accent-bg);
  color: var(--accent);
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.article-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
}

.article-tag {
  font-size: 13px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border-radius: 4px;
  padding: 3px 10px;
  transition: color 0.15s, background 0.15s;
}

.article-tag:hover {
  color: var(--accent);
  background: var(--accent-bg);
}

/* 正文不再套独立的背景层。
   之前这里是米黄底 + 边框 + 阴影，等于在白底页面上贴了一张"纸"，
   正文和正文之外是两种颜色，怎么调都不协调。现在让它直接落在页面底色上，
   只保留左右内边距，避免文字紧贴容器边缘。 */
.paper {
  padding: 8px 24px 0;
  /* 正文 chunk 是异步拉的（通常几十毫秒），先撑个高度防止标题/页脚跳动 */
  min-height: 40vh;
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
  padding-left: 14px;
  color: var(--paper-heading);
  font-weight: 600;
}

/* h2 左侧的品牌色短竖线（和全站标题记号一致），长文里扫读定位更快 */
.markdown-body :deep(h2)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.18em;
  bottom: 0.18em;
  width: 4px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--accent), var(--accent-soft));
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

/* 站外链接的小箭头标识（由渲染后处理加 class） */
.markdown-body :deep(a.external-link)::after {
  content: '↗';
  font-size: 0.75em;
  margin-left: 2px;
  opacity: 0.6;
}

/* 标题锚点按钮：藏在标题左外侧，hover 标题才露面 */
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  position: relative;
}

.markdown-body :deep(.heading-anchor) {
  /* 默认不显示，只在 ≥1200px 的宽屏启用：
     按钮挂在标题左外侧的空白里，窄屏没有这块 gutter，挂出去会造成横向溢出 */
  display: none;
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-right: 4px;
  border: none;
  background: none;
  padding: 2px 4px;
  font-size: 0.85em;
  line-height: 1;
  color: var(--accent);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
}

@media (min-width: 1200px) {
  .markdown-body :deep(.heading-anchor) {
    display: block;
  }
}

.markdown-body :deep(h1:hover .heading-anchor),
.markdown-body :deep(h2:hover .heading-anchor),
.markdown-body :deep(h3:hover .heading-anchor),
.markdown-body :deep(h4:hover .heading-anchor),
.markdown-body :deep(h5:hover .heading-anchor),
.markdown-body :deep(h6:hover .heading-anchor),
.markdown-body :deep(.heading-anchor:focus-visible) {
  opacity: 0.9;
}

.markdown-body :deep(.heading-anchor.copied) {
  opacity: 0.9;
  color: #16a34a;
}

.markdown-body :deep(.heading-anchor.copy-failed) {
  opacity: 0.9;
  color: #dc2626;
}

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
  display: block;
  overflow-x: auto;
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

/* 上一篇 / 下一篇 */
.prev-next {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 56px;
}

.pn-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: border-color 0.15s, box-shadow 0.15s;
  min-width: 0;
}

.pn-card:hover {
  border-color: var(--accent);
  box-shadow: var(--card-hover-shadow);
}

.pn-card.next {
  text-align: right;
}

.pn-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.pn-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--heading);
  line-height: 1.5;
  /* 长标题最多两行 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.15s;
}

.pn-card:hover .pn-title {
  color: var(--accent);
}

.article-footer {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.back-link,
.edit-link {
  font-size: 15px;
  color: var(--text-secondary);
  transition: color 0.15s;
}

.back-link:hover,
.edit-link:hover { color: var(--accent); }

/* 浮动按钮 */
.float-actions {
  position: fixed;
  right: 24px;
  bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 90;
}

.fab {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--card-shadow);
  transition: color 0.15s, border-color 0.15s, box-shadow 0.15s, opacity 0.2s, transform 0.2s;
}

.fab:hover {
  color: var(--accent);
  border-color: var(--accent);
  box-shadow: var(--card-hover-shadow);
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
@media (min-width: 1460px) {
  .toc-fab {
    display: none;
  }
}

/* 窄屏目录抽屉（Teleport 到 body，scoped 样式仍然生效） */
.toc-overlay {
  position: fixed;
  inset: 0;
  z-index: 140;
  background: rgba(0, 0, 0, 0.4);
  animation: toc-fade-in 0.2s ease;
}

.toc-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(320px, 85vw);
  z-index: 150;
  background: var(--bg);
  border-left: 1px solid var(--border);
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  animation: toc-slide-in 0.25s ease;
}

.toc-drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  font-size: 15px;
  font-weight: 600;
  color: var(--heading);
  flex-shrink: 0;
}

.toc-close {
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0 4px;
  transition: color 0.15s;
}

.toc-close:hover {
  color: var(--accent);
}

.toc-drawer-body {
  overflow-y: auto;
  padding: 12px 20px 24px;
  font-size: 14px;
  line-height: 1.7;
}

@keyframes toc-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes toc-slide-in {
  from { transform: translateX(100%); }
  to { transform: none; }
}

@media (max-width: 767px) {
  .paper {
    padding: 8px 4px 0;
  }
  .article-header h1 { font-size: 24px; }
  .prev-next { grid-template-columns: 1fr; }
  .pn-spacer { display: none; }
  .pn-card.next { text-align: left; }
  .float-actions { right: 16px; bottom: 24px; }
}

.loading, .error {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-secondary);
}
</style>
