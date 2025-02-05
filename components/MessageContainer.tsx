import { useEffect, useRef } from "react";
import { SystemMessage } from "./SystemMessage";
import { ChatMessage } from "./ChatMessage";

interface Message {
  text: string;
  senderId: string;
  timestamp: number;
  senderName: string;
}

interface MessageContainerProps {
  messages: Message[];
}

export const MessageContainer: React.FC<MessageContainerProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex message-animation ${
            message.senderId === "me"
              ? "justify-end"
              : message.senderId === "system"
              ? "justify-center"
              : "justify-start"
          }`}
        >
          {message.senderId === "system" ? (
            <SystemMessage text={message.text} />
          ) : (
            <ChatMessage
              text={message.text}
              senderId={message.senderId}
              senderName={message.senderName}
              timestamp={message.timestamp}
              isMe={message.senderId === "me"}
            />
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};