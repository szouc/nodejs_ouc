# 1. 综述 GENERAL

**Simple, unobtrusive authentication for Node.js**

<!-- TOC -->

- [1. 综述 GENERAL](#1-综述-general)
  - [1.1. 概览 Overview](#11-概览-overview)
  - [1.2. 认证 Authenticate](#12-认证-authenticate)
    - [1.2.1. 重定向 Redirects](#121-重定向-redirects)
    - [1.2.2. 快报 Flash Messages](#122-快报-flash-messages)
    - [1.2.3. 禁用会话 Disable Sessions](#123-禁用会话-disable-sessions)
    - [1.2.4. 自定义回调函数 Custom Callback](#124-自定义回调函数-custom-callback)
  - [1.3. 配置 Configure](#13-配置-configure)
    - [1.3.1. 策略 Strategies](#131-策略-strategies)
    - [1.3.2. 验证回调 Verify Callback](#132-验证回调-verify-callback)
    - [1.3.3. 中间件 Middleware](#133-中间件-middleware)
    - [1.3.4. 会话 Session](#134-会话-session)
  - [1.4. 用户名和密码 Username & Password](#14-用户名和密码-username--password)
    - [1.4.1. 配置 Configuration](#141-配置-configuration)
    - [1.4.2. 表格 Form](#142-表格-form)
    - [1.4.3. 路由 Route](#143-路由-route)
    - [1.4.4. 参数 Parameters](#144-参数-parameters)
  - [1.5. OpenID](#15-openid)
  - [1.6. OAuth](#16-oauth)
- [2. 内置操作 Operations](#2-内置操作-operations)
  - [2.1. 登录 Log In](#21-登录-log-in)
  - [2.2. 注销 Log Out](#22-注销-log-out)
  - [2.3. 授权 Authorize](#23-授权-authorize)

<!-- /TOC -->

## 1.1. 概览 Overview

Passport 是 Node 的认证中间件，它的存在只有一个单一的目的，就是认证请求。

在现今的网络应用中认证方式多种多样。经典做法是用户提供用户名和密码进行登录，但随着社交网络的兴起，OAuth 等基于口令的方式越来越受到欢迎。

在 Passport 设计理念中就认为每一个网络应用拥有不同的认证需求。因此为了满足各种网络应用，被称作**策略**的认证机制被封装成单一的模块中，网络应用可自由选择不同策略来实现认证功能。

认证机制本身可能比较复杂，但是在 Passport 中编写的代码并没有那么繁琐：

```js
app.post('/login', passport.authenticate('local', { successRedirect: '/',
                                                    failureRedirect: '/login' }));
```

当然首先需要安装 Passport：

```js
$ npm install passport
```

## 1.2. 认证 Authenticate

通过调用 ```passport.authenticate()``` 方法及配置相应的策略，就可实现认证网络请求。 ```authenticate()``` 方法是标准的Node 中间件，在 Express 应用中可以非常方便的作为路由使用。

```js
app.post('/login',
  passport.authenticate('local'),
  function(req, res) {
    // 如果认证通过，将触发该函数
    // `req.user` 字段内有认证的用户名.
    res.redirect('/users/' + req.user.username);
  });
```

在默认情况下，认证失败后 Passport 会返回 ```401 Unauthorized``` 状态的响应，其后面的处理函数也不会被触发。当然认证成功后，处理函数被触发并将认证用户信息作为值赋值给 ```req.user``` 。

> **注意：** 策略必须在路由使用它之前进行配置。

### 1.2.1. 重定向 Redirects

在认证请求后通常接下来需要处理的事务就是重定向。

```js
app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login' }));
```

上述代码中，如果认证成功将会被重定向到首页，如果失败会重新来到登录页面。

### 1.2.2. 快报 Flash Messages

当认证失败后客户端被重定向到登录页面，重定向后的页面中经常会显示一些状态提示信息，如：登录失败。那么如何分辨登录页面是认证失败后的重定向还是第一次访问？区别它们的方法就是在 session 中写入一个特殊的标识 ```flash``` 。

```js
app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: true })
);
```

上述代码会在认证失败后，将策略的认证函数中返回的信息写入 ```flash```。这是最常用和最好的方法，因为每个策略的认证函数都会把认证失败的准确信息返回。

当然也可以自定义快报：

```js
passport.authenticate('local', { failureFlash: 'Invalid username or password.' });
```

或者是认证成功后的快报：

```js
passport.authenticate('local', { successFlash: 'Welcome!' });
```

> **注意：** 在 Express 4.x 中使用快报需要添加 ```connect-flash```  中间件。

### 1.2.3. 禁用会话 Disable Sessions

由于 HTTP 是无状态协议，所以在认证成功后通常是将登录信息保存在 session 中。但是在某些情况下并不需要 session，如 API 服务需要证书来认证，此时可以放心的禁用会话。

```js
app.get('/api/users/me',
  passport.authenticate('basic', { session: false }),
  function(req, res) {
    res.json({ id: req.user.id, username: req.user.username });
  });
```

### 1.2.4. 自定义回调函数 Custom Callback

在处理认证请求时，可自定义回调函数来处理成功或失败的认证。

```js
app.get('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/login'); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/users/' + user.username);
    });
  })(req, res, next);
});
```

上例中，方法 ```authenticate()``` 没有作为路由的中间件出现，而是在路由的处理函数中被调用。该方法的回调函数的参数通过闭包从路由中传入。如果认证失败 ```user``` 将被赋值为 ```false```。出现异常 ```err``` 会被初始化并返回异常信息。可选的 ```info``` 则返回策略中相关信息。

> **注意：** 使用自定义回调函数，应用必须建立一个 session （上例通过 ```req.logIn()```） 并发送响应。

## 1.3. 配置 Configure

在认证过程中 Passport 需要配置三个部分：

- 认证策略
- 应用中间件
- 会话（可选）

### 1.3.1. 策略 Strategies

Passport 通过策略来认证网络请求。策略可以是用户名和密码的确认认证，可以是 OAuth 的委派认证，还可以是 OpenID 的联合认证。正如上文所提到的策略在使用前必须进行配置。

策略及其配置通过 ```use()``` 方法实现。比如接下来的通过用户名和密码的认证策略 ```LocalStrategy``` :

```js
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));
```

### 1.3.2. 验证回调 Verify Callback

上面的例子中有个很重要的概念：策略中需要验证回调。验证回调目的是找到拥有认证信息的用户。

当 Passport 验证一个请求时，会解析请求中的认证信息，然后将认证信息发送给验证回调函数同时触发该函数。如果认证信息有效，验证回调函数触发 ```done``` 函数，将认证的用户信息返回给 Passport 。

```js
return done(null, user);
```

如果认证信息无效， ```done``` 函数同样也会被触发，但是返回的是 ```false``` 。

```js
return done(null, false);
```

一些附加信息可以追加在 ```done``` 函数的第三个参数中，这些信息可用来呈现快报。

```js
return done(null, false, { message: 'Incorrect password.' });
```

最后如果在验证过程中出现异常，```done``` 函数可以传递一个 Node 风格的 err 信息。

```js
return done(err);
```

> **注意：** 区分开两种验证失败的原因，如果是服务器的异常 ```done``` 函数的第一个参数 ```err``` 设置为非空值；验证条件的失败要确保 ```err``` 为 null 。

这种委派方式确保了 Passport 数据库对验证回调函数的透明，应用可任意选择用户信息的存储方式。

### 1.3.3. 中间件 Middleware

在 Express 应用中， ```passport.initialize()``` 中间件可初始化 Passport， ```passport.session()``` 中间件用来存储用户登录的 session 信息。

```js
var app = express();
app.use(require('serve-static')(__dirname + '/../../public'));
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
```

> **注意：** ```express.session()``` 中间件应该在 ```passport.session()``` 中间件前面。

### 1.3.4. 会话 Session

在典型的网络应用中，登录请求中包含验证用户的认证信息。如果认证成功，用户浏览器中通过 cookie 创建并保存 sessionID。随后所有的请求不再需要验证，而是通过 sessionID 来识别用户。Passport 可以将 session 中的用户信息序列化或反序列化，以此支持 session 机制。

```js
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
```

上述代码中，user ID 被序列化到 session 中，接下来的请求中，通过 user ID 获取用户信息并将其存入到 ```req.user``` 中。

序列化和反序列化的逻辑由应用提供，可以选择适合的数据库存储会话，在认证层面这些操作没有任何的限制。

## 1.4. 用户名和密码 Username & Password

网络中最常用的方式就是通过用户名和密码进行认证，提供这种认证的策略是 ```passport-local``` 。

```js
$ npm install passport-local
```

### 1.4.1. 配置 Configuration

```js
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));
```

本地认证的验证回调函数接受 ```username``` 和 ```password``` 两个参数。

### 1.4.2. 表格 Form

表格提供了 ```username``` 和 ```password``` 这两个参数：

```html
<form action="/login" method="post">
    <div>
        <label>Username:</label>
        <input type="text" name="username"/>
    </div>
    <div>
        <label>Password:</label>
        <input type="password" name="password"/>
    </div>
    <div>
        <input type="submit" value="Log In"/>
    </div>
</form>
```

### 1.4.3. 路由 Route

登录表格信息通过 ```POST``` 方法提交给服务器， ```local``` 策略使用 ```authenticate()``` 函数处理登录请求：

```js
app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: true })
);
```

设置 ```failureFlash``` 选项为 ```true``` ，意味着在验证回调函数中返回的 ```message``` 信息将成为错误快报的值。

### 1.4.4. 参数 Parameters

默认情况下，```localStrategy``` 策略使用 ```username``` 和 ```password``` 作为认证机制的参数，实际上其他字段也可以作为参数进行验证：

```js
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'passwd'
  },
  function(username, password, done) {
    // ...
  }
));
```

## 1.5. OpenID

暂时用不到 ^_^

## 1.6. OAuth

暂时用不到 ^_^

# 2. 内置操作 Operations

## 2.1. 登录 Log In

Passport 通过暴露给 ```req``` 的 ```login()``` 方法建立登录会话。

```js
req.login(user, function(err) {
  if (err) { return next(err); }
  return res.redirect('/users/' + req.user.username);
});
```

登录操作完成后，用户信息被指派在 ```req.user``` 上。

> **注意：** ```passport.authenticate()``` 中间件会自动触发 ```req.login()``` 。 这项功能主要使用在用户注册时，调用 ```req.login()``` 方法自动登录新注册的用户。

## 2.2. 注销 Log Out

与 ```login()``` 相反，```logout()``` 方法用来结束登录会话。 调用 ```logout()``` 方法会删除 ```req.user``` 属性并清除登录会话。

```js
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});
```

## 2.3. 授权 Authorize

暂时用不到 ^_^