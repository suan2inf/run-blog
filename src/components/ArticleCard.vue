<template>
  <article class="card" @click="open">
    <div class="card-body">
      <h2 class="card-title">{{ article.title }}</h2>
      <p class="card-summary" v-if="article.summary">{{ article.summary }}</p>
      <div class="card-meta">
        <span class="card-date">{{ formatDate(article.date) }}</span>
        <span class="card-category" v-if="article.category">{{ article.category }}</span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  article: { type: Object, required: true },
})

const router = useRouter()

function open() {
  router.push(`/article/${props.article.slug}`)
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
.card {
  /* 卡片和页面同色，用边框区分；hover 时才浮起来 */
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
}
.card:hover {
  box-shadow: var(--card-hover-shadow);
  border-color: var(--accent);
  transform: translateY(-2px);
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

.card-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
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
