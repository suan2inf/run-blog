<template>
  <header class="navbar">
    <div class="container navbar-inner">
      <router-link to="/" class="brand">{{ AUTHOR }}</router-link>

      <nav class="nav-links" aria-label="主导航">
        <router-link to="/blog" :class="{ on: section === 'blog' }">文章</router-link>
        <router-link to="/about" :class="{ on: section === 'about' }">关于</router-link>
        <button
          class="theme-btn"
          type="button"
          @click="toggleTheme"
          title="切换亮色 / 暗色"
          aria-label="切换亮色 / 暗色主题"
        >
          <!-- 两个图标都渲染，由 CSS 按 html[data-theme] 显示其中一个：
               暗色下显示太阳（点它切回亮色），亮色下显示月亮。
               不用 v-if：预渲染时不知道读者的主题，按主题分支渲染会和浏览器水合对不上 -->
          <svg class="icon-sun" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
          </svg>
          <svg class="icon-moon" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </svg>
        </button>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { toggleTheme } from '../composables/useTheme'
import { AUTHOR } from '../site'

const route = useRoute()

// 文章详情页也算在「文章」栏目下，导航高亮跟着走
const section = computed(() => {
  if (route.name === 'blog' || route.name === 'article') return 'blog'
  if (route.name === 'about') return 'about'
  return ''
})
</script>

<style scoped>
/* 不吸顶：页面以阅读为主，导航只在顶部出现一次，不占阅读空间 */
.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 68px;
}

.brand {
  font-size: 17px;
  font-weight: 650;
  letter-spacing: 0.02em;
  color: var(--heading);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 22px;
  font-size: 15px;
}

.nav-links a {
  color: var(--muted);
  transition: color 0.15s;
}

.nav-links a:hover,
.nav-links a.on {
  color: var(--heading);
}

.theme-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-right: -6px;
  border: none;
  border-radius: var(--radius);
  background: none;
  color: var(--muted);
  cursor: pointer;
  transition: color 0.15s, background-color 0.15s;
}

.theme-btn:hover {
  color: var(--heading);
  background: var(--surface);
}

.icon-sun,
[data-theme='dark'] .icon-moon {
  display: none;
}

[data-theme='dark'] .icon-sun {
  display: block;
}
</style>
