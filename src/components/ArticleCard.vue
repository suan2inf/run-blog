<template>
  <!-- 整卡就是一个 <a>：键盘 Tab 能到、回车能进、还能右键新标签打开，
       比原来 div + @click 的方案语义和可访问性都好。
       悬停/聚焦时预拉正文 chunk（loadArticleContent 带缓存），点进去基本零等待 -->
  <router-link
    class="card"
    :to="`/article/${article.slug}`"
    @mouseenter="preload"
    @focus="preload"
  >
    <div class="card-body">
      <h2 class="card-title">{{ article.title }}</h2>
      <p class="card-summary" v-if="article.summary">{{ article.summary }}</p>
      <div class="card-tags" v-if="article.tags.length">
        <span class="card-tag" v-for="tag in article.tags" :key="tag">#{{ tag }}</span>
      </div>
      <div class="card-meta">
        <span class="card-date">{{ formatDate(article.date) }}</span>
        <span class="card-readtime">{{ article.readTime }} 分钟</span>
        <span class="card-category" v-if="article.category">{{ article.category }}</span>
      </div>
    </div>
  </router-link>
</template>

<script setup>
import { loadArticleContent } from '../data/articles'
import { formatDate } from '../utils/format'

const props = defineProps({
  article: { type: Object, required: true },
})

function preload() {
  loadArticleContent(props.article.slug)
}
</script>

<style scoped>
.card {
  display: block;
  position: relative;
  overflow: hidden;
  /* 卡片和页面同色，用边框区分；hover 时才浮起来 */
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s, background-color 0.3s ease;
}

/* hover 时左侧划入一条品牌色渐变线，配合上浮，反馈更明确 */
.card::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, var(--accent), var(--accent-soft));
  transform: scaleY(0);
  transform-origin: top;
  transition: transform 0.25s ease;
}

.card:hover {
  box-shadow: var(--card-hover-shadow);
  border-color: var(--accent);
  transform: translateY(-2px);
}

.card:hover::after {
  transform: scaleY(1);
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--heading);
  margin-bottom: 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.15s;
}

/* hover 时标题变色，给出「这张卡能点」的明确反馈 */
.card:hover .card-title {
  color: var(--accent);
}

.card-summary {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.card-tag {
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border-radius: 4px;
  padding: 2px 8px;
}

.card-meta {
  display: flex;
  gap: 16px;
  align-items: center;
  font-size: 12.5px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  flex-wrap: wrap;
}

.card-category {
  background: var(--accent-bg);
  color: var(--accent);
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
}
</style>
