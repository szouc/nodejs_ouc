const net = require('net');

const server = net.createServer((socket) => {
  socket.on('end', function() {
    console.log('client disconnected');
  });
  
  socket.write('Welcome to the Earth!\n');

  socket.pipe(socket);
});

server.on('error', (err) => {
  throw err;
});

server.listen({port: 8124}, () => {
  console.log('opened server on', server.address());
});