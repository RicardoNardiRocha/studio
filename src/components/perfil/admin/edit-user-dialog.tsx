'use client';

import { useState, useMemo, useEffect } from 'react';
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
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { UserProfile, ModulePermissions } from '@/firebase/provider';
import { logActivity } from '@/lib/activity-log';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

interface EditUserDialogProps {
  userToEdit: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

const modules: Array<keyof UserProfile['permissions']> = [
  'empresas',
  'societario',
  'processos',
  'obrigacoes',
  'fiscal',
  'financeiro',
  'usuarios',
];

const permissionSchema = z.object({
  read: z.boolean().default(false),
  create: z.boolean().default(false),
  update: z.boolean().default(false),
  delete: z.boolean().default(false),
});

const formSchema = z.object({
  permissions: z.object({
    empresas: permissionSchema,
    societario: permissionSchema,
    processos: permissionSchema,
    obrigacoes: permissionSchema,
    fiscal: permissionSchema,
    financeiro: permissionSchema,
    usuarios: permissionSchema,
  }),
});

const getDefaultPermissions = (): Record<keyof UserProfile['permissions'], ModulePermissions> => ({
  empresas: { read: false, create: false, update: false, delete: false },
  societario: { read: false, create: false, update: false, delete: false },
  processos: { read: false, create: false, update: false, delete: false },
  obrigacoes: { read: false, create: false, update: false, delete: false },
  fiscal: { read: false, create: false, update: false, delete: false },
  financeiro: { read: false, create: false, update: false, delete: false },
  usuarios: { read: false, create: false, update: false, delete: false },
});


export function EditUserDialog({ userToEdit, open, onOpenChange, onUserUpdated }: EditUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user: currentUser, profile: currentUserProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      permissions: userToEdit.permissions || getDefaultPermissions(),
    },
  });

  useEffect(() => {
    form.reset({
      permissions: userToEdit.permissions || getDefaultPermissions(),
    });
  }, [userToEdit, form]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !currentUser) {
      toast({ title: 'Erro', description: 'Não foi possível salvar as permissões.', variant: 'destructive' });
      return;
    }

    if (currentUser.uid === userToEdit.uid) {
       toast({ title: 'Ação não permitida', description: 'Você não pode alterar suas próprias permissões.', variant: 'destructive' });
       return;
    }

    setIsLoading(true);
    try {
      const userRef = doc(firestore, 'users', userToEdit.uid);
      const dataToUpdate: Partial<UserProfile> = {
        permissions: values.permissions
      };
      
      await updateDoc(userRef, dataToUpdate);

      logActivity(firestore, currentUser, `atualizou as permissões de ${userToEdit.displayName}.`);
      toast({ title: 'Permissões atualizadas!', description: `As permissões de ${userToEdit.displayName} foram salvas.` });
      
      onUserUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Erro ao salvar', description: 'Não foi possível atualizar as permissões do usuário.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Permissões</DialogTitle>
          <DialogDescription>Editando permissões para <span className='font-bold'>{userToEdit.displayName}</span> ({userToEdit.email})</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
              {modules.map((moduleName) => (
                <div key={moduleName} className="space-y-2">
                  <h3 className="text-md font-semibold capitalize">{moduleName}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-lg border p-4">
                    {Object.keys(permissionSchema.shape).map((permission) => (
                      <FormField
                        key={`${moduleName}-${permission}`}
                        control={form.control}
                        name={`permissions.${moduleName}.${permission as keyof ModulePermissions}`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="capitalize">{permission}</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Permissões
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
