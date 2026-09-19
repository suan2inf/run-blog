<template>
  <div class="about">
    <h1>关于</h1>

    <!-- 个人介绍 -->
    <section class="intro">
      <h2>关于我</h2>
      <p>我叫算不尽，这是我的个人博客网站，主做作品展示与经验分享，欢迎观看。</p>
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
  font-size: 28px;
  font-weight: 700;
  color: var(--heading);
  margin-bottom: 36px;
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
  background: var(--paper-bg);
  border: 1px solid var(--paper-border);
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
