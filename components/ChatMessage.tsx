interface ChatMessageProps {
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  isMe: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  text,
  senderId,
  senderName,
  timestamp,
  isMe,
}) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
      <div className="text-xs text-gray-500 mt-1 px-2">
        {isMe ? "You" : senderName || senderId} • {formatTime(timestamp)}
      </div>
      <div
        className={`px-4 py-2 rounded-2xl message-bubble text-center ${
          isMe
            ? "bg-purple-200 text-gray-800"
            : "bg-white border border-gray-200 text-gray-800"
        }`}
      >
        {text}
      </div>
    </div>
  );
}; 