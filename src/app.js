import { createApp as createClientApp, createSSRApp } from 'vue'
import App from './App.vue'
import { createAppRouter } from './router'

/**
 * 应用工厂：浏览器入口（entry-client.js）和预渲染入口（entry-server.js）共用。
 * hydrate = true 时用 createSSRApp，挂载时会「接管」预渲染好的 HTML 而不是重画一遍。
 */
export function createApp({ hydrate = false } = {}) {
  const app = hydrate ? createSSRApp(App) : createClientApp(App)
  const router = createAppRouter()
  app.use(router)
  return { app, router }
}
