/**
 * KaTeX 集成。
 *
 * md-editor-v3 默认是运行时从 CDN（unpkg）动态插入 katex 的 <script> 和 <link>，
 * 见 md-editor-v3/lib/es/chunks/index3.mjs 里那段 O("script", {...})。
 * 那样有两个问题：站点多一个外部依赖，CDN 不通时公式直接不渲染。
 *
 * 做法是把本地 katex 实例注册进 md-editor-v3 的全局配置：库启动时先读
 * editorExtensions.katex.instance，拿到实例就跳过 CDN 加载。
 *
 * 这个模块必须在渲染前同步执行完（main.js 里 import 在 mount 之前）。
 */
import katex from 'katex'
import { config } from 'md-editor-v3'
// 库内部的默认配置对象（源码里读的就是它上面的 editorExtensions.katex.instance）。
// 这个 chunk 是压缩过的，导出名 g 就是它，换个版本可能会变——所以下面做存在性判断。
import { g as defaultConfig } from 'md-editor-v3/lib/es/chunks/config.mjs'

// 主路径：官方 API，实现是 deepMerge(库内部默认配置, 传入的配置)
config({
  editorExtensions: {
    katex: {
      instance: katex,
    },
  },
})

// 兜底：直接落到库内部读取的那个对象上
if (defaultConfig?.editorExtensions?.katex) {
  defaultConfig.editorExtensions.katex.instance = katex
}

// 字体文件由 katex 包自带，Vite 会一并打包并改写 url()
import 'katex/dist/katex.min.css'
