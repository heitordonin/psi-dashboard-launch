import React, { useState } from "react";
import { Search, Check, Users, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEligibleUsers } from "@/hooks/useEligibleUsers";
import { EnhancedSkeleton } from "@/components/ui/enhanced-skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  display_name: string | null;
  cpf?: string;
  current_plan?: string;
  has_active_override: boolean;
}

interface MobileUserSelectorProps {
  selectedUser: User | null;
  onUserSelect: (user: User) => void;
  onClear: () => void;
  className?: string;
}

export const MobileUserSelector: React.FC<MobileUserSelectorProps> = ({
  selectedUser,
  onUserSelect,
  onClear,
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyEligible, setShowOnlyEligible] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: users = [], isLoading, error } = useEligibleUsers(searchTerm, showOnlyEligible);

  const handleUserSelect = (user: User) => {
    onUserSelect(user);
    setIsOpen(false);
  };

  const UserListItem = ({ user }: { user: User }) => (
    <button
      onClick={() => handleUserSelect(user)}
      className="w-full p-4 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0 active:bg-muted"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">
            {user.full_name || user.display_name || 'Nome não informado'}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {user.email}
          </div>
          {user.current_plan && (
            <Badge variant="outline" className="mt-1 text-xs">
              {user.current_plan}
            </Badge>
          )}
        </div>
        {selectedUser?.id === user.id && (
          <Check className="w-5 h-5 text-primary flex-shrink-0" />
        )}
      </div>
    </button>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-3 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <EnhancedSkeleton variant="shimmer" className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <EnhancedSkeleton variant="pulse" className="h-4 w-3/4" />
            <EnhancedSkeleton variant="shimmer" className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="p-8 text-center">
      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-medium text-sm mb-2">
        {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário elegível'}
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        {searchTerm 
          ? `Nenhum resultado para "${searchTerm}"`
          : 'Não há usuários elegíveis para plano cortesia no momento'
        }
      </p>
      {searchTerm && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setSearchTerm("")}
        >
          Limpar busca
        </Button>
      )}
    </div>
  );

  const SelectorContent = () => (
    <div className="flex flex-col h-full">
      {/* Search and Filters */}
      <div className="p-4 border-b space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome, email ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-base" // Larger text for mobile
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="eligible-only"
              checked={showOnlyEligible}
              onCheckedChange={setShowOnlyEligible}
            />
            <Label htmlFor="eligible-only" className="text-sm">
              Apenas usuários elegíveis
            </Label>
          </div>
          <Badge variant="secondary" className="text-xs">
            {users.length} usuário{users.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* User List */}
      <div className="flex-1">
        {error ? (
          <div className="p-4 text-sm text-destructive bg-destructive/10 m-4 rounded-md">
            Erro ao carregar usuários: {error.message}
          </div>
        ) : isLoading ? (
          <LoadingSkeleton />
        ) : users.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollArea className="h-full">
            <div className="divide-y divide-border">
              {users.map((user) => (
                <UserListItem key={user.id} user={user} />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className={className}>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between h-12 text-left"
            >
              <div className="flex-1 min-w-0">
                {selectedUser ? (
                  <div>
                    <div className="font-medium truncate">
                      {selectedUser.full_name || selectedUser.display_name || 'Usuário selecionado'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {selectedUser.email}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Selecionar usuário</span>
                )}
              </div>
              <Filter className="w-4 h-4 ml-2 flex-shrink-0" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader className="pb-4">
              <SheetTitle>Selecionar Usuário</SheetTitle>
            </SheetHeader>
            <SelectorContent />
          </SheetContent>
        </Sheet>
        
        {selectedUser && (
          <div className="mt-3 p-3 bg-primary/5 rounded-md border-l-2 border-primary">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Usuário Selecionado:</div>
                <div className="text-sm text-muted-foreground truncate">
                  {selectedUser.full_name || selectedUser.display_name} ({selectedUser.email})
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onClear}
                className="ml-2 flex-shrink-0"
              >
                Limpar
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop fallback - simple select trigger
  return (
    <div className={className}>
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(true)}
        className="w-full justify-between"
      >
        {selectedUser ? (
          <span className="truncate">
            {selectedUser.full_name || selectedUser.display_name || selectedUser.email}
          </span>
        ) : (
          <span className="text-muted-foreground">Selecionar usuário</span>
        )}
        <Search className="w-4 h-4 ml-2" />
      </Button>
      
      {/* Desktop modal would go here if needed */}
    </div>
  );
};