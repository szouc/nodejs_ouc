# 1. 构建 Web 应用（服务器端）

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

### 1.1.1. HTTP Parser

Node 底层使用 HTTP_Parser 这个 C 语言模块来解析 HTTP 协议数据， 它解析的主要信息有：

- 头部字段和对应值（Header）
- Content-Length
- 请求方法（Method）
- 响应状态码（Status Code）
- 传输编码
- HTTP 版本
- 请求 URL
- 报文主体

### 1.1.2. 请求方法

HTTP_Parser 在解析请求报文时，将报文头抽取出来并将请求方式抽象为 ```req.method``` 属性。

### 1.1.3. 路径解析

url 模块提供了 URL 的解析。URL 是由多个具有意义的字段组成的字符串，具体描述如下：

![](https://raw.githubusercontent.com/szouc/nodejs_ouc/master/images/CH06/url_parser.png)

HTTP_Parser 将请求报文头的路径字段解析成名为 ```req.url``` 的 URL 字符串, 它可通过 ```url.parse()``` 方法解析成 URL 对象，对象中的 ```urlObject.pathname``` 属性反映了 URL 字符串的 *path* 字段中的 *pathname* 部分。

### 1.1.4. 查询字符串

在 *pathname* 部分后就是查询字符串，这部分内容经常需要为业务逻辑所用， Node 提供了 qureystring 模块来处理这部分数据。注意，业务的判断一定要检查值是数组还是字符串。

### 1.1.5. Cookie

HTTP 是一个无状态协议，无法区分用户之间的身份。如何标识和认证一个用户，最早的方案就是 Cookie 。

Cookie 的处理分为如下几步：

- 服务器向客户端发送 Cookie
- 浏览器将 Cookie 保存
- 之后每次浏览器都会将 Cookie 发送给服务器端

#### 1.1.5.1. 服务器端解析 Cookie

HTTP_Parser 会将请求报文头的所有字段解析到 ```req.headers``` 上，Cookie 就是 ```req.headers.cookie``` 。 Cookie 值的格式是键值对，Express 的中间件 ```cookie-parser``` 将其挂载在 req 对象上，让业务代码可以直接访问。

```js
function cookieParser (options) {
  return function cookieParser (req, res, next) {
    if (req.cookies) {
      return next()
    }
    var cookies = req.headers.cookie
    req.cookies = Object.create(null)
    // no cookies
    if (!cookies) {
      return next()
    }
    req.cookies = cookie.parse(cookies, options) // 这里调用了 cookie 模块 (https://github.com/jshttp/cookie)
    next()
  }
}
```

#### 1.1.5.2. 客户端初始 Cookie

客户端的 Cookie 最初来自服务器端，服务器端告知客户端的方式是通过响应报文实现的，响应的 Cookie 值在 *Set-Cookie* 字段中设置。具体格式如下所示：

```js
Set-Cookie: name=value; Path=/; Expires=Sun, 23-Apr-23 09:01:35 GMT; Domain=.domain.com;
```

- ```path``` 标识这个 Cookie 影响到的路径。
- ```Expires``` 和 ```Max-Age``` 告知浏览器这个 Cookie 何时过期。
- ```Secure``` 该属性为 true 时，表示 Cookie 只能通过 HTTPS 协议传递。

Express 中间件 ```express-session``` 处理 *Set-Cookie* :

```js
function setcookie(res, name, val, secret, options) {
  var signed = 's:' + signature.sign(val, secret);
  var data = cookie.serialize(name, signed, options);
  var prev = res.getHeader('set-cookie') || [];
  var header = Array.isArray(prev) ? prev.concat(data) : [prev, data];
  res.setHeader('set-cookie', header)
}
```

### 1.1.6. Session

### Basic 认证

Basic 认证是一个通过用户名和密码实现的身份认证方式。如果用户首次访问网页， URL 地址中没有携带认证内容，那么浏览器会到得一个 401 未授权的响应。

```js
var http = require('http')
var auth = require('basic-auth')

// Create server
var server = http.createServer(function (req, res) {
  var credentials = auth(req)

  if (!credentials || credentials.name !== 'john' || credentials.pass !== 'secret') {
    res.statusCode = 401
    res.setHeader('WWW-Authenticate', 'Basic realm="example"')
    res.end('Access denied')
  } else {
    res.end('Access granted')
  }
})

// Listen
server.listen(3000)
```

> 响应头中的 ```WWW-Authenticate``` 字段告知浏览器采用什么样的认证和加密方式。

浏览器在后续请求中都携带上 Authorization 信息，服务器会检查请求报文头中的 Authorization 字段的内容，该字段有认证方式和加密值构成。

```js
function auth (req) {
  // get header
  var header = req.headers.authorization
  // parse header
  var match = CREDENTIALS_REGEXP.exec(string) // CREDENTIALS_REGEXP = /^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9._~+/-]+=*) *$/
  if (!match) {
    return undefined
  }
  // decode user pass
  var userPass = USER_PASS_REGEXP.exec(decodeBase64(match[1]))  // USER_PASS_REGEXP = /^([^:]*):(.*)$/
  if (!userPass) {
    return undefined
  }
  // return credentials object
  return new Credentials(userPass[1], userPass[2])
}

function decodeBase64 (str) {
  return new Buffer(str, 'base64').toString()
}

function Credentials (name, pass) {
  this.name = name
  this.pass = pass
}
```