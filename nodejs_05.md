# 1. 网络编程

## 1.1. Net 模块

Node 中的 net 模块是对网络通信的一种异步包装， 它为服务端和客户端提供数据流函数。

### 1.1.1. net.Server 类

该类用于生成 TCP 连接或本地服务器， 它的实例是一个 ```EventEmitter```，与其相关的事件：

- ```'close'``` 当服务器关闭的被触发，注意如果某个连接存在，事件不会被触发。
- ```'connection'``` 当客户端建立新的连接触发该事件，回调函数参数是 ```<net.Socket>``` 实例。
- ```'error'``` 当异常发生时触发。这里注意处理 net.Server 对象的 ```'close'``` 事件，因为除非手动调用 ```server.close()``` 否则不会触发 ```'close'``` 事件。

  ```js
  server.on('error', (e) => {
    if (e.code == 'EADDRINUSE') {
      console.log('Address in use, retrying...');
      setTimeout(() => {
        server.close();
        server.listen(PORT, HOST);
      }, 1000);
    }
  });
  ```

- ```'listening'``` 在调用 server.listen 后， 服务器被绑定后触发。

该类的重要方法：

- ```server.listen([port][,hostname][,backlog][,callback])```

  服务端在指定主机和端口上接受连接。此方法会触发 ```'listening'``` 事件， 方法最后一个参数 ```callback``` 是该事件的侦听器。

- ```server.close([callback])```

  停止接受新建的连接但是保持已建立的连接，这个方法是异步的，当所有的连接断开后服务器会触发 ```'close'``` 事件，该方法的参数是这个事件的侦听器。

### 1.1.2. net.Socket 类

该类是 TCP 连接或本地服务器端口的抽象。```net.Socket``` 实例是一个双向数据流接口，它可以由用户使用客户端命令（```connect()```）创建，也可以由服务端的 Node 通过用户传递的 ```'connection'``` 事件创建。它同样也是一个 ```EventEmitter```，与其相关的事件：

- ```'close'``` 端口被完全关闭后触发一次。如果是传输错误该事件返回的参数 ```had_error``` 会置为 ```true``` 。
- ```'connect'``` 当一个端口连接建立完成时触发。
- ```'data'``` 当数据块发生流动时触发。数据可以是 ```Buffer``` 或 ```String``` 。
- ```'drain'``` 当写入缓存为空时触发。
- ```'end'``` 当另外一端的端口发出 FIN 数据包时触发。
- ```'error'``` 当异常发生时触发。```'close'``` 事件会在该事件触发后立即触发。
- ```'lookup'``` 在解析主机后并在发出连接前触发。主要用于 DNS。
- ```'timeout'``` 端口无动作一段时间后触发。

该类的重要方法：

- ```socket.connect(options[,connectListener])```

  在指定套接字上打开连接。该方法会在后面的工厂函数 ```net.createConnection()``` 中调用。

- ```socket.end([data][,encoding])```

  半关闭套接字， 它会发送一个 FIN 数据包。

- ```socket.write(data,[,encoding][,callback])```

  在套接字上发送数据，当所有数据发送结束将会执行回调函数。

### 1.1.3. 工厂函数

- ```net.connect(options[,connectListener])```

  返回一个 ```net.Socket``` 实例，并通过 ```socket.connect``` 方法打开连接。回调函数是 ```'connect'``` 事件的侦听器。

- ```net.createConnection(options[,connectListener])```

  返回一个新的 ```net.Socket``` 实例，同时建立连接。

- ```net.createServer()```

  建立一个新服务器，返回 ```net.Server``` 实例。 该函数的回调函数是 ```'connection'``` 事件侦听器。

## 1.2. TCP 服务

![](https://raw.githubusercontent.com/szouc/nodejs_ouc/master/images/CH05/net_Socket.png)

### 1.2.1. 创建 TCP 服务器端

```js
const net = require('net');

const server = net.createServer((socket) => {
  socket.on('end', function() {
    console.log('client disconnected');
  });
  
  socket.write('Welcome to the Earth!\n');

  socket.pipe(socket);
});

server.on('error', (err) => {
  throw err;
});

server.listen({port: 8124}, () => {
  console.log('opened server on', server.address());
});
```

### 1.2.2. 创建 TCP 客户端

```js
const net = require('net');

const client = net.connect({port: 8124}, () => {
  console.log('client connected');
  client.write('hello world!\r\n');
});

client.on('data', (data) => {
  console.log(data.toString());
  client.end();
});

client.on('end', () => {
  console.log('disconnected from server');
});

client.on('error', (err) => {
  throw err;
});
```

## 1.3. 构建 HTTP 服务

无论是 HTTP 请求报文还是 HTTP 响应报文，报文内容都包含两个部分： 报文头和报文体。

### 1.3.1. http 模块

TCP 服务以 **connection** 为单位进行服务（可以看作是 ```'connection'``` 事件），HTTP 服务以 **request** 为单位进行服务（同理可以看作是 ```'request'``` 事件）。http 模块即是将 **connection** 到 **request** 的过程进行了封装。

![]()

以服务器端为例, http 模块将连接所用套接字的读写抽象为 IncomingMessage 和 ServerResponse 对象。 在请求响应过程中， http 模块将网络连接读来的数据，通过调用二进制模块 http_parser 进行解析，在解析完请求报文的报头后，触发 ```'request'``` 事件，调用业务逻辑，然后再通过对连接的写操作，将响应返回到客户端。

#### 1.3.1.1. HTTP 请求

请求报文将会通过 http_parser 进行解析，并抽象为 IncomingMessage 对象：

- ```mssage.method``` 字符形式的请求方法，只读。
- ```message.url``` 请求 URL 字符串。
- ```message.httpVersion``` http 版本号。
- ```message.headers``` 头部变量和数值所对应的键/值对。

IcomingMessage 对象是一个只读流接口（Readable Stream），如果业务逻辑需要读取报文体中的数据，则要在这个数据流结束后才能进行。

#### 1.3.1.2. HTTP 响应

HTTP 响应封装了对底层连接的写操作，可以将其看成一个可写的流对象（Writable Stream）。http 模块将 HTTP 响应抽象为 ServerResponse 对象。
ServerResponse 对象对报文头的操作：

- ```response.setHeader(name, value)``` 设置响应报文头，可以多次设置。
- ```response.writeHeader(statusCode[,statusMessage][,headers])``` 发送响应报文头。

ServerResponse 对象对报文体的操作：

- ```response.write(chunk,[,encoding][,callback])``` 发送响应报文体的区块，注意一旦开始了数据发送，报文头的发送将不再生效。
- ```response.end([data][,encoding][,callback])``` 每一个响应**必须**调用该方法，调用该方法意味着所有响应报文都已发送，服务器认为这次事务结束。

#### 1.3.1.3. HTTP 服务的事件

对于 Node 来说，可以将 HTTP 服务抽象为 ```http.Server``` 对象，该对象继承自 ```net.Server``` 对象，所以 HTTP 服务的实例是一个 ```EventEmitter``` ，与其相关的事件有：

- ```'connection'``` 当一个新的 TCP 数据流被建立，该事件触发并返回一个 ```net.Socket``` 实例。
- ```'request'``` 建立 TCP 连接后，当请求数据到达服务器端， http 模块底层解析出 HTTP 请求报文头后，将会触发该事件。