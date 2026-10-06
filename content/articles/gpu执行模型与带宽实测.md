---
title: "GPU 执行模型与带宽实测：BLOCK_SIZE 如何影响搬运"
date: 2026-10-07
summary: "用Triton写gpu kernel，设置不同的BLOCK_SIZE和torch对比研究"
---

# GPU 执行模型与带宽实测：BLOCK_SIZE 如何影响搬运


## 问题

向量加 C = A + B：每个元素读两个 float32，做一次加法，写回一个。这个 kernel 的性能上限由谁决定？

答案：带宽，不是算力。先用 roofline 模型推出这个结论；然后做一组 BLOCK_SIZE 扫描实验——roofline 回答"天花板在哪"，实验回答"怎样才能吃到天花板、吃不到时卡在哪"。

## roofline：木桶效应中，谁是短板？

**算术强度** = FLOP ÷ 搬运字节数。向量加每个元素 1 次加法、搬运 12 字节（读 2 × 4B，写 1 × 4B），强度 = 1/12 ≈ 0.08 FLOP/B。

**机器平衡点** = 算力 ÷ 带宽。RTX 4060 Laptop：FP32 约 15 TFLOPS（规格值，未实测）、显存标称 256 GB/s，平衡点 ≈ 58 FLOP/B。

kernel 的强度低于平衡点三个数量级，所以无论代码怎么写，算力都用不满，**唯一有意义的指标是带宽**。这也是为什么这种 kernel 适合当带宽测试器。

> 注意：256 GB/s 是标称理论峰值。实测可持续带宽只有 197~222 GB/s（标称的 77%~87%），具体值随运行时频率状态浮动。

（**注意 roofline 给的上限是硬件属性，不会自动到达。有效带宽（搬运字节 ÷ 实际耗时）能达到峰值的几成，取决于 kernel 向内存系统喂请求的方式；而喂请求的粒度，在 Triton 里就是 BLOCK_SIZE。下面扫一遍它。**）

## kernel 与执行模型对号

代码（`迷你引擎/01_vec_add.py`）核心四行：

```python
pid = tl.program_id(axis=0)
offsets = pid * BLOCK_SIZE + tl.arange(0, BLOCK_SIZE)
mask = offsets < n
x = tl.load(x_ptr + offsets, mask=mask)
```

- grid = ceil(N / BLOCK_SIZE) 个 program，每个 program 作为一个 **block** 调度到某个 SM 上。block 是 GPU 的调度单位，有启动和退出的固定成本。
- kernel 是块级写法：offsets 是全局下标张量；`x_ptr + offsets` 是指针张量（指针算术以元素为单位，+1 前进 4 字节，有个小知识点，就是指针指向的是变量内存地址的首地址）；`tl.load` 把这一块从 DRAM 搬进寄存器。
（这里的话注意一下，就是在triton的官方文档里面，写offsets是指针列表，这句话有一定误导）
- N 不整除 BLOCK_SIZE 时最后一个 block 的辖区越过数组末尾，**mask** 让越界 lane 的访存整笔不发出（load 返回占位值，store 不写）。没有 mask 的 store 会写坏显存里别的 tensor，不报错、随机坏。

内存侧的关键机制是**访存合并（coalescing）**：DRAM/L2 的最小颗粒是 32 字节的 **sector**；一个 warp 内 32 条 lane 同时发起的访存，若地址连续，会被合并成少数几笔交易。合并只发生在 warp 内部，跨 block 合不了。

由此对 BLOCK_SIZE 扫描有三个预测：

1. BLOCK_SIZE=1：每个 block 只有 1 条 lane 干活，block 数 = N，调度开销淹没一切；
2. BLOCK_SIZE ≥ 32：warp 内 32 条 lane 覆盖连续 128 字节 = 4 个 sector，全部用满，带宽应接近平台；
3. 继续加大 block：只是减少 block 总数、摊薄调度成本，带宽应进入平台。

## 实验设置

- 环境：RTX 4060 Laptop（24 SM，L2 实测 32 MiB），WSL2 Ubuntu 22.04，torch 2.6.0+cu124，triton 3.2.0。
- N = 2²⁴，fp32，每次 kernel 搬运 0.20 GB（读 2 份 + 写 1 份）。计时用 CUDA event，warmup 后取 20 次平均；BLOCK_SIZE=1 只跑 3 次，因为它要启动 1670 万个 block。
- 正确性先用 N = 1,000,003 验证过（故意不整除，含尾块）。
- 扫描前先空跑约 200 次 `a + b`，让 GPU 频率进入稳定状态。

> 注意：CUDA kernel 启动是**异步**的，CPU 把 kernel 入队就返回，真正的执行在 GPU 上随后发生。计时区间两端都必须 `torch.cuda.synchronize()`，否则测到的是入队开销（µs 级），不是 kernel 执行时间。
>
> 注意：数据总量必须明显大于 L2。早前误用 12 MB 的数据测过一次，整个放进 32 MiB 的 L2，报出 16 TB/s——那不是 DRAM 带宽，是缓存带宽加口径错误。

## 数字

| BLOCK_SIZE | block 数 | Triton (GB/s) | torch a + b (GB/s) |
|---:|---:|---:|---:|
| 1 | 16,777,216 | 7.4 | 201.3 |
| 32 | 524,288 | 177.4 | 202.5 |
| 128 | 131,072 | 197.4 | 197.2 |
| 1024 | 16,384 | 196.9 | 197.4 |
| 4096 | 4,096 | 196.0 | 202.9 |
| 16384 | 1,024 | 201.1 | 197.6 |

![bandwidth vs BLOCK_SIZE](/01_vec_add_bandwidth.png)

## 解读

1. **BLOCK_SIZE=1 雪崩到 7.4 GB/s，约为平台的 1/27。** 瓶颈不在 DRAM：相邻 sector 会被后续 block 经 L2 命中，流量并没有放大 27 倍。瓶颈是 **block 调度**：16,777,216 个 block ÷ 27.3 ms ≈ 每秒 6.1 亿个 block，摊到 24 个 SM 是每 SM 每 39 ns 处理一个 block，这就是调度加退出的固定成本。同时每个 block 的 128 个线程（num_warps=4）里只有 1 个有活干。
2. **BLOCK_SIZE=32 回到平台的 88%。** 合并成立：32 条连续 lane = 128 字节 = 4 个 sector 全部用满。剩下的 12% 是 52 万个 block 的调度税和 3/4 线程空置。
3. **BLOCK_SIZE ≥ 128 进入平台，约 197 GB/s，与 torch 完全打平。** 手写 kernel 和调优过的库没有区别，因为顶到的是同一堵 DRAM 墙。另一次运行（N = 2²⁸、频率状态不同）测到过 222 GB/s；平台上的小幅起伏（196 vs 201）不做解读。

> 注意：torch 那列是**对照组**，六行调用完全相同。没加频率预跑时它从 187 漂到 214——对照组变了，说明变的是环境（DVFS 频率状态）而不是代码。

## 结论

从上面的内容可以看到，有效带宽会极大影响kernel性能。
**而decode 阶段的算术强度和向量加同量级**：每生成一个 token 要把全部权重从显存读一遍，而每个权重只参与一次乘加。所以 batch=1 的理论上限 ≈ 带宽 ÷ 模型字节数——8B 模型 FP16 是 16 GB，在约 200 GB/s 的实测带宽下就是每秒十几次前向。后面要学的 KV cache、量化、continuous batching，本质都是跟这堵墙打交道：量化缩小要搬的字节数，batching 让同一份字节服务更多请求。
所以这条曲线的**平台段给出 decode 吞吐上限的估法（实测带宽 ÷ 模型字节数），而雪崩段则解释为什么推理引擎要拼命压调度税**


