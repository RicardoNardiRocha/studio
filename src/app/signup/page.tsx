
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layers, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) {
      toast({
        title: 'Erro de Autenticação',
        description: 'O serviço de autenticação ou banco de dados não está disponível.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update the user's profile with the name
      await updateProfile(user, { displayName: name });
      
      // Create user document in Firestore
      const userDocRef = doc(firestore, "users", user.uid);
      await setDoc(userDocRef, {
          uid: user.uid,
          displayName: name,
          email: user.email,
          photoURL: user.photoURL || '',
          roleId: 'owner' // Assign the 'owner' role to the first user signing up
      });

      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Redirecionando para o dashboard...',
      });
      
      // Redirect to the dashboard
      router.push('/dashboard');

    } catch (error: any) {
      let errorMessage = 'Ocorreu um erro desconhecido.';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este e-mail já está em uso por outra conta.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'O formato do e-mail é inválido.';
          break;
        case 'auth/weak-password':
          errorMessage = 'A senha é muito fraca. Ela deve ter no mínimo 6 caracteres.';
          break;
        default:
          errorMessage = 'Erro ao criar conta. Tente novamente.';
          break;
      }
      toast({
        title: 'Erro no Cadastro',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Signup error:', error);
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
            Crie sua conta
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Comece a transformar seu escritório contábil hoje.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Cadastro</CardTitle>
            <CardDescription>Preencha os campos abaixo para criar sua conta.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
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
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Criar Conta'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link href="/login" className="underline" prefetch={false}>
            Faça login
          </Link>
        </div>
      </div>
    </div>
  );
}
