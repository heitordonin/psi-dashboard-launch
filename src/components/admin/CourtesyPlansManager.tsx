import { useState } from "react";
import { Search, Plus, Calendar, User, CheckCircle, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface User {
  id: string;
  email: string;
  full_name: string;
  display_name: string;
}

interface SubscriptionOverride {
  id: string;
  user_id: string;
  plan_slug: string;
  expires_at: string | null;
  reason: string;
  created_at: string;
  is_active: boolean;
  profiles?: {
    full_name: string;
    display_name: string;
    email: string;
  };
}

const PLAN_OPTIONS = [
  { value: 'gestao', label: 'Plano Gestão' },
  { value: 'psi_regular', label: 'Plano Psi Regular' }
];

export const CourtesyPlansManager = () => {
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [planSlug, setPlanSlug] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [reason, setReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();

  // Search users
  const { data: users, isLoading: searchingUsers } = useQuery({
    queryKey: ['search-users', searchEmail],
    queryFn: async () => {
      if (!searchEmail || searchEmail.length < 3) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, display_name')
        .ilike('full_name', `%${searchEmail}%`)
        .limit(10);
      
      if (error) throw error;
      
      // Get emails from auth.users
      if (data.length === 0) return [];
      
      const userIds = data.map(user => user.id);
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;
      
      return data.map((profile: any) => {
        const authUser = authUsers.users.find((u: any) => u.id === profile.id);
        return {
          id: profile.id,
          email: authUser?.email || '',
          full_name: profile.full_name || '',
          display_name: profile.display_name || ''
        };
      });
    },
    enabled: searchEmail.length >= 3
  });

  // Get existing overrides
  const { data: overrides, isLoading: loadingOverrides } = useQuery({
    queryKey: ['subscription-overrides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_overrides')
        .select(`
          *,
          profiles (
            full_name,
            display_name
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get emails from auth
      const userIds = data.map(override => override.user_id);
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;
      
      return data.map((override: any) => ({
        ...override,
        profiles: override.profiles ? {
          ...override.profiles,
          email: authUsers.users.find((u: any) => u.id === override.user_id)?.email || ''
        } : {
          full_name: '',
          display_name: '',
          email: authUsers.users.find((u: any) => u.id === override.user_id)?.email || ''
        }
      }));
    }
  });

  // Create override mutation
  const createOverrideMutation = useMutation({
    mutationFn: async (overrideData: {
      user_id: string;
      plan_slug: string;
      expires_at: string | null;
      reason: string;
    }) => {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('subscription_overrides')
        .insert({
          ...overrideData,
          created_by_admin_id: profile.user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Plano cortesia criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['subscription-overrides'] });
      setIsDialogOpen(false);
      setSelectedUser(null);
      setPlanSlug("");
      setExpiresAt("");
      setReason("");
    },
    onError: (error) => {
      toast.error("Erro ao criar plano cortesia: " + error.message);
    }
  });

  // Deactivate override mutation
  const deactivateOverrideMutation = useMutation({
    mutationFn: async (overrideId: string) => {
      const { error } = await supabase
        .from('subscription_overrides')
        .update({ is_active: false })
        .eq('id', overrideId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plano cortesia desativado!");
      queryClient.invalidateQueries({ queryKey: ['subscription-overrides'] });
    },
    onError: (error) => {
      toast.error("Erro ao desativar plano: " + error.message);
    }
  });

  const handleCreateOverride = () => {
    if (!selectedUser || !planSlug || !reason) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createOverrideMutation.mutate({
      user_id: selectedUser.id,
      plan_slug: planSlug,
      expires_at: expiresAt || null,
      reason: reason
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Gestão de Planos Cortesia</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Plano Cortesia
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Plano Cortesia</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Search User */}
                <div>
                  <label className="text-sm font-medium">Buscar Usuário</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Digite o nome do usuário..."
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {users && users.length > 0 && (
                    <div className="mt-2 border rounded-md max-h-32 overflow-y-auto">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                          onClick={() => {
                            setSelectedUser(user);
                            setSearchEmail("");
                          }}
                        >
                          <div className="font-medium">{user.full_name || user.display_name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {selectedUser && (
                    <div className="mt-2 p-2 bg-primary/10 rounded-md">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{selectedUser.full_name || selectedUser.display_name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                    </div>
                  )}
                </div>

                {/* Plan Selection */}
                <div>
                  <label className="text-sm font-medium">Plano</label>
                  <Select value={planSlug} onValueChange={setPlanSlug}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAN_OPTIONS.map((plan) => (
                        <SelectItem key={plan.value} value={plan.value}>
                          {plan.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Expiration Date */}
                <div>
                  <label className="text-sm font-medium">Data de Expiração (opcional)</label>
                  <Input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="text-sm font-medium">Motivo *</label>
                  <Textarea
                    placeholder="Descreva o motivo para este plano cortesia..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleCreateOverride}
                  disabled={createOverrideMutation.isPending}
                  className="w-full"
                >
                  {createOverrideMutation.isPending ? "Criando..." : "Criar Plano Cortesia"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {loadingOverrides ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overrides?.map((override) => (
                <TableRow key={override.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{override.profiles?.full_name || 'Nome não disponível'}</div>
                      <div className="text-sm text-muted-foreground">{override.profiles?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {PLAN_OPTIONS.find(p => p.value === override.plan_slug)?.label || override.plan_slug}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {override.expires_at ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(override.expires_at).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Sem expiração</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={override.reason}>
                    {override.reason}
                  </TableCell>
                  <TableCell>
                    {override.is_active ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="w-3 h-3 mr-1" />
                        Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {override.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deactivateOverrideMutation.mutate(override.id)}
                        disabled={deactivateOverrideMutation.isPending}
                      >
                        Desativar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {overrides?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum plano cortesia encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};