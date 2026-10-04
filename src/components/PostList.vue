<template>
  <!-- 文章列表：按年份分组，左边日期、右边标题和摘要。
       整条是一个链接；悬停/聚焦时预拉正文 chunk，点进去基本零等待 -->
  <div class="post-list">
    <section v-for="group in groups" :key="group.year" class="year-group">
      <h2 class="year">{{ group.year }}</h2>
      <ul>
        <li v-for="article in group.articles" :key="article.slug">
          <router-link
            class="post"
            :to="`/article/${article.slug}`"
            @mouseenter="preload(article.slug)"
            @focus="preload(article.slug)"
          >
            <time :datetime="article.date">{{ monthDay(article.date) }}</time>
            <span class="post-title">{{ article.title }}</span>
            <span class="post-summary" v-if="showSummary && article.summary">{{ article.summary }}</span>
          </router-link>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { loadArticleContent } from '../data/articles'

const props = defineProps({
  articles: { type: Array, required: true },
  showSummary: { type: Boolean, default: true },
})

// 列表已经按日期由新到旧排好，顺序遍历分组即可
const groups = computed(() => {
  const result = []
  for (const article of props.articles) {
    const year = String(article.date).slice(0, 4) || '未注明日期'
    const last = result[result.length - 1]
    if (last?.year === year) last.articles.push(article)
    else result.push({ year, articles: [article] })
  }
  return result
})

function monthDay(date) {
  return String(date).slice(5, 10)
}

function preload(slug) {
  loadArticleContent(slug)
}
</script>

<style scoped>
.year-group + .year-group {
  margin-top: 12px;
}

.year {
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
  margin: 24px 0 4px;
}

ul {
  list-style: none;
}

.post {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  column-gap: 16px;
  padding: 12px 0;
}

time {
  font-size: 14px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
  /* 和标题第一行的基线大致对齐 */
  padding-top: 2px;
}

.post-title {
  font-size: 17px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--heading);
  transition: color 0.15s;
}

.post-summary {
  grid-column: 2;
  margin-top: 4px;
  font-size: 14.5px;
  line-height: 1.65;
  color: var(--muted);
  /* 摘要最多两行；宽屏下也别拉满整行，读起来太长 */
  max-width: 46em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post:hover .post-title {
  color: var(--accent);
}

@media (max-width: 640px) {
  .post {
    grid-template-columns: 48px minmax(0, 1fr);
    column-gap: 12px;
  }

  .post-title {
    font-size: 16px;
  }
}
</style>
