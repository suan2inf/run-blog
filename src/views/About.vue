<template>
  <div class="container about">
    <h1 class="page-title">关于</h1>

    <section aria-labelledby="about-me">
      <h2 id="about-me">关于我</h2>
      <dl class="facts">
        <div>
          <dt>学校</dt>
          <dd>绵阳师范学院 · 数学专业 · 大二</dd>
        </div>
        <div>
          <dt>方向</dt>
          <dd>AI 推理引擎</dd>
        </div>
        <div>
          <dt>志向</dt>
          <dd>开发出高效的推理引擎，通往 AGI 的未来</dd>
        </div>
      </dl>
    </section>

    <section aria-labelledby="about-blog">
      <h2 id="about-blog">这个博客</h2>
      <p>这里算是我的学习笔记，也兼作作品集。读论文、做东西、踩坑的过程都会记在这里：一方面倒逼自己把学过的东西想明白、讲清楚；另一方面以后找工作时，这里比简历上的几行字更能说明我学过什么。</p>
      <p>文章难免有错漏，如果发现了问题，欢迎通过下面的方式告诉我，非常感谢。</p>
    </section>

    <section aria-labelledby="about-contact">
      <h2 id="about-contact">联系</h2>
      <dl class="facts">
        <div>
          <dt>GitHub</dt>
          <dd><a :href="GITHUB_URL" target="_blank" rel="noopener noreferrer">@suan2inf</a></dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd><a :href="`mailto:${EMAIL}`">{{ EMAIL }}</a></dd>
        </div>
      </dl>
    </section>

    <p class="colophon">
      本站是纯静态站点：Vue 3 + Vite 预渲染，文章由 markdown-it、KaTeX、Shiki 在构建时渲染，托管于 GitHub Pages。
      <a :href="REPO_URL" target="_blank" rel="noopener noreferrer">源码</a>
    </p>
  </div>
</template>

<script setup>
import { EMAIL, GITHUB_URL, REPO_URL } from '../site'
</script>

<style scoped>
.about {
  padding-top: 40px;
}

section {
  margin-top: 40px;
  max-width: 44em;
}

h2 {
  font-size: 15px;
  font-weight: 600;
  color: var(--muted);
  margin-bottom: 12px;
}

p {
  line-height: 1.85;
  margin-bottom: 0.9em;
}

/* 两列「字段 · 内容」 */
.facts > div {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 16px;
  padding: 7px 0;
}

dt {
  color: var(--muted);
}

dd {
  color: var(--heading);
}

dd a {
  color: var(--accent);
  word-break: break-all;
}

dd a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.colophon {
  margin-top: 56px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
  max-width: 44em;
  font-size: 13.5px;
  color: var(--muted);
}

.colophon a {
  color: var(--accent);
}

@media (max-width: 640px) {
  .about {
    padding-top: 28px;
  }

  .facts > div {
    grid-template-columns: 56px minmax(0, 1fr);
    gap: 12px;
  }
}
</style>
