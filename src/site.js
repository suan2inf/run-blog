/**
 * 站点级常量。前端（head 管理）和构建插件（sitemap / feed / 预渲染）共用，
 * 所以这里只能是纯数据，别 import Vue 或浏览器 API。
 *
 * 站点完整地址 = SITE_ORIGIN + base（vite.config.js），例如
 * https://suan2inf.github.io + /run-blog/ → https://suan2inf.github.io/run-blog/
 * 以后绑定自定义域名：改 SITE_ORIGIN，并把 vite.config.js 的 base 改成 '/'。
 */
export const SITE_ORIGIN = 'https://suan2inf.github.io'

export const SITE_TITLE = '算不尽的博客'

export const SITE_DESCRIPTION = '一名普通大学生的学习笔记：论文精读、技术分享、踩坑记录。'

export const REPO_URL = 'https://github.com/suan2inf/run-blog'

/* ---------- 个人信息（首页、关于页、页脚共用） ---------- */
export const AUTHOR = '算不尽'

export const GITHUB_URL = 'https://github.com/suan2inf'

export const EMAIL = '3662927683@qq.com'

/** 首页名字下面的几句话，每一项一行 */
export const TAGLINE = ['迎着风，迎向远方的天空', '路上也有艰难，也有那解脱，都走得从容']

/** 自我介绍（首页显示；关于页在它后面再补几句） */
export const INTRO =
  '我是算不尽，一名大二男生，在绵阳师范学院读数学，正朝着 AI 推理引擎的方向学习。' +
  '希望将来能亲手做出高效的推理引擎，为通往 AGI 的未来出一份力。'

/** base 形如 '/run-blog/'，拼出带结尾斜杠的站点根地址。 */
export function siteUrlFor(base) {
  const path = `/${String(base || '/').replace(/^\/+|\/+$/g, '')}/`.replace(/\/+/g, '/')
  return `${SITE_ORIGIN}${path}`
}
