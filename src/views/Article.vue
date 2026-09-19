<template>
  <div class="article-shell">
    <article class="article-detail" v-if="article">
      <header class="article-header">
        <h1>{{ article.title }}</h1>
        <div class="article-meta">
          <span>{{ formatDate(article.date) }}</span>
          <span v-if="article.category" class="meta-category">{{ article.category }}</span>
          <span>{{ article.readTime }} 分钟阅读</span>
        </div>
      </header>
      <div class="paper">
        <div class="markdown-body">
          <MdPreview :modelValue="article.content" />
        </div>
      </div>
      <div class="article-footer">
        <router-link to="/blog" class="back-link">← 返回文章列表</router-link>
      </div>
    </article>
    <div class="error" v-else>
      <p>文章不存在</p>
      <router-link to="/blog" class="back-link">← 返回文章列表</router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getArticle } from '../data/articles'
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'

const route = useRoute()

// 文章已经在构建时全部读进内存，同步按 slug 查表即可，没有加载态
const article = computed(() => getArticle(route.params.slug))

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
  width: 100%;
  max-width: var(--article-width);
  margin: 0 auto;
}

.article-detail {
  width: 100%;
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
