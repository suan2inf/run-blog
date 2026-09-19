<template>
  <div class="landing">
    <!-- Hero -->
    <section class="hero">
      <h1 class="hero-title">算不尽的博客</h1>
      <p class="hero-subtitle">记录学习与踩坑，主做技术分享与经验总结</p>
      <p class="hero-meta" v-if="articles.length">
        <span>{{ articles.length }} 篇文章</span>
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
          v-for="article in articles"
          :key="article.slug"
          :article="article"
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
import ArticleCard from '../components/ArticleCard.vue'

// 内容在构建时就已经读进内存了，这里没有任何请求，纯同步取前 6 篇。
const articles = getArticles(6)

// allArticles 已按日期由新到旧排好，第一条就是最近的
const latestDate = computed(() => allArticles.value[0]?.date || '')

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
/* 跟着外壳撑满，宽屏下不留大片空白 */
.landing { width: 100%; }

/* Hero */
.hero {
  position: relative;
  padding: 64px 0 56px;
  margin-bottom: 40px;
  text-align: center;
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
.hero-meta {
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 48px;
  font-weight: 800;
  color: var(--heading);
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin-bottom: 14px;
}

.hero-subtitle {
  font-size: 19px;
  color: var(--text-secondary);
  line-height: 1.7;
}

.hero-meta {
  margin-top: 22px;
  font-size: 13px;
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
  font-size: 21px;
  font-weight: 700;
  color: var(--heading);
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
