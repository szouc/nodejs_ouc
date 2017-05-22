# 1. 异步 I/O

Node 的基调是异步 I/O 、事件驱动和单线程。

## 1.1. 为什么使用异步 I/O

Node 利用单线程，远离多线程死锁、状态同步等问题；利用异步 I/O ，让单线程远离阻塞，以更好地使用 CPU 。

### 1.1.1. Node 的异步 I/O 实现

事件循环、观察者、请求对象和 I/O 线程池共同构成了 Node 异步 I/O 模型。

![](https://raw.githubusercontent.com/szouc/nodejs_ouc/master/images/CH03/AsyncIO.png)

Node 中的观察者：

![](https://raw.githubusercontent.com/szouc/nodejs_ouc/master/images/CH03/observer.png)