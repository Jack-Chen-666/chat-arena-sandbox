
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { Plus, Users, MessageSquare, TrendingUp, Upload, Send } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import AttackHeatmapModal from '@/components/AttackHeatmapModal';
import GlobalAttackHeatmapModal from '@/components/GlobalAttackHeatmapModal';
import ExcelUploader from '@/components/ExcelUploader';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'customer' | 'service';
  timestamp: Date;
}

interface AIClient {
  id: string;
  name: string;
  category: string;
  prompt: string;
  messageCount: number;
  maxMessages: number;
  isActive: boolean;
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Client name must be at least 2 characters.",
  }),
  category: z.string().min(2, {
    message: "Category must be at least 2 characters.",
  }),
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters.",
  }),
  maxMessages: z.number().min(50, {
    message: "Max messages must be at least 50.",
  }).max(2000, {
    message: "Max messages must be less than 2000.",
  }),
})

const MultiClientChat = () => {
  const [clients, setClients] = useState<AIClient[]>([]);
  const [messages, setMessages] = useState<{ [clientId: string]: ChatMessage[] }>({});
  const [input, setInput] = useState<{ [clientId: string]: string }>({});
  const [isClientModalOpen, setShowClientModal] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState<{ [clientId: string]: boolean }>({});
  const [showGlobalHeatmap, setShowGlobalHeatmap] = useState(false);
  const [showExcelUploader, setShowExcelUploader] = useState(false);
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      prompt: "",
      maxMessages: 500,
    },
  })

  useEffect(() => {
    // Load clients from local storage on component mount
    const storedClients = localStorage.getItem('aiClients');
    if (storedClients) {
      const parsedClients = JSON.parse(storedClients);
      console.log('Loaded clients from localStorage:', parsedClients);
      setClients(parsedClients);
    }
  }, []);

  useEffect(() => {
    // Save clients to local storage whenever the clients state changes
    if (clients.length > 0) {
      console.log('Saving clients to localStorage:', clients);
      localStorage.setItem('aiClients', JSON.stringify(clients));
    }
  }, [clients]);

  const addClient = (values: z.infer<typeof formSchema>) => {
    const newClient: AIClient = {
      id: uuidv4(),
      name: values.name,
      category: values.category,
      prompt: values.prompt,
      messageCount: 0,
      maxMessages: values.maxMessages,
      isActive: false,
    };
    setClients([...clients, newClient]);
    setShowClientModal(false);
    form.reset();
    toast({
      title: "添加成功",
      description: `${values.name} AI 客户已成功添加`,
    })
  };

  const toggleClientActivity = (clientId: string) => {
    setClients(clients.map(client =>
      client.id === clientId ? { ...client, isActive: !client.isActive } : client
    ));
  };

  const sendMessage = (clientId: string) => {
    const currentInput = input[clientId] || '';
    if (currentInput.trim() === '') return;

    const newMessage: ChatMessage = {
      id: uuidv4(),
      content: currentInput,
      sender: 'customer',
      timestamp: new Date(),
    };

    setMessages(prevMessages => ({
      ...prevMessages,
      [clientId]: [...(prevMessages[clientId] || []), newMessage],
    }));

    setInput(prevInput => ({ ...prevInput, [clientId]: '' }));

    // 模拟AI客服回复
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: uuidv4(),
        content: `您好，我是 ${clients.find(c => c.id === clientId)?.name}，我收到了您的消息: "${currentInput}"`,
        sender: 'service',
        timestamp: new Date(),
      };

      setClients(prevClients =>
        prevClients.map(client =>
          client.id === clientId
            ? { ...client, messageCount: client.messageCount + 1 }
            : client
        )
      );

      setMessages(prevMessages => ({
        ...prevMessages,
        [clientId]: [...(prevMessages[clientId] || []), aiResponse],
      }));
    }, Math.random() * 1000 + 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent, clientId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(clientId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white flex items-center">
              <Users className="h-8 w-8 mr-3 text-blue-400" />
              多AI客户对话测试
            </h1>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowGlobalHeatmap(true)}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-0"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                攻击热力图
              </Button>
              <Button
                onClick={() => setShowExcelUploader(!showExcelUploader)}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-0"
              >
                <Upload className="h-4 w-4 mr-2" />
                {showExcelUploader ? '隐藏' : '上传'}测试用例
              </Button>
              <Button
                onClick={() => setShowClientModal(true)}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加客户
              </Button>
            </div>
          </div>
          <p className="text-gray-300">同时与多个AI客户进行安全测试对话</p>
        </div>

        {/* Excel Uploader */}
        {showExcelUploader && (
          <ExcelUploader />
        )}

        {/* AI Client List and Chat */}
        {clients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">暂无AI客户</h3>
            <p className="text-gray-400 mb-6">请点击"添加客户"按钮创建您的第一个AI客户</p>
            <Button
              onClick={() => setShowClientModal(true)}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              添加客户
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map(client => (
              <Card key={client.id} className="bg-white/5 backdrop-blur-md border-white/10">
                <CardHeader className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${client.name}`} />
                      <AvatarFallback>{client.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <CardTitle className="text-white">{client.name}</CardTitle>
                      <p className="text-sm text-gray-400">{client.category}</p>
                    </div>
                  </div>
                  <Popover>
                    <PopoverTrigger>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30 transition-colors cursor-pointer">
                        配置
                      </Badge>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 bg-slate-800 border-white/20 text-white">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">运行状态</span>
                          <Switch
                            id={`active-${client.id}`}
                            checked={client.isActive}
                            onCheckedChange={() => toggleClientActivity(client.id)}
                          />
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">消息数量</span>
                          <Slider
                            defaultValue={[client.maxMessages]}
                            max={2000}
                            step={100}
                            onValueChange={(value) => {
                              setClients(clients.map(c =>
                                c.id === client.id ? { ...c, maxMessages: value[0] } : c
                              ))
                            }}
                          />
                          <p className="text-xs text-gray-300 mt-1">
                            当前: {client.maxMessages}
                          </p>
                        </div>
                        <Button onClick={() => setShowHeatmap(prev => ({ ...prev, [client.id]: true }))} variant="outline">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          攻击热力图
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-2">
                      {messages[client.id]?.map(message => (
                        <div
                          key={message.id}
                          className={`flex flex-col text-sm ${message.sender === 'customer' ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`px-3 py-2 rounded-lg max-w-[80%] ${message.sender === 'customer' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'
                              }`}
                          >
                            {message.content}
                          </div>
                          <span className="text-xs text-gray-400 mt-1">
                            {message.sender === 'customer' ? '你' : client.name} - {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Separator />
                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <Textarea
                        value={input[client.id] || ''}
                        onChange={(e) => setInput(prev => ({ ...prev, [client.id]: e.target.value }))}
                        placeholder="输入消息..."
                        className="bg-white/10 border-white/20 text-white placeholder-gray-300 resize-none min-h-[80px]"
                        rows={2}
                        onKeyPress={(e) => handleKeyPress(e, client.id)}
                      />
                    </div>
                    <Button 
                      onClick={() => sendMessage(client.id)} 
                      size="lg"
                      className="h-[80px] px-4 bg-blue-600 hover:bg-blue-700"
                      disabled={!input[client.id]?.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-gray-400">
                    消息总数: {messages[client.id]?.length || 0} / {client.maxMessages}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Client Modal */}
      <Dialog open={isClientModalOpen} onOpenChange={setShowClientModal}>
        <DialogContent className="max-w-md bg-slate-900 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>添加 AI 客户</DialogTitle>
            <DialogDescription>
              创建一个新的 AI 客户进行对话测试
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(addClient)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>客户名称</FormLabel>
                    <FormControl>
                      <Input placeholder="AI 客户名称" className="bg-white/10 border-white/20 text-white" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>类别</FormLabel>
                    <FormControl>
                      <Input placeholder="AI 客户类别" className="bg-white/10 border-white/20 text-white" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="AI 客户 Prompt"
                        className="bg-white/10 border-white/20 text-white"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxMessages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>消息总数</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="消息总数"
                        className="bg-white/10 border-white/20 text-white"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">添加客户</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Attack Heatmap Modals */}
      {clients.map(client => (
        <AttackHeatmapModal
          key={client.id}
          isOpen={showHeatmap[client.id] || false}
          onClose={() => setShowHeatmap(prev => ({ ...prev, [client.id]: false }))}
          messages={messages[client.id] || []}
          clientName={client.name}
        />
      ))}

      {/* Global Attack Heatmap Modal */}
      <GlobalAttackHeatmapModal
        isOpen={showGlobalHeatmap}
        onClose={() => setShowGlobalHeatmap(false)}
        clients={clients}
      />
    </div>
  );
};

export default MultiClientChat;
