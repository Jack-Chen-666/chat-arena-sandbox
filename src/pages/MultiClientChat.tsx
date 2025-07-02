
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Play, Pause, TrendingUp, Upload, Plus } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import ClientChatRoom from '@/components/ClientChatRoom';
import ClientConfigModal from '@/components/ClientConfigModal';
import GlobalAttackHeatmapModal from '@/components/GlobalAttackHeatmapModal';
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
  max_messages: number;
  use_random_generation: boolean;
  isActive: boolean;
  testCases: TestCase[];
}

const MultiClientChat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<AIClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<AIClient | null>(null);
  const [showGlobalHeatmap, setShowGlobalHeatmap] = useState(false);
  const [showExcelUploader, setShowExcelUploader] = useState(false);
  const [isGlobalAutoMode, setIsGlobalAutoMode] = useState(false);
  const [messageStats, setMessageStats] = useState<{[key: string]: number}>({});
  const [apiKey, setApiKey] = useState('');
  const [completedClients, setCompletedClients] = useState<Set<string>>(new Set());
  
  const [categories, setCategories] = useState<string[]>([]);
  const [allTestCases, setAllTestCases] = useState<TestCase[]>([]);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('deepseek-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    loadClients();
    loadTestCases();
  }, []);

  const loadTestCases = async () => {
    try {
      const { data: testCasesData, error } = await supabase
        .from('test_cases')
        .select('*');

      if (error) throw error;

      if (testCasesData) {
        setAllTestCases(testCasesData);
        const uniqueCategories = [...new Set(testCasesData.map(tc => tc.category))];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('加载测试用例失败:', error);
    }
  };

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const { data: clientsData, error: clientsError } = await supabase
        .from('ai_clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      if (clientsData && clientsData.length > 0) {
        const clientsWithTestCases = await Promise.all(
          clientsData.map(async (client) => {
            const { data: testCasesData, error: testCasesError } = await supabase
              .from('ai_client_test_cases')
              .select(`
                test_cases (
                  id,
                  attack_type,
                  category,
                  test_prompt,
                  expected_result
                )
              `)
              .eq('ai_client_id', client.id);

            if (testCasesError) {
              console.error('加载测试用例失败:', testCasesError);
              return {
                ...client,
                isActive: false,
                testCases: []
              };
            }

            const testCases = testCasesData?.map(item => item.test_cases).filter(Boolean) || [];
            
            return {
              ...client,
              isActive: false,
              testCases
            };
          })
        );

        setClients(clientsWithTestCases);
      }
    } catch (error) {
      console.error('加载AI客户失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载AI客户列表",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClient = () => {
    setEditingClient(null);
    setIsConfigModalOpen(true);
  };

  const handleEditClient = (client: AIClient) => {
    setEditingClient(client);
    setIsConfigModalOpen(true);
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('ai_clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      setClients(clients.filter(client => client.id !== clientId));
      toast({
        title: "删除成功",
        description: "AI客户已删除"
      });
    } catch (error) {
      console.error('删除客户失败:', error);
      toast({
        title: "删除失败",
        description: "无法删除AI客户",
        variant: "destructive"
      });
    }
  };

  const handleSaveClient = async (clientData: Omit<AIClient, 'id' | 'isActive'>) => {
    try {
      if (editingClient) {
        // Update existing client
        const { error } = await supabase
          .from('ai_clients')
          .update({
            name: clientData.name,
            category: clientData.category,
            prompt: clientData.prompt,
            max_messages: clientData.max_messages,
            use_random_generation: clientData.use_random_generation
          })
          .eq('id', editingClient.id);

        if (error) throw error;
        
        toast({
          title: "更新成功",
          description: "AI客户已更新"
        });
      } else {
        // Create new client
        const { data: newClient, error } = await supabase
          .from('ai_clients')
          .insert({
            name: clientData.name,
            category: clientData.category,
            prompt: clientData.prompt,
            max_messages: clientData.max_messages,
            use_random_generation: clientData.use_random_generation
          })
          .select()
          .single();

        if (error) throw error;

        // Link test cases to the new client
        if (clientData.testCases && clientData.testCases.length > 0) {
          const testCaseLinks = clientData.testCases.map(testCase => ({
            ai_client_id: newClient.id,
            test_case_id: testCase.id
          }));

          const { error: linkError } = await supabase
            .from('ai_client_test_cases')
            .insert(testCaseLinks);

          if (linkError) {
            console.error('链接测试用例失败:', linkError);
          }
        }
        
        toast({
          title: "创建成功",
          description: "AI客户已创建"
        });
      }

      setIsConfigModalOpen(false);
      setEditingClient(null);
      
      // 如果是编辑现有客户，直接更新本地状态
      if (editingClient) {
        setClients(clients.map(client => 
          client.id === editingClient.id 
            ? { ...client, ...clientData }
            : client
        ));
      } else {
        // 如果是新建客户，重新加载数据
        loadClients();
      }
    } catch (error) {
      console.error('保存客户失败:', error);
      toast({
        title: "保存失败",
        description: "无法保存AI客户",
        variant: "destructive"
      });
    }
  };

  const handleToggleClientActive = (clientId: string) => {
    setClients(clients.map(client =>
      client.id === clientId ? { ...client, isActive: !client.isActive } : client
    ));
  };

  const handleStartGlobalAuto = () => {
    if (!apiKey) {
      toast({
        title: "API密钥未设置",
        description: "请先在首页设置DeepSeek API密钥",
        variant: "destructive"
      });
      return;
    }
    
    // 检查是否所有客户都已达到上限
    const allAtLimit = clients.every(client => {
      const currentCount = messageStats[client.id] || 0;
      return currentCount >= client.max_messages;
    });
    
    if (allAtLimit && clients.length > 0) {
      toast({
        title: "全部测试已完成",
        description: "所有AI客户均已达到消息上限，无需再次执行",
      });
      return;
    }
    
    setIsGlobalAutoMode(true);
    // 激活所有客户
    setClients(clients.map(client => ({ ...client, isActive: true })));
  };

  const handleStopGlobalAuto = () => {
    setIsGlobalAutoMode(false);
    setClients(clients.map(client => ({ ...client, isActive: false })));
  };

  const handleClearAllMessages = () => {
    window.dispatchEvent(new CustomEvent('clearAllClientMessages'));
    setMessageStats({});
    setCompletedClients(new Set());
  };

  const handleMessageCountChange = (clientId: string, count: number) => {
    setMessageStats(prev => ({ ...prev, [clientId]: count }));
    
    const client = clients.find(c => c.id === clientId);
    if (client && count >= client.max_messages && !completedClients.has(clientId)) {
      // 标记此客户已完成，避免重复通知
      setCompletedClients(prev => new Set([...prev, clientId]));
      
      // 显示个人客户达到上限的toast通知
      toast({
        title: `${client.name} 测试完成`,
        description: "已达到消息发送上限",
      });
      
      if (isGlobalAutoMode) {
        // 检查是否所有客户都达到上限
        const allAtLimit = clients.every(c => {
          const currentCount = c.id === clientId ? count : (messageStats[c.id] || 0);
          return currentCount >= c.max_messages;
        });
        
        if (allAtLimit) {
          // 停止全局自动模式
          setIsGlobalAutoMode(false);
          setClients(clients.map(client => ({ ...client, isActive: false })));
          
          setTimeout(() => {
            toast({
              title: "全部测试完成",
              description: "所有AI客户均已达到消息上限，全局自动模式已停止",
            });
          }, 500);
        }
      }
    }
  };

  const getActiveClientCount = () => {
    return clients.filter(client => client.isActive).length;
  };

  const getAvailableTestCases = () => {
    return clients.reduce((total, client) => total + client.testCases.length, 0);
  };

  const getTotalMessagesSent = () => {
    return Object.values(messageStats).reduce((total, count) => total + count, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">多AI客户对话测试</h1>
              <p className="text-gray-300 text-sm">同时与多个AI客户进行安全测试对话</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowGlobalHeatmap(true)}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              攻击热力图
            </Button>
            <Button
              onClick={() => setShowExcelUploader(!showExcelUploader)}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              {showExcelUploader ? '隐藏' : '上传'}测试用例
            </Button>
            <Button
              onClick={handleAddClient}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              添加客户
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{getActiveClientCount()}</div>
            <div className="text-sm text-gray-300">活跃客户: {getActiveClientCount()}/{clients.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{getAvailableTestCases()}</div>
            <div className="text-sm text-gray-300">可用案例: {getAvailableTestCases()}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{getTotalMessagesSent()}</div>
            <div className="text-sm text-gray-300">测试用例: {getTotalMessagesSent()}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-cyan-400">
              {apiKey ? '已配置' : '未配置'}
            </div>
            <div className="text-sm text-gray-300">API状态: {apiKey ? '已配置' : '未配置'}</div>
          </div>
        </div>

        {/* Control Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleClearAllMessages}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/20 bg-white/10"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              清空所有
            </Button>
          </div>
          
          <div className="flex items-center space-x-3">
            {!isGlobalAutoMode ? (
              <Button
                onClick={handleStartGlobalAuto}
                disabled={!apiKey || clients.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              >
                <Play className="h-4 w-4 mr-2" />
                全局自动
              </Button>
            ) : (
              <Button
                onClick={handleStopGlobalAuto}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Pause className="h-4 w-4 mr-2" />
                停止自动
              </Button>
            )}
          </div>
        </div>

        {/* Excel Uploader */}
        {showExcelUploader && (
          <div className="mb-6">
            <ExcelUploader />
          </div>
        )}

        {/* Client Grid */}
        {clients.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-6">
              <Plus className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-white mb-2">暂无AI客户</h3>
              <p className="text-gray-400 mb-6">请点击"添加客户"按钮创建您的第一个AI客户</p>
            </div>
            <Button
              onClick={handleAddClient}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              添加客户
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <ClientChatRoom
                key={client.id}
                client={client}
                onEdit={() => handleEditClient(client)}
                onDelete={() => handleDeleteClient(client.id)}
                onToggleActive={() => handleToggleClientActive(client.id)}
                onMessageCountChange={handleMessageCountChange}
                apiKey={apiKey}
                isGlobalAutoMode={isGlobalAutoMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ClientConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        editingClient={editingClient}
        onSave={handleSaveClient}
        categories={categories}
        testCases={allTestCases}
      />

      <GlobalAttackHeatmapModal
        isOpen={showGlobalHeatmap}
        onClose={() => setShowGlobalHeatmap(false)}
        clients={clients.map(client => ({
          id: client.id,
          name: client.name,
          category: client.category,
          messageCount: messageStats[client.id] || 0,
          maxMessages: client.max_messages,
          isActive: client.isActive
        }))}
      />

    </div>
  );
};

export default MultiClientChat;
