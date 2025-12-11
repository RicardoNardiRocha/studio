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
import { useUser } from '@/firebase';
import { createUser } from '@/app/actions/create-user';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: () => void;
}

const formSchema = z.object({
  displayName: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres.'),
  email: z.string().email('O e-mail é inválido.'),
  roleId: z.enum(['admin', 'contador', 'usuario'], { required_error: 'Selecione um papel para o usuário.' }),
});

export function AddUserDialog({ open, onOpenChange, onUserAdded }: AddUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      email: '',
      roleId: 'usuario',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
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
      const result = await createUser(values);
      if (result.error) {
        throw new Error(result.error);
      }
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
            Crie um perfil para um usuário já existente na autenticação e atribua um papel.
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
