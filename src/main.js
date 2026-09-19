import { createApp } from 'vue'
import './style.css'
// 必须在挂载前执行：给 md-editor-v3 注入本地 katex 实例，避免它运行时去 CDN 拉
import './plugins/katex'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
