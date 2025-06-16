
import { useSecureAuth } from "@/hooks/useSecureAuth";

/**
 * Componente de teste para validar que a proteção admin está funcionando
 * Este componente deve NUNCA mostrar conteúdo admin para usuários não-admin
 */
export const AdminProtectionTest = () => {
  const { user, isLoading, isAdminLoading, isAdmin, canPerformAdminAction } = useSecureAuth();

  if (import.meta.env.MODE === 'development') {
    console.log('AdminProtectionTest render:', {
      hasUser: !!user,
      isLoading,
      isAdminLoading,
      isAdmin,
      canPerformAdminAction: canPerformAdminAction()
    });
  }

  // Mostrar loading enquanto qualquer verificação estiver em andamento
  if (isLoading || isAdminLoading) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="animate-spin h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
          <span className="text-yellow-800">Verificando permissões...</span>
        </div>
      </div>
    );
  }

  // Só mostrar conteúdo admin se TODAS as verificações passaram
  if (!user || !canPerformAdminAction()) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <span className="text-gray-600">Usuário comum - sem acesso admin</span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <span className="text-green-800 font-medium">✅ ADMIN VERIFICADO - Acesso concedido</span>
    </div>
  );
};
