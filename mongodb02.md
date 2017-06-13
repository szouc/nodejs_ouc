# 1. MongoDB 聚合

<!-- TOC -->

- [1. MongoDB 聚合](#1-mongodb-聚合)
  - [1.1. 聚合框架](#11-聚合框架)
  - [1.2. 聚合管道阶段操作符](#12-聚合管道阶段操作符)
    - [1.2.1. $project](#121-project)
    - [1.2.2. $group](#122-group)
    - [1.2.3. $match , $sort , $skip , $limit](#123-match--sort--skip--limit)
    - [1.2.4. $unwind](#124-unwind)
    - [1.2.5. $out](#125-out)
  - [1.3. 聚合管道函数操作符](#13-聚合管道函数操作符)
    - [1.3.1. 字符串函数](#131-字符串函数)
    - [1.3.2. 算术运算函数](#132-算术运算函数)
    - [1.3.3. 日期函数](#133-日期函数)
    - [1.3.4. 逻辑函数](#134-逻辑函数)
    - [1.3.5. 集合函数](#135-集合函数)
    - [1.3.6. 其他函数](#136-其他函数)
  - [1.4. 聚合管道的性能](#14-聚合管道的性能)
    - [1.4.1. 聚合管道的选项参数](#141-聚合管道的选项参数)

<!-- /TOC -->

## 1.1. 聚合框架

使用聚合框架需要定义一个聚合管道，管道中的每一步输出都是下一步的输入。聚合管道阶段操作有：

- ```$project```：确定输出文档的字段（投影）
- ```$match```：选择被处理的文档
- ```$limit```：限制传入到下一步的文档数量
- ```$skip```：略过确定数量的文档
- ```$unwind```：将数组字段扩展生成多个输出文档
- ```$group```：根据特定字段分组文档
- ```$sort```：对文档排序
- ```$out```：将管道结果输出到集合
- ```$redact```：对特定数据的访问控制

使用 ```match```, ```group```, ```sort``` 定义一个聚合框架：

```js
db.products.aggregate( [ {$match: …}, {$group: …}, {$sort: …} ] )
```

![](https://raw.githubusercontent.com/szouc/classroom/master/md/images/aaggregate.png)

SQL 与聚合框架的对比：

SQL 命令  | 聚合框架操作
------  | --------
SELECT  | $project, $group functions: $sum, $min, $avg, etc.
FROM  | db.collectionName.aggregate(...)
JOIN  | $unwind
WHERE | $match
GROUP BY  | $group
HAVING  | $match

## 1.2. 聚合管道阶段操作符

### 1.2.1. $project

投影操作符主要是查询的投影功能：

```js
db.users.aggregate([
    {$match: {username: 'kbanker',
              hashed_password: 'bd1cfa194c3a603e7186780824b04419'}},
    {$project: {first_name:1, last_name:1}}
])
```

### 1.2.2. $group

$group 操作符主要用于多文档的数据聚合，也是聚合管道最常用的操作符，该操作符提供了多种统计功能，如*max* , *min* , *average* 。

```js
// 统计月销售信息
> db.orders.aggregate([
...   {$match: {purchase_data: {$gte: new Date(2010, 0, 1)}}},
...   {$group: {
...     _id: {year : {$year :'$purchase_data'},
...           month : {$month :'$purchase_data'}},
...     count: {$sum:1},
...     total: {$sum:'$sub_total'}}},
...   {$sort: {_id:-1}}
... ]);
// 输出文档
{ "_id" : { "year" : 2014, "month" : 11 },
  "count" : 1, "total" : 4897 }
{ "_id" : { "year" : 2014, "month" : 8 },
  "count" : 2, "total" : 11093 }
{ "_id" : { "year" : 2014, "month" : 4 },
  "count" : 1, "total" : 4897 }
```

$group 操作符提供的函数：

函数  | 功能
------  | ---------
$addToSet | 向数组添加一个非重复元素
$first  | 组的第一个值，在进行了 $sort 后才有意义
$last | 组的最后一个值，在进行了 $sort 后才有意义
$max  | 组中某字段最大值
$min  | 组中某字段最小值
$avg  | 组中某字段平均值
$push | 向数组添加一个元素，元素值可重复
$sum  | 组中所有值的和

### 1.2.3. $match , $sort , $skip , $limit

标题的操作符分别对应选择特定文档、排序文档、略过文档的数量和限制文档数量。

```js
page_number = 1
product = db.products.findOne({'slug': 'wheelbarrow-9092'})
reviews = db.reviews.aggregate([
    {$match: {'product_id': product['_id']}},
    {$skip : (page_number - 1) * 12},
    {$limit: 12},
    {$sort:  {'helpful_votes': -1}}
]).toArray();
```

### 1.2.4. $unwind

该操作符通过展开数组为每一个数组元素生成一个输出文档：

```js
// 没有展开
> db.products.findOne({},{category_ids:1})
{
    "_id" : ObjectId("4c4b1476238d3b4dd5003981"),
    "category_ids" : [
        ObjectId("6a5b1476238d3b4dd5000048"),
        ObjectId("6a5b1476238d3b4dd5000049")
    ]
}
// 展开数组
> db.products.aggregate([
...     {$project : {category_ids:1}},
...     {$unwind : '$category_ids'},
...     {$limit : 2}
... ]);
{ "_id" : ObjectId("4c4b1476238d3b4dd5003981"), 
  "category_ids" : ObjectId("6a5b1476238d3b4dd5000048") }
{ "_id" : ObjectId("4c4b1476238d3b4dd5003981"), 
  "category_ids" : ObjectId("6a5b1476238d3b4dd5000049") } 
```

### 1.2.5. $out

将管道输出的文档保存到集合中，该操作符必须是管道的最后一个环节。

## 1.3. 聚合管道函数操作符

### 1.3.1. 字符串函数

函数  | 功能
----  | -----
$concat | 连接函数
$strcasecmp  | 比较函数，大小写不敏感
$substr | 字符串子串
$toLower  | 转换为小写
$toUpper  | 转换为大写

### 1.3.2. 算术运算函数

函数  | 功能
----  | -----
$add  | 和
$divide | 除
$mod  | 余数
$multiply | 乘
$subtract | 减

### 1.3.3. 日期函数

函数  | 功能
----  | -----
$dayOfYear  | 一年中的某一天 (1...366)
$dayOfMonth | 一月中的某一天 (1...31)
$dayOfWeek  | 一星期中的某一天 (1...7 , 1是星期天)
$year | 日期的年份
$month  | 日期的月份
$week | 日期的周数 (0...53)
$hour | 日期的小时
$minute | 日期的分钟
$second | 日期的秒数
$millisecond  | 日期的毫秒数 (0...999)

### 1.3.4. 逻辑函数

函数  | 功能
----  | -----
$and  | 与
$cmp  | 比较
$cond | 条件 (if: {}, then: , else: )
$eq | 相等
$gt | 大于
$gte  | 大于等于
$ifNull | 替代 Null
$lt | 小于
$lte  | 小于等于
$ne | 不等于
$not  | 非
$or | 或

### 1.3.5. 集合函数

函数  | 功能
----  | -----
$setEquals | 集合相等
$setIntersection | 交集
$setDifference | 差集
$setUnion | 并集
$setIsSubset | 子集
$anyElementTrue | 集合中任一值
$allElementsTrue | 集合中所有值

### 1.3.6. 其他函数

函数  | 功能
----  | -----
$meta  | 文本搜索信息
$size | 数组的大小
$map | 数组每一个成员的操作
$let | 表达式范围中定义变量
$literal | 不执行返回表达式

## 1.4. 聚合管道的性能

影响管道性能的因素：

- 尽量早的减少文档的数量和大小
- 在 ```$match``` 和 ```$sort``` 阶段使用索引。
- 在管道中使用了除 ```$match``` 和 ```$sort``` 外的阶段操作后，就不能使用索引了。（打乱了索引键值对）

### 1.4.1. 聚合管道的选项参数

- ```explain()```： 返回管道运行的详细信息
- ```allowDiskUse```：适合处理大型数据。MongoDB 的内存限制是 100MB
- ```cursor```：每次返回文档的数量
  - ```cursor.hasNext()```：确定是否有下一组
  - ```cursor.next()```：返回下一组文档

```js
options = { explain:true, allowDiskUse:true, cursor: { batchSize: n } }
db.collection.aggregate(pipeline,options)
```