# 1. MongoDB 构建查询

<!-- TOC -->

- [1. MongoDB 构建查询](#1-mongodb-构建查询)
  - [1.1. 查询基础](#11-查询基础)
    - [1.1.1. findOne & find 查询](#111-findone--find-查询)
    - [1.1.2. 各种查询选项](#112-各种查询选项)
  - [1.2. MongoDB 的查询语言](#12-mongodb-的查询语言)
    - [1.2.1. 查询选择器](#121-查询选择器)
    - [1.2.2. 查询选项](#122-查询选项)

<!-- /TOC -->

## 1.1. 查询基础

### 1.1.1. findOne & find 查询

如果想得到单一文件，则当文件存在时 ```findOne``` 方法会返回文件。如果需要返回多个文件，则使用 ```find``` 方法会返回一个迭代指针对象，同时需要在程序的调用处对指针对象进行迭代。

```js
product = db.products.findOne({'slug': 'wheel-barrow-9092'})
db.reviews.find({'product_id': product['_id']})
```

### 1.1.2. 各种查询选项

如果需要对评论进行分页，可以链式查询选项：

```js
db.reviews.find({'product_id': product['_id']}).skip(0).limit(12)
```

根据点赞数排序：

```js
db.reviews.find({'product_id': product['_id']}).
                   sort({'helpful_votes': -1}).
                   limit(12)
```

综合查询选项可轻松获得按照点赞数排序的任意页：

```js
page_number = 1
product  = db.products.findOne({'slug': 'wheel-barrow-9092'})
reviews_count = db.reviews.count({'product_id': product['_id']})
reviews = db.reviews.find({'product_id': product['_id']}).
                           skip((page_number - 1) * 12).
                           limit(12).
                           sort({'helpful_votes': -1})
```

## 1.2. MongoDB 的查询语言

### 1.2.1. 查询选择器

查询条件是由一个或多个查询选择器构成，为此 MongoDB 提供了各种运算符用以构成合适的选择器。

- 范围运算符

  运算符 | 功能
  --------|---------------------
  $lt | 小于
  $gt | 大于
  $lte | 小于等于
  $gte | 大于等于

  ```js
  > db.users.find( { 'birth_year': { '$gte': 1985, '$lte': 2016 } } ）
  ```

- 集合运算符

  运算符 | 功能
  --------|---------------------
  $all | 匹配所有的数组元素
  $in | 匹配任意数组元素
  $nin | 不匹配所有的数组元素

  ```js
  > db.products.find({'tags': {'$all': ["gift", "garden"]}})
  ```

- 逻辑运算符

  运算符  | 功能
  ------|------------
  $or  |  或
  $and  | 与
  $not  | 非
  $nor  | 异或
  $ne   | 不相等
  $exists | 字段（键）是否存在 （Boolean）

  ```js
  > db.users.find( { 'age': { '$not': { 'lte': 30 } } } )
  ```

- 数组运算符

  运算符  | 功能
  ------|------------
  $elemMatch | 在同一个子文档中进行匹配
  $size | 子文档的数目

  ```js
  > db.users.find({
      'addresses': {
        '$elemMatch': {
          'name': 'home', 
          'state': 'NY'
        }
      }
    })
  ```

- 其他运算符

  运算符  | 功能
  ------|------------
  $mod | 除法匹配
  $type | 判断字段（键）的类型

  ```js
  > db.orders.find({subtotal: {$mod: [3, 0]}})
  ```

### 1.2.2. 查询选项

可以通过不同的查询选项对查询结果进一步的筛选，MongoDB 中提供了多种查询选项：

- 投影

  选项 ```$slice```： 返回文档的子集。

  ```js
  > db.products.find({}, {'reviews': {$slice: [24, 12]}})
  ```

- 排序

  在 MongoDB 查询过程中，可以针对一个或多个字段的升降序实现对查询结果的排序。

  ```js
  > db.reviews.find({}).sort({'helpful_votes':-1, 'rating': -1})  
  ```

- 略过和限制

  在使用 ```skip``` 方法时，注意查询的性能，以下是一个反例：

  ```js
  > db.docs.find({}).skip(500000).limit(10).sort({date: -1}) // 扫描的文档数大于等于略过值
  ```
