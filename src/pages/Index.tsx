
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Upload, FileText, MessageSquare, User, Bot, Settings, History, Send, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import AttackHeatmapModal from '@/components/AttackHeatmapModal';

interface Message {
  id: string;
  content: string;
  sender: 'customer' | 'service';
  timestamp: Date;
}

interface Conversation {
  id: string;
  customer_message: string;
  service_response: string;
  created_at: string;
  test_mode: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('deepseek-api-key') || '');
  const [systemPrompt, setSystemPrompt] = useState(() => localStorage.getItem('system-prompt') || '你是一个专业的AI客服助手，请礼貌、耐心地回答用户的问题。');
  const [showSettings, setShowSettings] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Conversation[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConversationHistory();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversationHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setConversationHistory(data || []);
    } catch (err) {
      console.error('加载对话历史失败:', err);
    }
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
    if (!currentMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentMessage,
      sender: 'customer',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const aiResponse = await callDeepSeekAPI(currentMessage);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'service',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // 保存对话记录
      await supabase.from('conversations').insert({
        customer_message: currentMessage,
        service_response: aiResponse,
        test_mode: 'single_chat'
      });

      await loadConversationHistory();

    } catch (error) {
      console.error('发送消息失败:', error);
      toast({
        title: "发送失败",
        description: "消息发送失败，请重试",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast({
      title: "对话已清空",
      description: "聊天记录已清除",
    });
  };

  const saveSettings = () => {
    localStorage.setItem('deepseek-api-key', apiKey);
    localStorage.setItem('system-prompt', systemPrompt);
    setShowSettings(false);
    toast({
      title: "设置已保存",
      description: "API密钥和系统提示词已保存",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto h-screen flex flex-col">
        {/* 顶部导航 */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">AI 客服安全测试平台</h1>
              <p className="text-sm text-gray-300">测试AI客服的安全性和响应能力</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowSettings(!showSettings)}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Settings className="h-4 w-4 mr-2" />
                设置
              </Button>
              <Button
                onClick={clearChat}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                清空对话
              </Button>
              <Link to="/multi-client">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  多客户测试
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 设置面板 */}
        {showSettings && (
          <div className="bg-white/5 border-b border-white/10 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  DeepSeek API密钥
                </label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="请输入您的DeepSeek API密钥"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  系统提示词
                </label>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="请输入系统提示词"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-300"
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={saveSettings} className="bg-blue-600 hover:bg-blue-700">
                保存设置
              </Button>
            </div>
          </div>
        )}

        {/* 主要内容区域 - 扩大左右区域 */}
        <div className="flex-1 flex gap-4 p-4 min-h-0 max-w-full">
          {/* 左侧聊天区域 - 扩大宽度 */}
          <div className="flex-1 flex flex-col min-w-0">
            <Card className="flex-1 bg-white/10 backdrop-blur-md border-white/20 flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    实时对话测试
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => setShowHeatmap(true)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      攻击热力图
                    </Button>
                    <Link to="/multi-client">
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        多客户测试
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col min-h-0 p-4">
                {/* 消息区域 - 扩大高度 */}
                <ScrollArea className="flex-1 mb-4 min-h-0">
                  <div className="space-y-4 pr-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-400 mt-12">
                        <MessageSquare className="h-20 w-20 mx-auto mb-6 opacity-50" />
                        <p className="text-lg">开始与AI客服对话...</p>
                        <p className="text-sm mt-2">输入您的问题并点击发送</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === 'service' ? 'justify-start' : 'justify-end'}`}
                        >
                          <div className={`flex items-start space-x-3 max-w-[75%] ${message.sender === 'customer' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              message.sender === 'service' 
                                ? 'bg-blue-500' 
                                : 'bg-orange-500'
                            }`}>
                              {message.sender === 'service' ? (
                                <Bot className="h-5 w-5 text-white" />
                              ) : (
                                <User className="h-5 w-5 text-white" />
                              )}
                            </div>
                            
                            <div className={`rounded-lg p-4 ${
                              message.sender === 'service'
                                ? 'bg-blue-600/80 text-white'
                                : 'bg-white/20 text-white'
                            }`}>
                              <p className="text-sm leading-relaxed">{message.content}</p>
                              <p className="text-xs opacity-70 mt-2">
                                {message.timestamp.toLocaleTimeString('zh-CN', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-white" />
                          </div>
                          <div className="bg-blue-600/80 text-white rounded-lg p-4">
                            <p className="text-sm">AI客服正在回复...</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* 输入区域 */}
                <div className="flex space-x-3">
                  <Textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="请输入您的问题..."
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder-gray-300 resize-none"
                    rows={3}
                    disabled={isLoading || !apiKey}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !currentMessage.trim() || !apiKey}
                    className="bg-blue-600 hover:bg-blue-700 px-6"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧对话历史区域 - 扩大宽度 */}
          <div className="w-96 flex flex-col">
            <Card className="flex-1 bg-white/10 backdrop-blur-md border-white/20 flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  对话历史
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 p-4">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {conversationHistory.length === 0 ? (
                      <div className="text-center text-gray-400 mt-8">
                        <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>暂无对话记录</p>
                      </div>
                    ) : (
                      conversationHistory.map((conv) => (
                        <div key={conv.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="space-y-2">
                            <div className="flex items-start space-x-2">
                              <User className="h-4 w-4 text-orange-400 mt-1 flex-shrink-0" />
                              <p className="text-sm text-gray-200 leading-relaxed">
                                {conv.customer_message}
                              </p>
                            </div>
                            <div className="flex items-start space-x-2">
                              <Bot className="h-4 w-4 text-blue-400 mt-1 flex-shrink-0" />
                              <p className="text-sm text-gray-300 leading-relaxed">
                                {conv.service_response}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-white/10">
                            <p className="text-xs text-gray-400">
                              {formatTime(conv.created_at)}
                            </p>
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

        {/* 攻击热力图模态框 */}
        <AttackHeatmapModal
          isOpen={showHeatmap}
          onClose={() => setShowHeatmap(false)}
          messages={messages}
          clientName="首页对话"
        />
      </div>
    </div>
  );
};

export default Index;
