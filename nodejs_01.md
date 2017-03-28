# 1. Node.js


## 1.1. Welcome to Node.js

### 1.1.1. Asynchronous and Evented: The Browser

**I/O does not block execution**

```js
  $.post('/resource.json', function (data) { 
    console.log(data);
  });
  // script execution continues
```

**I/O blocks execution until finished**

```js
  var data = $.post('/resource.json'); 
  console.log(data);
```