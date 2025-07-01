
import React from 'react';

interface Message {
  id: string;
  content: string;
  sender: 'customer' | 'service';
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div
      className={`flex ${message.sender === 'service' ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`max-w-[70%] rounded-lg p-3 ${
        message.sender === 'service'
          ? 'bg-white/20 text-white'
          : 'bg-blue-600 text-white'
      }`}>
        <p className="text-sm">{message.content}</p>
        <p className="text-xs opacity-70 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
