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