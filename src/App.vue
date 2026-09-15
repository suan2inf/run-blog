<template>
  <div class="app-shell">
    <Navbar />
    <main class="main">
      <router-view />
    </main>
    <footer class="footer">
      <p>© 2025 算不尽 · Vue 3 + Vite · 静态托管于 GitHub Pages</p>
    </footer>
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue'
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
  max-width: 1280px;
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
