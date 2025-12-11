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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, collection, query, orderBy } from 'firebase/firestore';
import type { UserProfile } from '@/firebase/provider';
import { logActivity } from '@/lib/activity-log';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import ReactSelect from 'react-select';
import { Badge } from '@/components/ui/badge';

interface EditUserDialogProps {
  userToEdit: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

type Role = 'owner' | 'admin' | 'contador' | 'usuario';
const roles: Role[] = ['owner', 'admin', 'contador', 'usuario'];

type CompanyOption = { value: string; label: string; };

const formSchema = z.object({
  roleId: z.enum(roles),
  isAdmin: z.boolean(),
  canFinance: z.boolean(),
  companyIds: z.array(z.string()).optional(),
});

export function EditUserDialog({ userToEdit, open, onOpenChange, onUserUpdated }: EditUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user: currentUser, profile: currentUserProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const companiesCollection = useMemoFirebase(() => {
    return firestore ? query(collection(firestore, 'companies'), orderBy('name', 'asc')) : null;
  }, [firestore]);
  const { data: companies } = useCollection<{id: string; name: string;}>(companiesCollection);

  const companyOptions = useMemo<CompanyOption[]>(() => {
    return companies?.map(c => ({ value: c.id, label: c.name })) || [];
  }, [companies]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roleId: userToEdit.roleId,
      isAdmin: userToEdit.isAdmin,
      canFinance: userToEdit.canFinance,
      companyIds: userToEdit.companyIds || [],
    },
  });

  useEffect(() => {
    form.reset({
      roleId: userToEdit.roleId,
      isAdmin: userToEdit.isAdmin,
      canFinance: userToEdit.canFinance,
      companyIds: userToEdit.companyIds || [],
    });
  }, [userToEdit, form]);
  
  const watchedRole = form.watch('roleId');
  const isCompanyAssignmentDisabled = watchedRole === 'owner' || watchedRole === 'admin';


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !currentUser) {
      toast({ title: 'Erro', description: 'Não foi possível salvar as permissões.', variant: 'destructive' });
      return;
    }

    if (currentUser.uid === userToEdit.uid) {
       toast({ title: 'Ação não permitida', description: 'Você não pode alterar suas próprias permissões.', variant: 'destructive' });
       return;
    }
    
    // Owner safety check
    if (userToEdit.roleId === 'owner' && currentUserProfile?.roleId !== 'owner') {
      toast({ title: 'Ação não permitida', description: 'Apenas um Owner pode editar outro Owner.', variant: 'destructive' });
      return;
    }
     if (values.roleId === 'owner' && currentUserProfile?.roleId !== 'owner') {
      toast({ title: 'Ação não permitida', description: 'Apenas um Owner pode promover outro usuário a Owner.', variant: 'destructive' });
      return;
    }


    setIsLoading(true);
    try {
      const userRef = doc(firestore, 'users', userToEdit.uid);
      const dataToUpdate: Partial<UserProfile> = {
        roleId: values.roleId,
        isAdmin: values.roleId === 'admin' || values.roleId === 'owner' || values.isAdmin,
        canFinance: values.canFinance,
        companyIds: isCompanyAssignmentDisabled ? [] : values.companyIds || [],
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Permissões de Usuário</DialogTitle>
          <DialogDescription>Editando permissões para <span className='font-bold'>{userToEdit.displayName}</span> ({userToEdit.email})</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Função Principal</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a função do usuário" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role} value={role} disabled={role === 'owner' && currentUserProfile?.roleId !== 'owner'}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className='flex flex-col space-y-4 rounded-lg border p-4'>
                <FormField
                  control={form.control}
                  name="isAdmin"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Acesso de Administrador?</FormLabel>
                        <FormDescription>Permite ver e gerenciar todos os dados operacionais e usuários.</FormDescription>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange}  /></FormControl>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="canFinance"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Acesso ao Financeiro?</FormLabel>
                        <FormDescription>Permite ver e gerenciar o módulo de faturamento.</FormDescription>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange}  /></FormControl>
                    </FormItem>
                  )}
                />
            </div>

            <FormField
              control={form.control}
              name="companyIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-2'>
                      Acesso a Empresas
                      {isCompanyAssignmentDisabled && <Badge variant='outline'>Acesso Global</Badge>}
                  </FormLabel>
                  <FormControl>
                    <ReactSelect
                      isMulti
                      options={companyOptions}
                      value={companyOptions.filter(option => field.value?.includes(option.value))}
                      onChange={options => field.onChange(options.map(option => option.value))}
                      placeholder="Selecione as empresas..."
                      noOptionsMessage={() => 'Nenhuma empresa encontrada'}
                      isDisabled={isCompanyAssignmentDisabled}
                       styles={{
                        control: (base, state) => ({ ...base, background: 'transparent', borderColor: 'hsl(var(--input))', opacity: state.isDisabled ? 0.5 : 1 }),
                        menu: (base) => ({ ...base, zIndex: 100 }),
                        input: (base) => ({ ...base, color: 'hsl(var(--foreground))' }),
                        multiValue: (base) => ({ ...base, backgroundColor: 'hsl(var(--secondary))' }),
                      }}
                    />
                  </FormControl>
                  <FormDescription>Defina a quais empresas este usuário terá acesso. Deixe em branco para nenhuma (exceto Admins/Owners).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
