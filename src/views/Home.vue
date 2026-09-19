<template>
  <div class="landing">
    <!-- Hero -->
    <section class="hero">
      <h1 class="hero-title">算不尽的博客</h1>
      <p class="hero-subtitle">记录学习与踩坑，主做技术分享与经验总结</p>
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
        <p>暂无文章</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { getArticles } from '../data/articles'
import ArticleCard from '../components/ArticleCard.vue'

// 内容在构建时就已经读进内存了，这里没有任何请求，纯同步取前 6 篇。
const articles = getArticles(6)
</script>

<style scoped>
/* 跟着外壳撑满，宽屏下不留大片空白 */
.landing { width: 100%; }

/* Hero */
.hero {
  padding: 80px 0 64px;
  text-align: center;
}

.hero-title {
  font-size: 48px;
  font-weight: 800;
  color: var(--heading);
  letter-spacing: -1px;
  margin-bottom: 16px;
}

.hero-subtitle {
  font-size: 20px;
  color: var(--accent);
  margin-bottom: 24px;
}

/* Section */
.section {
  margin-bottom: 72px;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 28px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.section-head h2 {
  font-size: 22px;
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

.article-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

@media (max-width: 767px) {
  .hero { padding: 48px 0 40px; }
  .hero-title { font-size: 32px; }
  .hero-subtitle { font-size: 17px; }
  .article-grid { grid-template-columns: 1fr; }
}
</style>
