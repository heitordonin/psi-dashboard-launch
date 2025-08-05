import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, UserX, Loader2, Search } from "lucide-react";
import { useForceSyncSubscription } from "@/hooks/useForceSyncSubscription";
import { debounce } from "lodash";

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
  profiles: {
    full_name: string | null;
    display_name: string | null;
  };
  user_email: string;
}

export const CourtesyPlansManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [planSlug, setPlanSlug] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [reason, setReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const forceSyncMutation = useForceSyncSubscription();

  // Debug logging
  console.log('CourtesyPlansManager - Component rendered');

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              <h3 className="text-lg font-semibold mb-2">Erro</h3>
              <p>{error}</p>
              <Button 
                onClick={() => setError(null)} 
                className="mt-4"
                variant="outline"
              >
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (!term || term.length < 2) {
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase.functions.invoke('search-users', {
          body: { searchTerm: term }
        });

        if (error) throw error;
        queryClient.setQueryData(['users', term], data.users || []);
      } catch (error) {
        console.error('Error searching users:', error);
        toast.error('Erro ao buscar usuários');
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [queryClient]
  );

  // Search users based on search term
  const { data: users = [] } = useQuery({
    queryKey: ["users", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      
      console.log('Searching users with term:', searchTerm);
      try {
        const { data, error } = await supabase.functions.invoke('search-users', {
          body: { searchTerm }
        });

        if (error) {
          console.error('Error from search-users function:', error);
          throw error;
        }
        
        console.log('Successfully found users:', data);
        return data.users || [];
      } catch (err) {
        console.error('Error searching users:', err);
        toast.error(`Erro ao buscar usuários: ${err.message}`);
        return [];
      }
    },
    enabled: false // We use manual triggering via debounced search
  });

  // Get existing subscription overrides with fallback
  const { data: overrides = [], isLoading: overridesLoading, error: overridesError } = useQuery({
    queryKey: ["subscription-overrides"],
    queryFn: async () => {
      console.log('Fetching subscription overrides...');
      try {
        // Try edge function first
        const { data, error } = await supabase.functions.invoke('get-subscription-overrides');
        
        if (error) {
          console.error('Edge function failed, trying direct query:', error);
          
          // Fallback to direct query
          const { data: directData, error: directError } = await supabase
            .from('subscription_overrides')
            .select(`
              id,
              user_id,
              plan_slug,
              expires_at,
              reason,
              created_at,
              is_active,
              profiles:user_id (
                full_name,
                display_name
              )
            `)
            .order('created_at', { ascending: false });
            
          if (directError) {
            console.error('Direct query also failed:', directError);
            throw directError;
          }
          
          // Add mock email for fallback
          const fallbackData = directData?.map(override => ({
            ...override,
            user_email: 'N/A (fallback mode)'
          })) || [];
          
          console.log('Successfully fetched overrides via fallback:', fallbackData);
          return fallbackData;
        }
        
        console.log('Successfully fetched overrides via edge function:', data);
        return data.overrides || [];
      } catch (err) {
        console.error('All methods failed:', err);
        setError(`Erro ao carregar planos cortesia: ${err.message}`);
        throw err;
      }
    },
    retry: 1,
    retryDelay: 1000
  });

  // Create new courtesy plan override
  const createOverrideMutation = useMutation({
    mutationFn: async (overrideData: {
      user_id: string;
      plan_slug: string;
      expires_at?: string;
      reason: string;
    }) => {
      const { data, error } = await supabase
        .from('subscription_overrides')
        .insert([{
          ...overrideData,
          expires_at: overrideData.expires_at || null,
          created_by_admin_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      toast.success('Plano cortesia criado com sucesso!');
      
      // Force sync subscription for the user
      try {
        await forceSyncMutation.mutateAsync();
        toast.success('Sincronização automática executada!');
      } catch (syncError) {
        console.error('Error syncing subscription:', syncError);
        toast.warning('Plano criado, mas erro na sincronização automática');
      }
      
      queryClient.invalidateQueries({ queryKey: ['subscription-overrides'] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Erro ao criar override:', error);
      toast.error('Erro ao criar plano cortesia');
    }
  });

  // Deactivate existing override
  const deactivateOverrideMutation = useMutation({
    mutationFn: async (overrideId: string) => {
      const { data, error } = await supabase
        .from('subscription_overrides')
        .update({ is_active: false })
        .eq('id', overrideId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Plano cortesia desativado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['subscription-overrides'] });
    },
    onError: (error) => {
      console.error('Erro ao desativar override:', error);
      toast.error('Erro ao desativar plano cortesia');
    }
  });

  const handleCreateOverride = () => {
    if (!selectedUser || !planSlug || !reason.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (expiresAt && new Date(expiresAt) <= new Date()) {
      toast.error('Data de expiração deve ser no futuro');
      return;
    }

    createOverrideMutation.mutate({
      user_id: selectedUser.id,
      plan_slug: planSlug,
      expires_at: expiresAt || undefined,
      reason: reason.trim()
    });
  };

  const resetForm = () => {
    setSelectedUser(null);
    setPlanSlug("");
    setExpiresAt("");
    setReason("");
    setSearchTerm("");
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value.length >= 2) {
      debouncedSearch(value);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestão de Planos Cortesia</CardTitle>
              <p className="text-sm text-muted-foreground">
                Crie e gerencie planos cortesia para usuários específicos
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Plano Cortesia
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader className="space-y-3 pb-6">
                  <DialogTitle>Criar Plano Cortesia</DialogTitle>
                  <DialogDescription>
                    Atribua um plano premium gratuito para um usuário específico
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 px-1">
                  <div className="space-y-2">
                    <Label htmlFor="search">Buscar Usuário</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="search"
                        placeholder="Digite nome ou email..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10"
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    
                    {selectedUser && (
                      <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="font-medium text-green-800">{selectedUser.full_name || selectedUser.display_name}</div>
                        <div className="text-sm text-green-600 mt-1">{selectedUser.email}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => {
                            setSelectedUser(null);
                            setSearchTerm("");
                          }}
                        >
                          Limpar seleção
                        </Button>
                      </div>
                    )}
                    
                    {!selectedUser && users.length > 0 && searchTerm.length >= 2 && (
                      <div className="mt-3 border rounded-lg max-h-40 overflow-y-auto bg-card">
                        {users.map((user) => (
                          <div
                            key={user.id}
                            className="p-4 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors"
                            onClick={() => {
                              setSelectedUser(user);
                            }}
                          >
                            <div className="font-medium">{user.full_name || user.display_name}</div>
                            <div className="text-sm text-muted-foreground mt-1">{user.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plan">Plano</Label>
                    <Select value={planSlug} onValueChange={setPlanSlug}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um plano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gestao">Plano Gestão</SelectItem>
                        <SelectItem value="psi_regular">Plano Psi Regular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expires">Data de Expiração (opcional)</Label>
                    <Input
                      id="expires"
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Motivo *</Label>
                    <Textarea
                      id="reason"
                      placeholder="Descreva o motivo para este plano cortesia..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        resetForm();
                      }}
                      disabled={createOverrideMutation.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateOverride}
                      disabled={createOverrideMutation.isPending || !selectedUser || !planSlug || !reason.trim()}
                    >
                      {createOverrideMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        "Criar Plano Cortesia"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {overridesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Carregando planos cortesia...
            </div>
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
                {overrides.map((override) => (
                  <TableRow key={override.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {override.profiles?.full_name || override.profiles?.display_name || 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {override.user_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={override.plan_slug === 'psi_regular' ? 'default' : 'secondary'}>
                        {override.plan_slug === 'psi_regular' ? 'Psi Regular' : 
                         override.plan_slug === 'gestao' ? 'Gestão' : override.plan_slug}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {override.expires_at 
                        ? new Date(override.expires_at).toLocaleDateString('pt-BR')
                        : 'Sem expiração'
                      }
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={override.reason}>
                        {override.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={override.is_active ? 'default' : 'secondary'}>
                        {override.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deactivateOverrideMutation.mutate(override.id)}
                        disabled={!override.is_active || deactivateOverrideMutation.isPending}
                      >
                        {deactivateOverrideMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <UserX className="w-4 h-4 mr-1" />
                            Desativar
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {overrides.length === 0 && (
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
    </div>
  );
};