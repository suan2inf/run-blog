import { ref } from 'vue'

/**
 * 全局主题状态。
 *
 * 之前主题逻辑整个塞在 Navbar 里，结果文章页想给 MdPreview/MdCatalog 传暗色标记
 * 时拿不到当前主题。抽成模块级单例：谁要用谁 import，状态只有一份。
 *
 * 首屏的 data-theme 由 index.html 里的内联脚本在渲染前就设好（防暗色闪白），
 * 这里 initTheme() 只是把它读进来并挂上「跟随系统」的监听。
 */
const theme = ref('light')

let mediaCleanup = null

function readStoredTheme() {
  try {
    return localStorage.getItem('theme')
  } catch {
    // 无痕模式 / 禁用了本地存储时当没存过
    return null
  }
}

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(next) {
  theme.value = next
  document.documentElement.dataset.theme = next
}

export function initTheme() {
  applyTheme(readStoredTheme() || (systemPrefersDark() ? 'dark' : 'light'))

  // 用户没手动选过主题时，跟随系统切换
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = event => {
    if (!readStoredTheme()) applyTheme(event.matches ? 'dark' : 'light')
  }
  media.addEventListener('change', onChange)
  // 模块单例只初始化一次，但也别让重复调用挂多个监听
  mediaCleanup?.()
  mediaCleanup = () => media.removeEventListener('change', onChange)
}

export function toggleTheme() {
  const next = theme.value === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  try {
    localStorage.setItem('theme', next)
  } catch {
    /* 存不上就算了，刷新后回到跟随系统 */
  }
}

export function useTheme() {
  return theme
}
