<template>
  <header class="navbar" :class="{ scrolled }">
    <router-link to="/" class="brand">
      <!-- 品牌符号 ∞：「算不尽」= Suan to infinity，与 favicon 是同一个标 -->
      <svg class="brand-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="brand-gradient" x1="11" y1="16" x2="37" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#a78bfa" />
            <stop offset="1" stop-color="#6d28d9" />
          </linearGradient>
        </defs>
        <path
          d="M24 24 C28 16 37 16 37 24 C37 32 28 32 24 24 C20 32 11 32 11 24 C11 16 20 16 24 24 Z"
          stroke="url(#brand-gradient)"
          stroke-width="5"
          stroke-linejoin="round"
        />
      </svg>
      Suan2INF
    </router-link>

    <nav class="nav-links" :class="{ open: menuOpen }" aria-label="主导航">
      <router-link to="/" @click="menuOpen = false">首页</router-link>
      <router-link to="/blog" @click="menuOpen = false">博客</router-link>
      <router-link to="/about" @click="menuOpen = false">关于</router-link>
    </nav>

    <div class="nav-actions">
      <button
        class="theme-btn"
        @click="toggleTheme"
        :title="themeLabel"
        :aria-label="themeLabel"
      >
        <!-- 暗色下显示太阳（点它切回亮色），亮色下显示月亮 -->
        <svg v-if="theme === 'dark'" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      </button>
      <button
        class="menu-btn"
        @click="menuOpen = !menuOpen"
        :aria-expanded="menuOpen"
        aria-label="打开导航菜单"
      >
        ☰
      </button>
    </div>

    <div class="overlay" v-if="menuOpen" @click="menuOpen = false"></div>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { toggleTheme, useTheme } from '../composables/useTheme'

const menuOpen = ref(false)
const theme = useTheme()

// 滚动一点后给导航栏加阴影，和内容区拉开层次
const scrolled = ref(false)

function onScroll() {
  scrolled.value = window.scrollY > 8
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})

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
  /* 半透明 + 毛玻璃：页面内容从下面滚过时隐约透上来。
     之前 background 是不透明的 var(--bg)，backdrop-filter 写了也看不出效果。 */
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
  transition: box-shadow 0.2s ease, background-color 0.3s ease;
}

.navbar.scrolled {
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.08);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--heading);
  text-decoration: none;
  transition: color 0.15s;
}

.brand-mark {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.brand:hover { color: var(--accent); }

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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  color: var(--text-secondary);
  transition: border-color 0.15s, color 0.15s;
}

.theme-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
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
