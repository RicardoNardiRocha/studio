'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layers, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast({
        title: 'Erro de Autenticação',
        description: 'O serviço de autenticação não está disponível.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Login bem-sucedido!',
        description: 'Redirecionando para o dashboard...',
      });
      router.push('/dashboard');
    } catch (error: any) {
      let errorMessage = 'Ocorreu um erro desconhecido.';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Nenhum usuário encontrado com este e-mail.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Senha incorreta. Por favor, tente novamente.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'O formato do e-mail é inválido.';
          break;
        default:
          errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';
          break;
      }
      toast({
        title: 'Erro de Login',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block" prefetch={false}>
            <Layers className="h-10 w-10 text-primary mx-auto" />
          </Link>
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100 font-headline">
            Acesse sua conta
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Bem-vindo de volta ao ContaFlow
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Insira seu e-mail e senha para continuar.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                  <Link href="#" className="ml-auto inline-block text-sm underline" prefetch={false}>
                    Esqueceu sua senha?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="animate-spin" />}
                {!isLoading && 'Entrar'}
              </Button>
              <Button variant="outline" className="w-full" disabled={isLoading}>
                Entrar com Google
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="text-center text-sm text-muted-foreground">
          Não tem uma conta?{' '}
          <Link href="#" className="underline" prefetch={false}>
            Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  );
}
