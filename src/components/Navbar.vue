<template>
  <header class="navbar">
    <router-link to="/" class="brand">DSM</router-link>

    <nav class="nav-links" :class="{ open: menuOpen }">
      <router-link to="/" @click="menuOpen = false">首页</router-link>
      <router-link to="/blog" @click="menuOpen = false">博客</router-link>
      <router-link to="/about" @click="menuOpen = false">关于</router-link>
    </nav>

    <div class="nav-actions">
      <button class="theme-btn" @click="toggleTheme" :title="themeLabel">
        {{ themeIcon }}
      </button>
      <button class="menu-btn" @click="menuOpen = !menuOpen">☰</button>
    </div>

    <div class="overlay" v-if="menuOpen" @click="menuOpen = false"></div>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'

const menuOpen = ref(false)
const theme = ref('light')

initTheme()

function readStoredTheme() {
  return localStorage.getItem('theme')
}

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(next) {
  theme.value = next
  document.documentElement.dataset.theme = next
}

function initTheme() {
  applyTheme(readStoredTheme() || (systemPrefersDark() ? 'dark' : 'light'))

  // 用户没手动选过主题时，跟随系统切换（原来只读一次，系统改暗色网站不会跟）
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = event => {
    if (!readStoredTheme()) applyTheme(event.matches ? 'dark' : 'light')
  }
  media.addEventListener('change', onChange)
  onBeforeUnmount(() => media.removeEventListener('change', onChange))
}

function toggleTheme() {
  const next = theme.value === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  localStorage.setItem('theme', next)
}

const themeIcon = computed(() => (theme.value === 'dark' ? '☀️' : '🌙'))
const themeLabel = computed(() => (theme.value === 'dark' ? '切换亮色' : '切换暗色'))
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 48px;
  height: 64px;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(8px);
}

.brand {
  font-size: 20px;
  font-weight: 700;
  color: var(--heading);
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 4px;
}

.nav-links a {
  padding: 8px 16px;
  border-radius: var(--radius);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.nav-links a:hover,
.nav-links a.router-link-exact-active {
  background: var(--accent-bg);
  color: var(--accent);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.theme-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 6px 10px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.menu-btn {
  display: none;
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 6px 10px;
  cursor: pointer;
  font-size: 18px;
  color: var(--text);
}

.overlay { display: none; }

@media (max-width: 767px) {
  .navbar {
    padding: 0 16px;
  }

  .menu-btn {
    display: block;
  }

  .nav-links {
    display: none;
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    flex-direction: column;
    padding: 8px 16px 16px;
  }

  .nav-links.open {
    display: flex;
  }

  .overlay {
    display: block;
    position: fixed;
    inset: 0;
    top: 64px;
    z-index: 50;
    background: rgba(0, 0, 0, 0.3);
  }
}
</style>
