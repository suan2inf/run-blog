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
  → 默认做法是你自己在本机终端跑构建；**如果助手申请了 `danger-full-access` 提权并获你同意，
  它就能自己跑 `npm run build` 验证**（2026-09 已确认可行，构建本身无写区外文件的需求）。
- **`github.com`、`api.github.com`、`raw.githubusercontent.com` 在本机被 DNS 解析到非公网地址**，
  助手读不到仓库和 Actions 页面。但 **`*.github.io` 可读**，所以线上站点内容是可以验证的。
- npm 缓存目录在工作区外会被拒，需要 `npm install --cache "$env:TEMP\dsh-npm-cache"`。

### 5. GitHub Pages 缓存
更新后看不到变化先 `Ctrl+Shift+R`，别怀疑代码。

---

## 五、当前文章状态

两篇：`dspark.md`（DSpark 论文精读，5 节 33 个小节）和
`dspark-edge-cloud.md`（端云迁移推演，结论是走不通）。

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
plugins/articles-manifest.js  构建期生成文章元数据清单虚拟模块（正文懒加载的前提）
plugins/sitemap.js       构建时生成 sitemap.xml + robots.txt
scripts/export_from_db.py  旧 SQLite → Markdown 的一次性脚本，已跑过
src/data/text-utils.js   纯文本工具（frontmatter 解析/字数统计），前端和构建插件共用
src/data/articles.js     元数据 + 正文懒加载 + 搜索索引 + 标签集合 + 上下篇
src/composables/useTheme.js  全局主题状态（Navbar 和 Article 的渲染器共用）
src/utils/format.js      formatDate / formatCount 展示工具
src/plugins/katex.js     公式渲染
src/views/               Home / Blog / Article / About / NotFound
src/components/          Navbar / ArticleCard
src/style.css            主题变量（含背景光晕配色）
```

**2026-09-21 加过的一轮功能**（版式打磨 + 阅读体验，均为纯前端实现）：

- 文章页：顶部阅读进度条、字数/阅读时长 meta、标签、上一篇/下一篇、回到顶部按钮、
  窄屏浮动目录抽屉（`Teleport` 到 body，第二个 `MdCatalog` 实例；挂载时目录组件会
  主动向预览要数据，所以晚挂载也拿得到）
- 目录点击跳转加了 `scrollElementOffsetTop: 80`，标题不再被 64px 吸顶导航盖住
- `MdPreview`/`MdCatalog` 现在传 `:theme` 跟随站点主题（暗色下代码高亮不再亮瞎）
- 博客页：即时搜索（输入停 250ms 用 `router.replace` 同步进 URL，不刷历史记录）、
  标签筛选 chips（`?tag=` 参数）
- 全站：路由淡入过渡、选区色、`focus-visible` 焦点框、`prefers-reduced-motion` 兼容、
  `index.html` 内联主题脚本防暗色首屏闪白、每页 `document.title`（router `afterEach`）
- 文章卡片整卡是 `<router-link>`（键盘可达、可右键新标签打开），不再是 div + @click

**第二轮（技术博客向）**：

- **标题锚点分享**：hover 标题出现 `#` 按钮（≥1200px 才有左侧 gutter），点击复制
  `#/article/slug?h=标题id` 形式的链接并写进地址栏；打开这种链接会自动滚到对应小节。
  注意不能用 `<a href="#id">`——hash 路由里 `#` 是路由的地盘，真锚点会炸路由。
  实现挂在 `MdPreview` 的 `@onHtmlChanged` 上（渲染完标题才有 id），重复触发靠
  data 标记防重。`scrollBehavior` 里对「文章页内只改 query」放行不滚顶（不然点锚点会
  弹回顶部）；`scrollToQueryHeading` 有 `scrolledForHeading` 去重，不然切主题重渲染会
  把读者拽回锚点。
- **正文外链自动 `target="_blank" rel="noopener noreferrer"`** + `↗` 角标
- 代码块行号：`MdPreview :showCodeRowNumber="true"`（等文章有代码块时生效）
- 文章页脚「在 GitHub 上编辑此页」直达仓库编辑页
- 打印样式（`@media print`）：隐藏导航/页脚/目录/浮动按钮，只留正文，方便存 PDF
- 404 页（`src/views/NotFound.vue`），未知路径不再静默跳首页
- 主题按钮换 SVG 图标（emoji 跨平台渲染不一致）；博客页按 `/` 聚焦搜索框

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
  是否正常，需要放一张真图验证。图片点击放大是 MdPreview 自带的（`noImgZoomIn` 默认关，
  即默认允许放大），等文章有图时一起看
- **移动端没真机验过**：断点都是桌面浏览器拖窗口试的；窄屏目录抽屉建议真机过一遍
- 复制代码按钮、代码行号：md-editor-v3 自带/已开，等文章里有代码块时验证（目前两篇都没有）
- RSS feed：文章量太少，暂时不值

## 七点六、第四轮改动（2026-09-21）：定位校准 + 文案定调

**用户画像（调查结论，别再搞错）**：普通大学生，博客 = 学习笔记 + 作品集，
主要用途是找工作时给人看；方向是 AI Infra / 推理引擎 / 系统。
**内容会很多很杂，文案里不要明写内容分类**（用户原话：明写太多很难分类）。
**文案气质定调为「朴素学生气」**：谦虚直接，不要口号式标语。
（反面教材：「把论文读薄，把工程想透」「算力有穷，思考不尽」都被否了，太装。）

本轮功能：
- RSS 订阅源 `feed.xml`（`plugins/feed.js`，复用 buildManifest；hash 链接阅读器能打开）
- 悬停/聚焦文章卡片预拉正文 chunk（点击零等待）；上下篇卡片同理
- 首页最新文章为 featured 头条卡（占满整行 + 「最新」角标）
- 「跳到主要内容」skip link（仅键盘聚焦时可见）
- OG 分享卡片 `public/og-cover.png`：源文件 `scripts/og-cover.html`，
  用 Edge 无头截图重新生成（命令写在源文件注释里）；hash 路由没法给每篇文章
  单独 OG 图，全站共用这一张
- 首页 hero 下加了 GitHub / Email / RSS 链接行（求职场景直达）

参考站（用户认可的审美）：https://blog.dejavu.moe/ —— Hugo + PaperMod，
个人化、真诚、内容杂（技术+生活）。**经验：先问用户再定文案。**
归档页/友链/Now 页没做：文章太少时是空架子，等文章超过 15 篇再加归档。

## 七点五、第三轮改动（2026-09-21）：正文懒加载 + 视觉改版

### 正文懒加载
文章对象上**没有 content 字段**了。元数据由 `plugins/articles-manifest.js` 在构建时
生成（虚拟模块 `virtual:articles-manifest`），正文每篇一个 chunk：
`loadArticleContent(slug)` 按需拉、带缓存；全文搜索第一次用时 `ensureFullTextIndex()`
拉全部正文。改文章后 dev 模式会整页刷新（清单没有细粒度 HMR）。
**注意**：`src/data/text-utils.js` 被前端和两个构建插件同时 import，别在里面用
浏览器 API 或 Vue。

### 视觉体系
- 品牌色从通用蓝换成**紫罗兰**（`--accent: #7c3aed`），和 favicon 的紫色同族；
  想换色改 `src/style.css` 的 `--accent / --accent-hover / --accent-bg / --accent-soft /
  --bg-blob-1/2`（亮暗两套）即可，全站都走变量
- 全站统一的标题记号：**品牌色渐变短竖线**（页面 h1、区块 h2、正文 h2 左侧）。
  ⚠️ 教训：之前试过 Markdown 梗装饰（`#`/`##` 前缀、品牌名闪烁光标），用户反馈不美观，
  已撤掉——装饰要克制，别再加这类 gimmick
- **品牌符号是自设计的 ∞（双纽线）**：呼应站名「算不尽」= Suan to infinity。
  `public/favicon.svg` 和 Navbar 品牌标是同一个 path（四段贝塞尔拼成，中心交叉处
  两段曲线方向严格相反保证平滑），紫罗兰渐变描边；首页 Hero 右侧还有超大号极淡的
  ∞ 水印（≥1280px 才出现）。旧的闪电 favicon 是随便下的，已废弃
- 等宽字体（`--font-mono`）用于日期/字数/标签等「数据感」小字
- 首页 Hero：等宽眉题（TECH NOTES · LEARNING LOG）+ 标题末段渐变
  （`background-clip: text`，有 `@supports` 兜底）
- 卡片 hover 左侧渐变线划入；阅读进度条是 accent → accent-soft 渐变

### 验证方式新增
本机有 Edge，可以无头截图验证视觉效果：
`& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu --window-size=1440,900 --virtual-time-budget=6000 --screenshot=out.png <url>`
（当前模型不看图，截图为证即可；真眼检查靠人）
