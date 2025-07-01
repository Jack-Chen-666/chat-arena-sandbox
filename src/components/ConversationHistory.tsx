
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

interface Conversation {
  id: string;
  customer_message: string;
  service_response: string;
  created_at: string;
}

interface ConversationHistoryProps {
  conversations: Conversation[];
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({ conversations }) => {
  return (
    <div className="w-80 p-4 pl-0">
      <Card className="h-full bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-sm">手动对话历史</CardTitle>
          <p className="text-xs text-gray-400">仅显示手动对话记录</p>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="space-y-3">
            {conversations.length === 0 ? (
              <div className="text-center text-gray-400 text-sm mt-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>暂无对话记录</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div key={conv.id} className="bg-white/10 rounded-lg p-3 border border-white/10">
                  <div className="text-xs text-blue-300 mb-1 font-medium">客户消息:</div>
                  <div className="text-xs text-white mb-2 line-clamp-3 bg-white/5 p-2 rounded">
                    {conv.customer_message}
                  </div>
                  <div className="text-xs text-green-300 mb-1 font-medium">AI客服回复:</div>
                  <div className="text-xs text-gray-300 line-clamp-3 bg-white/5 p-2 rounded mb-2">
                    {conv.service_response}
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    {new Date(conv.created_at).toLocaleString('zh-CN')}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversationHistory;
