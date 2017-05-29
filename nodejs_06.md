# 1. 构建 Web 应用（服务器端）

<!-- TOC -->

- [1. 构建 Web 应用（服务器端）](#1-构建-web-应用服务器端)
  - [1.1. 基础功能](#11-基础功能)
    - [1.1.1. HTTP Parser](#111-http-parser)
    - [1.1.2. 请求方法](#112-请求方法)
    - [1.1.3. 路径解析](#113-路径解析)
    - [1.1.4. 查询字符串](#114-查询字符串)
    - [1.1.5. Cookie](#115-cookie)
      - [1.1.5.1. 服务器端解析 Cookie](#1151-服务器端解析-cookie)
      - [1.1.5.2. 客户端初始 Cookie](#1152-客户端初始-cookie)
    - [1.1.6. Session](#116-session)
    - [1.1.7. Basic 认证](#117-basic-认证)
  - [1.2. 数据上传](#12-数据上传)
    - [1.2.1. 表单数据](#121-表单数据)
    - [1.2.2. 附件上传](#122-附件上传)
    - [1.2.3. 跨站请求伪造 ( CSRF )](#123-跨站请求伪造--csrf-)
  - [1.3. 路由解析](#13-路由解析)
    - [1.3.1. 文件路径型](#131-文件路径型)
    - [1.3.2. MVC](#132-mvc)
    - [1.3.3. RESTful](#133-restful)
  - [1.4. 中间件](#14-中间件)
    - [1.4.1. 异常处理](#141-异常处理)

<!-- /TOC -->

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

### 1.1.7. Basic 认证

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

浏览器在后续请求中都携带上 Authorization 信息，服务器会检查请求报文头中的 *Authorization* 字段的内容，该字段有认证方式和加密值构成。

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

## 1.2. 数据上传

报文头部中的内容已经能够让服务器端进行大多数业务逻辑操作了，但是单纯的报文头部无法携带大量的数据，请求报文中还有携带内容的报文体，这部分需要用户自行接收和解析。通过报文头部的 ```Transfer-Encoding``` 或 ```Content-Length``` 字段即可判断请求中是否带有报文体。

```js
function hasbody (req) {
  return req.headers['transfer-encoding'] !== undefined ||
    !isNaN(req.headers['content-length'])
}
```

HTTP_Parser 模块通过触发 ```'data'``` 事件获取 ```req.rawBody``` ，然后针对不同类型的报文体进行相应的解析。 Express 中间件 ```body-parser``` 针对 JSON 的解析如下：

```js
  function parse (body) {
    if (body.length === 0) {
      // special-case empty json body, as it's a common client-side mistake
      // TODO: maybe make this configurable or part of "strict" option
      return {}
    }
    if (strict) {
      var first = firstchar(body)   // FIRST_CHAR_REGEXP = /^[\x20\x09\x0a\x0d]*(.)/ // eslint-disable-line no-control-regex
      if (first !== '{' && first !== '[') {
        throw new SyntaxError('Unexpected token ' + first)
      }
    }
    return JSON.parse(body)
  }
```

### 1.2.1. 表单数据

在表单提交的请求头中 *Content-Type* 字段值为 ```application/x-www-form-urlencoded``` ，也就是其内容通过 urlencoded 的方式编码内容形成报文体，```node-formidable``` 模块解析表单提交大概如下：

```js
// 判断报文头
if (this.headers['content-type'].match(/urlencoded/i)) {
  this._initUrlencoded();
  return;
}
// 事件发布
IncomingForm.prototype._initUrlencoded = function() {
  this.type = 'urlencoded';
  var parser = new QuerystringParser(this.maxFields);
  parser.onField = function(key, val) {
    self.emit('field', key, val);
  };
};
// 事件订阅
IncomingForm.prototype.parse = function(req, cb) {
  if (cb) {
    this
      .on('field', function(name, value) {
        fields[name] = value;
      })
  }
}
```



### 1.2.2. 附件上传

一种特殊的表单需要提交文件，该表单中可以含有 file 类型的控件，以及需要指定表单属性 *enctype* 为 ```multipart/form-data``` 。因为表单中含有多种控件，所有使用名为 ```boundary``` 的分隔符进行分割。

模块 node-formidable 将解析上传文件和处理普通表单数据进行了统一化处理，以下是文件上传的实例：

```js
var formidable = require('formidable'),
    http = require('http'),
    util = require('util');

http.createServer(function(req, res) {
  if (req.url == '/upload' && req.method.toLowerCase() == 'post') {
    // parse a file upload
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
      res.writeHead(200, {'content-type': 'text/plain'});
      res.write('received upload:\n\n');
      res.end(util.inspect({fields: fields, files: files}));
    });
    return;
  }

  // show a file upload form
  res.writeHead(200, {'content-type': 'text/html'});
  res.end(
    '<form action="/upload" enctype="multipart/form-data" method="post">'+
    '<input type="text" name="title"><br>'+
    '<input type="file" name="upload" multiple="multiple"><br>'+
    '<input type="submit" value="Upload">'+
    '</form>'
  );
}).listen(8080);
```

Express 的中间件 ```Multer``` 也提供了类似的功能，但是它只能处理特殊的表单也就是表单属性含有 ```multipart/form-data``` 。

```js
var express = require('express')
var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

var app = express()

app.post('/profile', upload.single('avatar'), function (req, res, next) {
  // req.file is the `avatar` file
  // req.body will hold the text fields, if there were any
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files is array of `photos` files
  // req.body will contain the text fields, if there were any
})

var cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', cpUpload, function (req, res, next) {
  // req.files is an object (String -> Array) where fieldname is the key, and the value is array of files
  //
  // e.g.
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body will contain the text fields, if there were any
})
```

### 1.2.3. 跨站请求伪造 ( CSRF )

通常解决 CSRF 的方法是在表单中添加随机值。 首先服务器端生成一个随机值，然后将随机值内嵌到前端表单，前端表单的请求中携带该随机值，服务器端收到并解析后对比判定是否一致。

Express 中间件 ```csurf``` 默认情况下会自动生成随机值，并且会将该随机值挂载到 ```req.session.csrfSecret``` 上。

## 1.3. 路由解析

### 1.3.1. 文件路径型

这种路由的处理方式，就是将请求路径中的文件发送给客户端即可，而请求 URL 中的文件路径与文件所在的具体路径相对应。

### 1.3.2. MVC

MVC 模型将业务逻辑按职责分离：

- **模型 （Model）** 数据相关的操作和封装
- **控制器（Controller）** 行为的集合
- **视图 （View）** 页面的渲染

它的工作模式：

- **路由**解析，根据 URL 查找到对应的**控制器**及其所定义的行为
- 行为调用相关的**模型**，进行数据操作
- 将操作后的数据结合相应的**视图**进行页面渲染，并将页面返回给客户端

在 MVC 模型中，路由也是非常重要的概念，它主要实现了 URL 和控制器的映射，具体实现的方式有：

- 手工映射
  - 静态映射
  - 正则匹配
  - 参数解析
- 自然映射

### 1.3.3. RESTful

REST 的中文含义为表现层状态转化， 符合 REST 规范的设计成为 RESTful 设计。 它的设计哲学是将服务器端提供的内容实体看作为一个资源，并表现在 URL 上。其中 URL 中的 Method 代表了对这个资源的操作方法。

```js
POST /user/jacksontian  // 创建新用户
DELETE /user/jacksontian  // 删除用户
PUT /user/jacksontian    // 更改用户
GET /user/jacksontian   // 查询用户
```

在 RESTful 设计中，客户端能够接受资源的具体格式由请求报文头中的 *Accept* 字段给出：

```js
Accept: application/json,application/xml
```

而服务器端在响应报文中，通过 *Content-Type* 字段告知客户端是什么格式：

```js
Content-Type: application/json 
```

所以 RESTful 的设计就是， 通过 URL 设计资源、请求方法定义资源的操作和通过 *Accept* 决定资源的具体格式。

## 1.4. 中间件

上述工作有太多的繁琐细节要完成，为了简化和隔离这些基础功能，让开发者关注业务逻辑的实现，引入了中间件这个定义。中间件组件是一个函数，它拦截 HTTP 服务器提供的请求和响应对象，执行逻辑，然后或者结束响应，或者传递给下一个中间件。

Node 的 ```http``` 模块提供了应用层协议的封装，但是对具体业务没有支持（小而灵活），因此必须有开发框架对业务提供支持。 通过中间件的形式搭建开发框架，完成各种基础功能，最终汇成强大的基础框架。每一种基础框架对中间件的组织形式不尽相同，下图是基础框架 Express 的实现机制。

![Middleware]()

在 Express 中，中间件按惯例会接受三个参数：一个请求对象，一个响应对象，还有一个通常命名为 ```next``` 的参数，它是一个回调函数，表明该组件已经完成了工作，可以执行下一个中间件组件了。中间件的分派主要依赖于 ```next``` 这个回调函数的尾触发，这样前一个中间件组件完成后才能进入下一个中间件组件。

通过中间件和业务逻辑的结合可以完成对路由的执行。首先使用 ```app.use()``` 方法将所有的中间件和业务逻辑以及相应的挂载点有序的放入路由数组，然后通过请求路径与挂载点的对比，将匹配的数据元素重组为新的数组，最后通过分发执行中间件，中间件执行完毕后通过 ```next()``` 函数将结果转入到下一个匹配的数组元素。

```js
var handle = function (req, res, stack) {
  var next = function () {
    // 从stack数组中取出中间件并执行
    var middleware = stack.shift();
    if (middleware) {
      // 传入next()函数自身，使中间件能够执行结束后递归
      middleware(req, res, next);
    }
  };

  // 启动执行
  next();
};
```

### 1.4.1. 异常处理

为了捕获中间件抛出的同步异常，保证 Web 应用的稳定和健壮，我们为 ```next()``` 方法添加 ```err``` 参数。

