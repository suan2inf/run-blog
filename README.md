# run-blog

纯静态个人博客。改一个 Markdown 文件 → push → 网站自动更新。没有后端、没有数据库、没有服务器。

- 技术栈：Vue 3 + Vite + Vue Router（hash 模式）
- 内容：`content/articles/` 下的 `.md` 文件，构建时打包进 JS
- 渲染：md-editor-v3 的 `MdPreview`
- 部署：GitHub Actions → GitHub Pages

## 怎么写一篇文章

在 `content/articles/` 下新建一个 `.md` 文件，文件名就是文章的 URL 标识（**用英文和短横线，别用中文**）。

比如新建 `content/articles/docker-multi-stage.md`：

```markdown
---
title: "Docker 多阶段构建实践"
date: 2026-06-01
summary: "记录一次把镜像从 1.2G 压到 80M 的过程"
category: "云原生"        # 可选，只是显示用的文字标签
tags: [Docker, Nginx]     # 可选
---

## 背景

正文用 Markdown 写……
```

然后：

```bash
git add content/articles/docker-multi-stage.md
git commit -m "新增文章：Docker 多阶段构建"
git push
```

推送后 GitHub Actions 会自动构建并部署，一两分钟后线上就是新的了。

### frontmatter 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | 是 | 文章标题 |
| `date` | 是 | 格式 `YYYY-MM-DD`，用于排序（新的在前） |
| `summary` | 否 | 列表页摘要，不写就自动截正文前 100 字 |
| `category` | 否 | 分类名，仅作文案展示 |
| `tags` | 否 | 标签数组，写法 `[A, B]` |

正文从 frontmatter 下面的第一个 `---` 之后开始。

### 图片怎么放

放在 `public/images/` 下，正文里用绝对路径引用（`base` 会自动带上）：

```markdown
![截图](/images/docker-build.png)
```

## 本地预览

```bash
npm install
npm run dev
```

打开终端提示的地址（默认 http://localhost:5173/run-blog/ ）。注意 `vite.config.js` 里
`base: '/run-blog/'`，本地开发也要带这个路径前缀。

构建产物预览：

```bash
npm run build
npm run preview
```

## 部署配置（一次性）

1. 在 GitHub 新建仓库，名字必须是 `run-blog`（和 `vite.config.js` 里的 `base` 一致）
2. 推代码到 `main` 分支
3. 仓库 **Settings → Pages → Source** 选 **GitHub Actions**
4. 仓库 **Settings → Actions → General → Workflow permissions**
   选 **Read and write permissions**，保存

> ⚠️ 第 4 步很容易漏。默认的 "Read repository contents" 权限下，
> `deploy` 步骤拿不到 `id-token`，会在 6 秒内失败，而 `build` 步骤是成功的
> ——表现为"构建过了但部署失败"。跳过这步的话，流水线必须重跑一次才会生效。

5. 等 Actions 跑完，访问 `https://<你的用户名>.github.io/run-blog/`

> 如果仓库名不是 `run-blog`，把 `vite.config.js` 里的 `base` 改成 `/<仓库名>/`。
> 如果绑定了自定义域名，把 `base` 改成 `'/'`。
>
> GitHub Pages 对 `index.html` 有缓存，更新后看不到变化就先 `Ctrl+Shift+R` 强刷。

## 目录结构

```
content/articles/      文章 Markdown（你唯一需要天天碰的地方）
drafts/                未定稿的草稿，不参与构建、不会发布
scripts/               一次性工具脚本
plugins/sitemap.js     构建时按文章列表生成 sitemap.xml 和 robots.txt
src/data/articles.js   构建时读 md、解析 frontmatter、排序、搜索
src/views/             Home / Blog / Article / About 四个页面
src/components/        Navbar / ArticleCard
src/plugins/katex.js   把 katex 注入 md-editor-v3，公式渲染不依赖 CDN
.github/workflows/     自动部署流水线
```

> `content/articles/` 下**任何** `.md` 都会被构建打包上线，没写完的放 `drafts/`。

## 文章页的几个可调项

`src/views/Article.vue` 的样式里：

| 变量 / 规则 | 作用 |
|---|---|
| `--article-width: 1040px` | 正文宽度，改大改小都行 |
| `--toc-width: 230px` | 左侧目录宽度 |
| `@media (min-width: 1460px)` | 目录从多宽的屏幕开始显示，太窄会自动隐藏 |

文章页右侧的目录由 md-editor-v3 的 `MdCatalog` 生成，靠 `editorId` 与 `MdPreview` 配对。
**两个组件的 id 必须一致**，否则目录不渲染。

## 从旧版本迁移

`scripts/export_from_db.py` 是把旧 FastAPI + SQLite 版本的文章导成 Markdown 用的，已经跑过一次。
数据库里还有内容要补导的话：

```bash
python scripts/export_from_db.py <blog.db 路径> content/articles
```
