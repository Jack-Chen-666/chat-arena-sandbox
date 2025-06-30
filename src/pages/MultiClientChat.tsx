import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Settings, Play, Pause, RotateCcw, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import ClientChatRoom from '@/components/ClientChatRoom';
import ClientConfigModal from '@/components/ClientConfigModal';
import ExcelUploader from '@/components/ExcelUploader';

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

const MultiClientChat = () => {
  const [clients, setClients] = useState<AIClient[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showExcelUploader, setShowExcelUploader] = useState(false);
  const [editingClient, setEditingClient] = useState<AIClient | null>(null);
  const [isGlobalAutoMode, setIsGlobalAutoMode] = useState(false);
  const [clientMessageCounts, setClientMessageCounts] = useState<{[key: string]: number}>({});
  const [apiKey] = useState(() => localStorage.getItem('deepseek-api-key') || '');

  useEffect(() => {
    loadTestCases();
    const savedClients = localStorage.getItem('ai-clients');
    if (savedClients) {
      try {
        const parsedClients = JSON.parse(savedClients);
        setClients(parsedClients);
        
        // 初始化消息计数
        const counts: {[key: string]: number} = {};
        parsedClients.forEach((client: AIClient) => {
          counts[client.id] = 0;
        });
        setClientMessageCounts(counts);
      } catch (error) {
        console.error('加载客户配置失败:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (clients.length > 0) {
      localStorage.setItem('ai-clients', JSON.stringify(clients));
    }
  }, [clients]);

  const loadTestCases = async () => {
    try {
      const { data, error } = await supabase
        .from('test_cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setTestCases(data || []);
      const uniqueCategories = [...new Set(data?.map(tc => tc.category) || [])];
      setCategories(uniqueCategories);
      
      console.log('加载的测试用例:', data);
      console.log('类别:', uniqueCategories);
    } catch (error) {
      console.error('加载测试用例失败:', error);
    }
  };

  const createNewClient = () => {
    setEditingClient(null);
    setShowConfigModal(true);
  };

  const editClient = (client: AIClient) => {
    setEditingClient(client);
    setShowConfigModal(true);
  };

  const saveClient = (clientData: Omit<AIClient, 'id' | 'isActive'>) => {
    const categoryTestCases = testCases.filter(tc => tc.category === clientData.category);
    
    if (editingClient) {
      setClients(prev => prev.map(c => 
        c.id === editingClient.id 
          ? { ...clientData, id: editingClient.id, isActive: c.isActive, testCases: categoryTestCases }
          : c
      ));
      toast({
        title: "客户配置已更新",
        description: `${clientData.name} 的配置已成功更新`,
      });
    } else {
      const newClient: AIClient = {
        ...clientData,
        id: Date.now().toString(),
        isActive: false,
        testCases: categoryTestCases
      };
      setClients(prev => [...prev, newClient]);
      setClientMessageCounts(prev => ({...prev, [newClient.id]: 0}));
      toast({
        title: "新客户已创建",
        description: `${clientData.name} 已成功创建`,
      });
    }
    
    setShowConfigModal(false);
    setEditingClient(null);
  };

  const deleteClient = (clientId: string) => {
    setClients(prev => prev.filter(c => c.id !== clientId));
    setClientMessageCounts(prev => {
      const newCounts = {...prev};
      delete newCounts[clientId];
      return newCounts;
    });
    toast({
      title: "客户已删除",
      description: "AI客户已成功删除",
    });
  };

  const toggleClientActive = (clientId: string) => {
    setClients(prev => prev.map(c => 
      c.id === clientId ? { ...c, isActive: !c.isActive } : c
    ));
  };

  const updateClientMessageCount = (clientId: string, count: number) => {
    setClientMessageCounts(prev => {
      const newCounts = {...prev, [clientId]: count};
      
      // 检查是否所有客户都达到了消息上限
      if (isGlobalAutoMode) {
        const allClientsFinished = clients.every(client => {
          const clientCount = newCounts[client.id] || 0;
          return clientCount >= client.maxMessages;
        });
        
        if (allClientsFinished) {
          setIsGlobalAutoMode(false);
          setClients(prev => prev.map(c => ({ ...c, isActive: false })));
          toast({
            title: "全局自动模式已完成",
            description: "所有AI客户都已达到消息上限",
          });
        }
      }
      
      return newCounts;
    });
  };

  const startGlobalAutoMode = () => {
    if (!apiKey) {
      toast({
        title: "API密钥未设置",
        description: "请先在设置中配置DeepSeek API密钥",
        variant: "destructive"
      });
      return;
    }

    if (clients.length === 0) {
      toast({
        title: "无可用客户",
        description: "请先创建至少一个AI客户",
        variant: "destructive"
      });
      return;
    }

    // 检查是否有客户还未达到消息上限
    const availableClients = clients.filter(c => {
      const messageCount = clientMessageCounts[c.id] || 0;
      return messageCount < c.maxMessages;
    });

    if (availableClients.length === 0) {
      toast({
        title: "所有客户已完成",
        description: "所有AI客户都已达到消息上限",
        variant: "destructive"
      });
      return;
    }

    setIsGlobalAutoMode(true);
    // 只激活还未达到限制的客户
    setClients(prev => prev.map(c => {
      const messageCount = clientMessageCounts[c.id] || 0;
      return { ...c, isActive: messageCount < c.maxMessages };
    }));
    
    toast({
      title: "全局自动模式已启动",
      description: `${availableClients.length} 个AI客户开始自动对话`,
    });
  };

  const stopGlobalAutoMode = () => {
    setIsGlobalAutoMode(false);
    setClients(prev => prev.map(c => ({ ...c, isActive: false })));
    
    toast({
      title: "全局自动模式已停止",
      description: "所有AI客户停止自动对话",
    });
  };

  const clearAllMessages = () => {
    // 通知所有客户清空消息
    const clearEvent = new CustomEvent('clearAllClientMessages');
    window.dispatchEvent(clearEvent);
    
    // 重置消息计数
    setClientMessageCounts(prev => {
      const newCounts = {...prev};
      Object.keys(newCounts).forEach(key => {
        newCounts[key] = 0;
      });
      return newCounts;
    });
    
    // 如果在全局自动模式，也停止它
    if (isGlobalAutoMode) {
      stopGlobalAutoMode();
    }
    
    toast({
      title: "消息已清空",
      description: "所有对话记录已清空",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to="/">
                <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">多AI客户对话测试</h1>
                <p className="text-sm text-gray-300">多个AI客户同时与AI销售进行安全性测试</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowExcelUploader(true)}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                上传测试用例
              </Button>
              
              <Button
                onClick={createNewClient}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加AI客户
              </Button>
              
              <Button
                onClick={clearAllMessages}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                清空所有
              </Button>
              
              {!isGlobalAutoMode ? (
                <Button
                  onClick={startGlobalAutoMode}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!apiKey || clients.length === 0}
                >
                  <Play className="h-4 w-4 mr-2" />
                  全局自动
                </Button>
              ) : (
                <Button
                  onClick={stopGlobalAutoMode}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  停止所有
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 状态栏 */}
        <div className="bg-white/5 border-b border-white/10 p-2">
          <div className="flex items-center justify-between text-sm text-gray-300">
            <span>活跃客户: {clients.filter(c => c.isActive).length}/{clients.length}</span>
            <span>可用类别: {categories.length}</span>
            <span>测试用例: {testCases.length}</span>
            <span className={apiKey ? "text-green-300" : "text-red-300"}>
              API状态: {apiKey ? "已配置" : "未配置"}
            </span>
          </div>
        </div>

        {/* 客户对话区域 */}
        <div className="flex-1 overflow-hidden">
          {clients.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8">
                <CardContent className="text-center">
                  <Plus className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-white mb-2">暂无AI客户</h3>
                  <p className="text-gray-300 mb-4">点击"添加AI客户"开始创建您的第一个AI客户</p>
                  <Button onClick={createNewClient} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    添加AI客户
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="h-full p-4">
              <div className="h-full overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {clients.map(client => (
                    <ClientChatRoom
                      key={client.id}
                      client={client}
                      onEdit={() => editClient(client)}
                      onDelete={() => deleteClient(client.id)}
                      onToggleActive={() => toggleClientActive(client.id)}
                      onMessageCountChange={updateClientMessageCount}
                      apiKey={apiKey}
                      isGlobalAutoMode={isGlobalAutoMode}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 配置模态框 */}
        {showConfigModal && (
          <ClientConfigModal
            isOpen={showConfigModal}
            onClose={() => {
              setShowConfigModal(false);
              setEditingClient(null);
            }}
            onSave={saveClient}
            categories={categories}
            testCases={testCases}
            editingClient={editingClient}
          />
        )}

        {/* Excel上传模态框 */}
        {showExcelUploader && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-900 p-6 rounded-lg max-w-2xl w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">上传测试用例</h2>
                <Button
                  onClick={() => setShowExcelUploader(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  ×
                </Button>
              </div>
              <ExcelUploader />
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => {
                    setShowExcelUploader(false);
                    loadTestCases(); // 重新加载测试用例
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  完成
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiClientChat;
