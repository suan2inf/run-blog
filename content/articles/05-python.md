---
title: "Python 异步编程入门"
date: 2026-05-19
summary: "从零开始理解 Python 异步编程，掌握 async/await 和 asyncio 的基本用法。"
category: "后端开发"
---
## 为什么需要异步

传统的同步 IO 会阻塞线程，异步编程可以让程序在等待 IO 时处理其他任务。

```python
import asyncio

async def fetch_data(url):
    await asyncio.sleep(1)
    return f"Data from {url}"

async def main():
    tasks = [fetch_data(f"url{i}") for i in range(10)]
    results = await asyncio.gather(*tasks)
    return results
```

## async/await

`async` 声明一个协程，`await` 等待协程完成。

## 总结

异步编程能极大提升 IO 密集型应用的性能。
