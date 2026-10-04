import { onMounted, ref } from 'vue'

/**
 * 「页面是否已经在浏览器里接管完毕」。
 *
 * 预渲染时拿不到 URL 里的 ?q= / ?tag=，所以博客页预渲染出来的是完整列表。
 * 浏览器水合的第一帧必须和预渲染一致（否则 Vue 报水合不匹配、整块重画），
 * 依赖 URL 参数的展示要等这个值变成 true 再生效。
 * 首屏水合结束后，后续站内跳转挂载的组件直接拿到 true，不会多闪一帧。
 */
let appHydrated = false

export function markHydrated() {
  appHydrated = true
}

export function useHydrated() {
  const ready = ref(appHydrated)
  if (!appHydrated) onMounted(() => (ready.value = true))
  return ready
}
