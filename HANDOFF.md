# 交接文档

给未来的自己（和 AI 助手）看的状态记录。**日常写文章不需要读这个**，写文章的说明在 `README.md`。

最后更新：2026-10-05（第五轮：预渲染 + 构建期 Markdown，见「七点七」，**架构变了，先读那节**；
第六轮：视觉改版，见「七点八」）

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

**改 `vite.config.js` 里的 `base` 会连带影响**：资源路径、路由、正文里的站内链接/图片、
sitemap / feed / canonical / og:url 里的站点地址。站点域名在 `src/site.js` 的 `SITE_ORIGIN`，
绑自定义域名时两处一起改。

---

## 四、踩过的坑（都会再遇到）

### 1. `content/articles/` 下任何 `.md` 都会被发布
没写完的草稿放 `drafts/`（不参与构建）。曾经因为把"草稿位置说明"写成 HTML 注释、
成稿时又忘了补 frontmatter，导致线上标题显示成文件名 `dspark`。

### 2. ~~公式渲染依赖本地 katex 注入~~（第五轮已废弃）
md-editor-v3 已移除。公式在构建时由 `plugins/markdown.js` 调 KaTeX 渲染成 HTML，
浏览器只加载 KaTeX 的 CSS 和字体，不再有运行时注入/CDN 的问题。

### 3. 标题 id 由文本确定性生成
规则在 `plugins/markdown.js` 的 `headingId()`，和 md-editor-v3 时期完全一致
（纯数字开头加 `s-` 前缀），所以以前分享出去的小节链接 id 不变。同名标题会加 `-1`、`-2` 去重。
**别改这个规则**，改了旧的小节链接就失效了。

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
plugins/markdown.js      Markdown → { html, toc, text }（KaTeX、Shiki、标题 id、链接/图片补 base）
plugins/articles-manifest.js  元数据清单 + .md?article 正文模块 + virtual:search-index
plugins/sitemap.js / feed.js  sitemap.xml + robots.txt / feed.xml
scripts/prerender.js     构建最后一步：逐页预渲染 + 每页 head + 404.html
scripts/export_from_db.py  旧 SQLite → Markdown 的一次性脚本，已跑过
src/site.js              站点地址/标题/描述 + 名字、短句、自我介绍、联系方式（前端和构建脚本共用）
src/app.js               应用工厂；entry-client.js 浏览器入口（水合）；entry-server.js 预渲染入口
src/head.js              每页 head（预渲染写入 + 站内跳转时更新）
src/data/text-utils.js   纯文本工具（frontmatter 解析/字数统计），前端和构建插件共用
src/data/articles.js     元数据 + 正文懒加载 + 搜索索引 + 标签集合 + 上下篇
src/composables/useTheme.js  全局主题状态
src/composables/useHydrated.js  「浏览器接管完成」标记，依赖 URL 参数的展示用
src/utils/format.js      formatDate / formatCount 展示工具
src/views/               Home / Blog / Article / About / NotFound
src/components/          Navbar / PostList（按年份分组的文章列表）/ ArticleToc
src/style.css            设计变量（颜色、宽度、字体）+ 全局重置
```

> 下面「2026-09-21」两轮里提到 MdPreview / MdCatalog / `?h=` 的实现细节已被第五轮替换，
> 功能都保留了，实现以「七点七」和代码为准。

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

- **图片没用真图测过**：`/images/x.png` 构建时会自动补成 `/run-blog/images/x.png`（单测过），
  第一次放图时看一眼。图片点击放大随 md-editor-v3 一起没了，需要的话再加
- **移动端没真机验过**：无头浏览器 390px 宽度过了一遍，真机建议再看
- 代码块行号没做（md-editor-v3 时期有），有需要再加

## 七点八、第六轮改动（2026-10-05）：视觉改版「简洁个人风」

**用户反馈（别再犯）**：旧版「太花、像模板」（紫色渐变、光晕、点阵、∞ 水印、标题渐变竖条、
卡片浮起），「首页布局别扭」（一张通栏卡片 + 一张小卡片），「看不出是谁的博客」。
**∞ 标志用户明确说很尴尬，别再用。** 参考站仍是 https://blog.dejavu.moe/ 。
流程经验：先出设计稿截图讨论，用户拍板后再改正式代码。

**现行设计**：
- 单栏，导航/首页/文章/页脚共用一个宽度 `--site-width: 1040px`，左边缘始终对齐。
  文章正文是**宽版**（用户选的，约 990px），宽屏（≥1480px）目录放在正文右侧留白里
- 颜色：近白底 + 黑灰文字 + 唯一强调色**墨蓝**（`--accent` 亮 `#2c5d8f` / 暗 `#86acd6`），
  只用在链接、悬停、当前目录项上。变量全在 `src/style.css` 顶部，亮暗各一套
- 没有任何渐变/阴影装饰；标题层级只靠字号、字重、间距
- 导航不吸顶，纯文字「算不尽」+「文章 / 关于」+ 主题按钮，窄屏也不需要汉堡菜单
- 首页：头像 + 名字 + 两行短句 + 自我介绍 + GitHub/Email/RSS，下面是按年份分组的文章列表
  （`src/components/PostList.vue`，「文章」页共用）。文章页去掉了分页，列表本身就能承载很多篇
- 名字统一：导航/首页/页脚叫「算不尽」，浏览器标题「算不尽的博客」，Suan2INF 只留在 GitHub 链接里

**改文案去哪**：名字、两行短句（`TAGLINE`）、自我介绍（`INTRO`）、GitHub、邮箱都在
`src/site.js`；关于页的「学校/方向/志向」在 `src/views/About.vue`。

**图片资源**：
- `public/avatar.webp`：头像，256px，从 `picture/` 里的原图裁的（中心约 (460,455)、边长 620 的正方形）
- `public/favicon.svg`：墨蓝圆角方块 + 白色「算」（SVG 文字，字形取访客系统字体）；
  `public/apple-touch-icon.png` 是同样设计的 180px PNG（用 Pillow + 微软雅黑粗体画的）
- `public/og-cover.png`：分享卡片，源文件 `scripts/og-cover.html`（头像 + 站名 + 短句），
  重新生成的命令写在源文件注释里

## 七点七、第五轮改动（2026-10-05）：预渲染 + 构建期 Markdown（架构调整）

**为什么改**：原来是 hash 路由 + 浏览器里渲染 Markdown。抓取线上首页只能拿到一个标题
「算不尽的博客」，正文一个字都没有——搜索引擎收录不了文章（hash 后面的部分会被忽略，
sitemap 等于只有一条），微信/QQ 链接预览也读不到每篇文章自己的标题摘要。
另外首页要下载约 378KB 的 JS（KaTeX 打在主包里），文章页再加 160KB 的编辑器运行时。

**现在的链路**（`npm run build` 依次执行）：
1. `vite build` → `dist/`：浏览器产物
2. `vite build --ssr src/entry-server.js --outDir dist-ssr`：同一套 Vue 代码的 Node 版
3. `node scripts/prerender.js`：逐个路由渲染，写出 `index.html`、`blog.html`、`about.html`、
   `article/<slug>.html`，每页带自己的 title/description/canonical/og/JSON-LD；
   再写一个空壳 `404.html`（未知地址由前端路由显示 404 页）。最后删掉 `dist-ssr/` 和 `dist/.vite/`

GitHub Pages 会把 `/run-blog/article/dspark` 自动对应到 `article/dspark.html`
（本地 `vite preview` 也是这样）。**推上去后第一件事：打开一篇文章直接刷新，确认不是 404。**

**Markdown**：`plugins/markdown.js`（markdown-it + KaTeX + Shiki），由 `articles-manifest.js`
插件以 `content/articles/x.md?article` 模块的形式提供 `{ html, toc }`，每篇一个 chunk。
全文搜索用的纯文本是另一个虚拟模块 `virtual:search-index`，第一次搜索才拉。
正文开头的 `# 一级标题` 会被去掉（两篇文章原来都是标题显示两遍）。

**路由**：普通路径（`createWebHistory`）。旧的 `#/article/x?h=小节` 链接由 `index.html`
最前面的内联脚本 `location.replace` 到 `article/x#小节`。小节链接现在就是真正的 `#id`。
进入文章页前路由守卫先 await 正文 chunk（`router.beforeResolve`），chunk 加载失败
（通常是刚重新部署、旧文件名没了）就整页跳转。

**写组件的新规矩（不然水合会对不上）**：
- `setup` 里别直接碰 `window` / `document` / `localStorage`，放进 `onMounted`
- 别按主题 `v-if` 分支渲染（预渲染时不知道读者主题），用 CSS `[data-theme]` 切换，
  参考 Navbar 的太阳/月亮图标
- 依赖 URL 查询参数的展示（博客页 `?q=` `?tag=`）用 `useHydrated()` 等接管完成后再生效
- `Teleport` 只在挂载后渲染（Article.vue 的目录抽屉 `v-if="mounted"`）
- 日期格式化别用 `new Date('YYYY-MM-DD')`（UTC 零点，跨时区会差一天），见 `src/utils/format.js`

**体积**（gzip）：主 JS 约 50KB（原来未压缩 378KB 的主包 + 161KB 文章 chunk），
dspark 正文 chunk 约 24KB。页面组件改成静态 import，所以全站 CSS 一个文件，预渲染页面首屏就有样式。

**验证情况**：本机 build + preview，用无头 Edge 走过：首页水合、卡片跳转、`#小节` 直开定位、
点标题锚点、旧 hash 链接跳转、`?tag=` 直开、全文搜索、代码块亮/暗高亮、404 空壳、
移动端目录抽屉，控制台无报错、无水合不匹配。**没验证**：GitHub Pages 线上行为（需要推送后看）、
真机移动端、真实图片。

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

### 视觉体系（⚠️ 第六轮已整体废弃，现行设计见「七点八」，这段只留作历史）
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
