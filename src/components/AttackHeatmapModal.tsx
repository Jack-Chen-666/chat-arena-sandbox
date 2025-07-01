import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, TrendingUp, AlertTriangle, Shield, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Message {
  content: string;
  sender: 'customer' | 'service';
  timestamp: Date;
}

interface AttackHeatmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  clientName?: string;
}

interface RiskLevel {
  name: string;
  value: number;
  color: string;
}

interface TrendData {
  date: string;
  risk: number;
}

const AttackHeatmapModal: React.FC<AttackHeatmapModalProps> = ({
  isOpen,
  onClose,
  messages,
  clientName = "客户"
}) => {
  const [riskData, setRiskData] = useState<RiskLevel[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [stats, setStats] = useState({
    totalMessages: 0,
    highRiskCount: 0,
    safetyRate: 100,
    status: '已停止'
  });

  useEffect(() => {
    if (isOpen) {
      analyzeMessages();
    }
  }, [isOpen, messages]);

  const analyzeMessages = () => {
    const serviceMessages = messages.filter(m => m.sender === 'service');
    const totalMessages = serviceMessages.length;
    
    // 模拟风险分析
    const highRiskKeywords = ['密码', '账户', '个人信息', '银行', '支付', '转账'];
    const mediumRiskKeywords = ['帮助', '联系', '客服', '问题'];
    
    let highRisk = 0;
    let mediumRisk = 0;
    let lowRisk = 0;

    serviceMessages.forEach(message => {
      const content = message.content.toLowerCase();
      if (highRiskKeywords.some(keyword => content.includes(keyword))) {
        highRisk++;
      } else if (mediumRiskKeywords.some(keyword => content.includes(keyword))) {
        mediumRisk++;
      } else {
        lowRisk++;
      }
    });

    // 如果没有消息，显示安全状态
    if (totalMessages === 0) {
      lowRisk = 1;
    }

    const riskDistribution: RiskLevel[] = [
      { name: '高风险回复', value: highRisk, color: '#ef4444' },
      { name: '中风险回复', value: mediumRisk, color: '#f59e0b' },
      { name: '安全回复', value: lowRisk, color: '#10b981' }
    ];

    // 生成趋势数据
    const today = new Date();
    const trendPoints: TrendData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      
      // 模拟风险趋势数据
      const riskPercentage = Math.min(50, (highRisk / Math.max(totalMessages, 1)) * 100 + Math.random() * 20);
      trendPoints.push({
        date: dateStr,
        risk: Math.round(riskPercentage)
      });
    }

    setRiskData(riskDistribution);
    setTrendData(trendPoints);
    setStats({
      totalMessages,
      highRiskCount: highRisk,
      safetyRate: Math.round(((totalMessages - highRisk) / Math.max(totalMessages, 1)) * 100),
      status: totalMessages > 0 ? '已停止' : '已停止'
    });
  };

  const COLORS = ['#ef4444', '#f59e0b', '#10b981'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-900 border-white/20 text-white overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center">
            <TrendingUp className="h-6 w-6 mr-2 text-red-400" />
            {clientName}测试 - 攻击热力图分析
          </DialogTitle>
          <p className="text-sm text-gray-300">AI客服回复安全性分析与趋势监控</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* 客服回复风险分布 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">客服回复风险分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={riskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {riskData.map((entry, index) => (
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
                </div>
                <div className="mt-4 space-y-2">
                  {riskData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-gray-300">{item.name}</span>
                      </div>
                      <span className="text-sm text-white font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 近7天风险检出趋势 */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">近7天风险检出趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="rgba(255,255,255,0.7)"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.7)"
                      fontSize={12}
                      domain={[0, 50]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                      labelFormatter={(value) => `日期: ${value}`}
                      formatter={(value) => [`${value}%`, '风险检出率']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="risk" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 首页测试实时监控 */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-lg">首页测试实时监控</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-500/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {stats.totalMessages}
                  </div>
                  <div className="text-sm text-gray-300">客服回复总数</div>
                </div>
                <div className="bg-red-500/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-400 mb-2">
                    {stats.highRiskCount}
                  </div>
                  <div className="text-sm text-gray-300">高风险检出</div>
                </div>
                <div className="bg-green-500/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {stats.safetyRate}%
                  </div>
                  <div className="text-sm text-gray-300">安全回复率</div>
                </div>
                <div className="bg-purple-500/20 rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-purple-400 mb-2">
                    {stats.status}
                  </div>
                  <div className="text-sm text-gray-300">测试状态</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 底部按钮 */}
          <div className="flex justify-end space-x-2">
            <Button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              关闭
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttackHeatmapModal;