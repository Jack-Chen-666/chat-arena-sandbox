
import React, { useEffect, useState } from 'react';
import { CheckCircle, Crown, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GlobalLimitNotificationProps {
  isVisible: boolean;
  onClose: () => void;
}

const GlobalLimitNotification: React.FC<GlobalLimitNotificationProps> = ({
  isVisible,
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
      }, 8000);
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

  const handleClick = () => {
    handleClose();
  };

  if (!shouldRender) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
      onClick={handleClick}
    >
      {/* 背景遮罩 */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* 通知卡片 */}
      <div 
        className={`relative transform transition-all duration-500 ease-out ${
          isAnimating 
            ? 'translate-y-0 scale-100 opacity-100' 
            : 'translate-y-8 scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 p-0.5 rounded-3xl shadow-2xl">
          <div className="bg-slate-900/95 backdrop-blur-md rounded-3xl p-8 min-w-[400px] max-w-md">
            {/* 关闭按钮 */}
            <Button
              onClick={handleClick}
              variant="ghost"
              size="sm"
              className="absolute top-3 right-3 text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* 图标和动画 */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-ping opacity-75"></div>
                <div className="absolute inset-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-pulse opacity-60"></div>
                <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-full">
                  <Crown className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>

            {/* 标题 */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-3 flex items-center justify-center gap-3">
                <Sparkles className="h-6 w-6 text-green-400 animate-pulse" />
                全部测试完成
                <Sparkles className="h-6 w-6 text-green-400 animate-pulse" />
              </h3>
              <div className="h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent mx-8"></div>
            </div>

            {/* 内容 */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-400 mr-3" />
                <span className="text-xl font-semibold text-white">测试任务全部完成</span>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-white/90 leading-relaxed">
                  所有AI客户均已达到消息上限
                  <br />
                  <span className="text-green-300 font-medium">全局自动模式已自动停止</span>
                </p>
              </div>
              
              <div className="text-sm text-white/70 mt-4">
                点击任意位置关闭此通知
              </div>
            </div>

            {/* 装饰性元素 */}
            <div className="absolute top-6 left-6 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <div className="absolute bottom-6 right-6 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute top-1/2 left-4 w-2 h-2 bg-teal-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/3 right-4 w-2 h-2 bg-green-300 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalLimitNotification;
