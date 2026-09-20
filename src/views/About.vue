<template>
  <div class="about">
    <h1>关于</h1>

    <!-- 个人介绍 -->
    <section class="intro">
      <h2>关于我</h2>
      <p>我是一名普通的大学生，平时对 AI 系统、推理引擎这些方向比较感兴趣，正在学习中。</p>
      <p>这个博客算是我的学习笔记，也兼作作品集。读论文、做东西、踩坑的过程都会记在这里——一方面倒逼自己把学过的东西想明白、讲清楚；另一方面以后找工作时，这里比简历上的几行字更能说明我学过什么。</p>
      <p>文章难免有错漏，如果发现了问题，欢迎通过下面的方式告诉我，非常感谢。</p>
    </section>

    <!-- 联系方式 -->
    <section class="contact">
      <h2>联系方式</h2>
      <div class="contact-cards">
        <a href="https://github.com/suan2inf" target="_blank" class="contact-card">
          <span class="contact-icon">GH</span>
          <span class="contact-label">GitHub</span>
          <span class="contact-value">@suan2inf</span>
        </a>
        <a href="mailto:3662927683@qq.com" class="contact-card">
          <span class="contact-icon">@</span>
          <span class="contact-label">Email</span>
          <span class="contact-value">3662927683@qq.com</span>
        </a>
      </div>
    </section>

    <!-- 关于本站 -->
    <section class="site-info">
      <div class="info-card">
        <h3>关于本站</h3>
        <ul>
          <li>纯静态技术博客，文章即 Markdown 文件</li>
          <li>前端：Vue 3 + Vite + Vue Router（hash 模式）</li>
          <li>内容：content/articles/ 下的 .md，构建时打包</li>
          <li>渲染：md-editor-v3 的 MdPreview</li>
          <li>部署：GitHub Actions → GitHub Pages</li>
        </ul>
      </div>
    </section>
  </div>
</template>

<style scoped>
.about { max-width: 640px; margin: 0 auto; }

h1 {
  display: flex;
  align-items: center;
  font-size: 28px;
  font-weight: 700;
  color: var(--heading);
  margin-bottom: 36px;
}

/* 全站统一的标题记号：品牌色短竖线 */
h1::before {
  content: '';
  width: 4px;
  height: 22px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--accent), var(--accent-soft));
  margin-right: 12px;
}

.intro { margin-bottom: 48px; }

.intro h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--heading);
  margin-bottom: 16px;
}

.intro p {
  color: var(--text);
  margin-bottom: 14px;
  line-height: 1.85;
}

/* 联系方式 */
.contact { margin-bottom: 48px; }

.contact h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--heading);
  margin-bottom: 16px;
}

.contact-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.contact-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  text-decoration: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.contact-card:hover {
  border-color: var(--accent);
  box-shadow: var(--card-hover-shadow);
}

.contact-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius);
  background: var(--accent-bg);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  font-family: var(--font-mono);
  flex-shrink: 0;
}

.contact-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.contact-value {
  font-size: 14px;
  color: var(--text);
  font-weight: 500;
  word-break: break-all;
}

/* 关于本站 */
.site-info {
  border-top: 1px solid var(--border);
  padding-top: 32px;
}

.info-card {
  /* 原来用的是 paper 那套米黄底，已经跟正文一起去掉色块了，
     这里改用页面自带的次级底色，卡片边界还看得见 */
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px 24px;
}

.info-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--heading);
  margin-bottom: 12px;
}

.info-card ul {
  list-style: none;
}

.info-card li {
  padding: 5px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.info-card li::before {
  content: "— ";
  color: var(--paper-secondary);
}

@media (max-width: 767px) {
  .contact-cards { grid-template-columns: 1fr; }
}
</style>
