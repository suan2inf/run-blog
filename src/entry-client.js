import './style.css'
import { createApp } from './app'
import { initTheme } from './composables/useTheme'
import { markHydrated } from './composables/useHydrated'

// index.html 的内联脚本已经设过 data-theme 防闪烁，这里读入状态并挂「跟随系统」监听
initTheme()

// 构建产物里 #app 已经有预渲染好的页面 → 水合；dev 模式和 404.html 里是空的 → 正常挂载
const container = document.getElementById('app')
const hydrate = Boolean(container.firstElementChild)
const { app, router } = createApp({ hydrate })

if (!hydrate) markHydrated()

router.isReady().then(() => {
  app.mount(container)
  markHydrated()
})
