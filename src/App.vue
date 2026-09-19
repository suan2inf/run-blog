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
  /* 透明，让上面的背景一路铺到底，避免底部出现一条颜色断层的横带 */
  background: transparent;
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
