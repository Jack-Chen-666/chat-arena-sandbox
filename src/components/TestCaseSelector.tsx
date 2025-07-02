
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Filter, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TestCase {
  id: string;
  attack_type: string;
  category: string;
  test_prompt: string;
  expected_result: string;
}

interface TestCaseSelectorProps {
  onSelectTestCase: (testPrompt: string) => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

const TestCaseSelector: React.FC<TestCaseSelectorProps> = ({
  onSelectTestCase,
  isVisible,
  onToggleVisibility
}) => {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [editedPrompt, setEditedPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTestCases();
  }, []);

  const loadTestCases = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('test_cases')
        .select('*')
        .order('category', { ascending: true })
        .order('attack_type', { ascending: true });

      if (error) throw error;

      const testCasesData = data || [];
      setTestCases(testCasesData);
      
      const uniqueCategories = [...new Set(testCasesData.map(tc => tc.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('加载测试用例失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载测试用例，请重试",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTestCases = selectedCategory 
    ? testCases.filter(tc => tc.category === selectedCategory)
    : testCases;

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedTestCase(null);
    setEditedPrompt('');
  };

  const handleTestCaseChange = (testCaseId: string) => {
    const testCase = testCases.find(tc => tc.id === testCaseId);
    if (testCase) {
      setSelectedTestCase(testCase);
      setEditedPrompt(testCase.test_prompt);
    }
  };

  const handleUseTestCase = () => {
    if (editedPrompt.trim()) {
      onSelectTestCase(editedPrompt);
      toast({
        title: "测试用例已应用",
        description: "测试用例内容已填入输入框",
      });
    }
  };

  const handleCopyPrompt = () => {
    if (editedPrompt.trim()) {
      navigator.clipboard.writeText(editedPrompt);
      toast({
        title: "已复制",
        description: "测试用例内容已复制到剪贴板",
      });
    }
  };

  if (!isVisible) {
    return (
      <div className="mb-4">
        <Button
          onClick={onToggleVisibility}
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <Filter className="h-4 w-4 mr-2" />
          选择测试用例
        </Button>
      </div>
    );
  }

  return (
    <Card className="mb-4 bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            测试用例选择器
          </CardTitle>
          <Button
            onClick={onToggleVisibility}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            收起
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm text-gray-300">加载测试用例中...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  选择类别
                </label>
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="请选择测试类别" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem value="all" className="text-white">所有类别</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category} className="text-white">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  选择测试用例
                </label>
                <Select 
                  value={selectedTestCase?.id || ''} 
                  onValueChange={handleTestCaseChange}
                  disabled={!selectedCategory}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="请选择具体测试用例" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    {filteredTestCases.map((testCase) => (
                      <SelectItem key={testCase.id} value={testCase.id} className="text-white">
                        <div className="flex flex-col">
                          <span className="font-medium">{testCase.attack_type}</span>
                          <span className="text-xs text-gray-300 truncate max-w-60">
                            {testCase.test_prompt.substring(0, 50)}...
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedTestCase && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    测试用例内容（可编辑）
                  </label>
                  <Textarea
                    value={editedPrompt}
                    onChange={(e) => setEditedPrompt(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-gray-300"
                    rows={4}
                    placeholder="测试用例内容"
                  />
                </div>

                <div className="text-sm text-gray-300 bg-white/5 rounded-lg p-3">
                  <p><strong className="text-white">攻击类型：</strong>{selectedTestCase.attack_type}</p>
                  <p><strong className="text-white">预期结果：</strong>{selectedTestCase.expected_result}</p>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleUseTestCase}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                    disabled={!editedPrompt.trim()}
                  >
                    应用到输入框
                  </Button>
                  <Button
                    onClick={handleCopyPrompt}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    disabled={!editedPrompt.trim()}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {!selectedCategory && (
              <div className="text-center py-4 text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">选择类别以查看可用的测试用例</p>
                <p className="text-xs mt-1">共有 {testCases.length} 个测试用例，{categories.length} 个类别</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TestCaseSelector;
