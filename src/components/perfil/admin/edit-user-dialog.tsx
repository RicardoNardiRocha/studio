'use client';

import { useState, useEffect } from 'react';
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
} from '@/components/ui/form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, PlusCircle, Pencil, Trash2, AlertTriangle, Settings } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { UserProfile, ModulePermissions } from '@/firebase/provider';
import { logActivity } from '@/lib/activity-log';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

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
  'documentos',
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
    documentos: permissionSchema,
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
  documentos: { read: false, create: false, update: false, delete: false },
  financeiro: { read: false, create: false, update: false, delete: false },
  usuarios: { read: false, create: false, update: false, delete: false },
});


export function EditUserDialog({ userToEdit, open, onOpenChange, onUserUpdated }: EditUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { profile: currentUserProfile } = useUser();
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
    if (!firestore || !currentUserProfile) {
      toast({ title: 'Erro', description: 'Não foi possível salvar as permissões.', variant: 'destructive' });
      return;
    }

    if (currentUserProfile.uid === userToEdit.uid) {
       toast({ title: 'Ação não permitida', description: 'Você não pode alterar suas próprias permissões.', variant: 'destructive' });
       return;
    }

    if (!currentUserProfile.permissions?.usuarios?.update) {
       toast({ title: 'Acesso Negado', description: 'Você não tem permissão para alterar as permissões de outros usuários.', variant: 'destructive' });
       return;
    }

    setIsLoading(true);
    try {
      const userRef = doc(firestore, 'users', userToEdit.uid);
      const dataToUpdate: Partial<UserProfile> = {
        permissions: values.permissions
      };
      
      await updateDoc(userRef, dataToUpdate);

      logActivity(firestore, { uid: currentUserProfile.uid, displayName: currentUserProfile.displayName } as any, `atualizou as permissões de ${userToEdit.displayName}.`);
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
  
  const permissionsHeader = [
      { id: 'read', label: 'Ver', icon: Eye },
      { id: 'create', label: 'Criar', icon: PlusCircle },
      { id: 'update', label: 'Editar', icon: Pencil },
      { id: 'delete', label: 'Excluir', icon: Trash2 },
  ];
  
  const setModulePermissions = (module: keyof UserProfile['permissions'], preset: 'admin' | 'user' | 'none') => {
    const newPermissions: ModulePermissions = { read: false, create: false, update: false, delete: false };
    if (preset === 'admin') {
      newPermissions.read = true;
      newPermissions.create = true;
      newPermissions.update = true;
      newPermissions.delete = true;
    } else if (preset === 'user') {
      newPermissions.read = true;
      newPermissions.create = true;
      newPermissions.update = true;
      newPermissions.delete = false;
    }
    form.setValue(`permissions.${module}`, newPermissions);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Permissões de Usuário</DialogTitle>
          <DialogDescription>Controle o que <span className='font-bold'>{userToEdit.displayName}</span> pode ver e fazer no sistema.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <div className="space-y-3 p-1">
                {/* Header */}
                <div className="flex items-center px-4 py-2">
                    <div className="flex-1 font-semibold text-muted-foreground text-sm">MÓDULO</div>
                    <div className="w-20"></div> {/* Spacer for dropdown */}
                    {permissionsHeader.map(p => (
                         <div key={p.id} className="w-24 text-center font-semibold text-muted-foreground text-sm flex flex-col items-center gap-1">
                            <p.icon className="h-4 w-4" />
                            {p.label}
                        </div>
                    ))}
                </div>

                {/* Module Cards */}
                <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-2">
                    {modules.map((moduleName) => {
                        const isFinance = moduleName === 'financeiro';
                        return (
                            <div key={moduleName} className={`flex items-center p-4 rounded-lg border bg-card shadow-sm ${isFinance ? 'border-amber-500/50' : ''}`}>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        {isFinance && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                                        <p className="font-semibold text-card-foreground capitalize">{moduleName}</p>
                                    </div>
                                </div>
                                <div className="w-20 flex justify-center">
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon">
                                            <Settings className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                          <DropdownMenuItem onClick={() => setModulePermissions(moduleName, 'admin')}>
                                            Admin (Acesso Total)
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => setModulePermissions(moduleName, 'user')}>
                                            Usuário (Criar/Editar)
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => setModulePermissions(moduleName, 'none')} className="text-destructive">
                                            Nenhum Acesso
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                </div>
                                {permissionsHeader.map((permission) => (
                                    <div key={`${moduleName}-${permission.id}`} className="w-24 flex justify-center">
                                         <FormField
                                            control={form.control}
                                            name={`permissions.${moduleName}.${permission.id as keyof ModulePermissions}`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        {permission.id === 'read' ? (
                                                             <Switch
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        ) : (
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                                disabled={!form.watch(`permissions.${moduleName}.read`)}
                                                            />
                                                        )}
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                            />
                                    </div>
                                ))}
                            </div>
                        )
                    })}
                </div>
             </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading} className='bg-primary text-primary-foreground hover:bg-primary/90'>
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
