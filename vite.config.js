import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { sitemapPlugin } from './plugins/sitemap.js'
import { articlesManifestPlugin } from './plugins/articles-manifest.js'
import { feedPlugin } from './plugins/feed.js'

// https://vite.dev/config/
export default defineConfig({
  // articlesManifestPlugin：文章元数据清单 + 构建期渲染好的正文（.md?article）+ 全文搜索索引
  // sitemapPlugin：生成 sitemap.xml 和 robots.txt
  // feedPlugin：生成 RSS 订阅源 feed.xml
  plugins: [vue(), articlesManifestPlugin(), sitemapPlugin(), feedPlugin()],

  // GitHub Pages 项目站点是子路径：https://<用户名>.github.io/<仓库名>/
  // base 必须和仓库名一致，否则 CSS/JS/图标会 404，路由也会错位。
  // 以后若绑定自定义域名（如 blog.example.com），改成 '/'，同时改 src/site.js 的 SITE_ORIGIN。
  base: '/run-blog/',

  build: {
    // 预渲染脚本靠 manifest 找到每篇文章正文 chunk 的文件名，给页面加 modulepreload
    manifest: true,
  },
})
