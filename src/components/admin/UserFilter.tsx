
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

  // Fetch all users with their profiles
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          created_at
        `);
      
      if (error) throw error;
      return data;
    },
  });

  // Get user emails from auth.users (we need to do this separately due to RLS)
  const { data: userEmails = {} } = useQuery({
    queryKey: ['admin-user-emails'],
    queryFn: async () => {
      // We'll fetch patients to get owner emails as a workaround
      const { data, error } = await supabase
        .from('patients')
        .select('owner_id')
        .not('owner_id', 'is', null);
      
      if (error) throw error;
      
      // Get unique owner IDs
      const uniqueOwnerIds = [...new Set(data.map(p => p.owner_id).filter(Boolean))];
      
      // Create a mapping - in a real scenario you'd have user email data
      const emailMapping: Record<string, string> = {};
      uniqueOwnerIds.forEach((id, index) => {
        emailMapping[id] = `Usuário ${index + 1}`;
      });
      
      return emailMapping;
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

  const uniqueUserIds = [...new Set(users.map(u => u.id))];

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
                  {uniqueUserIds.map((userId) => (
                    <SelectItem key={userId} value={userId}>
                      {userEmails[userId] || `ID: ${userId.slice(0, 8)}...`}
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
