interface MessageInputProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  isConnected: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  inputMessage,
  setInputMessage,
  handleSendMessage,
  isConnected,
}) => {
  return (
    <form onSubmit={handleSendMessage} className="p-4 bg-white border-t fade-in">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-3 border border-gray-200 rounded-xl input-focus-ring"
        />
        <button
          type="submit"
          disabled={!isConnected}
          className="px-6 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-all input-focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </form>
  );
}; 