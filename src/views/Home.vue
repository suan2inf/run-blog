<template>
  <div class="landing">
    <!-- Hero -->
    <section class="hero">
      <!-- 品牌水印：超大号 ∞ 用极低透明度铺在右侧，宽屏才出现 -->
      <svg class="hero-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path
          d="M24 24 C28 16 37 16 37 24 C37 32 28 32 24 24 C20 32 11 32 11 24 C11 16 20 16 24 24 Z"
          stroke-width="2.5"
          stroke-linejoin="round"
        />
      </svg>
      <h1 class="hero-title">算不尽的博客</h1>
      <p class="hero-subtitle">一名普通大学生，在这里记录学习，也记录踩坑</p>
      <div class="hero-links">
        <a href="https://github.com/suan2inf" target="_blank" rel="noopener">GitHub</a>
        <a href="mailto:3662927683@qq.com">Email</a>
        <a href="./feed.xml" target="_blank" rel="noopener">RSS</a>
      </div>
      <p class="hero-meta" v-if="articles.length">
        <span>{{ articles.length }} 篇文章</span>
        <span class="dot" aria-hidden="true">·</span>
        <span>共 {{ formatCount(totalWords) }} 字</span>
        <span class="dot" aria-hidden="true">·</span>
        <span>最近更新 {{ formatDate(latestDate) }}</span>
      </p>
    </section>

    <!-- 最新文章 -->
    <section class="section">
      <div class="section-head">
        <h2>最新文章</h2>
        <router-link to="/blog" class="more-link">查看全部 →</router-link>
      </div>
      <div class="article-grid" v-if="articles.length">
        <ArticleCard
          v-for="(article, index) in articles"
          :key="article.slug"
          :article="article"
          :class="{ featured: index === 0 }"
        />
      </div>
      <div class="empty" v-else>
        <p>还没有文章。在 content/articles/ 下放一个 .md 文件，推送后就会出现在这里。</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { allArticles, getArticles } from '../data/articles'
import { formatCount, formatDate } from '../utils/format'
import ArticleCard from '../components/ArticleCard.vue'

// 元数据构建时内嵌，这里没有任何请求，纯同步取前 6 篇。
const articles = getArticles(6)

// allArticles 已按日期由新到旧排好，第一条就是最近的
const latestDate = computed(() => allArticles.value[0]?.date || '')

// 全站总字数（构建时算好的 wordCount 求和）
const totalWords = computed(() =>
  allArticles.value.reduce((sum, article) => sum + (article.wordCount || 0), 0)
)
</script>

<style scoped>
/* 跟着外壳撑满，宽屏下不留大片空白 */
.landing { width: 100%; }

/* Hero */
.hero {
  position: relative;
  padding: 64px 0 56px;
  margin-bottom: 40px;
  text-align: center;
  /* 入场时轻微上浮淡入（系统开「减少动态效果」时会被全局规则关掉） */
  animation: hero-rise 0.5s ease both;
}

@keyframes hero-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* 标题后面一层极淡的光晕，让首屏不至于是一整片纯白 */
.hero::before {
  content: '';
  position: absolute;
  top: -120px;
  left: 50%;
  transform: translateX(-50%);
  width: min(760px, 92vw);
  height: 420px;
  background: radial-gradient(
    ellipse at center,
    color-mix(in srgb, var(--accent) 12%, transparent) 0%,
    transparent 68%
  );
  pointer-events: none;
  z-index: 0;
}

/* 文字压在光晕之上 */
.hero-title,
.hero-subtitle,
.hero-links,
.hero-meta {
  position: relative;
  z-index: 1;
}

/* 品牌水印：超大号 ∞ 铺在 hero 右侧，透明度压到几乎只是"能感觉到有东西"的程度。
   只有宽屏才出现（和点阵同一个断点），窄屏避免与文字抢层次。 */
.hero-mark {
  display: none;
  position: absolute;
  top: 38%;
  right: 1%;
  transform: translateY(-50%) rotate(-6deg);
  width: min(430px, 34vw);
  pointer-events: none;
  z-index: 0;
}

.hero-mark path {
  stroke: var(--accent);
  opacity: 0.055;
}

@media (min-width: 1280px) {
  .hero-mark { display: block; }
}

/* 点阵纹理：只有宽屏才出现。
   窄屏上同样大小的点会显得很密、像噪点，所以直接从 none 起步；
   出现时用 mask 从中心向外淡出，免得露出一个矩形边界。 */
.hero::after {
  content: '';
  display: none;
  position: absolute;
  top: -140px;
  left: 50%;
  transform: translateX(-50%);
  width: 100vw;
  height: 560px;
  background-image: radial-gradient(circle, var(--bg-dot) 1px, transparent 1.6px);
  background-size: 24px 24px;
  -webkit-mask-image: radial-gradient(ellipse 46% 62% at 50% 46%, #000 0%, transparent 74%);
  mask-image: radial-gradient(ellipse 46% 62% at 50% 46%, #000 0%, transparent 74%);
  opacity: 0.5;
  pointer-events: none;
  z-index: 0;
}

@media (min-width: 1280px) {
  .hero::after { display: block; }
}

.hero-title {
  font-size: 48px;
  font-weight: 800;
  color: var(--heading);
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin-bottom: 14px;
}

/* 标题末段渐变成品牌紫。background-clip: text 不支持的浏览器保持纯色标题 */
@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  .hero-title {
    background: linear-gradient(115deg, var(--heading) 52%, var(--accent) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }
}

.hero-subtitle {
  font-size: 18px;
  color: var(--text-secondary);
  line-height: 1.7;
}

/* 首屏社交链接：求职场景下面试官能一键直达 GitHub / 邮箱 */
.hero-links {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 22px;
}

.hero-links a {
  font-size: 14px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  transition: color 0.15s;
}

.hero-links a:hover {
  color: var(--accent);
}

.hero-meta {
  margin-top: 22px;
  font-size: 13px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  opacity: 0.85;
}

.hero-meta .dot {
  margin: 0 8px;
  opacity: 0.6;
}

/* Section */
.section {
  margin-bottom: 72px;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

.section-head h2 {
  display: flex;
  align-items: center;
  font-size: 21px;
  font-weight: 700;
  color: var(--heading);
}

/* 全站统一的标题记号：品牌色短竖线（渐变收细），克制但提气 */
.section-head h2::before {
  content: '';
  width: 4px;
  height: 17px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--accent), var(--accent-soft));
  margin-right: 10px;
}

.more-link {
  font-size: 14px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.15s;
}

.more-link:hover { color: var(--accent); }

/* 文章不多时不要一张窄卡片孤零零贴在左边：
   auto-fit + 1fr 让卡片自己撑开、整体居中；文章多了再自动分列。 */
.article-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  justify-content: center;
  gap: 20px;
}

/* 最新一篇放大成「头条卡」：占满整行 + 右上角「最新」角标。
   class 落在 ArticleCard 的根元素上（会带上本组件的 scope id），
   卡片内部元素要走 :deep。 */
.article-grid .featured {
  grid-column: 1 / -1;
}

.article-grid .featured::before {
  content: '最新';
  position: absolute;
  top: 18px;
  right: 18px;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--accent);
  background: var(--accent-bg);
  padding: 2px 10px;
  border-radius: 999px;
  z-index: 1;
}

.article-grid .featured :deep(.card-title) {
  font-size: 21px;
}

.empty {
  text-align: center;
  padding: 56px 20px;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.8;
}

@media (max-width: 767px) {
  .hero { padding: 40px 0 32px; margin-bottom: 28px; }
  .hero-title { font-size: 32px; }
  .hero-subtitle { font-size: 16px; }
  .hero-meta { margin-top: 16px; }
  .article-grid { grid-template-columns: 1fr; }
}
</style>
