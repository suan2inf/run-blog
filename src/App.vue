<template>
  <div class="app-shell">
    <Navbar />
    <main class="main">
      <router-view />
    </main>
    <footer class="footer">
      <p>© {{ year }} 算不尽 · Vue 3 + Vite · 静态托管于 GitHub Pages</p>
    </footer>
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue'

// 别写死年份，否则跨年就过期
const year = new Date().getFullYear()
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
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

.footer {
  text-align: center;
  padding: 32px 48px;
  border-top: 1px solid var(--border);
  margin-top: 80px;
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
