<template>
  <div class="app-shell">
    <!-- 键盘/读屏用户的快速通道：平时藏起来，Tab 聚焦时才出现 -->
    <button class="skip-link" @click="skipToContent">跳到主要内容</button>
    <Navbar />
    <main class="main" id="main-content" tabindex="-1">
      <!-- 路由切换淡入。out-in 等旧页面退场完再进新页面，避免两个页面同屏抢布局 -->
      <router-view v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </main>
    <footer class="footer">
      <div class="container">
        <div class="footer-inner">
          <span>© {{ year }} {{ AUTHOR }}</span>
          <nav class="footer-links" aria-label="页脚链接">
            <a :href="GITHUB_URL" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a :href="feedUrl" target="_blank" rel="noopener">RSS</a>
          </nav>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue'
import { AUTHOR, GITHUB_URL } from './site'

// 别写死年份，否则跨年就过期
const year = new Date().getFullYear()

// 页面不全在站点根目录（/article/xxx），相对路径 ./feed.xml 会指错，统一带上 base
const feedUrl = `${import.meta.env.BASE_URL}feed.xml`

function skipToContent() {
  const el = document.getElementById('main-content')
  el?.focus({ preventScroll: true })
  el?.scrollIntoView()
}
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* 跳到主要内容：默认藏在视口上方，获得焦点时滑下来 */
.skip-link {
  position: fixed;
  top: 10px;
  left: 16px;
  z-index: 200;
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius);
  background: var(--heading);
  color: var(--bg);
  font-size: 14px;
  cursor: pointer;
  transform: translateY(-300%);
  transition: transform 0.2s ease;
}

.skip-link:focus-visible {
  transform: none;
}

/* main 只是为了接焦点，不要显示焦点框 */
.main:focus {
  outline: none;
}

.main {
  flex: 1;
  width: 100%;
}

/* 路由过渡：只淡入，快、短、不抢戏 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}

.footer {
  margin-top: 96px;
}

.footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding-top: 28px;
  padding-bottom: 40px;
  /* 边线画在内容宽度内，和正文左右对齐 */
  border-top: 1px solid var(--border);
  font-size: 13px;
  color: var(--muted);
}

.footer-links {
  display: flex;
  gap: 18px;
}

.footer-links a {
  transition: color 0.15s;
}

.footer-links a:hover {
  color: var(--accent);
}
</style>
