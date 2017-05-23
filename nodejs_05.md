# 1. 网络编程

## 1.1. Net 模块

Node 中的 net 模块是对网络通信的一种异步包装， 它为服务端和客户端提供数据流函数。

### 1.1.1. net.Server 类

该类用于生成 TCP 连接或本地服务器， 它的实例是一个 ```EventEmitter```，与其相关的事件：

- ```close``` 当服务器关闭的被触发，注意如果某个连接存在，事件不会被触发。
- ```connection``` 当客户端建立新的连接触发该事件，回调函数参数是 ```<net.Socket>``` 实例。
- ```error``` 当异常发生时触发。这里注意处理 net.Server 对象的 ```close``` 事件，因为除非手动调用 ```server.close()``` 否则不会触发 ```close``` 事件。

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

- ```listening``` 在调用 server.listen 后， 服务器被绑定后触发。

该类的重要方法：

- ```server.listen([port][,hostname][,backlog][,callback])```

  服务端在指定主机和端口上接受连接。此方法会触发 ```listening``` 事件， 方法最后一个参数 ```callback``` 是该事件的侦听器。

- ```server.close([callback])```

  停止接受新建的连接但是保持已建立的连接，这个方法是异步的，当所有的连接断开后服务器会触发 ```close``` 事件，该方法的参数是这个事件的侦听器。

### 1.1.2. net.Socket 类

该类是 TCP 连接或本地服务器端口的抽象。```net.Socket``` 实例是一个双向数据流接口，它可以由用户使用客户端命令（```connect()```）创建，也可以由服务端的 Node 通过用户传递的 ```connection``` 事件创建。它同样也是一个 ```EventEmitter```，与其相关的事件：

- ```close``` 端口被完全关闭后触发一次。如果是传输错误该事件返回的参数 ```had_error``` 会置为 ```true``` 。
- ```connect``` 当一个端口连接建立完成时触发。
- ```data``` 当数据块发生流动时触发。数据可以是 ```Buffer``` 或 ```String``` 。
- ```drain``` 当写入缓存为空时触发。
- ```end``` 当另外一端的端口发出 FIN 数据包时触发。
- ```error``` 当异常发生时触发。```close``` 事件会在该事件触发后立即触发。
- ```lookup``` 在解析主机后并在发出连接前触发。主要用于 DNS。
- ```timeout``` 端口无动作一段时间后触发。

该类的重要方法：

- ```socket.connect(options[,connectListener])```

  在指定套接字上打开连接。该方法会在后面的工厂函数 ```net.createConnection()``` 中调用。

- ```socket.end([data][,encoding])```

  半关闭套接字， 它会发送一个 FIN 数据包。

- ```socket.write(data,[,encoding][,callback])```

  在套接字上发送数据，当所有数据发送结束将会执行回调函数。

### 1.1.3. 工厂函数

- ```net.connect(options[,connectListener])```

  返回一个 ```net.Socket``` 实例，并通过 ```socket.connect``` 方法打开连接。回调函数是 ```connect``` 事件的侦听器。

- ```net.createConnection(options[,connectListener])```

  返回一个新的 ```net.Socket``` 实例，同时建立连接。

- ```net.createServer()```

  建立一个新服务器，返回 ```net.Server``` 实例。 该函数的回调函数是 ```connection``` 事件侦听器。

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

## 构建 UDP 服务

