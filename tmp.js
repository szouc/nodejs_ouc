// Promises 和 事件发布/订阅的区别

const EventsEmitter = require('events');

const emitter = new EventsEmitter();

const promise = new Promise(function(resolve, reject) {
  console.log("promise");
  resolve();
});

emitter.emit("done", "emit_ignore") // 触发事件，但是没有事件被订阅

emitter.on("done", (data) => {
  console.log(data + " done");
  promise.then(function() {     // 进入微指令队列（mirco），延迟执行。
    console.log("then in done");  
  });
});

emitter.emit("done", "emit")    // 触发事件，事件被订阅，事件侦听器立即执行（同步）

console.log("This is script.")

promise.then(function() {       // 进入微指令队列（mirco），延迟执行。
  console.log("then");
});