
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatInputProps {
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
  apiKey: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  currentMessage,
  setCurrentMessage,
  onSendMessage,
  isLoading,
  apiKey
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSendMessage();
    }
  };

  return (
    <div className="flex space-x-2">
      <Input
        value={currentMessage}
        onChange={(e) => setCurrentMessage(e.target.value)}
        placeholder="输入您的消息..."
        className="flex-1 bg-white/10 border-white/20 text-white placeholder-gray-400"
        onKeyPress={handleKeyPress}
        disabled={isLoading}
      />
      <Button
        onClick={onSendMessage}
        disabled={!currentMessage.trim() || isLoading || !apiKey}
        className="bg-blue-600 hover:bg-blue-700"
      >
        发送
      </Button>
    </div>
  );
};

export default ChatInput;
