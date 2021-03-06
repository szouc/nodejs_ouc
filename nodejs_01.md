# 1. Node 基础

## 1.1. Node 的组件构成

![Node 的组件构成](https://raw.githubusercontent.com/szouc/nodejs_ouc/master/images/CH01/Node_Components.png)

> [libuv/libuv](https://github.com/libuv/libuv) : Cross-platform asynchronous I/O .

Node 的结构与 Chrome 相似，都是基于事件驱动的异步架构。 Node 通过事件驱动来服务 I/O 。

## 1.2. Node 的特点

### 1.2.1. 异步 I/O

在 Node 中，我们可以从语言层面很自然的进行并行 I/O 操作， 每个调用之间无须等待之前的 I/O 调用结束。

![经典的异步调用](https://raw.githubusercontent.com/szouc/nodejs_ouc/master/images/CH01/ClassicalAsync.png)

### 1.2.2. 事件与回调函数

Node 配合异步 I/O ， 将事件点暴露给业务逻辑。 事件的编程方式具有轻量级、松耦合、只关注事务点等优势， Node 利用回调函数接受异步调用返回的数据。 但是代码的编写顺序和执行顺序并无关系，因此在流程控制方面需要划分业务和提炼事件。

### 1.2.3. 单线程

单线程自身的弱点有：

- 无法充分利用硬件资源
- 大量计算占用 CPU 导致无法继续调用异步 I/O
- 无错误处理时，会引起整个应用退出

Node 使用 ```child_process``` 模块， 将计算分发到个个子进程，再通过进程之间的事件消息来传递结果。

### 1.2.4. 跨平台

![跨平台架构示意图](https://raw.githubusercontent.com/szouc/nodejs_ouc/master/images/CH01/platform.png)

## 1.3. Node 的应用场景

### 1.3.1. I/O 密集型 或者 DIRT (data-intensive real-time)

I/O 密集的优势主要在于 Node 利用事件循环的处理能力。

### 1.3.2. CPU 密集型

比较计算运行时间和 I/O 的耗时，适当调整和分解大型运算任务为多个小任务，不阻塞 I/O 调用。

### 1.3.3. 分布式应用

Node 高效利用并行 I/O 可以来查询分布式数据库。