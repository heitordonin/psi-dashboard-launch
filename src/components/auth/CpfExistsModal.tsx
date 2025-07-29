import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserCheck, Mail, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CpfExistsModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  cpf: string;
}

export const CpfExistsModal: React.FC<CpfExistsModalProps> = ({
  isOpen,
  onClose,
  email,
  cpf
}) => {
  const navigate = useNavigate();

  const handleGoToLogin = () => {
    navigate('/login', { state: { email } });
    onClose();
  };

  const handleForgotPassword = () => {
    navigate('/login', { state: { email, showForgotPassword: true } });
    onClose();
  };

  const maskedCpf = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.**$4');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            CPF já cadastrado
          </DialogTitle>
          <DialogDescription className="text-left">
            Já existe uma conta com o CPF <strong>{maskedCpf}</strong> em nosso sistema.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              Opções disponíveis:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Faça login com suas credenciais</li>
              <li>• Recupere sua senha se necessário</li>
              <li>• Entre em contato conosco se precisar de ajuda</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleGoToLogin} className="w-full">
              <UserCheck className="w-4 h-4 mr-2" />
              Fazer Login
            </Button>
            
            <Button onClick={handleForgotPassword} variant="outline" className="w-full">
              <Mail className="w-4 h-4 mr-2" />
              Esqueci minha senha
            </Button>
            
            <Button onClick={onClose} variant="ghost" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao cadastro
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};