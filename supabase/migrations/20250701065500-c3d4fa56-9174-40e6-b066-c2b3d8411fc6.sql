
-- Create knowledge_documents table for document uploads
CREATE TABLE public.knowledge_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all access (since this is a test environment)
CREATE POLICY "Allow all access to knowledge_documents" ON public.knowledge_documents FOR ALL USING (true);
