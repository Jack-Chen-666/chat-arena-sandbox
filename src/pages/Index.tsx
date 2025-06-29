
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Play, Pause, RotateCcw, Settings, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_SYSTEM_PROMPT } from '@/components/SystemPromptEditor';
import { SystemPromptEditor } from '@/components/SystemPromptEditor';
import { Link } from 'react-router-dom';

interface Message {
  id: string;
  content: string;
  sender: 'customer' | 'service';
  timestamp: Date;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [conversationCount, setConversationCount] = useState(0);
  const [apiKey] = useState(() => localStorage.getItem('deepseek-api-key') || '');
  const [systemPrompt] = useState(() => localStorage.getItem('system-prompt') || DEFAULT_SYSTEM_PROMPT);
  const [showSystemPromptEditor, setShowSystemPromptEditor] = useState(false);
  const autoModeRef = useRef<NodeJS.Timeout>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    try {
      // 用户发送消息
      addMessage(input, 'customer');
      const userMessage = input;
      setInput('');

      // 保存对话记录
      await supabase.from('conversations').insert({
        customer_message: userMessage,
        service_response: '',
        test_mode: 'single_chat'
      });

      // AI客服回复
      setTimeout(async () => {
        try {
          const serviceReply = await callDeepSeekAPI(userMessage);
          addMessage(serviceReply, 'service');

          // 更新对话记录
          await supabase
            .from('conversations')
            .update({ service_response: serviceReply })
            .eq('customer_message', userMessage)
            .order('created_at', { ascending: false })
            .limit(1);
        } catch (error) {
          console.error('AI客服回复失败:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  };

  const handleAutoChat = async () => {
    if (conversationCount >= 10) {
      toast({
        title: "对话已达上限",
        description: "已完成10轮对话，请清空后重新开始",
        variant: "destructive"
      });
      setIsAutoMode(false);
      return;
    }

    try {
      // 用户发送消息
      const customerMessage = '你好，我想了解一下你们的产品';
      addMessage(customerMessage, 'customer');

      // 保存对话记录
      await supabase.from('conversations').insert({
        customer_message: customerMessage,
        service_response: '',
        test_mode: 'single_chat'
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
        } catch (error) {
          console.error('AI客服回复失败:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('发送消息失败:', error);
    }

    setConversationCount(prev => prev + 1);
    
    // 检查是否达到10轮限制
    if (conversationCount + 1 >= 10) {
      setIsAutoMode(false);
      toast({
        title: "自动对话已完成",
        description: "已完成10轮对话，自动停止",
      });
    }
  };

  const startAutoChat = () => {
    if (!apiKey) {
      toast({
        title: "API密钥未设置",
        description: "请先在设置中配置DeepSeek API密钥",
        variant: "destructive"
      });
      return;
    }

    setIsAutoMode(true);
    autoModeRef.current = setInterval(handleAutoChat, 8000);
  };

  const stopAutoChat = () => {
    setIsAutoMode(false);
    if (autoModeRef.current) {
      clearInterval(autoModeRef.current);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setConversationCount(0);
    stopAutoChat();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">AI客服对话测试</h1>
              <p className="text-sm text-gray-300">与AI客服进行对话，测试其安全性</p>
            </div>
            <div className="flex items-center space-x-2">
              <Link to="/multi-client">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Users className="h-4 w-4 mr-2" />
                  多客户对话
                </Button>
              </Link>
              <Button
                onClick={() => setShowSystemPromptEditor(true)}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Settings className="h-4 w-4 mr-2" />
                设置
              </Button>
            </div>
          </div>
        </div>

        {/* 对话区域 */}
        <div className="flex-1 p-4 min-h-0">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 h-full flex flex-col">
            <CardContent className="flex-1 p-4 flex flex-col min-h-0">
              {/* 消息滚动区域 */}
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4 pr-2">
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
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* 输入框和发送按钮 */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Input
                  type="text"
                  placeholder="输入你的消息..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
                <Button onClick={handleSendMessage} disabled={!apiKey} className="bg-orange-600 hover:bg-orange-700 text-white">
                  发送
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 底部控制栏 */}
        <div className="bg-white/10 backdrop-blur-md border-t border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-300">
              <span>对话轮数: {conversationCount} / 10</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={clearMessages}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                清空
              </Button>
              {!isAutoMode ? (
                <Button
                  onClick={startAutoChat}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={!apiKey}
                >
                  <Play className="h-4 w-4 mr-2" />
                  自动对话
                </Button>
              ) : (
                <Button
                  onClick={stopAutoChat}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  停止
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 系统提示词编辑器 */}
        {showSystemPromptEditor && (
          <SystemPromptEditor
            isOpen={showSystemPromptEditor}
            onClose={() => setShowSystemPromptEditor(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
