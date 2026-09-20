import { createApp } from 'vue'
import './style.css'
// 必须在挂载前执行：给 md-editor-v3 注入本地 katex 实例，避免它运行时去 CDN 拉
import './plugins/katex'
import App from './App.vue'
import router from './router'
import { initTheme } from './composables/useTheme'

// index.html 的内联脚本已经设过 data-theme 防闪烁，这里读入状态并挂「跟随系统」监听
initTheme()

createApp(App).use(router).mount('#app')
