# 1. MongoDB NodeJS Driver

<!-- TOC -->

- [1. MongoDB NodeJS Driver](#1-mongodb-nodejs-driver)
  - [1.1. Installation](#11-installation)
  - [1.2. Connect to MongoDB](#12-connect-to-mongodb)
  - [1.3. Insert a Document](#13-insert-a-document)
  - [1.4. Update a document](#14-update-a-document)
  - [1.5. Remove a document](#15-remove-a-document)
  - [1.6. Capped Collection](#16-capped-collection)
  - [1.7. Document Validation](#17-document-validation)
  - [1.8. Create Indexes](#18-create-indexes)
  - [1.9. CRUD](#19-crud)
    - [Write Methods](#write-methods)

<!-- /TOC -->

## 1.1. Installation

```js
$ npm install mongodb --save
```

## 1.2. Connect to MongoDB

```js
const MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

// Connection URL
const url = 'mongodb://localhost:27017/myproject';

// Use connect method to connect to the server
MongoClient.connect(url, (err, db) => {
  assert.equal(null, err);
  console.log("Connected successfully to server");

  db.close();
});
```

## 1.3. Insert a Document

```js
const insertDocuments = function (db, callback) {
  // Get the documents collection
  const collection = db.collection('documents')
  // Insert some documents
  collection.insertMany([
    {a: 1}, {a: 2}, {a: 3}
  ], (err, result) => {
    assert.equal(err, null)
    assert.equal(3, result.result.n)
    assert.equal(3, result.ops.length)
    console.log(result.result);
    console.log(result.ops);
    console.log('Inserted 3 documents into the collection')
    callback(result)
  })
}

const MongoClient = require('mongodb').MongoClient,
  assert = require('assert')

// Connection URL
const url = 'mongodb://tmp:123456@localhost:27017/myproject'
// Use connect method to connect to the server
MongoClient.connect(url, (err, db) => {
  assert.equal(null, err)
  console.log('Connected successfully to server')

  insertDocuments(db, () => {
    db.close()
  })
})
```

## 1.4. Update a document

```js
const updateDocument = (db, callback) => {
  // Get the documents collection
  const collection = db.collection('documents')
  // Update document where a is 2, set b equal to 1
  collection.updateOne({ a: 2 }
    , { $set: { b: 1 } }, (err, result) => {
      assert.equal(err, null)
      assert.equal(1, result.result.n)
      console.log('Updated the document with the field a equal to 2')
      callback(result)
    })
}

const MongoClient = require('mongodb').MongoClient,
  assert = require('assert')

// Connection URL
const url = 'mongodb://tmp:123456@localhost:27017/myproject'
// Use connect method to connect to the server
MongoClient.connect(url, (err, db) => {
  assert.equal(null, err)
  console.log('Connected successfully to server')

  updateDocument(db, () => {
    db.close()
  })
})
```

## 1.5. Remove a document

```js
const removeDocument = (db, callback) => {
  // Get the documents collection
  const collection = db.collection('documents');
  // Delete document where a is 3
  collection.deleteOne({ a : 3 }, (err, result) => {
    assert.equal(err, null);
    assert.equal(1, result.result.n);
    console.log("Removed the document with the field a equal to 3");
    callback(result);
  });    
}

const MongoClient = require('mongodb').MongoClient,
  assert = require('assert')

// Connection URL
const url = 'mongodb://tmp:123456@localhost:27017/myproject'
// Use connect method to connect to the server
MongoClient.connect(url, (err, db) => {
  assert.equal(null, err)
  console.log('Connected successfully to server')

  removeDocument(db, () => {
    db.close()
  })
})
```

## 1.6. Capped Collection

```js
const createCapped = (db, callback) => {
  db.createCollection("myCollection", { "capped": true, "size": 100000, "max": 5000},
    (err, results) => {
      console.log("Collection created.");
      callback();
    }
  );
};

const MongoClient = require('mongodb').MongoClient,
  assert = require('assert')

// Connection URL
const url = 'mongodb://tmp:123456@localhost:27017/myproject'
// Use connect method to connect to the server
MongoClient.connect(url, (err, db) => {
  assert.equal(null, err)
  console.log('Connected successfully to server')

  createCapped(db, () => {
    db.close()
  })
})
```

## 1.7. Document Validation

```js
const createValidated = (db, callback) => {
  db.createCollection('contacts',
    {
      'validator': { '$or': [
          { 'phone': { '$type': 'string' } },
          { 'email': { '$regex': /@mongodb\.com$/ } },
          { 'status': { '$in': [ 'Unknown', 'Incomplete' ] } }
        ]
      }
    },
    (err, results) => {
      console.log('Collection created.')
      callback()
    }
  )
}

const MongoClient = require('mongodb').MongoClient,
  assert = require('assert')

// Connection URL
const url = 'mongodb://tmp:123456@localhost:27017/myproject'
// Use connect method to connect to the server
MongoClient.connect(url, (err, db) => {
  assert.equal(null, err)
  console.log('Connected successfully to server')

  createValidated(db, () => {
    db.close()
  })
})
```

## 1.8. Create Indexes

```js
var createUniqueIndex = function(db, callback) {
  // Get the documents collection
  var collection = db.collection('users');
  // Create the index
  collection.createIndex(
    { lastName : -1, dateOfBirth : 1 },
    { unique:true },
    function(err, result) {
      console.log(result);
      callback(result);
  });
};
```

## 1.9. CRUD

### Write Methods

```js
import MongoDB from 'mongodb'
import assert from 'assert'

const MongoClient = MongoDB.MongoClient

const createDoc = async function () {
  // Connection URL
  const db = await MongoClient.connect('mongodb://tmp:123456@localhost:27017/myproject');
  console.log("Connected correctly to server");

  // Insert a single document
  const one = await db.collection('inserts').insertOne({a:1});
  assert.equal(1, one.insertedCount);

  // Insert multiple documents
  const many = await db.collection('inserts').insertMany([{a:2}, {a:3}]);
  assert.equal(2, many.insertedCount);

  // Close connection
  db.close();
}

createDoc().catch((err) => {
  console.log(err.stack);
});
```
