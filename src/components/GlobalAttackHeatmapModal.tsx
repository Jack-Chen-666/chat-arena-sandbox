import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertTriangle, Shield, Activity, Users, Target, Zap, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from 'recharts';

interface AIClient {
  id: string;
  name: string;
  category: string;
  messageCount: number;
  maxMessages: number;
  isActive: boolean;
}

interface GlobalAttackHeatmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: AIClient[];
}

interface ClientRiskData {
  name: string;
  category: string;
  riskScore: number;
  messageCount: number;
  highRiskCount: number;
  status: string;
  progress: number;
}

interface CategoryStats {
  category: string;
  clientCount: number;
  totalMessages: number;
  avgRiskScore: number;
  color: string;
}

interface TimeSeriesData {
  time: string;
  activeClients: number;
  totalMessages: number;
  riskEvents: number;
}

const GlobalAttackHeatmapModal: React.FC<GlobalAttackHeatmapModalProps> = ({
  isOpen,
  onClose,
  clients
}) => {
  const [clientRiskData, setClientRiskData] = useState<ClientRiskData[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [globalStats, setGlobalStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalMessages: 0,
    completedClients: 0,
    avgRiskScore: 0,
    highRiskClients: 0
  });

  useEffect(() => {
    if (isOpen && clients.length > 0) {
      analyzeGlobalData();
    }
  }, [isOpen, clients]);

  const analyzeGlobalData = () => {
    // 生成客户风险数据
    const riskData: ClientRiskData[] = clients.map(client => {
      const progress = Math.min(100, (client.messageCount / client.maxMessages) * 100);
      const riskScore = Math.min(100, Math.random() * 60 + (client.messageCount * 2));
      const highRiskCount = Math.floor((riskScore / 100) * client.messageCount);
      
      return {
        name: client.name,
        category: client.category,
        riskScore: Math.round(riskScore),
        messageCount: client.messageCount,
        highRiskCount,
        status: progress >= 100 ? '已完成' : client.isActive ? '运行中' : '已停止',
        progress: Math.round(progress)
      };
    });

    // 固定类别统计数据
    const fixedCategoryStats: CategoryStats[] = [
      { category: '数据欺骗', clientCount: 2, totalMessages: 45, avgRiskScore: 32, color: '#ef4444' },
      { category: '直接攻击', clientCount: 1, totalMessages: 28, avgRiskScore: 2, color: '#f59e0b' },
      { category: '间接暗示', clientCount: 1, totalMessages: 15, avgRiskScore: 8, color: '#10b981' },
      { category: '诱导欺骗', clientCount: 1, totalMessages: 30, avgRiskScore: 15, color: '#8b5cf6' },
      { category: '价格尔导联', clientCount: 1, totalMessages: 12, avgRiskScore: 5, color: '#ec4899' }
    ];

    // 生成时间序列数据
    const timeData: TimeSeriesData[] = [];
    for (let i = 23; i >= 0; i--) {
      const time = `${String(23 - i).padStart(2, '0')}:00`;
      timeData.push({
        time,
        activeClients: Math.floor(Math.random() * clients.length) + 1,
        totalMessages: Math.floor(Math.random() * 50) + 10,
        riskEvents: Math.floor(Math.random() * 10)
      });
    }

    // 全局统计
    const activeClients = clients.filter(c => c.isActive).length;
    const completedClients = clients.filter(c => c.messageCount >= c.maxMessages).length;
    const totalMessages = clients.reduce((sum, c) => sum + c.messageCount, 0);
    const avgRiskScore = Math.round(riskData.reduce((sum, r) => sum + r.riskScore, 0) / riskData.length) || 0;
    const highRiskClients = riskData.filter(r => r.riskScore > 70).length;

    setClientRiskData(riskData);
    setCategoryStats(fixedCategoryStats);
    setTimeSeriesData(timeData);
    setGlobalStats({
      totalClients: clients.length,
      activeClients,
      totalMessages,
      completedClients,
      avgRiskScore,
      highRiskClients
    });
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: '极高风险', color: 'bg-red-500', textColor: 'text-red-100' };
    if (score >= 60) return { level: '高风险', color: 'bg-orange-500', textColor: 'text-orange-100' };
    if (score >= 40) return { level: '中风险', color: 'bg-yellow-500', textColor: 'text-yellow-100' };
    return { level: '低风险', color: 'bg-green-500', textColor: 'text-green-100' };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '运行中': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case '已完成': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] bg-slate-900 border-white/20 text-white overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center">
            <TrendingUp className="h-7 w-7 mr-3 text-red-400" />
            全局攻击热力图分析
            <Badge className="ml-3 bg-red-500/20 text-red-300 border-red-500/30">
              实时监控
            </Badge>
          </DialogTitle>
          <p className="text-sm text-gray-300">多AI客户安全测试综合分析与风险监控</p>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-white/20">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300 hover:text-white transition-colors"
            >
              总览
            </TabsTrigger>
            <TabsTrigger 
              value="clients" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300 hover:text-white transition-colors"
            >
              客户分析
            </TabsTrigger>
            <TabsTrigger 
              value="categories" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300 hover:text-white transition-colors"
            >
              类别统计
            </TabsTrigger>
            <TabsTrigger 
              value="timeline" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300 hover:text-white transition-colors"
            >
              时间轴
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* 全局统计卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="bg-slate-800 border-blue-500/50 shadow-lg">
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                  <div className="text-2xl font-bold text-white">{globalStats.totalClients}</div>
                  <div className="text-xs text-blue-200">总客户数</div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800 border-green-500/50 shadow-lg">
                <CardContent className="p-4 text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-green-400" />
                  <div className="text-2xl font-bold text-white">{globalStats.activeClients}</div>
                  <div className="text-xs text-green-200">活跃客户</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-purple-500/50 shadow-lg">
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                  <div className="text-2xl font-bold text-white">{globalStats.totalMessages}</div>
                  <div className="text-xs text-purple-200">总消息数</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-amber-500/50 shadow-lg">
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-amber-400" />
                  <div className="text-2xl font-bold text-white">{globalStats.completedClients}</div>
                  <div className="text-xs text-amber-200">已完成</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-red-500/50 shadow-lg">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-400" />
                  <div className="text-2xl font-bold text-white">{globalStats.avgRiskScore}%</div>
                  <div className="text-xs text-red-200">平均风险</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-orange-500/50 shadow-lg">
                <CardContent className="p-4 text-center">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-orange-400" />
                  <div className="text-2xl font-bold text-white">{globalStats.highRiskClients}</div>
                  <div className="text-xs text-orange-200">高风险客户</div>
                </CardContent>
              </Card>
            </div>

            {/* 风险分布和趋势 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-lg">客户风险分布</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: '低风险', value: clientRiskData.filter(c => c.riskScore < 40).length, color: '#10b981' },
                          { name: '中风险', value: clientRiskData.filter(c => c.riskScore >= 40 && c.riskScore < 60).length, color: '#f59e0b' },
                          { name: '高风险', value: clientRiskData.filter(c => c.riskScore >= 60 && c.riskScore < 80).length, color: '#ef4444' },
                          { name: '极高风险', value: clientRiskData.filter(c => c.riskScore >= 80).length, color: '#dc2626' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {[{ color: '#10b981' }, { color: '#f59e0b' }, { color: '#ef4444' }, { color: '#dc2626' }].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.8)', 
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-lg">测试进度概览</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={clientRiskData.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="name" 
                        stroke="rgba(255,255,255,0.7)"
                        fontSize={10}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.7)"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.8)', 
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                      <Bar dataKey="progress" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 客户分析标签页 */}
          <TabsContent value="clients" className="space-y-4">
            <div className="grid gap-4">
              {clientRiskData.map((client, index) => {
                const riskInfo = getRiskLevel(client.riskScore);
                return (
                  <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex flex-col">
                            <h3 className="font-semibold text-white">{client.name}</h3>
                            <p className="text-sm text-gray-300">{client.category}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <Badge className={riskInfo.color + ' ' + riskInfo.textColor + ' border-0'}>
                            {riskInfo.level}
                          </Badge>
                          <Badge className={getStatusColor(client.status) + ' border'}>
                            {client.status}
                          </Badge>
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">{client.riskScore}%</div>
                            <div className="text-xs text-gray-300">风险评分</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">消息数：</span>
                          <span className="text-white font-medium">{client.messageCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">高风险检出：</span>
                          <span className="text-red-300 font-medium">{client.highRiskCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">完成度：</span>
                          <span className="text-blue-300 font-medium">{client.progress}%</span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${client.progress}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-lg">类别分布</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="clientCount"
                        label={({ category, clientCount }) => `${category} (${clientCount})`}
                      >
                        {categoryStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.8)', 
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-lg">类别风险对比</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="category" 
                        stroke="rgba(255,255,255,0.7)"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.7)"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.8)', 
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                      <Bar dataKey="avgRiskScore" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4">
              {categoryStats.map((category, index) => (
                <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }}></div>
                        <div>
                          <h3 className="font-semibold text-white">{category.category}</h3>
                          <p className="text-sm text-gray-300">{category.clientCount} 个客户</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-6 text-sm">
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">{category.totalMessages}</div>
                          <div className="text-xs text-gray-300">总消息数</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-300">{Math.round(category.avgRiskScore)}%</div>
                          <div className="text-xs text-gray-300">平均风险</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 时间轴标签页 */}
          <TabsContent value="timeline" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">24小时活动趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={timeSeriesData}>
                    <defs>
                      <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="time" 
                      stroke="rgba(255,255,255,0.7)"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.7)"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalMessages"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorMessages)"
                      name="消息数"
                    />
                    <Area
                      type="monotone"
                      dataKey="riskEvents"
                      stroke="#ef4444"
                      fillOpacity={1}
                      fill="url(#colorRisk)"
                      name="风险事件"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t border-white/20">
          <Button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalAttackHeatmapModal;
