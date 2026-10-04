/**
 * 展示用的小工具，几个页面共用。
 */

/**
 * '2026-07-06' → '2026年7月6日'；空值返回空串。
 * 直接拆字符串，不经过 Date：new Date('2026-07-06') 是 UTC 零点，
 * 西半球的读者按本地时区显示会变成前一天，预渲染（构建机时区）和浏览器也可能对不上。
 */
export function formatDate(dateStr) {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(dateStr || ''))
  if (!match) return String(dateStr || '')
  const [, year, month, day] = match
  return `${year}年${Number(month)}月${Number(day)}日`
}

/** 字数展示：过万用「x.x 万」压缩，否则原样。 */
export function formatCount(n) {
  const num = Number(n) || 0
  return num >= 10000 ? `${(num / 10000).toFixed(1)} 万` : String(num)
}
