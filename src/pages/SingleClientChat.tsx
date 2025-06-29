
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Bot, User, Play, Pause, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  useRandomGeneration?: boolean;
}

const SingleClientChat = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [client, setClient] = useState<AIClient | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [usedTestCases, setUsedTestCases] = useState<Set<string>>(new Set());
  const [apiKey] = useState(() => localStorage.getItem('deepseek-api-key') || '');
  const [systemPrompt] = useState(() => localStorage.getItem('system-prompt') || '');

  useEffect(() => {
    if (location.state) {
      const { client: stateClient, messages: stateMessages, messageCount: stateMessageCount } = location.state;
      setClient(stateClient);
      setMessages(stateMessages || []);
      setMessageCount(stateMessageCount || 0);
    }
  }, [location.state]);

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

  const generateCustomerMessage = async (): Promise<string> => {
    if (!client || client.testCases.length === 0) {
      return '你好，我想了解一下你们的产品';
    }
    
    if (client.useRandomGeneration) {
      const randomTestCase = client.testCases[Math.floor(Math.random() * client.testCases.length)];
      return randomTestCase.test_prompt;
    } else {
      const availableTestCases = client.testCases.filter(tc => !usedTestCases.has(tc.id));
      
      if (availableTestCases.length === 0) {
        setUsedTestCases(new Set());
        const testCase = client.testCases[0];
        setUsedTestCases(prev => new Set([...prev, testCase.id]));
        return testCase.test_prompt;
      }
      
      const testCase = availableTestCases[0];
      setUsedTestCases(prev => new Set([...prev, testCase.id]));
      return testCase.test_prompt;
    }
  };

  const handleSendMessage = async () => {
    if (!client || messageCount >= client.maxMessages) {
      toast({
        title: "达到消息限制",
        description: `已达到最大 ${client?.maxMessages} 条消息`,
        variant: "destructive"
      });
      setIsActive(false);
      return;
    }

    try {
      const customerMessage = await generateCustomerMessage();
      const newMessage: Message = {
        id: Date.now().toString() + Math.random(),
        content: customerMessage,
        sender: 'customer',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      
      setTimeout(async () => {
        try {
          const serviceReply = await callDeepSeekAPI(customerMessage);
          const replyMessage: Message = {
            id: Date.now().toString() + Math.random(),
            content: serviceReply,
            sender: 'service',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, replyMessage]);
          setMessageCount(prev => prev + 1);
          
          if (messageCount + 1 >= client.maxMessages) {
            setIsActive(false);
            toast({
              title: "对话已完成",
              description: `已达到最大 ${client.maxMessages} 条消息，自动停止`,
            });
          }
        } catch (error) {
          console.error('AI客服回复失败:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setMessageCount(0);
    setUsedTestCases(new Set());
    setIsActive(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8">
          <CardContent className="text-center">
            <p className="text-white">客户信息加载中...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => navigate('/multi-client')}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">{client.name}</h1>
                <p className="text-sm text-gray-300">
                  {client.category} | {messageCount}/{client.maxMessages} 消息
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={clearMessages}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                清空消息
              </Button>
              
              {!isActive ? (
                <Button
                  onClick={() => setIsActive(true)}
                  disabled={!apiKey || messageCount >= client.maxMessages}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  开始自动对话
                </Button>
              ) : (
                <Button
                  onClick={() => setIsActive(false)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  停止对话
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 对话区域 */}
        <div className="flex-1 p-4 min-h-0">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 h-full flex flex-col">
            <CardContent className="flex-1 p-4 min-h-0">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-8">
                      <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>等待对话开始...</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'service' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`flex items-start space-x-2 max-w-[70%] ${message.sender === 'customer' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.sender === 'service' 
                              ? 'bg-blue-500' 
                              : 'bg-orange-500'
                          }`}>
                            {message.sender === 'service' ? (
                              <Bot className="h-4 w-4 text-white" />
                            ) : (
                              <User className="h-4 w-4 text-white" />
                            )}
                          </div>
                          
                          <div className={`rounded-lg p-3 ${
                            message.sender === 'service'
                              ? 'bg-blue-600/80 text-white'
                              : 'bg-white/20 text-white'
                          }`}>
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <p className="text-xs opacity-70 mt-2">
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SingleClientChat;
