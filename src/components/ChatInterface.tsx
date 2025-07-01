
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

interface Message {
  id: string;
  content: string;
  sender: 'customer' | 'service';
  timestamp: Date;
}

interface ChatInterfaceProps {
  messages: Message[];
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  onSendMessage: () => void;
  onClearChat: () => void;
  isLoading: boolean;
  apiKey: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  currentMessage,
  setCurrentMessage,
  onSendMessage,
  onClearChat,
  isLoading,
  apiKey
}) => {
  return (
    <div className="flex-1 flex flex-col p-4">
      <Card className="flex-1 bg-white/10 backdrop-blur-md border-white/20 flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">实时对话测试</CardTitle>
            <div className="flex space-x-2">
              <Link to="/multi-client">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <Users className="h-4 w-4 mr-2" />
                  多客户测试
                </Button>
              </Link>
              <Button
                onClick={onClearChat}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                清空对话
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col min-h-0">
          {/* 消息区域 */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-8">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>开始与AI客服对话...</p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/20 text-white rounded-lg p-3">
                  <p className="text-sm">AI客服正在回复...</p>
                </div>
              </div>
            )}
          </div>

          {/* 输入区域 */}
          <ChatInput
            currentMessage={currentMessage}
            setCurrentMessage={setCurrentMessage}
            onSendMessage={onSendMessage}
            isLoading={isLoading}
            apiKey={apiKey}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatInterface;
