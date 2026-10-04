<template>
  <div class="container blog">
    <div class="blog-head">
      <h1 class="page-title">文章</h1>
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input
          ref="searchInputRef"
          v-model="query"
          type="search"
          placeholder="搜索标题和正文"
          aria-label="搜索文章"
          @keyup.enter="commitSearch(true)"
        />
        <kbd class="search-kbd" aria-hidden="true">/</kbd>
      </div>
    </div>

    <!-- 标签筛选：文章打了标签才出现 -->
    <div class="tag-row" v-if="allTags.length" role="group" aria-label="按标签筛选">
      <button
        type="button"
        class="tag"
        :class="{ on: !activeTag }"
        :aria-pressed="!activeTag"
        @click="setTag('')"
      >全部</button>
      <button
        v-for="tag in allTags"
        :key="tag.name"
        type="button"
        class="tag"
        :class="{ on: activeTag === tag.name }"
        :aria-pressed="activeTag === tag.name"
        @click="setTag(tag.name)"
      >{{ tag.name }}<span class="tag-count">{{ tag.count }}</span></button>
    </div>

    <p class="summary-line" aria-live="polite">
      <template v-if="searchQuery || activeTag">
        <template v-if="searchQuery">搜索「{{ searchQuery }}」</template>
        <template v-if="searchQuery && activeTag"> · </template>
        <template v-if="activeTag">标签「{{ activeTag }}」</template>
        ，共 {{ matched.length }} 篇
        <button type="button" class="clear-btn" @click="clearFilters">清除</button>
      </template>
      <template v-else>共 {{ matched.length }} 篇</template>
    </p>

    <PostList v-if="matched.length" :articles="matched" />
    <p class="empty" v-else>{{ searchQuery || activeTag ? '没有匹配的文章' : '还没有文章' }}</p>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { allTags, ensureFullTextIndex, fullTextReady, searchArticles } from '../data/articles'
import { useHydrated } from '../composables/useHydrated'
import PostList from '../components/PostList.vue'

const route = useRoute()
const router = useRouter()
const searchInputRef = ref(null)

// 预渲染的 blog.html 是不带筛选的完整列表；直接打开 /blog?tag=xx 时，
// 先按完整列表水合，接管完成后再应用 URL 里的搜索词/标签（见 useHydrated）
const hydrated = useHydrated()
const urlQuery = computed(() => (hydrated.value ? route.query : {}))

const searchQuery = computed(() => (typeof urlQuery.value.q === 'string' ? urlQuery.value.q : ''))
const activeTag = computed(() => (typeof urlQuery.value.tag === 'string' ? urlQuery.value.tag : ''))
const query = ref(searchQuery.value)

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

// 有搜索词时把全文索引拉起来（独立 chunk，拉一次后就绪）。
// ready 翻转是响应式的，matched 会自动用全文重算一遍。
watch(
  searchQuery,
  q => {
    if (q && !fullTextReady.value) ensureFullTextIndex()
  },
  { immediate: true }
)

// 元数据在构建时内嵌，搜索和筛选都是前端即时算出来的
const matched = computed(() => {
  let list = searchArticles(searchQuery.value)
  if (activeTag.value) {
    list = list.filter(article => article.tags.includes(activeTag.value))
  }
  return list
})

// 即时搜索：输入停 250ms 后同步进 URL。用 replace 而非 push，
// 不然每敲一个字就多一条历史记录
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
  router.push({ path: '/blog', query: next })
}

function clearFilters() {
  query.value = ''
  router.push({ path: '/blog' })
}
</script>

<style scoped>
.blog {
  padding-top: 40px;
}

.blog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 11px;
  color: var(--muted);
  pointer-events: none;
}

.search-box input {
  width: 260px;
  padding: 7px 34px 7px 33px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  color: var(--text);
  font: inherit;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
}

.search-box input::placeholder {
  color: var(--muted);
  opacity: 0.8;
}

.search-box input:focus {
  border-color: var(--accent);
}

/* 框内的 / 键提示，聚焦时隐去 */
.search-kbd {
  position: absolute;
  right: 9px;
  font-family: var(--font-sans);
  font-size: 12px;
  line-height: 1.4;
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0 6px;
  pointer-events: none;
}

.search-box input:focus ~ .search-kbd {
  opacity: 0;
}

/* 标签：纯文字样式，选中时变成强调色浅底 */
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 20px;
}

.tag {
  padding: 3px 10px;
  border: none;
  border-radius: var(--radius);
  background: none;
  color: var(--muted);
  font-size: 14px;
  cursor: pointer;
  transition: color 0.15s, background-color 0.15s;
}

.tag:hover {
  color: var(--heading);
  background: var(--surface);
}

.tag.on {
  color: var(--accent);
  background: var(--accent-bg);
}

.tag-count {
  margin-left: 4px;
  font-size: 12px;
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}

.summary-line {
  margin-top: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
  color: var(--muted);
}

.clear-btn {
  margin-left: 8px;
  border: none;
  background: none;
  color: var(--accent);
  font-size: 14px;
  cursor: pointer;
}

.clear-btn:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.empty {
  padding: 48px 0;
  color: var(--muted);
}

@media (max-width: 640px) {
  .blog {
    padding-top: 28px;
  }

  .search-box,
  .search-box input {
    width: 100%;
  }

  .search-kbd {
    display: none;
  }
}
</style>
