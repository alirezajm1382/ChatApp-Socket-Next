import { io, Socket } from "socket.io-client";

export class SocketIOConnection {
  private socket: Socket | null = null;
  private username: string | null = null;
  private onMessageCallback: ((message: string, senderId: string, senderName: string) => void) | null = null;
  private onUserJoinedCallback: ((userId: string, username: string) => void) | null = null;
  private onUserLeftCallback: ((userId: string, username: string) => void) | null = null;

  constructor(username: string) {
    this.username = username;
  }

  public connect() {
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";
    
    this.socket = io(socketUrl, {
      path: "/",
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
      this.socket?.emit("setUsername", this.username);
    });

    this.socket.on("message", (data: { text: string; senderId: string; senderName: string }) => {
      if (this.onMessageCallback) {
        this.onMessageCallback(data.text, data.senderId, data.senderName);
      }
    });

    this.socket.on("userJoined", (data: { userId: string; username: string }) => {
      if (this.onUserJoinedCallback) {
        this.onUserJoinedCallback(data.userId, data.username);
      }
    });

    this.socket.on("userLeft", (data: { userId: string; username: string }) => {
      if (this.onUserLeftCallback) {
        this.onUserLeftCallback(data.userId, data.username);
      }
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server");
    });
  }

  public sendMessage(message: string) {
    if (this.socket?.connected) {
      this.socket.emit("message", message);
    }
  }

  public onMessage(callback: (message: string, senderId: string, senderName: string) => void) {
    this.onMessageCallback = callback;
  }

  public onUserJoined(callback: (userId: string, username: string) => void) {
    this.onUserJoinedCallback = callback;
  }

  public onUserLeft(callback: (userId: string, username: string) => void) {
    this.onUserLeftCallback = callback;
  }
} 