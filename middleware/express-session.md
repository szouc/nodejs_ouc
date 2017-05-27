# 1. [expressjs/session](https://github.com/expressjs/session)

## 1.1. Installation

```bash
$ npm install express-session
```

## 1.2. API

```js
const session = require('express-session');
```

### 1.2.1. session(options)

Create a session middleware with the given options.

**options**

- **cookie** 
  
  Settings object for the session ID cookie. The default value is ```{ path: '/', httpOnly: true, secure: false, maxAge: null }```.

- **cookie.maxAge**

  Specifies the ```number``` (in milliseconds) to use when calculating the ```Expires``` ```Set-Cookie``` attribute. This is done by taking the current server time and adding ```maxAge``` milliseconds to the value to calculate an ```Expires``` datetime. 

- **cookie.path**

  Specifies the value for the ```Path``` ```Set-Cookie```. By default, this is set to ```'/'```, which is the root path of the domain.

- **cookie.secure**

  Specifies the boolean value for the ```Secure``` ```Set-Cookie``` attribute. By default, the ```Secure``` attribute is not set.
  
  Please note that ```secure: true``` is a **recommended** option. However, it requires an https-enabled website, i.e., HTTPS is necessary for secure cookies. If ```secure``` is set, and you access your site over HTTP, the cookie will not be set. If you have your node.js behind a proxy and are using ```secure: true```, you need to set "trust proxy" in express:

  ```js
  var app = express()
  var sess = {
    secret: 'keyboard cat',
    cookie: {}
  }
  if (app.get('env') === 'production') {
    app.set('trust proxy', 1) // trust first proxy
    sess.cookie.secure = true // serve secure cookies
  }
  app.use(session(sess))
  ```
  
- **name**

  The name of the session ID cookie to set in the response (and read from in the request). The default value is ```'connect.sid'```.

- **resave**

  Forces the session to be saved back to the session store, even if the session was never modified during the request. 

- **saveUninitialized**

  Forces a session that is "uninitialized" to be saved to the store. A session is uninitialized when it is new but not modified.

- **secret**

  **Required option**

  This is the secret used to sign the session ID cookie. This can be either a string for a single secret, or an array of multiple secrets. If an array of secrets is provided, only the first element will be used to sign the session ID cookie, while all the elements will be considered when verifying the signature in requests.

- **store**

  The session store instance, defaults to a new ```MemoryStore``` instance.
  
- **unset**

  Control the result of unsetting ```req.session``` (through ```delete```, setting to ```null```, etc.).

  The default value is ```'keep'```.

  ```'destroy'``` The session will be destroyed (deleted) when the response ends.

  ```'keep'``` The session in the store will be kept, but modifications made during the request are ignored and not saved.
  

### 1.2.2. req.session

To store or access session data, simply use the request property ```req.session```, which is (generally) serialized as JSON by the store, so nested objects are typically fine.

- **Session.regenerate(callback)**

  To regenerate the session simply invoke the method. Once complete, a new SID and ```Session``` instance will be initialized at ```req.session``` and the ```callback``` will be invoked.

- **Session.destroy(callback)**

  Destroys the session and will unset the ```req.session``` property. Once complete, the ```callback``` will be invoked.
  
- **Session.reload(callback)**

  Reloads the session data from the store and re-populates the ````req.session``` object. Once complete, the ```callback``` will be invoked.
  
- **Session.save(callback)**

  Save the session back to the store, replacing the contents on the store with the contents in memory. This method is automatically called at the end of the HTTP response if the session data has been altered. Because of this, typically this method does not need to be called.
  
- **Session.touch()**

  Updates the ```.maxAge``` property. Typically this is not necessary to call, as the session middleware does this for you.

### 1.2.3. req.session.id

Each session has a unique ID associated with it. This property is an alias of ```req.sessionID``` and cannot be modified. It has been added to make the session ID accessible from the ```session``` object.

### 1.2.4. req.session.cookie

Each session has a unique cookie object accompany it. This allows you to alter the session cookie per visitor.

### 1.2.5. req.sessionID

To get the ID of the loaded session, access the request property ```req.sessionID```. This is simply a read-only value set when a session is loaded/created.

## 1.3. Session Store Implementation

Every session store must be an ```EventEmitter``` and implement specific methods.

### 1.3.1. connect-redis

[connect-redis](https://github.com/tj/connect-redis) is a Redis session store backed by node_redis, and is insanely fast 

#### 1.3.1.1. Setup

```bash
$ npm install connect-redis
```

Pass the ```express-session``` store into ```connect-redis``` to create a ```RedisStore``` constructor.

```js
var session = require('express-session');
var RedisStore = require('connect-redis')(session);

app.use(session({
    store: new RedisStore(options),
    secret: 'keyboard cat'
}));
```

#### 1.3.1.2. Options

A Redis client is required. An existing ```client``` can be passed directly using the client param or created for you using the ```host```, ```port```, or ```socket``` params.

- ```client``` An existing client
- ```host``` Redis server hostname
- ```port``` Redis server portno
- ```socket``` Redis server unix_socket
- ```url``` Redis server url