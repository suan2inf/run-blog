import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { sitemapPlugin } from './plugins/sitemap.js'
import { articlesManifestPlugin } from './plugins/articles-manifest.js'
import { feedPlugin } from './plugins/feed.js'

// https://vite.dev/config/
export default defineConfig({
  // articlesManifestPlugin：构建期生成文章元数据清单（正文懒加载的前提）
  // sitemapPlugin：构建时按 content/articles/ 生成 sitemap.xml 和 robots.txt
  // feedPlugin：构建时生成 RSS 订阅源 feed.xml
  plugins: [vue(), articlesManifestPlugin(), sitemapPlugin(), feedPlugin()],

  // GitHub Pages 项目站点是子路径：https://<用户名>.github.io/<仓库名>/
  // base 必须和仓库名一致，否则 CSS/JS/图标会 404。
  // 以后若绑定自定义域名（如 blog.example.com），改成 '/'。
  base: '/run-blog/',
})
