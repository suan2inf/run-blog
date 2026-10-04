<template>
  <div class="container home">
    <section class="profile">
      <img
        class="avatar"
        :src="avatarUrl"
        width="88"
        height="88"
        alt="算不尽的头像"
        decoding="async"
      />
      <div class="profile-text">
        <h1 class="name">{{ AUTHOR }}</h1>
        <p class="tagline">
          <span v-for="line in TAGLINE" :key="line">{{ line }}</span>
        </p>
      </div>
    </section>

    <p class="intro">{{ INTRO }}</p>

    <div class="links">
      <a :href="GITHUB_URL" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" /></svg>
        GitHub
      </a>
      <a :href="`mailto:${EMAIL}`">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
        Email
      </a>
      <a :href="feedUrl" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1.2" fill="currentColor" /></svg>
        RSS
      </a>
    </div>

    <section class="recent" aria-labelledby="recent-title">
      <div class="section-head">
        <h2 id="recent-title">最近文章</h2>
        <router-link to="/blog" v-if="allArticles.length > RECENT_COUNT">全部 {{ allArticles.length }} 篇 →</router-link>
      </div>
      <PostList v-if="recent.length" :articles="recent" />
      <p class="empty" v-else>还没有文章。</p>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { allArticles } from '../data/articles'
import { AUTHOR, EMAIL, GITHUB_URL, INTRO, TAGLINE } from '../site'
import PostList from '../components/PostList.vue'

// 首页只列最近几篇，更多的去「文章」页
const RECENT_COUNT = 10
const recent = computed(() => allArticles.value.slice(0, RECENT_COUNT))

const avatarUrl = `${import.meta.env.BASE_URL}avatar.webp`
const feedUrl = `${import.meta.env.BASE_URL}feed.xml`
</script>

<style scoped>
.profile {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-top: 56px;
}

.avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;
  background: var(--surface);
  /* 极淡的描边，浅色头像在浅色底上也有边界 */
  box-shadow: 0 0 0 1px var(--border);
}

.name {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--heading);
}

/* 几句话分行显示，窄屏也不会在逗号中间断开 */
.tagline {
  display: flex;
  flex-direction: column;
  margin-top: 6px;
  font-size: 15px;
  line-height: 1.75;
  color: var(--muted);
}

.intro {
  margin-top: 24px;
  max-width: 40em;
  font-size: 16px;
  line-height: 1.85;
  color: var(--text);
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 16px;
  font-size: 14px;
}

.links a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  transition: color 0.15s;
}

.links a:hover {
  color: var(--accent);
}

.links svg {
  width: 15px;
  height: 15px;
}

.recent {
  margin-top: 56px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
  color: var(--muted);
}

.section-head h2 {
  font-size: 14px;
  font-weight: 500;
}

.section-head a {
  transition: color 0.15s;
}

.section-head a:hover {
  color: var(--accent);
}

.empty {
  padding: 32px 0;
  color: var(--muted);
}

@media (max-width: 640px) {
  .profile {
    gap: 18px;
    padding-top: 36px;
  }

  .avatar {
    width: 68px;
    height: 68px;
  }

  .name {
    font-size: 22px;
  }

  .tagline {
    font-size: 14px;
  }
}
</style>
