
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { HeadphonesIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import TutorialVideoCarousel from '@/components/support/TutorialVideoCarousel';

const SupportTicket = () => {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');

  // Vídeos tutoriais do Psiclo
  const tutorialVideos = [
    {
      id: '1',
      title: 'Dashboard - Psiclo',
      description: 'Visão geral do sistema e principais funcionalidades',
      youtubeId: 'c13kDPUIaxU'
    },
    {
      id: '2', 
      title: 'Módulo Agenda - Psiclo',
      description: 'Como gerenciar agendamentos e consultas',
      youtubeId: 'yJHA2KfT_EU'
    },
    {
      id: '3',
      title: 'Cadastro de Pacientes - Psiclo',
      description: 'Como cadastrar e gerenciar informações dos seus pacientes',
      youtubeId: 'YU_M7dKm23I'
    },
    {
      id: '4',
      title: 'Criar nova cobrança - Psiclo',
      description: 'Sistema de cobranças e lembretes via WhatsApp',
      youtubeId: 'gzT2DdtqxkY'
    },
    {
      id: '5',
      title: 'Criar nova despesa - Psiclo',
      description: 'Controle de despesas e cálculo da alíquota efetiva',
      youtubeId: '9EcQdVaFbDs'
    }
  ];

  const supportTicketMutation = useMutation({
    mutationFn: async (data: { subject: string; category: string; message: string }) => {
      const { data: result, error } = await supabase.functions.invoke('send-support-ticket', {
        body: data
      });

      if (error) {
        throw new Error(error.message || 'Erro ao enviar o chamado');
      }

      return result;
    },
    onSuccess: () => {
      toast.success('Chamado enviado com sucesso!');
      // Reset form fields
      setSubject('');
      setCategory('');
      setMessage('');
    },
    onError: (error: any) => {
      console.error('Error sending support ticket:', error);
      toast.error('Erro ao enviar o chamado. Tente novamente.');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!subject.trim() || !category || !message.trim()) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    supportTicketMutation.mutate({
      subject: subject.trim(),
      category,
      message: message.trim(),
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1">
          <div style={{ backgroundColor: '#002472' }} className="border-b px-4 py-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-white hover:text-gray-200" />
              <div>
                <h1 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                  Central de Suporte
                </h1>
                <p className="text-sm" style={{ color: '#03f6f9' }}>
                  Precisa de ajuda ou tem alguma sugestão? Envie-nos uma mensagem.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 min-h-screen">
            {/* Carrossel de Tutoriais */}
            <TutorialVideoCarousel videos={tutorialVideos} />
            
            {/* Formulário de Suporte */}
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HeadphonesIcon className="w-5 h-5" />
                    Abrir Chamado de Suporte
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Assunto *</Label>
                      <Input
                        id="subject"
                        type="text"
                        placeholder="Descreva brevemente o problema ou solicitação"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        disabled={supportTicketMutation.isPending}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria *</Label>
                      <Select 
                        value={category} 
                        onValueChange={setCategory}
                        disabled={supportTicketMutation.isPending}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="duvida-financeira">Dúvida Financeira</SelectItem>
                          <SelectItem value="problema-tecnico">Problema Técnico</SelectItem>
                          <SelectItem value="sugestao-melhoria">Sugestão de Melhoria</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mensagem *</Label>
                      <Textarea
                        id="message"
                        placeholder="Descreva detalhadamente sua solicitação ou problema..."
                        rows={6}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={supportTicketMutation.isPending}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        size="lg"
                        disabled={supportTicketMutation.isPending}
                      >
                        {supportTicketMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          'Enviar Chamado'
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default SupportTicket;
