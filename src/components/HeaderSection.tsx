
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Settings, MessageSquare } from 'lucide-react';

interface HeaderSectionProps {
  onShowDocumentUploader: () => void;
  onShowSystemPrompt: () => void;
  onShowSettings: () => void;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({
  onShowDocumentUploader,
  onShowSystemPrompt,
  onShowSettings
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI 客服安全测试平台</h1>
          <p className="text-sm text-gray-300">测试AI客服的安全性和响应能力</p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={onShowDocumentUploader}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Upload className="h-4 w-4 mr-2" />
            上传文档
          </Button>
          
          <Button
            onClick={onShowSystemPrompt}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            系统提示词
          </Button>
          
          <Button
            onClick={onShowSettings}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Settings className="h-4 w-4 mr-2" />
            设置
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeaderSection;
