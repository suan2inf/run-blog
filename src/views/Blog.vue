<template>
  <div class="blog">
    <div class="blog-head">
      <h1>博客</h1>
      <div class="search-box">
        <input
          ref="searchInputRef"
          v-model="query"
          type="search"
          placeholder="搜索文章…"
          aria-label="搜索文章"
          title="按 / 快速聚焦"
          @keyup.enter="commitSearch(true)"
        />
        <kbd class="search-kbd" aria-hidden="true">/</kbd>
      </div>
    </div>

    <!-- 标签筛选：文章打了标签才出现 -->
    <div class="tag-row" v-if="allTags.length">
      <button
        class="tag-chip"
        :class="{ active: !activeTag }"
        @click="setTag('')"
      >全部</button>
      <button
        v-for="tag in allTags"
        :key="tag.name"
        class="tag-chip"
        :class="{ active: activeTag === tag.name }"
        @click="setTag(tag.name)"
      >#{{ tag.name }}<span class="tag-count">{{ tag.count }}</span></button>
    </div>

    <div class="section-header" v-if="searchQuery || activeTag">
      <template v-if="searchQuery">搜索: "{{ searchQuery }}"</template>
      <template v-if="searchQuery && activeTag"> · </template>
      <template v-if="activeTag">标签: #{{ activeTag }}</template>
      <span class="result-count">（{{ matched.length }} 篇）</span>
    </div>

    <div class="article-grid" v-if="pagedArticles.length">
      <ArticleCard
        v-for="article in pagedArticles"
        :key="article.slug"
        :article="article"
      />
    </div>
    <div class="empty" v-else>
      <p>{{ searchQuery || activeTag ? '没有匹配的文章' : '暂无文章' }}</p>
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { allTags, ensureFullTextIndex, fullTextReady, searchArticles } from '../data/articles'
import ArticleCard from '../components/ArticleCard.vue'

const PAGE_SIZE = 9

const route = useRoute()
const router = useRouter()
const query = ref(typeof route.query.q === 'string' ? route.query.q : '')
const searchInputRef = ref(null)

// 按 / 快速聚焦搜索框（焦点已经在输入类控件里时不抢）
function onGlobalKeydown(event) {
  if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return
  const tag = document.activeElement?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  event.preventDefault()
  searchInputRef.value?.focus()
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKeydown))

const searchQuery = computed(() => (typeof route.query.q === 'string' ? route.query.q : ''))
const activeTag = computed(() => (typeof route.query.tag === 'string' ? route.query.tag : ''))
const currentPage = computed(() => Math.max(1, Number(route.query.page) || 1))

// 有搜索词时把全文索引拉起来（正文是懒加载的 chunk，拉一次后就绪）。
// ready 翻转是响应式的，matched 会自动用全文重算一遍。
watch(
  searchQuery,
  q => {
    if (q && !fullTextReady.value) ensureFullTextIndex()
  },
  { immediate: true }
)

// 元数据在构建时内嵌，搜索和分页都是前端即时算出来的。
// searchArticles 内部会读 fullTextReady，索引就绪后这个 computed 自动重算、补全正文命中。
const matched = computed(() => {
  let list = searchArticles(searchQuery.value)
  if (activeTag.value) {
    list = list.filter(article => article.tags.includes(activeTag.value))
  }
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(matched.value.length / PAGE_SIZE)))

const pagedArticles = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return matched.value.slice(start, start + PAGE_SIZE)
})

// 即时搜索：输入停 250ms 后同步进 URL。用 replace 而非 push，
// 不然每敲一个字就多一条历史记录，后退键要按到天荒地老。
let searchTimer = null
watch(query, () => commitSearch(false))

function commitSearch(immediate) {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(
    () => {
      const q = query.value.trim()
      if (q === searchQuery.value) return
      const next = { ...route.query }
      if (q) next.q = q
      else delete next.q
      delete next.page
      router.replace({ path: '/blog', query: next })
    },
    immediate ? 0 : 250
  )
}

// 前进/后退（或点了带参数的链接）时把 URL 里的关键词回填进输入框
watch(searchQuery, q => {
  if (q !== query.value.trim()) query.value = q
})

function setTag(tag) {
  const next = { ...route.query }
  if (tag) next.tag = tag
  else delete next.tag
  delete next.page
  router.push({ path: '/blog', query: next })
}

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
</script>

<style scoped>
.blog { width: 100%; margin: 0 auto; }

.blog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.blog-head h1 {
  display: flex;
  align-items: center;
  font-size: 28px;
  font-weight: 700;
  color: var(--heading);
}

/* 全站统一的标题记号：品牌色短竖线 */
.blog-head h1::before {
  content: '';
  width: 4px;
  height: 22px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--accent), var(--accent-soft));
  margin-right: 12px;
}

.search-box {
  position: relative;
}

.search-box input {
  padding: 8px 34px 8px 14px;
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

/* 框内的 / 键提示，聚焦时隐去 */
.search-kbd {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-family: inherit;
  font-size: 12px;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 7px;
  pointer-events: none;
  opacity: 0.75;
}

.search-box input:focus + .search-kbd {
  opacity: 0;
}

@media (max-width: 767px) {
  .search-kbd { display: none; }
}

/* 标签筛选行 */
.tag-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.tag-chip {
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-secondary);
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 13px;
  font-family: var(--font-mono);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.tag-chip:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.tag-chip.active {
  background: var(--accent-bg);
  border-color: var(--accent);
  color: var(--accent);
}

.tag-count {
  margin-left: 4px;
  font-size: 11px;
  opacity: 0.7;
}

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
  .search-box { width: 100%; }
  .search-box input { width: 100%; }
}
</style>
