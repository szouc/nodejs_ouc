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


# 2. 模块机制

## 2.1. Node 规范

![Node 规范](https://raw.githubusercontent.com/szouc/nodejs_ouc/master/images/CH02/Node_Relations.png)

## 2.2. Node 的模块实现

![Node 模块机制](https://raw.githubusercontent.com/szouc/nodejs_ouc/master/images/CH02/Node_Module.png)

## 2.3. 包与 NPM

### 2.3.1. 包结构

符合 CommonJS 规范的包目录：

- **package.json**: 包描述文件
- **bin**: 存放可执行二进制文件
- **lib**: 存放 JavaScript 代码的目录
- **doc**: 存放文档
- **test**: 存放单元测试用例的代码

### 2.3.2. 包描述文件与 NPM

包描述文件字段：

- **name**: 包名
- **description**: 包简介
- **version**: 版本号
- **keywords**: 关键词数组
- **maintainers**: 包维护者
- **contributors**: 贡献者
- **bugs**: 提交 bug 地址
- **licenses**: 许可证
- **repositories**: 托管源代码位置
- **dependencies**: 当前包所需要依赖的包
- **homepage**: 包的网站
- **os**: 操作系统
- **cpu**: CPU 支持
- **engine**: JavaScript 引擎
- **builtin**: 是否是内建在底层系统的标准组件
- **directories**: 包目录说明
- **implements**: 实现规范
- **scripts**: 脚本

NPM 字段：

- **author**: 包作者
- **bin**: 命令行工具
- **main**: 模块引入入口
- **devDependencies**: 开发时需要依赖的包


# 3. 异步 I/O

Node 的基调是异步 I/O 、事件驱动和单线程。

## 3.1. 为什么使用异步 I/O

Node 利用单线程，远离多线程死锁、状态同步等问题；利用异步 I/O ，让单线程远离阻塞，以更好地使用 CPU 。

### 3.1.3. Node 的异步 I/O 实现

事件循环、观察者、请求对象和 I/O 线程池共同构成了 Node 异步 I/O 模型。

![](https://raw.githubusercontent.com/szouc/nodejs_ouc/master/images/CH03/AsyncIO.png)

Node 中的观察者：

![](https://raw.githubusercontent.com/szouc/nodejs_ouc/master/images/CH03/observer.png)


# 4. 异步编程

## 4.1. 函数式编程

### 4.1.4. 高阶函数

高阶函数遵循一个明确的定义：

- 它是一等公民。
- 以一个函数作为参数。
- 以一个函数作为返回结果。

高阶函数形成了一种后续传递风格的程序编写，将函数的业务重点从返回值转移到了回调函数中。

### 4.1.5. 偏函数与 Curry 化

使用 Curry 化有利于创建更流畅的接口，同时使得代码阅读起来越来越像它行为的描述。

## 4.2. 异步编程的优势与难点

### 4.2.1. 优势

Node 带来的最大特性莫过于基于事件驱动的非阻塞 I/O 模型。 Node 为了解决编程模型中阻塞 I/O 的性能问题，采用了单线程模型， 对于 CPU 密集型程序建议将大量的计算分解为诸多小量计算，对 CPU 的耗用不要超过 10 ms， 可以使用 ```setImmediate()``` 调度。

### 4.2.2. 难点

- 异常处理
- 函数嵌套过深
- 阻塞代码
- 多线程编程

## 4.3. 异步编程解决方案

### 4.3.1. 事件发布/订阅模式

事件发布/订阅模式可以实现一个事件与多个回调函数的关联，这些回调函数又称为事件侦听器。侦听器可以很灵活的添加和删除，使得事件和具体处理逻辑之间可以很轻松的关联和解耦。

事件发布/订阅模式自身并无同步和异步调用问题，但在 Node 中， emit() 调用多半是伴随事件循环而异步触发的，所以我们说事件发布/订阅广泛应用于异步编程。

Node 对事件发布/订阅的机制做了一些额外的处理：

- 如果对一个事件添加了超过 10 个侦听器，将会得到一条警告。
- 如果运行期间的错误触发了 error 事件， EventEmitter 会检查是否有对 error 事件添加过侦听器。如果添加了，这个错误交由该侦听器处理，否则这个错误将会作为异常抛出，如果外部没有捕获这个异常，将会引起线程退出。

当一个事件被触发，所有和它相关的侦听器将被**同步**调用，侦听器中返回的数据会被忽视和丢弃。此外侦听器中的 ```this``` 被特意的指向与它相关的事件对象，所以需要特别留意使用箭头函数的情景。

如果需要**异步**调用侦听器，可以使用 ```setImmediate()``` 或者 ```process.nextTick()```:

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', (a, b) => {
  setImmediate(() => {
    console.log('this happens asynchronously');
  });
});
myEmitter.emit('event', 'a', 'b');

```

### 4.3.2. Promise/Deferred 模式

事件方式的缺点是即使是分支流程，也需要为每一个分支设置事件发布/订阅，并且侦听器是同步执行。那么是否有一种先执行异步调用，延迟传递处理的方式呢？

#### 4.3.2.1. Promises/A 规范

Promises/A 提议对单个异步操作做出如下抽象定义：

- Promise 操作只会处在 3 种状态的一种：未完成态、完成态和失败态。
- Promise 的状态只会出现从未完成态向完成态或失败态转化，不能逆反。完成态和失败态不能互相转化。
- Pormise 的状态一旦转化，将不能被更改。

一个 Promise 对象只要具备 then() 方法即可。

- 接受完成态、错误态的回调方法。
- 可选地支持 progress 事件回调作为第三个方法。
- then() 方法只接受 function 对象。
- then() 方法继续返回 Promise 对象，以实现链式调用。

从事件发布/订阅的角度出发，可粗略的认为 then() 方法是将回调函数（侦听器）存放起来。那么触发事件的任务是由 Deferred 对象实现。但是 Deferred 对象会保持状态不变，再对 Promise 对象添加回调函数，也会立即得到结果，而事件的特点是，你错过了它，再去监听是得不到结果的。

![](https://github.com/szouc/nodejs_ouc/raw/master/images/CH04/promises.png)

### 4.3.3. 流程控制库

- 尾触发与 Next
- Async