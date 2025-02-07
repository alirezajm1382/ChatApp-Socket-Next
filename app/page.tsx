"use client";

import { useEffect, useState, useRef } from "react";
import { SocketIOConnection } from "../utils/socket";
import { MessageContainer } from "../components/MessageContainer";
import { MessageInput } from "../components/MessageInput";

interface Message {
  text: string;
  senderId: string;
  timestamp: number;
  senderName: string;
}

const Home: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [username, setUsername] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<SocketIOConnection | null>(null);

  useEffect(() => {
    if (username && !socketRef.current) {
      socketRef.current = new SocketIOConnection(username);

      socketRef.current.onMessage((message, senderId, senderName) => {
        addMessage(message, senderId, senderName);
      });

      socketRef.current.onUserJoined((userId, username) => {
        addSystemMessage(`${username} joined the chat`);
      });

      socketRef.current.onUserLeft((userId, username) => {
        addSystemMessage(`${username} left the chat`);
      });

      socketRef.current.connect();
      setIsConnected(true);
    }
  }, [username]);

  const addMessage = (text: string, senderId: string, senderName: string) => {
    setMessages((prev) => [...prev, { text, senderId, timestamp: Date.now(), senderName }]);
  };

  const addSystemMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { 
        text, 
        senderId: "system", 
        timestamp: Date.now(), 
        senderName: "System" 
      },
    ]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && socketRef.current) {
      socketRef.current.sendMessage(inputMessage);
      addMessage(inputMessage, "me", username);
      setInputMessage("");
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!username) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-gradient flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md fade-in">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">
            Welcome to WebRTC Chat
          </h1>
          <p className="text-gray-600 mb-8">
            Enter your name to join the conversation
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.username as HTMLInputElement;
              setUsername(input.value);
            }}
          >
            <input
              type="text"
              name="username"
              className="w-full p-4 border border-gray-200 rounded-xl mb-4 input-focus-ring"
              placeholder="Your name"
              required
              minLength={2}
              maxLength={20}
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-4 rounded-xl font-medium hover:opacity-90 transition-all input-focus-ring"
            >
              Join Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border rounded-xl m-4 p-6 shadow-lg fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">WebRTC Chat</h1>
              <p className="text-sm text-gray-500 mt-1">Connected as {username}</p>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
              <div
                className={`w-2 h-2 rounded-full status-indicator ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-sm text-gray-500">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <MessageContainer messages={messages} />

        {/* Input Form */}
        <MessageInput
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleSendMessage={handleSendMessage}
          isConnected={isConnected}
        />
      </div>
    </div>
  );
};

export default Home;
