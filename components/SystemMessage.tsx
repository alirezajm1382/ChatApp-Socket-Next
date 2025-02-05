interface SystemMessageProps {
  text: string;
}

export const SystemMessage: React.FC<SystemMessageProps> = ({ text }) => {
  return (
    <div className="bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-500 message-bubble">
      {text}
    </div>
  );
}; 