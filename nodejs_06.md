# 1. 构建 Web 应用

## 1.1. 基础功能

对象 http.Server 的 ```'request'``` 事件发生于网络连接建立，客户端向服务器端发送报文，服务器段解析报文，发现 HTTP 请求报文的报文头时。在已出发 ```'request'``` 事件前，http 模块已准备好 IncomingMessage 和 ServerResponse 对象以对应请求和响应报文的操作。

```js
const http = require('http');
http.createServer( function(req, res) {    // 'request' 事件的侦听器
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end();
}).listen(1337, '127.0.0.1');
```

对于一个 Web 应用除了上面的业务还有如下的需求：

- 请求方法的判断
- URL 的路径解析
- URL 中的查询字符串的解析
- Cookie 和 Session 的解析
- Basic 认证
- 表单数据的解析
- 任意格式文件的上传处理

Web 应用可以看成是将上述需求进行线性组合，最终生成 ```'request'``` 事件的侦听器，通过高阶函数将它传递给 ```http.createServer()``` 方法。

```js
const app = express();
// TODO
http.createServer(app).listen(1337);
```

### 1.1.1. 请求方法

HTTP_Parser 在解析请求报文时，将报文头抽取出来并将请求方式抽象为 ```req.method``` 属性。

### 1.1.2. 路径解析