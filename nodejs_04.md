# 1. 异步编程

## 1.1. 函数式编程

### 1.1.1. 高阶函数

高阶函数遵循一个明确的定义：

- 它是一等公民。
- 以一个函数作为参数。
- 以一个函数作为返回结果。

高阶函数形成了一种后续传递风格的程序编写，将函数的业务重点从返回值转移到了回调函数中。

### 1.1.2. 偏函数与 Curry 化

使用 Curry 化有利于创建更流畅的接口，同时使得代码阅读起来越来越像它行为的描述。

## 1.2. 异步编程的优势与难点

### 1.2.1. 优势

Node 带来的最大特性莫过于基于事件驱动的非阻塞 I/O 模型。 Node 为了解决编程模型中阻塞 I/O 的性能问题，采用了单线程模型， 对于 CPU 密集型程序建议将大量的计算分解为诸多小量计算，对 CPU 的耗用不要超过 10 ms， 可以使用 ```setImmediate()``` 调度。

### 1.2.2. 难点

- 异常处理
- 函数嵌套过深
- 阻塞代码
- 多线程编程

## 1.3. 异步编程解决方案

### 1.3.1. 事件发布/订阅模式

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

### 1.3.2. Promise/Deferred 模式

事件方式的缺点是即使是分支流程，也需要为每一个分支设置事件发布/订阅，并且侦听器是同步执行。那么是否有一种先执行异步调用，延迟传递处理的方式呢？

#### 1.3.2.1. Promises/A 规范

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

#### 1.3.2.2. 事件发布/订阅模式和 Promises/Deferred 模式的区别

```js
// Promises 和 事件发布/订阅的区别

const EventsEmitter = require('events');

const emitter = new EventsEmitter();

const promise = new Promise(function(resolve, reject) {
  console.log("promise");
  resolve();
});

emitter.emit("done", "emit_ignore") // 触发事件，但是没有事件被订阅

emitter.on("done", (data) => {
  console.log(data + " done");
  promise.then(function() {     // 进入微指令队列（mirco），延迟执行。
    console.log("then in done");
  });
});

emitter.emit("done", "emit")    // 触发事件，事件被订阅，事件侦听器立即执行（同步）

console.log("This is script.")

promise.then(function() {       // 进入微指令队列（mirco），延迟执行。
  console.log("then");
});
```

上面程序的结果如下：

```bash
promise
emit done
This is script.
then in done
then
```

### 1.3.3. 流程控制库

- 尾触发与 Next
- Async
