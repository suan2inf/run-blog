# run-blog

纯静态个人博客。改一个 Markdown 文件 → push → 网站自动更新。没有后端、没有数据库、没有服务器。

- 技术栈：Vue 3 + Vite + Vue Router，构建时每个页面预渲染成静态 HTML
- 内容：`content/articles/` 下的 `.md` 文件
- 渲染：markdown-it + KaTeX（公式）+ Shiki（代码高亮），全部在构建时完成
- 地址：每篇文章是独立的真实地址，如 `https://suan2inf.github.io/run-blog/article/dspark`
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
| `tags` | 否 | 标签数组，写法 `[A, B]`；显示在卡片和文章页，可在博客页按标签筛选 |

正文从 frontmatter 下面的第一个 `---` 之后开始。正文开头如果是一级标题（`# xxx`），
渲染时会自动去掉（页面头部已经显示了 `title`，免得出现两遍）。

### 支持的写法

- 公式：行内 `$...$`，块级 `$$...$$`（单行或多行都行）。写错了会显示红色源码，不会让构建失败
- 代码块：` ```python ` 这样标上语言就有高亮，亮/暗主题自动切换，右上角有复制按钮
- 表格、引用、列表、删除线、内嵌 HTML 都正常支持
- 标题会自动生成锚点：链接形如 `.../article/dspark#核心思想`，宽屏下悬停标题点 `#` 可复制

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
`base: '/run-blog/'`，本地开发也要带这个路径前缀。改了文章页面会自动刷新。

构建产物预览（和线上完全一致，含预渲染）：

```bash
npm run build      # 浏览器构建 → 预渲染用的 Node 构建 → 逐页生成 HTML
npm run preview    # 默认 http://localhost:4173/run-blog/
```

> 以前的 `#/article/xxx` 形式的旧链接仍然能打开，会自动跳到新地址。

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
plugins/markdown.js    Markdown → HTML 的渲染器（公式、代码高亮、标题锚点、目录）
plugins/articles-manifest.js  文章元数据清单 + 每篇渲染好的正文 + 全文搜索索引
plugins/sitemap.js     构建时生成 sitemap.xml 和 robots.txt
plugins/feed.js        构建时生成 RSS 订阅源 feed.xml
scripts/prerender.js   构建最后一步：把每个页面渲染成静态 HTML
scripts/               其余是一次性工具脚本（含 og-cover.html，分享卡片的源文件）
src/site.js            站点地址、标题，以及名字、首页短句、自我介绍、联系方式（改文案来这里）
src/entry-client.js    浏览器入口；src/entry-server.js 预渲染入口；src/app.js 两边共用
src/head.js            每个页面的标题/摘要/分享卡片
src/data/articles.js   文章元数据、正文加载、搜索、标签
src/views/             Home / Blog / Article / About / NotFound
src/components/        Navbar / PostList / ArticleToc
.github/workflows/     自动部署流水线
```

> `content/articles/` 下**任何** `.md` 都会被构建打包上线，没写完的放 `drafts/`。

## 外观的几个可调项

| 位置 | 变量 / 规则 | 作用 |
|---|---|---|
| `src/style.css` | `--site-width: 1040px` | 全站内容宽度（导航、首页、文章正文共用，左边缘对齐） |
| `src/style.css` | `--accent` / `--accent-bg` | 强调色（墨蓝），亮暗两套 |
| `src/views/Article.vue` | `@media (min-width: 1480px)` | 从多宽的屏幕开始在正文右侧显示目录，窄了就收进右下角的目录按钮 |

目录是构建时从标题里收集的，只收最浅的两级（通常是 `##` 和 `###`）。

## 从旧版本迁移

`scripts/export_from_db.py` 是把旧 FastAPI + SQLite 版本的文章导成 Markdown 用的，已经跑过一次。
数据库里还有内容要补导的话：

```bash
python scripts/export_from_db.py <blog.db 路径> content/articles
```
