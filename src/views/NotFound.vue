<template>
  <div class="not-found">
    <p class="code">404</p>
    <h1>页面不存在</h1>
    <p class="hint">链接可能打错了，或者内容已被移动。</p>
    <div class="actions">
      <router-link to="/" class="action-btn primary">回首页</router-link>
      <router-link to="/blog" class="action-btn">去博客</router-link>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  text-align: center;
  padding: 96px 20px;
}

.code {
  font-size: 72px;
  font-weight: 800;
  letter-spacing: 0.04em;
  /* 主题色压得很淡的大数字，只是个视觉锚点 */
  color: color-mix(in srgb, var(--accent) 35%, transparent);
  line-height: 1;
  margin-bottom: 16px;
}

h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--heading);
  margin-bottom: 10px;
}

.hint {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 28px;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.action-btn {
  padding: 8px 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 14px;
  color: var(--text-secondary);
  transition: border-color 0.15s, color 0.15s;
}

.action-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.action-btn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.action-btn.primary:hover {
  opacity: 0.88;
  color: #fff;
}
</style>
