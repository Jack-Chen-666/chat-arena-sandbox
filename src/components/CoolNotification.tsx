
import React, { useEffect, useState } from 'react';
import { AlertTriangle, BellRing, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CoolNotificationProps {
  isVisible: boolean;
  clientName: string;
  onClose: () => void;
}

const CoolNotification: React.FC<CoolNotificationProps> = ({
  isVisible,
  clientName,
  onClose
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setTimeout(() => setIsAnimating(true), 50);
      // 自动关闭通知
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setShouldRender(false);
      onClose();
    }, 300);
  };

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* 通知卡片 */}
      <div 
        className={`relative pointer-events-auto transform transition-all duration-300 ease-out ${
          isAnimating 
            ? 'translate-y-0 scale-100 opacity-100' 
            : 'translate-y-8 scale-95 opacity-0'
        }`}
      >
        <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 p-0.5 rounded-2xl shadow-2xl">
          <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl p-6 min-w-[350px] max-w-md">
            {/* 关闭按钮 */}
            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* 图标和动画 */}
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-gradient-to-r from-orange-500 to-red-600 p-3 rounded-full">
                  <BellRing className="h-8 w-8 text-white animate-bounce" />
                </div>
              </div>
            </div>

            {/* 标题 */}
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                消息上限提醒
              </h3>
              <div className="h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent mx-8"></div>
            </div>

            {/* 内容 */}
            <div className="text-center space-y-3">
              <p className="text-white/90 leading-relaxed">
                <span className="font-semibold text-orange-300">{clientName}</span> 
                <br />
                已达到消息发送上限
              </p>
              
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-sm text-white/80">
                  该AI客户已完成所有测试任务
                </p>
              </div>
            </div>

            {/* 装饰性元素 */}
            <div className="absolute top-4 left-4 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <div className="absolute bottom-4 right-4 w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute top-1/2 left-2 w-1 h-1 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoolNotification;
