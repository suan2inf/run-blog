---
title: "提升 VS Code 效率的 10 个技巧"
date: 2026-05-19
summary: "分享 VS Code 开发中实用的效率技巧，包括快捷键、多光标编辑、代码片段等常用功能。"
category: "工具与效率"
---
## 1. 命令面板（Ctrl+Shift+P）

这是最重要的快捷键，所有 VS Code 功能都可以从这里找到。

## 2. 多光标编辑

- `Alt+Click` 添加光标
- `Ctrl+D` 选中下一个相同词
- `Ctrl+Shift+L` 选中所有相同词

## 3. 代码片段

创建自定义代码片段可以大幅减少重复输入。

```json
{
  "Print to console": {
    "prefix": "log",
    "body": ["console.log($1);"],
    "description": "Log to console"
  }
}
```

## 4. 集成终端

使用 `Ctrl+`` 快速打开/关闭终端，配合 `Ctrl+Shift+`` 可以分屏。

## 总结

掌握这些技巧能显著提升日常开发效率。
