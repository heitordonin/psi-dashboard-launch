
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const formatCPF = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    // Apply CPF mask: 000.000.000-00
    if (numericValue.length <= 11) {
      return numericValue
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    
    return value;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCPF(e.target.value);
    setCpf(formattedValue);
  };

  const validateCPF = (cpf: string) => {
    // Remove formatting for validation
    const numericCpf = cpf.replace(/\D/g, '');
    
    if (numericCpf.length !== 11) return false;
    
    // Check if all digits are the same
    if (/^(\d)\1{10}$/.test(numericCpf)) return false;
    
    // Validate CPF algorithm
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numericCpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numericCpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numericCpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numericCpf.charAt(10))) return false;
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast.error('Nome completo é obrigatório');
      return;
    }

    if (!cpf.trim()) {
      toast.error('CPF é obrigatório');
      return;
    }

    if (!validateCPF(cpf)) {
      toast.error('CPF inválido');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, {
        full_name: fullName.trim(),
        cpf: cpf.replace(/\D/g, '') // Store CPF without formatting
      });
      
      if (error) {
        console.log('Sign up error details:', error);
        
        // Handle specific error cases
        if (error.message === 'User already registered') {
          toast.error('Este email já está cadastrado');
        } else if (error.message.includes('Database error saving new user')) {
          // This usually means CPF constraint violation
          toast.error('Este CPF já está cadastrado no sistema');
        } else if (error.message.includes('duplicate key value violates unique constraint "unique_cpf"')) {
          toast.error('Este CPF já está cadastrado');
        } else if (error.message.includes('duplicate key value violates unique constraint')) {
          toast.error('Já existe uma conta com estes dados');
        } else {
          toast.error('Erro ao criar conta: ' + error.message);
        }
      } else {
        toast.success('Conta criada com sucesso!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Unexpected error during signup:', error);
      toast.error('Erro inesperado ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Criar Conta</CardTitle>
          <CardDescription>
            Crie sua conta para acessar o Declara Psi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Digite seu nome completo"
                required
              />
            </div>
            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                type="text"
                value={cpf}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                maxLength={14}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
                minLength={6}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua senha"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
