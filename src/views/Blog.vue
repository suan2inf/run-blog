<template>
  <div class="blog">
    <div class="blog-head">
      <h1>博客</h1>
      <div class="search-box">
        <input
          v-model="query"
          type="text"
          placeholder="搜索文章..."
          @keyup.enter="search"
        />
      </div>
    </div>

    <div class="section-header" v-if="searchQuery">
      搜索: "{{ searchQuery }}" <span class="result-count">（{{ matched.length }} 篇）</span>
    </div>

    <div class="article-grid" v-if="pagedArticles.length">
      <ArticleCard
        v-for="article in pagedArticles"
        :key="article.slug"
        :article="article"
      />
    </div>
    <div class="empty" v-else>
      <p>{{ searchQuery ? '没有匹配的文章' : '暂无文章' }}</p>
    </div>

    <nav class="pagination" v-if="totalPages > 1">
      <button :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">上一页</button>
      <button
        v-for="page in pageItems"
        :key="page.key"
        :class="{ active: page.number === currentPage, gap: page.number === null }"
        :disabled="page.number === null"
        @click="goToPage(page.number)"
      >{{ page.label }}</button>
      <button :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">下一页</button>
    </nav>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { searchArticles } from '../data/articles'
import ArticleCard from '../components/ArticleCard.vue'

const PAGE_SIZE = 9

const route = useRoute()
const router = useRouter()
const query = ref('')

const searchQuery = computed(() => route.query.q || '')
const currentPage = computed(() => Math.max(1, Number(route.query.page) || 1))

// 所有文章在构建时已经读进内存，搜索和分页都是前端即时算出来的
const matched = computed(() => searchArticles(searchQuery.value))

const totalPages = computed(() => Math.max(1, Math.ceil(matched.value.length / PAGE_SIZE)))

const pagedArticles = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return matched.value.slice(start, start + PAGE_SIZE)
})

// 页码列表：超过 7 页时中间用省略号收起
const pageItems = computed(() => {
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => ({
      key: i + 1,
      number: i + 1,
      label: String(i + 1),
    }))
  }

  const items = []
  const push = number => items.push({ key: number, number, label: String(number) })
  const pushGap = index => items.push({ key: `gap-${index}`, number: null, label: '…' })

  push(1)
  if (current > 3) pushGap('left')
  for (let page = Math.max(2, current - 1); page <= Math.min(total - 1, current + 1); page += 1) {
    push(page)
  }
  if (current < total - 2) pushGap('right')
  push(total)

  return items
})

function goToPage(page) {
  if (!page || page === currentPage.value) return
  const next = { ...route.query }
  if (page <= 1) delete next.page
  else next.page = String(page)
  router.push({ path: '/blog', query: next })
}

function search() {
  const next = { ...route.query, q: query.value.trim() || undefined }
  delete next.page
  if (!next.q) delete next.q
  router.push({ path: '/blog', query: next })
}
</script>

<style scoped>
.blog { max-width: 1200px; margin: 0 auto; }

.blog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 16px;
}

.blog-head h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--heading);
}

.search-box input {
  padding: 8px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  color: var(--text);
  font-size: 14px;
  outline: none;
  width: 240px;
  transition: border-color 0.2s;
}

.search-box input:focus { border-color: var(--accent); }

.section-header {
  font-size: 15px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.result-count { font-size: 13px; }

.article-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.empty {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-secondary);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 48px;
  flex-wrap: wrap;
}

.pagination button {
  min-width: 38px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.pagination button:hover:not(:disabled):not(.active) {
  border-color: var(--accent);
  color: var(--accent);
}

.pagination button.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.pagination button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pagination button.gap {
  border: none;
  background: none;
  opacity: 1;
}

@media (max-width: 767px) {
  .article-grid { grid-template-columns: 1fr; }
  .search-box input { width: 100%; }
}
</style>
