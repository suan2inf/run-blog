import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { sitemapPlugin } from './plugins/sitemap.js'

// https://vite.dev/config/
export default defineConfig({
  // sitemapPlugin 在构建时按 content/articles/ 生成 sitemap.xml 和 robots.txt
  plugins: [vue(), sitemapPlugin()],

  // GitHub Pages 项目站点是子路径：https://<用户名>.github.io/<仓库名>/
  // base 必须和仓库名一致，否则 CSS/JS/图标会 404。
  // 以后若绑定自定义域名（如 blog.example.com），改成 '/'。
  base: '/run-blog/',
})
