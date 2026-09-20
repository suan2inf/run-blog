<template>
  <div class="app-shell">
    <!-- 键盘/读屏用户的快速通道：平时藏起来，Tab 聚焦时才出现 -->
    <button class="skip-link" @click="skipToContent">跳到主要内容</button>
    <Navbar />
    <main class="main" id="main-content" tabindex="-1">
      <!-- 路由切换淡入淡出。out-in 等旧页面退场完再进新页面，避免两个页面同屏抢布局 -->
      <router-view v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </main>
    <footer class="footer">
      <nav class="footer-links" aria-label="页脚导航">
        <router-link to="/">首页</router-link>
        <router-link to="/blog">博客</router-link>
        <router-link to="/about">关于</router-link>
        <a href="https://github.com/suan2inf/run-blog" target="_blank" rel="noopener">GitHub</a>
        <a href="./feed.xml" target="_blank" rel="noopener">RSS</a>
      </nav>
      <p>© {{ year }} 算不尽 · Vue 3 + Vite · 静态托管于 GitHub Pages</p>
    </footer>
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue'

// 别写死年份，否则跨年就过期
const year = new Date().getFullYear()

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
  /* 页面背景：底色 + 三团大范围柔光。
     都是极低饱和度的径向渐变，叠在底色上，中间过渡到透明，
     所以不会出现色块边界。铺在最外层容器上，页脚也一起覆盖。 */
  background-color: var(--bg);
  background-image:
    radial-gradient(1100px 620px at 12% -8%, var(--bg-blob-1) 0%, transparent 62%),
    radial-gradient(1000px 580px at 90% 2%, var(--bg-blob-2) 0%, transparent 60%),
    radial-gradient(1300px 700px at 50% 118%, var(--bg-blob-1) 0%, transparent 68%);
  background-repeat: no-repeat;
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
  background: var(--accent);
  color: #fff;
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
  padding: 40px 48px;
  /* 外壳放宽到 1600px，让宽屏下正文和小伙伴页都有伸展空间。
     原来 1280px 会把可用宽度卡在 1184px，正文再怎么调也宽不起来。 */
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
}

/* 路由过渡：快、短、不抢戏 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-leave-to {
  opacity: 0;
}

.footer {
  text-align: center;
  padding: 32px 48px;
  border-top: 1px solid var(--border);
  margin-top: 80px;
  /* 透明，让上面的背景一路铺到底，避免底部出现一条颜色断层的横带 */
  background: transparent;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 12px;
}

.footer-links a {
  font-size: 13px;
  color: var(--text-secondary);
  transition: color 0.15s;
}

.footer-links a:hover {
  color: var(--accent);
}

.footer p {
  font-size: 13px;
  color: var(--text-secondary);
}

@media (max-width: 767px) {
  .main {
    padding: 24px 16px;
  }
}
</style>
