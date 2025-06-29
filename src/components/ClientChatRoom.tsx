
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, User, Play, Pause, Settings, Trash2, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_SYSTEM_PROMPT } from './SystemPromptEditor';

interface Message {
  id: string;
  content: string;
  sender: 'customer' | 'service';
  timestamp: Date;
}

interface TestCase {
  id: string;
  attack_type: string;
  category: string;
  test_prompt: string;
  expected_result: string;
}

interface AIClient {
  id: string;
  name: string;
  category: string;
  prompt: string;
  maxMessages: number;
  isActive: boolean;
  testCases: TestCase[];
}

interface ClientChatRoomProps {
  client: AIClient;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  apiKey: string;
  isGlobalAutoMode: boolean;
}

const ClientChatRoom: React.FC<ClientChatRoomProps> = ({
  client,
  onEdit,
  onDelete,
  onToggleActive,
  apiKey,
  isGlobalAutoMode
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  const [isLocalActive, setIsLocalActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoModeRef = useRef<NodeJS.Timeout>();
  const [systemPrompt] = useState(() => 
    localStorage.getItem('system-prompt') || DEFAULT_SYSTEM_PROMPT
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isGlobalAutoMode && client.isActive) {
      startAutoMode();
    } else {
      stopAutoMode();
    }
  }, [isGlobalAutoMode, client.isActive]);

  const addMessage = (content: string, sender: 'customer' | 'service') => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      content,
      sender,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const callDeepSeekAPI = async (message: string): Promise<string> => {
    if (!apiKey) {
      throw new Error('API密钥未设置');
    }

    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 400
        }),
      });

      if (!response.ok) {
        throw new Error(`API调用失败: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '抱歉，我暂时无法回复。';
    } catch (error) {
      console.error('DeepSeek API调用错误:', error);
      return '您好！我是AI客服助手，很高兴为您服务。请问有什么可以帮助您的吗？';
    }
  };

  const generateCustomerMessage = (): string => {
    if (client.testCases.length === 0) {
      return '你好，我想了解一下你们的产品';
    }
    
    const randomTestCase = client.testCases[Math.floor(Math.random() * client.testCases.length)];
    return randomTestCase.test_prompt;
  };

  const handleSendMessage = async () => {
    if (messageCount >= client.maxMessages) {
      toast({
        title: `${client.name} 达到消息限制`,
        description: `已达到最大 ${client.maxMessages} 条消息`,
        variant: "destructive"
      });
      stopAutoMode();
      return;
    }

    try {
      // AI客户发送消息
      const customerMessage = generateCustomerMessage();
      addMessage(customerMessage, 'customer');
      
      // 保存对话记录
      await supabase.from('conversations').insert({
        customer_message: customerMessage,
        service_response: '',
        test_mode: 'multi_client'
      });
      
      // AI客服回复
      setTimeout(async () => {
        try {
          const serviceReply = await callDeepSeekAPI(customerMessage);
          addMessage(serviceReply, 'service');
          
          // 更新对话记录
          await supabase
            .from('conversations')
            .update({ service_response: serviceReply })
            .eq('customer_message', customerMessage)
            .order('created_at', { ascending: false })
            .limit(1);
            
          setMessageCount(prev => prev + 1);
          
          if (messageCount + 1 >= client.maxMessages) {
            stopAutoMode();
          }
        } catch (error) {
          console.error('AI客服回复失败:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  };

  const startAutoMode = () => {
    if (messageCount >= client.maxMessages) {
      return;
    }

    setIsLocalActive(true);
    
    const runAutoConversation = () => {
      if (messageCount >= client.maxMessages) {
        stopAutoMode();
        return;
      }
      
      handleSendMessage();
      autoModeRef.current = setTimeout(runAutoConversation, 8000);
    };
    
    runAutoConversation();
  };

  const stopAutoMode = () => {
    setIsLocalActive(false);
    if (autoModeRef.current) {
      clearTimeout(autoModeRef.current);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setMessageCount(0);
    stopAutoMode();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = () => {
    if (isLocalActive || (isGlobalAutoMode && client.isActive)) {
      return 'bg-green-500';
    }
    return 'bg-gray-500';
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 h-96 flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor()}`} />
            {client.name}
          </CardTitle>
          <div className="flex space-x-1">
            <Button
              onClick={onEdit}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-1 h-auto"
            >
              <Settings className="h-3 w-3" />
            </Button>
            <Button
              onClick={clearMessages}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-1 h-auto"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
            <Button
              onClick={onDelete}
              variant="ghost"
              size="sm"
              className="text-red-300 hover:bg-red-500/20 p-1 h-auto"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="text-xs text-gray-300">
          {client.category} | {messageCount}/{client.maxMessages} 消息 | {client.testCases.length} 测试用例
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-2">
        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-2">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 text-xs mt-8">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>等待对话开始...</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'service' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`flex items-start space-x-1 max-w-[80%] ${message.sender === 'customer' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'service' 
                      ? 'bg-blue-500' 
                      : 'bg-orange-500'
                  }`}>
                    {message.sender === 'service' ? (
                      <Bot className="h-3 w-3 text-white" />
                    ) : (
                      <User className="h-3 w-3 text-white" />
                    )}
                  </div>
                  
                  <div className={`rounded-lg p-2 ${
                    message.sender === 'service'
                      ? 'bg-blue-600/80 text-white'
                      : 'bg-white/20 text-white'
                  }`}>
                    <p className="text-xs leading-relaxed">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 控制按钮 */}
        <div className="flex space-x-2">
          <Button
            onClick={handleSendMessage}
            disabled={!apiKey || messageCount >= client.maxMessages}
            size="sm"
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-xs"
          >
            手动发送
          </Button>
          
          {!isLocalActive ? (
            <Button
              onClick={() => {
                onToggleActive();
                startAutoMode();
              }}
              disabled={!apiKey || messageCount >= client.maxMessages}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Play className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                onToggleActive();
                stopAutoMode();
              }}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Pause className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientChatRoom;
