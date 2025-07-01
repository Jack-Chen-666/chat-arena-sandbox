
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_SYSTEM_PROMPT } from '@/components/SystemPromptEditor';
import { SystemPromptEditor } from '@/components/SystemPromptEditor';
import DocumentUploader from '@/components/DocumentUploader';
import { toast } from '@/hooks/use-toast';
import HeaderSection from '@/components/HeaderSection';
import ChatInterface from '@/components/ChatInterface';
import ConversationHistory from '@/components/ConversationHistory';

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
  console.log('Index component loaded');
  
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
    console.log('Index useEffect - loading conversations');
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      console.log('Loading conversations...');
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('test_mode', 'manual')
        .is('ai_client_id', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }
      
      console.log('Loaded conversations:', data);
      setConversations(data || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const saveApiKey = () => {
    try {
      localStorage.setItem('deepseek-api-key', apiKey);
      setShowSettings(false);
      console.log('API key saved');
    } catch (error) {
      console.error('Failed to save API key:', error);
    }
  };

  const handleSystemPromptChange = (newPrompt: string) => {
    try {
      setSystemPrompt(newPrompt);
      localStorage.setItem('system-prompt', newPrompt);
      console.log('System prompt updated');
    } catch (error) {
      console.error('Failed to update system prompt:', error);
    }
  };

  const callDeepSeekAPI = async (message: string): Promise<string> => {
    if (!apiKey) {
      throw new Error('请先设置API密钥');
    }

    try {
      console.log('Calling DeepSeek API...');
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
      console.log('DeepSeek API response received');
      return data.choices[0]?.message?.content || '抱歉，我暂时无法回复。';
    } catch (error) {
      console.error('DeepSeek API error:', error);
      throw error;
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    console.log('Sending message:', currentMessage);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentMessage,
      sender: 'customer',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await callDeepSeekAPI(messageToSend);
      
      const serviceMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'service',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, serviceMessage]);

      // 保存对话记录时确保使用正确的test_mode值
      const { error } = await supabase.from('conversations').insert({
        customer_message: messageToSend,
        service_response: response,
        test_mode: 'manual', // 确保使用正确的值
        chat_type: 'single',
        ai_client_id: null
      });

      if (error) {
        console.error('Failed to save conversation:', error);
      } else {
        console.log('Conversation saved successfully');
        loadConversations();
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "发送失败",
        description: "消息发送失败，请检查API密钥和网络连接",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    console.log('Chat cleared');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto h-screen flex flex-col">
        <HeaderSection
          onShowDocumentUploader={() => setShowDocumentUploader(true)}
          onShowSystemPrompt={() => setShowSystemPrompt(true)}
          onShowSettings={() => setShowSettings(true)}
        />

        <div className="flex-1 flex overflow-hidden">
          <ChatInterface
            messages={messages}
            currentMessage={currentMessage}
            setCurrentMessage={setCurrentMessage}
            onSendMessage={sendMessage}
            onClearChat={clearChat}
            isLoading={isLoading}
            apiKey={apiKey}
          />

          <ConversationHistory conversations={conversations} />
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
