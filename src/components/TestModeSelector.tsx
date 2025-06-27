
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Brain } from 'lucide-react';

interface TestModeSelectorProps {
  testMode: 'database' | 'ai_generated';
  onModeChange: (mode: 'database' | 'ai_generated') => void;
}

const TestModeSelector = ({ testMode, onModeChange }: TestModeSelectorProps) => {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-white">测试模式选择</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2">
          <Button
            onClick={() => onModeChange('database')}
            variant={testMode === 'database' ? 'default' : 'outline'}
            className={testMode === 'database' 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
            }
          >
            <Database className="h-4 w-4 mr-2" />
            数据库测试用例
          </Button>
          <Button
            onClick={() => onModeChange('ai_generated')}
            variant={testMode === 'ai_generated' ? 'default' : 'outline'}
            className={testMode === 'ai_generated' 
              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
            }
          >
            <Brain className="h-4 w-4 mr-2" />
            AI生成测试
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestModeSelector;
