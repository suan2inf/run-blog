<template>
  <!-- 文章目录。数据是构建时从标题里收集的（plugins/markdown.js），
       侧栏和窄屏抽屉共用这个组件。链接是真实的 #id，不开 JS 也能跳。 -->
  <ul class="toc-list">
    <li v-for="item in items" :key="item.id" :class="`depth-${item.depth}`">
      <a
        :href="`#${item.id}`"
        :class="{ active: item.id === activeId }"
        :aria-current="item.id === activeId ? 'location' : undefined"
        @click.prevent="emit('navigate', item.id)"
      >{{ item.text }}</a>
    </li>
  </ul>
</template>

<script setup>
defineProps({
  items: { type: Array, required: true },
  activeId: { type: String, default: '' },
})

const emit = defineEmits(['navigate'])
</script>

<style scoped>
.toc-list {
  list-style: none;
}

.toc-list a {
  display: block;
  padding: 4px 0;
  color: var(--muted);
  transition: color 0.15s;
}

.toc-list a:hover {
  color: var(--heading);
}

.toc-list a.active {
  color: var(--accent);
}

/* 第二级往里缩一档 */
.depth-1 a {
  padding-left: 14px;
}
</style>
