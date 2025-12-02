'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Separator } from '../ui/separator';
import { Loader2, Trash2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface Partner {
  nome_socio: string;
  qualificacao_socio: string;
  data_entrada_sociedade: string;
}

export interface Company {
    id: string;
    name: string;
    fantasyName?: string;
    cnpj: string;
    status: string;
    taxRegime: string;
    startDate: string;
    cnae?: string;
    address?: string;
    phone?: string;
    email?: string | null;
    capital?: number;
    legalNature?: string;
    porte?: string;
    qsa?: Partner[];
    members?: { [key: string]: 'admin' | 'viewer' };
}

interface CompanyDetailsDialogProps {
  company: Company;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyUpdated: () => void;
  onCompanyDeleted: () => void;
}

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | null | undefined => {
    if (!status) return 'secondary';
    switch(status.toLowerCase()) {
        case 'ativa': return 'default';
        case 'inapta': return 'destructive';
        case 'baixada': return 'outline';
        default: return 'secondary';
    }
}

export function CompanyDetailsDialog({ company, open, onOpenChange, onCompanyUpdated, onCompanyDeleted }: CompanyDetailsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDelete = () => {
    if (!firestore) {
      toast({ title: "Erro", description: "O serviço de banco de dados não está disponível.", variant: "destructive"});
      return;
    }
    const companyRef = doc(firestore, 'companies', company.id);
    deleteDocumentNonBlocking(companyRef);
    toast({
      title: "Empresa Excluída",
      description: `${company.name} foi removida do sistema.`
    });
    onCompanyDeleted();
    onOpenChange(false);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className='font-headline text-2xl'>{company.name}</DialogTitle>
              <DialogDescription>{company.fantasyName || 'Sem nome fantasia'}</DialogDescription>
            </div>
            <Badge variant={getStatusVariant(company.status)}>{company.status}</Badge>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <Label className='text-muted-foreground'>CNPJ</Label>
              <p className="font-medium">{company.cnpj}</p>
            </div>
            <div>
              <Label className='text-muted-foreground'>Data de Abertura</Label>
              <p className="font-medium">{company.startDate}</p>
            </div>
            <div>
              <Label className='text-muted-foreground'>Regime Tributário</Label>
              <p className="font-medium">{company.taxRegime}</p>
            </div>
            <div>
              <Label className='text-muted-foreground'>Porte</Label>
              <p className="font-medium">{company.porte || 'Não informado'}</p>
            </div>
            <div>
              <Label className='text-muted-foreground'>Natureza Jurídica</Label>
              <p className="font-medium">{company.legalNature || 'Não informado'}</p>
            </div>
            <div>
              <Label className='text-muted-foreground'>Capital Social</Label>
              <p className="font-medium">{company.capital?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'Não informado'}</p>
            </div>
            <div className='col-span-2'>
              <Label className='text-muted-foreground'>Atividade Principal (CNAE)</Label>
              <p className="font-medium">{company.cnae || 'Não informado'}</p>
            </div>
          </div>

          <Separator/>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className='space-y-2'>
              <h3 className="font-semibold font-headline">Endereço</h3>
              <p className="text-sm text-muted-foreground">{company.address || 'Não informado'}</p>
            </div>
            <div className='space-y-2'>
              <h3 className="font-semibold font-headline">Contato</h3>
              <p className="text-sm text-muted-foreground">
                Telefone: {company.phone || 'Não informado'} <br/>
                Email: {company.email || 'Não informado'}
              </p>
            </div>
          </div>
        
          <div>
            <h3 className='font-semibold font-headline mb-2'>Quadro de Sócios e Administradores (QSA)</h3>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Qualificação</TableHead>
                    <TableHead>Data de Entrada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {company.qsa && company.qsa.length > 0 ? (
                    company.qsa.map((socio, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{socio.nome_socio}</TableCell>
                        <TableCell>{socio.qualificacao_socio}</TableCell>
                        <TableCell>{new Date(socio.data_entrada_sociedade).toLocaleDateString('pt-BR')}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                        Nenhum sócio ou administrador encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 flex-row justify-between w-full">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Empresa
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso irá excluir permanentemente a empresa <strong>{company.name}</strong> e todos os seus dados associados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    Sim, excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Fechar</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading} onClick={() => alert("Em breve!")}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
