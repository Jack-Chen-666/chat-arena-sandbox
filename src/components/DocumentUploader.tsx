
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const DocumentUploader = () => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        
        // Use the generic insert method to bypass TypeScript type checking temporarily
        const { error } = await (supabase as any)
          .from('knowledge_documents')
          .insert({
            filename: file.name,
            content: content,
            file_type: file.type || 'text/plain'
          });

        if (error) {
          throw error;
        }

        toast({
          title: "上传成功",
          description: `文档 ${file.name} 已成功上传到知识库`,
        });
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('文档上传错误:', error);
      toast({
        title: "上传失败",
        description: "上传文档时出现错误",
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
          <FileText className="h-5 w-5 mr-2" />
          知识库文档
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Input
              type="file"
              accept=".txt,.md,.doc,.docx"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div className="text-sm text-gray-300">
            支持文本文档格式，用于AI客服RAG查询
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUploader;
