<template>
  <div class="container not-found">
    <p class="code">404</p>
    <h1 class="page-title">页面不存在</h1>
    <p class="hint">链接可能打错了，或者内容已经移走。</p>
    <div class="actions">
      <router-link to="/">回首页</router-link>
      <router-link to="/blog">看文章</router-link>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  padding-top: 72px;
}

.code {
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
  margin-bottom: 6px;
}

.hint {
  margin-top: 10px;
  color: var(--muted);
}

.actions {
  display: flex;
  gap: 20px;
  margin-top: 24px;
}

.actions a {
  color: var(--accent);
}

.actions a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
