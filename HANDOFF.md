# 交接文档

给未来的自己（和 AI 助手）看的状态记录。**日常写文章不需要读这个**，写文章的说明在 `README.md`。

最后更新：2026-09-19

---

## 一、这是什么

从旧的 FastAPI + Vue 全栈博客改造来的**纯静态博客**。

- 旧项目原封不动留在上一级目录（`frontend/`、`Backend/`），随时可对照
- 新项目就是这个仓库，没有后端、没有数据库、没有服务器
- 文章是仓库里的 `.md` 文件，构建时被打包进 JS

**线上地址**：https://suan2inf.github.io/run-blog/
**仓库**：https://github.com/suan2inf/run-blog（public）

---

## 二、写一篇文章的完整流程

```powershell
cd run-blog

# 1. 在 content/articles/ 下新建 xxx.md（文件名用英文，它就是 URL）
#    必须写 frontmatter：title / date / summary

# 2. 本地预览（可选）
npm run dev          # 打开 http://localhost:5173/run-blog/  ← 注意路径后缀

# 3. 推送
git add content/articles/xxx.md
git commit -m "新增文章：xxx"
git push
```

推完等 Actions 跑完（约 1 分钟），**`Ctrl+Shift+R` 强刷页面**。

> 详细字段说明、图片放法、frontmatter 格式规则 → 见 `README.md`

---

## 三、部署链路（一次性配好的，别乱动）

1. **Settings → Pages → Source = GitHub Actions**
2. **Settings → Actions → General → Workflow permissions = Read and write permissions**

第 2 条是踩过的坑：不设的话 `deploy` 步骤会在 6 秒内失败，而 `build` 步骤是成功的。

**改 `vite.config.js` 里的 `base` 会连带影响三处**：资源路径、路由、以及 `plugins/sitemap.js`
生成的 sitemap 里的站点地址（插件从 `base` 反推仓库名）。

---

## 四、踩过的坑（都会再遇到）

### 1. `content/articles/` 下任何 `.md` 都会被发布
没写完的草稿放 `drafts/`（不参与构建）。曾经因为把"草稿位置说明"写成 HTML 注释、
成稿时又忘了补 frontmatter，导致线上标题显示成文件名 `dspark`。

### 2. 公式渲染依赖本地 katex 注入
`src/plugins/katex.js` 必须在 `main.js` 里**于挂载前** import。
md-editor-v3 默认会从 CDN 拉 katex，注入本地实例后才会跳过。
这个文件里改了一处 md-editor-v3 的内部 API 用法（`config()` 是函数不是对象），
**升级 md-editor-v3 后要重新验证公式**。

### 3. 目录（TOC）的 id 生成不能依赖渲染序号
`MdCatalog` 和 `MdPreview` 靠 `editorId` 配对，标题 id 由 `mdHeadingId` 生成。
库里给回调传的 `index` 是"已渲染标题数"，一旦有标题被跳过就整体错位，
表现为**目录只有前几项能跳**。现在改成按标题文本确定性生成（纯数字开头时加 `s-` 前缀，
避免 id 以数字打头、当 CSS 选择器非法）。

### 4. 环境限制（这条只影响和 AI 助手协作）
- **DSH 沙箱**（workspace-write 模式）下无法执行 `npm run build` 和 `npm run dev`：
  Vite 需要 `child_process` 管道，会被拒 `spawn EPERM`。
  → **所有构建/预览验证必须你自己在本机终端跑**，助手只能做静态代码和逻辑验证。
- **`github.com`、`api.github.com`、`raw.githubusercontent.com` 在本机被 DNS 解析到非公网地址**，
  助手读不到仓库和 Actions 页面。但 **`*.github.io` 可读**，所以线上站点内容是可以验证的。
- npm 缓存目录在工作区外会被拒，需要 `npm install --cache "$env:TEMP\dsh-npm-cache"`。

### 5. GitHub Pages 缓存
更新后看不到变化先 `Ctrl+Shift+R`，别怀疑代码。

---

## 五、当前文章状态

只有一篇：`content/articles/dspark.md`（DSpark 论文精读，5 节 33 个小节，约 8000 汉字）。

**已定稿并上线**，但有两处待办：

1. **内部矛盾未决**：文中 §5.5 只写了"训练侧传隐状态"，而 DSpark 实际是
   **特征级接口族**（推理时草稿器要吃 target 的隐状态，靠 KV injection）。
   现在文章里两边都不站，只客观描述训练侧机制。要不要补推理侧、怎么表述，**待定**。
2. **来源标注**：文章里 §1.1 / §5.5 有部分内容是从 arXiv:2607.05147 原文补的，
   不在原始笔记里。当时决定**不加引用**（DSpark 足够有名），保持现状即可。

---

## 六、文件地图

```
content/articles/        文章（唯一天天碰的地方）
drafts/                  草稿，不发布
plugins/sitemap.js       构建时生成 sitemap.xml + robots.txt
scripts/export_from_db.py  旧 SQLite → Markdown 的一次性脚本，已跑过
src/data/articles.js     读 md、解析 frontmatter、排序、搜索
src/plugins/katex.js     公式渲染
src/views/               Home / Blog / Article / About
src/components/          Navbar / ArticleCard
src/style.css            主题变量（含背景光晕配色）
```

**常调的参数**：

| 位置 | 变量 | 作用 |
|---|---|---|
| `src/views/Article.vue` | `--article-width: 1040px` | 正文宽度 |
| `src/views/Article.vue` | `--toc-width: 230px` | 目录栏宽度 |
| `src/views/Article.vue` | `@media (min-width: 1460px)` | 目录从多宽开始出现 |
| `src/style.css` | `--bg-blob-1/2`、`--bg-dot` | 背景光晕和点阵的颜色（亮/暗各一套） |

---

## 七、想做但还没做的

- **图片没实测过**：`public/images/` + `/images/x.png` 的引用方式在有 `base` 前缀时
  是否正常，需要放一张真图验证
- **移动端没验过**：所有断点都是原项目带的，宽度改过三处
- **文章的版式打磨**（用户提过，尚未开始）
- 复制代码按钮、图片点击放大：md-editor-v3 应该自带，等文章里有代码块/图片时验证
- RSS feed：文章量太少，暂时不值
