"""把 Backend/blog.db 里的文章导出成 Markdown 文件。

用法（在 run-blog 目录下）：
    python scripts/export_from_db.py <blog.db 路径> [输出目录]

默认输出到 content/articles/。文件名规则：<两位序号>-<slug>.md
其中 slug 由数据库里的英文 slug 字段决定，没有就退化成 article-<id>。
"""

import os
import re
import sqlite3
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(HERE)
DEFAULT_OUT = os.path.join(PROJECT_ROOT, 'content', 'articles')


def slugify(text, fallback):
    """把标题压成一个安全的英文/数字文件名，中文会被丢掉。"""
    text = (text or '').lower()
    text = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    return text or fallback


def yaml_str(value):
    """frontmatter 里的字符串值：统一用双引号包住并转义。"""
    return '"' + str(value).replace('\\', '\\\\').replace('"', '\\"') + '"'


def main():
    db_path = sys.argv[1] if len(sys.argv) > 1 else '/tmp/blog.db'
    out_dir = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_OUT

    if not os.path.isfile(db_path):
        sys.exit(f'找不到数据库文件：{db_path}')

    os.makedirs(out_dir, exist_ok=True)

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    categories = {
        row['id']: row['name']
        for row in conn.execute('SELECT id, name FROM categories')
    }

    rows = conn.execute(
        'SELECT id, title, content, summary, category_id, created_at '
        'FROM articles ORDER BY created_at ASC, id ASC'
    ).fetchall()

    if not rows:
        sys.exit('数据库里没有文章，什么都没导出。')

    written = []
    for index, row in enumerate(rows, start=1):
        created = (row['created_at'] or '')[:10] or '1970-01-01'
        slug = slugify(row['title'], f'article-{row["id"]}')
        filename = f'{index:02d}-{slug}.md'
        path = os.path.join(out_dir, filename)

        lines = ['---']
        lines.append(f'title: {yaml_str(row["title"])}')
        lines.append(f'date: {created}')
        if row['summary']:
            lines.append(f'summary: {yaml_str(row["summary"])}')
        if row['category_id'] and row['category_id'] in categories:
            lines.append(f'category: {yaml_str(categories[row["category_id"]])}')
        lines.append('---')
        lines.append('')

        body = (row['content'] or '').strip()
        text = '\n'.join(lines) + body + '\n'

        with open(path, 'w', encoding='utf-8', newline='\n') as handle:
            handle.write(text)

        written.append(filename)
        print(f'导出 {filename}  ({len(body)} 字符)')

    conn.close()
    print(f'\n完成：{len(written)} 篇文章 → {out_dir}')


if __name__ == '__main__':
    main()
