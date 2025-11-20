// WebSocket server configuration
module.exports = (http) => {
  const io = require('socket.io')(http, {
    cors: {
      origin: [
        'https://mern-social-media-vu92.onrender.com',
        'http://localhost:3000',
        'http://localhost:5000'
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    },
    allowEIO3: true
  });

  return io;
};
