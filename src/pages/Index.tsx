
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileText, Settings, MessageSquare, Users, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_SYSTEM_PROMPT } from '@/components/SystemPromptEditor';
import { SystemPromptEditor } from '@/components/SystemPromptEditor';
import DocumentUploader from '@/components/DocumentUploader';
import { Link } from 'react-router-dom';

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
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('deepseek-api-key') || '');
  const [systemPrompt, setSystemPrompt] = useState(localStorage.getItem('system-prompt') || DEFAULT_SYSTEM_PROMPT);
  const [showSettings, setShowSettings] = useState(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [showDocumentUploader, setShowDocumentUploader] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setConversations(data || []);
    } catch (error) {
      console.error('加载对话记录失败:', error);
    }
  };

  const saveApiKey = () => {
    localStorage.setItem('deepseek-api-key', apiKey);
    setShowSettings(false);
  };

  const handleSystemPromptChange = (newPrompt: string) => {
    setSystemPrompt(newPrompt);
    localStorage.setItem('system-prompt', newPrompt);
  };

  const callDeepSeekAPI = async (message: string): Promise<string> => {
    if (!apiKey) {
      throw new Error('请先设置API密钥');
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
            ...messages.map(msg => ({
              role: msg.sender === 'customer' ? 'user' : 'assistant',
              content: msg.content
            })),
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        }),
      });

      if (!response.ok) {
        throw new Error(`API调用失败: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '抱歉，我暂时无法回复。';
    } catch (error) {
      console.error('DeepSeek API调用错误:', error);
      throw error;
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

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
      // 保存对话记录
      await supabase.from('conversations').insert({
        customer_message: currentMessage,
        service_response: '',
        test_mode: 'manual'
      });

      const response = await callDeepSeekAPI(currentMessage);
      
      const serviceMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'service',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, serviceMessage]);

      // 更新对话记录
      await supabase
        .from('conversations')
        .update({ service_response: response })
        .eq('customer_message', currentMessage)
        .order('created_at', { ascending: false })
        .limit(1);

      loadConversations();
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">AI 客服安全测试平台</h1>
              <p className="text-sm text-gray-300">测试AI客服的安全性和响应能力</p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowDocumentUploader(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                上传文档
              </Button>
              
              <Button
                onClick={() => setShowSystemPrompt(true)}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                系统提示词
              </Button>
              
              <Button
                onClick={() => setShowSettings(true)}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Settings className="h-4 w-4 mr-2" />
                设置
              </Button>
            </div>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧 - 聊天界面 */}
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
                      onClick={clearChat}
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
                      <div
                        key={message.id}
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
                <div className="flex space-x-2">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="输入您的消息..."
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder-gray-400"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!currentMessage.trim() || isLoading || !apiKey}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    发送
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧 - 对话历史 */}
          <div className="w-80 p-4 pl-0">
            <Card className="h-full bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-sm">对话历史</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-3">
                  {conversations.map((conv) => (
                    <div key={conv.id} className="bg-white/10 rounded-lg p-3">
                      <div className="text-xs text-blue-300 mb-1">客户:</div>
                      <div className="text-xs text-white mb-2 line-clamp-2">
                        {conv.customer_message}
                      </div>
                      <div className="text-xs text-green-300 mb-1">客服:</div>
                      <div className="text-xs text-gray-300 line-clamp-2">
                        {conv.service_response}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(conv.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* API密钥设置模态框 */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center">
                <Key className="h-4 w-4 mr-2" />
                API 设置
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="apiKey" className="text-white">DeepSeek API 密钥</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="请输入您的 DeepSeek API 密钥"
                  className="bg-slate-800 border-slate-600 text-white"
                />
                <p className="text-xs text-gray-400 mt-2">
                  您可以在 <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">DeepSeek 平台</a> 获取 API 密钥
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveApiKey} className="bg-blue-600 hover:bg-blue-700">
                  保存设置
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 系统提示词模态框 */}
        <Dialog open={showSystemPrompt} onOpenChange={setShowSystemPrompt}>
          <DialogContent className="max-w-4xl max-h-[80vh] bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">系统提示词设置</DialogTitle>
            </DialogHeader>
            <SystemPromptEditor
              systemPrompt={systemPrompt}
              onSystemPromptChange={handleSystemPromptChange}
            />
            <div className="flex justify-end">
              <Button onClick={() => setShowSystemPrompt(false)} className="bg-blue-600 hover:bg-blue-700">
                完成
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 文档上传模态框 */}
        <Dialog open={showDocumentUploader} onOpenChange={setShowDocumentUploader}>
          <DialogContent className="max-w-4xl max-h-[80vh] bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">导入测试用例</DialogTitle>
            </DialogHeader>
            <DocumentUploader />
            <div className="flex justify-end">
              <Button onClick={() => setShowDocumentUploader(false)} className="bg-blue-600 hover:bg-blue-700">
                关闭
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;
