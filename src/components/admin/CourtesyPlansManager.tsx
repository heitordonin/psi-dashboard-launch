import React, { useState, useCallback, useEffect } from "react";
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
import { Plus, UserX, Loader2, Search, AlertTriangle } from "lucide-react";
import { useCourtesyPlanValidation } from '@/hooks/useCourtesyPlanValidation';
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
  const [planSlug, setPlanSlug] = useState("gestao");
  const [expiresAt, setExpiresAt] = useState("");
  const [reason, setReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{field: string, message: string}>>([]);
  const queryClient = useQueryClient();
  const forceSyncMutation = useForceSyncSubscription();

  const { validateCourtesyPlan, getFieldError, hasErrors } = useCourtesyPlanValidation();

  // Debug logging
  console.log('CourtesyPlansManager - Component rendered');

  // Debounced search function with improved performance
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (!term || term.length < 2) return [];
      
      try {
        const { data, error } = await supabase.functions.invoke('search-users', {
          body: { searchTerm: term }
        });
        
        if (error) throw error;
        return data?.users || [];
      } catch (err) {
        console.error('Search error:', err);
        toast.error('Erro ao buscar usuários. Tente novamente.');
        return [];
      }
    }, 500),
    []
  );

  // Search users with improved UX
  const { 
    data: searchResults = [], 
    isLoading: isSearchLoading,
    error: searchError 
  } = useQuery({
    queryKey: ['user-search', searchTerm],
    queryFn: () => debouncedSearch(searchTerm),
    enabled: searchTerm.length >= 2,
    staleTime: 30000, // 30 seconds
    retry: 1
  });

  // Load initial list of recent users when dialog opens
  const { 
    data: recentUsers = [], 
    isLoading: isRecentUsersLoading 
  } = useQuery({
    queryKey: ['recent-users'],
    queryFn: async () => {
      try {
        // Get recent users (last 20 users by creation date)
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, display_name')
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (error) throw error;
        
        // Get emails from auth
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const authUsersMap = new Map<string, string>();
        if (authUsers?.users) {
          authUsers.users.forEach((u: any) => {
            if (u.id && u.email) {
              authUsersMap.set(u.id, u.email);
            }
          });
        }
        
        return data?.map(profile => ({
          id: profile.id,
          email: authUsersMap.get(profile.id) || 'N/A',
          full_name: profile.full_name,
          display_name: profile.display_name
        })) || [];
      } catch (err) {
        console.error('Error loading recent users:', err);
        return [];
      }
    },
    enabled: dialogOpen && searchTerm.length < 2
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
              is_active
            `)
            .order('created_at', { ascending: false });
            
          if (directError) {
            console.error('Direct query also failed:', directError);
            throw directError;
          }
          
          // Get profiles separately if direct query succeeds
          let profilesData = [];
          if (directData && directData.length > 0) {
            const userIds = directData.map(o => o.user_id);
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, full_name, display_name')
              .in('id', userIds);
            profilesData = profiles || [];
          }
            
          // Enrich data with profiles
          const fallbackData = directData?.map(override => {
            const profile = profilesData.find(p => p.id === override.user_id);
            return {
              ...override,
              profiles: {
                full_name: profile?.full_name || null,
                display_name: profile?.display_name || null
              },
              user_email: 'N/A (fallback mode)'
            };
          }) || [];
          
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

  const resetForm = () => {
    setSelectedUser(null);
    setSearchTerm('');
    setPlanSlug('gestao');
    setExpiresAt('');
    setReason('');
    setError(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setSelectedUser(null); // Clear selection when searching
  };

  const displayUsers = searchTerm.length >= 2 ? searchResults : recentUsers;
  const isLoadingUsers = searchTerm.length >= 2 ? isSearchLoading : isRecentUsersLoading;

  const handleCreateOverride = async () => {
    // Executar validação completa
    const errors = validateCourtesyPlan({
      selectedUser,
      planSlug,
      expiresAt,
      reason,
      existingOverrides: overrides
    });

    setValidationErrors(errors);

    if (hasErrors(errors)) {
      setError(errors[0].message); // Mostrar o primeiro erro como mensagem principal
      return;
    }

    try {
      setError(null);
      await createOverrideMutation.mutateAsync({
        user_id: selectedUser.id,
        plan_slug: planSlug,
        expires_at: expiresAt || undefined,
        reason: reason.trim()
      });
      
      toast.success(`Plano cortesia criado para ${selectedUser.full_name || selectedUser.display_name || selectedUser.email}`);
      
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao criar plano cortesia: ${errorMessage}`);
    }
  };

  // Error state handling (after all hooks)
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
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
                        placeholder="Digite nome, email ou CPF (mín. 2 caracteres)"
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10"
                      />
                      {isLoadingUsers && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* User Selection */}
                    <div className="mt-2 max-h-48 overflow-y-auto border rounded-md bg-card">
                      {searchError && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10">
                          Erro na busca: {searchError.message}
                        </div>
                      )}
                      
                      {isLoadingUsers ? (
                        <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          {searchTerm.length >= 2 ? 'Buscando usuários...' : 'Carregando usuários recentes...'}
                        </div>
                      ) : displayUsers.length > 0 ? (
                        <div className="divide-y">
                          {searchTerm.length < 2 && (
                            <div className="p-2 text-xs text-muted-foreground bg-muted/50">
                              Usuários criados recentemente:
                            </div>
                          )}
                          {displayUsers.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => setSelectedUser(user)}
                              className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${
                                selectedUser?.id === user.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                              }`}
                            >
                              <div className="text-sm font-medium">
                                {user.full_name || user.display_name || 'Nome não informado'}
                              </div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </button>
                          ))}
                        </div>
                      ) : searchTerm.length >= 2 ? (
                        <div className="p-3 text-sm text-muted-foreground">
                          Nenhum usuário encontrado para "{searchTerm}"
                        </div>
                      ) : (
                        <div className="p-3 text-sm text-muted-foreground">
                          Digite pelo menos 2 caracteres para buscar usuários
                        </div>
                      )}
                    </div>

                    {selectedUser && (
                      <div className="mt-2 p-3 bg-primary/5 rounded-md border-l-2 border-primary">
                        <div className="text-sm font-medium">Usuário Selecionado:</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedUser.full_name || selectedUser.display_name} ({selectedUser.email})
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setSelectedUser(null);
                            setSearchTerm("");
                          }}
                        >
                          Limpar seleção
                        </Button>
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
                      min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)} // Mínimo 1 hora no futuro
                      max={new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)} // Máximo 2 anos
                      className={getFieldError(validationErrors, 'expiresAt') ? 'border-destructive' : ''}
                    />
                    <div>
                      {getFieldError(validationErrors, 'expiresAt') ? (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {getFieldError(validationErrors, 'expiresAt')}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Se não definir, o plano cortesia será permanente
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Motivo *</Label>
                    <Textarea
                      id="reason"
                      placeholder="Descreva o motivo para conceder este plano cortesia... (mínimo 10 caracteres)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className={`min-h-[100px] resize-none ${
                        getFieldError(validationErrors, 'reason') ? 'border-destructive' : ''
                      }`}
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">
                        {getFieldError(validationErrors, 'reason') && (
                          <span className="text-destructive flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {getFieldError(validationErrors, 'reason')}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {reason.length}/500 caracteres
                      </p>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                      {error}
                    </div>
                  )}

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
                        {override.plan_slug === 'gestao' ? 'Gestão' : 'Psi Regular'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {override.expires_at ? (
                        new Date(override.expires_at).toLocaleDateString('pt-BR')
                      ) : (
                        <Badge variant="outline">Sem expiração</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm truncate" title={override.reason}>
                        {override.reason}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={override.is_active ? 'default' : 'destructive'}>
                        {override.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {override.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deactivateOverrideMutation.mutate(override.id)}
                          disabled={deactivateOverrideMutation.isPending}
                        >
                          <UserX className="w-4 h-4 mr-1" />
                          Desativar
                        </Button>
                      )}
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