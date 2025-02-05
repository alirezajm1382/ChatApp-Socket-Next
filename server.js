const WebSocket = require("ws");
const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end();
});

const wss = new WebSocket.Server({
  server,
  path: "/ws",
  clientTracking: true,
});

const clients = new Map(); // stores [ws, {id, username}]

wss.on("connection", (ws, req) => {
  console.log("New client connected");

  const clientId = Math.random().toString(36).substring(7);
  clients.set(ws, { id: clientId, username: null });

  // Send the client their ID
  ws.send(JSON.stringify({ type: "id", id: clientId }));

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log("Received message:", data);

      if (data.type === "username") {
        // Store the username when received
        const clientInfo = clients.get(ws);
        clientInfo.username = data.username;
        clients.set(ws, clientInfo);

        // Broadcast to other clients that a new user joined
        for (const [client, info] of clients.entries()) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ 
              type: "userJoined", 
              id: clientId,
              username: data.username 
            }));
          }
        }
        return;
      }

      // Add the sender's info to the message
      const senderInfo = clients.get(ws);
      data.from = senderInfo.id;
      data.username = senderInfo.username;

      // Forward the message to the target client if specified
      if (data.target) {
        for (const [client, info] of clients.entries()) {
          if (info.id === data.target && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on("close", () => {
    const clientInfo = clients.get(ws);
    console.log("Client disconnected:", clientInfo.id);
    clients.delete(ws);

    // Notify other clients that a user left
    for (const [client] of clients.entries()) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ 
          type: "userLeft", 
          id: clientInfo.id,
          username: clientInfo.username 
        }));
      }
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
});
