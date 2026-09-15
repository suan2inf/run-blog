---
title: "FastAPI 项目结构最佳实践"
date: 2026-05-19
summary: "介绍 FastAPI 项目的推荐目录结构和最佳实践，包括路由分离、依赖注入等核心设计模式。"
category: "后端开发"
---
## 项目结构

一个成熟的 FastAPI 项目推荐使用以下目录结构：

```
project/
├── main.py          # 应用入口
├── models.py        # 数据库模型
├── schemas.py       # Pydantic 模型
├── crud.py          # 数据库操作
├── database.py      # 数据库连接
└── router/
    ├── __init__.py
    ├── articles.py
    └── users.py
```

## 路由分离

使用 `APIRouter` 将不同模块的路由分离到单独文件中，保持代码整洁。

## 依赖注入

FastAPI 的 `Depends` 是依赖注入的强大工具：

```python
from fastapi import Depends
from sqlalchemy.orm import Session
from database import get_db

@app.get("/items")
def read_items(db: Session = Depends(get_db)):
    return db.query(Item).all()
```

## 总结

良好的项目结构是项目可维护性的基础，一开始就规划好结构能避免后期的重构成本。
