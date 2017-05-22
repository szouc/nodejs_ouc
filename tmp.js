const Events = require('events');

class Stream extends Events {
  constructor(){
    super(Events);
  }
  
}

const emitter = new Stream();

// emitter.on("done", (data) => {
//   console.log(data + " done");
// })

emitter.on("done", (data) => {
  setImmediate(() => {
    console.log(data + " done");
  });
});

emitter.emit("done", "emit")

console.log("This is script.")