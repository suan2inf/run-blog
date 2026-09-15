---
title: "Vue 3 组合式 API 入门指南"
date: 2026-05-19
summary: "Vue 3 组合式 API 的核心概念与实战用法，包括 setup、ref、reactive 等基础 API 的详细介绍。"
category: "前端开发"
---
## 什么是组合式 API

Vue 3 引入的组合式 API（Composition API）是一种全新的组件逻辑组织方式。它与传统的选项式 API 相比，提供了更好的逻辑复用和类型推导。

## setup 函数

`setup()` 是组合式 API 的入口，在组件创建之前执行。

```javascript
import { ref, onMounted } from 'vue'

export default {
  setup() {
    const count = ref(0)
    
    function increment() {
      count.value++
    }
    
    onMounted(() => {
      console.log("组件已挂载")
    })
    
    return { count, increment }
  }
}
```

## 响应式基础

### ref

`ref` 用于将基本类型包装为响应式对象：

```javascript
const name = ref("张三")
console.log(name.value) // "张三"
```

### reactive

`reactive` 用于创建响应式对象：

```javascript
const state = reactive({
  count: 0,
  name: "张三"
})
```

## 总结

组合式 API 让代码组织更加灵活，特别适合大型项目和逻辑复用的场景。
