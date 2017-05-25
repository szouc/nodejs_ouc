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

url 模块提供了 URL 的解析。URL 是由多个具有意义的字段组成的字符串，具体描述如下：

![]()

HTTP_Parser 将请求报文头的路径字段解析成名为 ```req.url``` 的 URL 字符串, 它可通过 ```url.parse()``` 方法解析成 URL 对象，对象中的 ```urlObject.pathname``` 属性反映了 URL 字符串的 *path* 字段中的 *pathname* 部分。

### 1.1.3. 查询字符串

在 *pathname* 部分后就是查询字符串，这部分内容经常需要为业务逻辑所用， Node 提供了 qureystring 模块来处理这部分数据。注意，业务的判断一定要检查值是数组还是字符串。

### 1.1.4. Cookie


