
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

interface TestCase {
  attack_type: string;
  category: string;
  test_prompt: string;
  expected_result: string;
}

const ExcelUploader = () => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const testCases: TestCase[] = jsonData.map((row) => ({
          attack_type: row['攻击类型'] || row['attack_type'] || '',
          category: row['类别'] || row['category'] || '',
          test_prompt: row['测试用例 (Prompt)'] || row['test_prompt'] || '',
          expected_result: row['预期结果 (AI应该如何回应)'] || row['expected_result'] || ''
        })).filter(tc => tc.attack_type && tc.test_prompt);

        if (testCases.length === 0) {
          toast({
            title: "上传失败",
            description: "Excel文件中没有找到有效的测试用例数据",
            variant: "destructive"
          });
          return;
        }

        const { error } = await supabase
          .from('test_cases')
          .insert(testCases);

        if (error) {
          throw error;
        }

        toast({
          title: "上传成功",
          description: `成功导入 ${testCases.length} 条测试用例`,
        });
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Excel上传错误:', error);
      toast({
        title: "上传失败",
        description: "处理Excel文件时出现错误",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <FileSpreadsheet className="h-5 w-5 mr-2" />
          导入测试用例
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div className="text-sm text-gray-300">
            支持Excel格式(.xlsx, .xls)，需包含列：攻击类型、类别、测试用例(Prompt)、预期结果
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExcelUploader;
