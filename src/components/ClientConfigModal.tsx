import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';

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
}

interface ClientConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Omit<AIClient, 'id' | 'isActive'>) => void;
  categories: string[];
  testCases: TestCase[];
  editingClient: AIClient | null;
}

const ClientConfigModal: React.FC<ClientConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  testCases,
  editingClient
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [prompt, setPrompt] = useState('');
  const [maxMessages, setMaxMessages] = useState(10);
  const [useRandomGeneration, setUseRandomGeneration] = useState(false);
  const categoryTestCases = testCases.filter(tc => tc.category === category);

  useEffect(() => {
    if (editingClient) {
      setName(editingClient.name);
      setCategory(editingClient.category);
      setPrompt(editingClient.prompt);
      setMaxMessages(editingClient.maxMessages);
      setUseRandomGeneration(editingClient.useRandomGeneration || false);
    } else {
      setName('');
      setCategory('');
      setPrompt('');
      setMaxMessages(10);
      setUseRandomGeneration(false);
    }
  }, [editingClient]);

  const handleSave = () => {
    if (!name || !category || !prompt || maxMessages < 1) return;

    onSave({
      name,
      category,
      prompt,
      maxMessages,
      useRandomGeneration,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editingClient ? '编辑AI客户' : '创建AI客户'}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white">客户名称</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入客户名称"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-white">测试类别</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="选择测试类别" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-white hover:bg-slate-700">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="prompt" className="text-white">客户提示词</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述这个AI客户的行为特征和对话风格"
                className="bg-slate-800 border-slate-600 text-white min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="maxMessages" className="text-white">最大消息数</Label>
              <Input
                id="maxMessages"
                type="number"
                value={maxMessages}
                onChange={(e) => setMaxMessages(Number(e.target.value))}
                placeholder="设置最大对话轮数"
                className="bg-slate-800 border-slate-600 text-white"
                min="1"
                max="50"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="useRandomGeneration"
                checked={useRandomGeneration}
                onCheckedChange={setUseRandomGeneration}
              />
              <Label htmlFor="useRandomGeneration" className="text-white">
                启用随机生成测试用例
              </Label>
            </div>

            {category && (
              <div>
                <Label className="text-white">
                  可用测试用例 ({categoryTestCases.length} 个)
                </Label>
                <div className="max-h-40 overflow-y-auto space-y-2 mt-2">
                  {categoryTestCases.map((testCase) => (
                    <div key={testCase.id} className="bg-slate-800 p-2 rounded text-sm">
                      <div className="text-blue-300 font-medium">{testCase.attack_type}</div>
                      <div className="text-gray-300 text-xs mt-1">{testCase.test_prompt}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end space-x-2 pt-4 border-t border-slate-600">
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name || !category || !prompt || maxMessages < 1}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {editingClient ? '更新' : '创建'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientConfigModal;
