/**
 * 展示用的小工具，之前 formatDate 在 Home / ArticleCard / Article 里各抄了一份。
 */

/** '2026-07-06' → '2026年7月6日'；空值返回空串。 */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** 字数展示：过万用「x.x 万」压缩，否则原样。 */
export function formatCount(n) {
  const num = Number(n) || 0
  return num >= 10000 ? `${(num / 10000).toFixed(1)} 万` : String(num)
}
