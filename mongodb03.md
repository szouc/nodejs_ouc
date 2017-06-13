# 1. MongoDB 更新、原子操作和删除

<!-- TOC -->

- [1. MongoDB 更新、原子操作和删除](#1-mongodb-更新原子操作和删除)
  - [1.1. 更新操作的基础](#11-更新操作的基础)
    - [1.1.1. 替换更新](#111-替换更新)
    - [1.1.2. 更新操作符](#112-更新操作符)
    - [1.1.3. ```$``` 占位操作符](#113--占位操作符)
  - [1.2. 原子操作](#12-原子操作)
  - [1.3. 更新操作符](#13-更新操作符)
    - [1.3.1. 字段更新操作符](#131-字段更新操作符)
    - [1.3.2. 数组更新操作符](#132-数组更新操作符)
    - [1.3.3. 隔离更新操作符](#133-隔离更新操作符)

<!-- /TOC -->

## 1.1. 更新操作的基础

更新一个文档有两种方式，一种是替换现有的文档内容，另外一种是利用更新操作符对某一个字段进行修改。

### 1.1.1. 替换更新

```js
user_id = ObjectId("4c4b1476238d3b4dd5003981")
doc = db.users.findOne({_id: user_id})
doc['email'] = 'mongodb-user@mongodb.com'
print('updating ' + user_id)
db.users.update({_id: user_id}, doc)
```

### 1.1.2. 更新操作符

```js
user_id = ObjectId("4c4b1476238d3b4dd5000001")
db.users.update({_id: user_id}, 
  {$set: {email: 'mongodb-user2@mongodb.com'}})
```

> 更新操作符使用的是前缀表达式而查询操作符使用的是中缀表达式。
>
> ```js
>  db.products.update({price: {$lte: 10}}, 
>     {$addToSet: {tags: 'cheap'}})
> ```

### 1.1.3. ```$``` 占位操作符

占位操作符实现了无须明确元素在数组中的位置而直接更新元素。

```js
// 原始文档数据
{
  _id: 4,
  grades: [
     { grade: 80, mean: 75, std: 8 },
     { grade: 85, mean: 90, std: 5 },
     { grade: 90, mean: 85, std: 3 }
  ]
}
// 更新操作
db.students.update(
   {
     _id: 4,
     grades: { $elemMatch: { grade: { $lte: 90 }, mean: { $gt: 80 } } }
   },
   { $set: { "grades.$.std" : 6 } }
)
// 输出文档
{
  _id: 4,
  grades: [
    { grade: 80, mean: 75, std: 8 },
    { grade: 85, mean: 90, std: 6 },
    { grade: 90, mean: 85, std: 3 }
  ]
}
```

> 占位操作符只作用于第一个匹配的元素，而且数组的字段名（键）必须作为查询选择器中的一部分。

## 1.2. 原子操作

原子操作是一个不会被其他操作中断或与其他操作交互的操作。原子更新可以支持许多功能，比如可以使用 ```findAndModify``` 来构建工作队列和状态机，以此间接构建事务处理。

例如购物车的状态转化有四个阶段：

CART ---> PRE-AUTHORIZE --->  AUTHORIZING --->  PRE-SHIPPING

```js
// CART ---> PRE-AUTHORIZE
newDoc = db.orders.findAndModify({
  query: {
    user_id: ObjectId("4c4b1476238d3b4dd5000001"),
    state: 'CART'
  },
  update: {
    $set: {
      state: 'PRE-AUTHORIZE'
    }
  },
  'new': true
})
// PRE_AUTHORIZE ---> AUTHORIZING
oldDoc = db.orders.findAndModify({
    query: {
      user_id: ObjectId("4c4b1476238d3b4dd5000001"),
      total: 99000,
      state: "PRE-AUTHORIZE"
    },
    update: {
      '$set': {
        state: "AUTHORIZING"
      }
    }
})
// AUTHORIZING ---> PRE-SHIPPING
auth_doc = {
  ts: new Date(),
  cc: 3432003948293040,
  id: 2923838291029384483949348,
  gateway: "Authorize.net"
}
db.orders.findAndModify({
  query: {
    user_id: ObjectId("4c4b1476238d3b4dd5000001"),
    state: "AUTHORIZING"
  },
      update: {
    $set: {
      state: "PRE-SHIPPING",
      authorization: auth_doc
    }
  }
})
```

## 1.3. 更新操作符

### 1.3.1. 字段更新操作符

操作符 | 功能
----  | ----
$inc  | 根据给定值增加字段值
$set  | 设置字段值为特定值
$unset  | 删除特定字段
$rename | 重命名特定字段
$setOnInsert  | 插入特定字段和对应值，只在  ```{ upsert: true }``` 情况下有效。
$bit  | 按位更新字段

### 1.3.2. 数组更新操作符

操作符 | 功能
----  | ----
$ | 占位符
$push | 添加值到数组
$addToSet | 添加值到集合
$pop  | 删除数组第一个或最后一个元素
$pull | 删除数组中匹配的元素
$pullAll  | 删除数组中多个元素
$each | 结合 $push 和 $addToSet 操作多个值
$slice  | 结合 $push 和 $addToSet 分片数组
$sort | 结合 $push 和 $addToSet 排序数组

### 1.3.3. 隔离更新操作符

操作符 | 功能
----  | ----
$isolated | 隔离其他操作，防止交叉更新