# 1. MongoDB 3.4 学习笔记 （三）：非关系数据库的 Schema

<!-- TOC -->

- [1. MongoDB 3.4 学习笔记 （三）：非关系数据库的 Schema](#1-mongodb-34-学习笔记-三非关系数据库的-schema)
  - [1.1. Schema 设计原则](#11-schema-设计原则)
    - [1.1.1. Schema 基础](#111-schema-基础)
      - [1.1.1.1. 一对一](#1111-一对一)
      - [1.1.1.2. 一对多](#1112-一对多)
      - [1.1.1.3. 多对多](#1113-多对多)
    - [1.1.2. 实例](#112-实例)

<!-- /TOC -->

## 1.1. Schema 设计原则

数据库 Schema 设计是基于数据库特性、数据属性和应用系统选择最好的数据表示形式的过程。关系数据库中的范式即是 Schema 设计原则。

### 1.1.1. Schema 基础

#### 1.1.1.1. 一对一

一对一的关系是描述两个实体之间的唯一关系。

**模型：**


```js
// 用户文档：
{
  name: "Peter Wilkinson",
  age: 27
}
```

```js
// 地址文档
{
  street: "100 some road",
  city: "Nevermore"
}
```

- 内嵌方式

  将地址文档内嵌入用户文档，这样在检索用户信息和地址信息时，只需要一次读操作即可：

  ```js
  {
    name: "Peter Wilkinson",
    age: 27,
    address: {
      street: "100 some road",
      city: "Nevermore"
    }
  }
  ```

- 连接方式

  使用外键将两个文档连接，这也是关系数据库使用的方式，但是 MongoDB 没有外键的限制，只将外键作为 Schema 层面的一种关系：

  ```js
  // 用户文档
  {
    _id: 1,
    name: "Peter Wilkinson",
    age: 27
  }
  ```

  ```js
  // 地址文档
  {
    user_id: 1, // 用户外键
    street: "100 some road",
    city: "Nevermore"
  }
  ```

> 很明显在非关系数据库中，内嵌方式更有效。

#### 1.1.1.2. 一对多

一对多的关系主要体现在其中一方的实体对应另一方多个实体，其中博客和评论尤为典型：

**模型：**

```js
// 博客文档
{
  title: "An awesome blog",
  url: "http://awesomeblog.com",
  text: "This is an awesome blog we have just started"
}
```

```js
// 评论文档
{
  name: "Peter Critic",
  created_on: ISODate("2014-01-01T10:01:22Z"),
  comment: "Awesome blog post"
}
{
  name: "John Page",
  created_on: ISODate("2014-01-01T11:01:22Z"),
  comment: "Not so awesome blog"
}
```

- 内嵌方式

  将评论以数组形式内嵌入博客文档中：

  ```js
  {
    title: "An awesome blog",
    url: "http://awesomeblog.com",
    text: "This is an awesome blog we have just started",
    comments: [{
      name: "Peter Critic",
      created_on: ISODate("2014-01-01T10:01:22Z"),
      comment: "Awesome blog post"
    }, {
      name: "John Page",
      created_on: ISODate("2014-01-01T11:01:22Z"),
      comment: "Not so awesome blog"
    }]
  }
  ```

  这种方式需要注意三点：

  - 文档的大小的上限是 16M 。
  - 在添加评论时会将文档复制到内存中的新位置并更新所有的索引，这会严重影响写性能。
  - 每次检索都会将所有的评论返回，无法实现分页功能。

- 连接方式

  与一对一关系相似，都是利用外键实现连接：

  ```js
  // 博客文档
  {
    _id: 1,
    title: "An awesome blog",
    url: "http://awesomeblog.com",
    text: "This is an awesome blog we have just started"
  }
  ```

  ```js
  {
    blog_entry_id: 1,
    name: "Peter Critic",
    created_on: ISODate("2014-01-01T10:01:22Z"),
    comment: "Awesome blog post"
  }
  {
    blog_entry_id: 1,
    name: "John Page",
    created_on: ISODate("2014-01-01T11:01:22Z"),
    comment: "Not so awesome blog"
  }
  ```

  连接方式在评论数不多时效果很好，但当评论数很多时会影响读操作的性能。

- 桶装方式

  桶装方式是对前两种方式的混合，尝试使用连接方式的灵活性来解决嵌入方式笨重，同时平衡读操作的性能。方法就是将评论按一定数量灌入的桶中，每一个桶都是用连接方式和博客关联。

  ```js
  // 博客文档
  {
    _id: 1,
    title: "An awesome blog",
    url: "http://awesomeblog.com",
    text: "This is an awesome blog we have just started"
  }
  ```

  ```js
  {
    blog_entry_id: 1,
    page: 1,
    count: 50,
    comments: [{
      name: "Peter Critic",
      created_on: ISODate("2014-01-01T10:01:22Z"),
      comment: "Awesome blog post"
    }, ...]
  }
  {
    blog_entry_id: 1,
    page: 2,
    count: 1,
    comments: [{
      name: "John Page",
      created_on: ISODate("2014-01-01T11:01:22Z"),
      comment: "Not so awesome blog"
    }]
  }
  ```

  > 桶装方式非常适合利用时间或编号进行分页操作的文档。

#### 1.1.1.3. 多对多

双方的实体间都对应了多个关系即为多对多关系。典型代表是图书与作者：

- 双向内嵌

  作者文档中包含图书的外键，图书文档中也包含作者的外键。

  ```js
  // 作者文档
  {
    _id: 1,
    name: "Peter Standford",
    books: [1, 2]
  }
  {
    _id: 2,
    name: "Georg Peterson",
    books: [2]
  }
  ```

  ```js
  // 图书文档
  {
    _id: 1,
    title: "A tale of two people",
    categories: ["drama"],
    authors: [1]
  }
  {
    _id: 2,
    title: "A tale of two space ships",
    categories: ["scifi"],
    authors: [1, 2]
  }
  ```

  > **解耦多对多关系：**
  >
  > 如果是图书和图书类别的多对多关系，可以想象的到图书类别的文档中将包含成千上万的图书外键。所以需要另外一种方式来实现多对多关系.

- 单向内嵌

  当一方的关系明显多余另外一方，此时就应该考虑使用单向内嵌的方式来实现多对多的关系。

  ```js
  // 图书类别文档
  {
    _id: 1,
    name: "drama"
  }
  ```

  ```js
  // 图书文档
  {
    _id: 1,
    title: "A tale of two people",
    categories: [1],
    authors: [1, 2]
  }
  ```

### 1.1.2. 实例

在非关系数据库中没有固定的 Schema 设计原则，它是弹性的可根据多种因素灵活选择。下面通过商品实例分析非关系数据库的 Schema 设计思想：

```js
{
  _id: ObjectId("4c4b1476238d3b4dd5003981"), 
  slug: "wheelbarrow-9092",
  sku: "9092",
  name: "Extra Large Wheelbarrow",
  description: "Heavy duty wheelbarrow...",
  details: {
    weight: 47,
    weight_units: "lbs",
    model_num: 4039283402,
    manufacturer: "Acme",
    color: "Green"
  },
  total_reviews: 4,
  average_review: 4.5,
  pricing: {
    retail: 589700,
    sale: 489700,
  },
  price_history: [
    {
      retail: 529700,
      sale: 429700,
      start: new Date(2010, 4, 1),
      end: new Date(2010, 4, 8)
    },
    {
      retail: 529700,
      sale: 529700,
      start: new Date(2010, 4, 9),
      end: new Date(2010, 4, 16)
    },
  ],
  primary_category: ObjectId("6a5b1476238d3b4dd5000048"),
  category_ids: [
    ObjectId("6a5b1476238d3b4dd5000048"),
    ObjectId("6a5b1476238d3b4dd5000049")
  ],
  main_cat_id: ObjectId("6a5b1476238d3b4dd5000048"),
  tags: ["tools", "gardening", "soil"],
}
```

- 内嵌文档（一对一关系）

  商品实例中有个键 ```details``` 指向一个子文档，这样的好处是既可以灵活的规划商品的属性，又为程序员对文档的查询提供了模块化的操作。与此类似的有 ```pricing``` 键和 ```price_history``` 键，而 ```price_history``` 键指向的是一个数组。

- 一对多关系

  商品只属于一个类别，而类别可以拥有多种商品。 ```primary_category``` 键对应的是一个类别的 ID，表明该商品属性哪一个类别。

- 多对多关系

  应用可能需要列出与该商品相关的类别。这种操作在关系数据库中通常建立一个多对多的表，然后通过 ```join``` 方法连接多个表。而在非关系数据库中，只需要像 ```category_ids``` 键这样指向与该商品相关的类别 ID 数组即可。在 mongoose 中提供了 ```population``` 语法糖实现了用文档来填充 ID 。

- 优化与去范式

  每个商品会有多个评价：

  ```js
    {
    _id: ObjectId("4c4b1476238d3b4dd5000041"),
    product_id: ObjectId("4c4b1476238d3b4dd5003981"),
    date: new Date(2010, 5, 7),
    title: "Amazing",
    text: "Has a squeaky wheel, but still a darn good wheelbarrow.",
    rating: 4,
    user_id: ObjectId("4c4b1476238d3b4dd5000042"),
    username: "dgreenthumb",
    helpful_votes: 3,
    voter_ids: [ 
      ObjectId("4c4b1476238d3b4dd5000033"),
      ObjectId("7a4f0376238d3b4dd5000003"),
      ObjectId("92c21476238d3b4dd5000032")
    ]
  }
  ```

  可以看出 ```user_id``` 键是用来关联评价与用户，但是因为 MongoDB 不支持 ```join``` 连接，而评价的内容中需要展示用户名，为此添加 ```username``` 键，也就是选择优化减少成本，而不去选择去范式。相似的还有 MongoDB 中不允许查询文档中数组的大小， 添加 ```helpful_votes``` 键可以轻松的实现这一功能。