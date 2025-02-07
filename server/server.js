const { Server } = require("socket.io");
const http = require("http");

const PORT = process.env.PORT || 3001;

// Add CORS configuration
const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end();
});

const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
  path: "/",
});

const users = new Map(); // stores socket.id -> username

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("setUsername", (username) => {
    users.set(socket.id, username);
    socket.broadcast.emit("userJoined", { userId: socket.id, username });
  });

  socket.on("message", (message) => {
    socket.broadcast.emit("message", {
      text: message,
      senderId: socket.id,
      senderName: users.get(socket.id),
      timestamp: Date.now(),
    });
  });

  socket.on("disconnect", () => {
    const username = users.get(socket.id);
    users.delete(socket.id);
    io.emit("userLeft", { userId: socket.id, username });
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Socket.IO server is running on port ${PORT}`);
});
