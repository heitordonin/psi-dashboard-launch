
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';

interface UserFilterProps {
  onFilterChange: (userId: string | null, showAllUsers: boolean) => void;
}

export const UserFilter = ({ onFilterChange }: UserFilterProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showAllUsers, setShowAllUsers] = useState(true);

  // Fetch all users with their profiles data
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users-with-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          cpf,
          created_at
        `)
        .not('full_name', 'is', null)
        .not('cpf', 'is', null)
        .order('full_name');
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    onFilterChange(showAllUsers ? null : selectedUserId, showAllUsers);
  }, [selectedUserId, showAllUsers, onFilterChange]);

  const handleShowAllUsersChange = (checked: boolean) => {
    setShowAllUsers(checked);
    if (checked) {
      setSelectedUserId(null);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setShowAllUsers(false);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Filtro de Usuário
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-all-users"
              checked={showAllUsers}
              onCheckedChange={handleShowAllUsersChange}
            />
            <Label htmlFor="show-all-users">
              Mostrar dados de todos os usuários
            </Label>
          </div>
          
          {!showAllUsers && (
            <div className="space-y-2">
              <Label htmlFor="user-select">Selecionar usuário específico:</Label>
              <Select onValueChange={handleUserSelect} value={selectedUserId || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um usuário..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} - {user.cpf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
