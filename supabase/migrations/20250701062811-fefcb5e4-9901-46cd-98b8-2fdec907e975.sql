
-- 创建AI客户表
CREATE TABLE public.ai_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  prompt TEXT NOT NULL,
  max_messages INTEGER NOT NULL DEFAULT 10,
  use_random_generation BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建AI客户与测试用例的关联表
CREATE TABLE public.ai_client_test_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ai_client_id UUID NOT NULL REFERENCES public.ai_clients(id) ON DELETE CASCADE,
  test_case_id UUID NOT NULL REFERENCES public.test_cases(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ai_client_id, test_case_id)
);

-- 更新conversations表，添加ai_client_id和chat_type字段
ALTER TABLE public.conversations 
ADD COLUMN ai_client_id UUID REFERENCES public.ai_clients(id) ON DELETE SET NULL,
ADD COLUMN chat_type TEXT NOT NULL DEFAULT 'single' CHECK (chat_type IN ('single', 'multi_client'));

-- 创建索引以提高查询性能
CREATE INDEX idx_ai_clients_category ON public.ai_clients(category);
CREATE INDEX idx_ai_client_test_cases_client_id ON public.ai_client_test_cases(ai_client_id);
CREATE INDEX idx_ai_client_test_cases_test_case_id ON public.ai_client_test_cases(test_case_id);
CREATE INDEX idx_conversations_ai_client_id ON public.conversations(ai_client_id);
CREATE INDEX idx_conversations_chat_type ON public.conversations(chat_type);

-- 启用行级安全
ALTER TABLE public.ai_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_client_test_cases ENABLE ROW LEVEL SECURITY;

-- 创建策略允许所有用户访问（因为这是测试环境）
CREATE POLICY "Allow all access to ai_clients" ON public.ai_clients FOR ALL USING (true);
CREATE POLICY "Allow all access to ai_client_test_cases" ON public.ai_client_test_cases FOR ALL USING (true);

-- 创建触发器自动更新ai_clients表的updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_clients_updated_at 
    BEFORE UPDATE ON public.ai_clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
