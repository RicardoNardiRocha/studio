'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: () => void;
}

const formSchema = z.object({
  displayName: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres.'),
  email: z.string().email('O e-mail é inválido.'),
  // O UID será obtido de outra forma, então não precisa estar no schema de validação do formulário.
  uid: z.string().min(1, 'UID é obrigatório'),
  roleId: z.enum(['admin', 'contador', 'usuario'], { required_error: 'Selecione um papel para o usuário.' }),
});

export function AddUserDialog({ open, onOpenChange, onUserAdded }: AddUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useUser();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      email: '',
      uid: '',
      roleId: 'usuario',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) {
      toast({ title: "Erro", description: "O serviço de banco de dados não está disponível.", variant: "destructive" });
      return;
    }
    if (profile?.roleId !== 'owner' && values.roleId === 'admin') {
      toast({
        title: 'Permissão Negada',
        description: 'Apenas o Owner pode criar outros administradores.',
        variant: 'destructive',
      });
      return;
    }
      
    setIsLoading(true);
    try {
      const userDocRef = doc(firestore, 'users', values.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        throw new Error(`Um perfil de usuário para o UID ${values.uid} já existe no sistema.`);
      }

      const newUserProfile = {
        userId: values.uid,
        displayName: values.displayName,
        email: values.email,
        roleId: values.roleId,
        companyIds: [],
        isAdmin: values.roleId === 'admin' || values.roleId === 'owner',
        canFinance: values.roleId === 'admin' || values.roleId === 'owner',
        photoURL: '', // Pode ser preenchido pelo usuário depois
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(userDocRef, newUserProfile);

      toast({
        title: 'Perfil de Usuário Criado!',
        description: `O perfil para ${values.email} foi criado com sucesso.`,
      });
      onUserAdded();
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Create user profile error:', error);
      toast({
        title: 'Erro ao Criar Perfil',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const availableRoles = [
      { id: 'admin', name: 'Administrador' },
      { id: 'contador', name: 'Contador' },
      { id: 'usuario', name: 'Usuário (Apenas Leitura)' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Usuário</DialogTitle>
          <DialogDescription>
            Crie um perfil para um usuário. Você precisará do UID do Firebase Authentication dele.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do usuário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="usuario@seu-dominio.com" {...field} />
                  </FormControl>
                   <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="uid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UID do Usuário</FormLabel>
                  <FormControl>
                    <Input placeholder="UID do Firebase Authentication" {...field} />
                  </FormControl>
                   <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Papel (Role)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um papel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id} disabled={profile?.roleId !== 'owner' && role.id === 'admin'}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Perfil de Usuário
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}