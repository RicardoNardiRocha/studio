'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  AlertTriangle,
  Send,
  CheckCircle,
  FileCheck2,
  X,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { format, parse } from 'date-fns';

// --- Tipos --- //

type Company = {
  id: string;
  name: string;
  cnpj: string;
  receivesXml: boolean;
};

export type XmlStatusOption =
  | 'Pendente'
  | 'Aguardando Reenvio'
  | 'Enviado';
export type DasStatusOption = 'DAS Enviado';
type AllStatus = XmlStatusOption | DasStatusOption;

type StatusRecord = {
  companyId: string;
  month: number;
  year: number;
  xmlStatus: XmlStatusOption;
  dasStatus?: DasStatusOption;
};

type CompanyStatus = {
  companyId: string;
  companyName: string;
  companyCnpj: string;
  xmlStatus: XmlStatusOption;
  dasStatus?: DasStatusOption;
  isLocked: boolean;
};

const xmlStatusOptions: XmlStatusOption[] = [
  'Pendente',
  'Aguardando Reenvio',
  'Enviado',
];
const dasStatusOption: DasStatusOption = 'DAS Enviado';

const statusColors: Record<AllStatus, string> = {
  Pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  'Aguardando Reenvio': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  Enviado: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  'DAS Enviado': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const cnpjMask = (value: string) => {
  if (!value) return '';
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
};

// --- Componente --- //

export function FiscalControlTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AllStatus | 'Todos'>('Todos');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertCallback, setAlertCallback] = useState<(() => void) | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [competenceInput, setCompetenceInput] = useState(format(new Date(), 'MM/yyyy'));

  const firestore = useFirestore();

  const companiesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'companies') : null),
    [firestore]
  );
  const xmlStatusQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'xmlStatus') : null),
    [firestore]
  );

  const {
    data: companies,
    isLoading: loadingCompanies,
  } = useCollection<Company>(companiesQuery);
  const {
    data: statusRecords,
    isLoading: loadingStatuses,
    forceRefetch: refetchStatuses,
  } = useCollection<StatusRecord>(xmlStatusQuery);

  const competenceMonth = selectedDate.getMonth();
  const competenceYear = selectedDate.getFullYear();

  const handleCompetenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 6);
    }
    setCompetenceInput(value);
    if (value.length === 7) {
      const date = parse(value, 'MM/yyyy', new Date());
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
      }
    }
  };

  const companyStatuses = useMemo<CompanyStatus[]>(() => {
    if (!companies || !statusRecords) return [];

    const relevantCompanies = companies.filter((c) => c.receivesXml === true);

    return relevantCompanies
      .map((c) => {
        const savedStatus = statusRecords.find(
          (s) =>
            s.companyId === c.id &&
            s.month === competenceMonth &&
            s.year === competenceYear
        );

        const companyStatus: CompanyStatus = {
          companyId: c.id,
          companyName: c.name,
          companyCnpj: c.cnpj,
          xmlStatus: savedStatus?.xmlStatus || 'Pendente',
          dasStatus: savedStatus?.dasStatus,
          isLocked: savedStatus?.dasStatus === 'DAS Enviado',
        };
        return companyStatus;
      })
      .filter((c) => {
        const searchMatch =
          c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.companyCnpj.includes(searchTerm);
        
        let statusMatch = true;
        if (statusFilter !== 'Todos') {
            if (statusFilter === 'DAS Enviado') {
                statusMatch = c.dasStatus === 'DAS Enviado';
            } else {
                statusMatch = c.xmlStatus === statusFilter && !c.isLocked;
            }
        }

        return searchMatch && statusMatch;
      });
  }, [companies, statusRecords, competenceMonth, competenceYear, searchTerm, statusFilter]);

  const kpis = useMemo(() => {
    const allRelevantCompanies = companies?.filter(c => c.receivesXml === true) || [];
    const baseStatuses = allRelevantCompanies.map(c => {
       const savedStatus = statusRecords?.find(
          (s) =>
            s.companyId === c.id &&
            s.month === competenceMonth &&
            s.year === competenceYear
        );
         return {
            xmlStatus: savedStatus?.xmlStatus || 'Pendente',
            dasStatus: savedStatus?.dasStatus,
        };
    });

    return {
        'Pendente': baseStatuses.filter(s => s.xmlStatus === 'Pendente' && s.dasStatus !== 'DAS Enviado').length,
        'Aguardando Reenvio': baseStatuses.filter(s => s.xmlStatus === 'Aguardando Reenvio' && s.dasStatus !== 'DAS Enviado').length,
        'Enviado': baseStatuses.filter(s => s.xmlStatus === 'Enviado' && s.dasStatus !== 'DAS Enviado').length,
        'DAS Enviado': baseStatuses.filter(s => s.dasStatus === 'DAS Enviado').length,
    }
  }, [companies, statusRecords, competenceMonth, competenceYear])

  const handleStatusChange = async (
    companyId: string,
    newStatus: XmlStatusOption
  ) => {
    if (!firestore) return;

    const toastId = toast.loading(`Alterando status para ${newStatus}...`);

    try {
      const batch = writeBatch(firestore);
      const statusRef = doc(
        firestore,
        'xmlStatus',
        `${companyId}_${competenceMonth}_${competenceYear}`
      );

      batch.set(
        statusRef,
        {
          companyId,
          month: competenceMonth,
          year: competenceYear,
          xmlStatus: newStatus,
        },
        { merge: true }
      );

      await batch.commit();
      toast.success('Status alterado com sucesso!', { id: toastId });
      refetchStatuses();
    } catch (error) {
      console.error('Erro ao alterar status: ', error);
      toast.error('Erro ao alterar status.', { id: toastId });
    }
  };

  const handleDasStatusChange = (companyId: string, isChecked: boolean) => {
    const change = async () => {
      if (!firestore) return;
      const toastId = toast.loading('Atualizando status do DAS...');
      try {
        const batch = writeBatch(firestore);
        const statusRef = doc(
          firestore,
          'xmlStatus',
          `${companyId}_${competenceMonth}_${competenceYear}`
        );
        batch.set(
          statusRef,
          {
            companyId,
            month: competenceMonth,
            year: competenceYear,
            dasStatus: isChecked ? dasStatusOption : null,
          },
          { merge: true }
        );
        await batch.commit();
        toast.success('Status do DAS atualizado!', { id: toastId });
        refetchStatuses();
      } catch (error) {
        console.error('Erro ao alterar status do DAS: ', error);
        toast.error('Erro ao alterar status do DAS.', { id: toastId });
      }
    };

    if (!isChecked) {
      setAlertCallback(() => () => change());
      setIsAlertOpen(true);
    } else {
      change();
    }
  };

  const KpiCard = ({ title, value, icon, onClick, colorClass, isActive }: { title: string; value: number; icon: React.ElementType, onClick: () => void, colorClass: string, isActive: boolean }) => {
    const Icon = icon;
    return (
        <Card className={`cursor-pointer hover:shadow-md transition-all ${isActive ? 'ring-2 ring-primary shadow-lg' : ''}`} onClick={onClick}>
            <CardContent className="p-4 flex items-center gap-4 relative">
                 <div className={`p-3 rounded-full ${colorClass}`}>
                    <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                    <div className="text-2xl font-bold">{value}</div>
                    <p className="text-xs text-muted-foreground">{title}</p>
                </div>
                {isActive && (
                    <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 rounded-full" onClick={(e) => { e.stopPropagation(); setStatusFilter('Todos'); }}>
                        <X className="h-4 w-4"/>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
  };

  const isLoading = loadingCompanies || loadingStatuses;

  // --- Renderização --- //
  return (
    <div>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Desmarcar esta opção reativará a edição da linha. Isso deve ser
              feito apenas se o DAS precisar ser reenviado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                alertCallback && alertCallback();
                setIsAlertOpen(false);
              }}
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 my-4">
        <KpiCard title="Pendente" value={kpis['Pendente']} icon={AlertTriangle} colorClass="bg-yellow-500" onClick={() => setStatusFilter('Pendente')} isActive={statusFilter === 'Pendente'} />
        <KpiCard title="Aguardando Reenvio" value={kpis['Aguardando Reenvio']} icon={Send} colorClass="bg-blue-500" onClick={() => setStatusFilter('Aguardando Reenvio')} isActive={statusFilter === 'Aguardando Reenvio'} />
        <KpiCard title="XML Enviado" value={kpis['Enviado']} icon={CheckCircle} colorClass="bg-green-500" onClick={() => setStatusFilter('Enviado')} isActive={statusFilter === 'Enviado'} />
        <KpiCard title="DAS Enviado" value={kpis['DAS Enviado']} icon={FileCheck2} colorClass="bg-gray-500" onClick={() => setStatusFilter('DAS Enviado')} isActive={statusFilter === 'DAS Enviado'} />
      </div>


      <div className="flex flex-col md:flex-row items-center gap-4 my-4">
        <Input
            placeholder="Competência (MM/AAAA)"
            value={competenceInput}
            onChange={handleCompetenceChange}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="w-full md:w-auto"
            maxLength={7}
        />
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por empresa ou CNPJ..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead className="text-center w-[220px]">
                Status do XML
              </TableHead>
              <TableHead className="text-center w-[150px]">
                DAS Enviado
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-64" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="h-9 w-40" />
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="h-5 w-5" />
                  </TableCell>
                </TableRow>
              ))
            ) : companyStatuses.length > 0 ? (
              companyStatuses.map((item) => (
                <TableRow key={item.companyId} className={item.isLocked ? 'bg-muted/50' : ''}>
                  <TableCell className="font-medium">
                    {item.companyName}
                  </TableCell>
                  <TableCell>{cnpjMask(item.companyCnpj)}</TableCell>
                  <TableCell className="text-center">
                    <Select
                      value={item.xmlStatus}
                      onValueChange={(newStatus: XmlStatusOption) =>
                        handleStatusChange(item.companyId, newStatus)
                      }
                      disabled={item.isLocked}
                    >
                      <SelectTrigger className={`w-full border-0 shadow-none focus:ring-0 ${statusColors[item.xmlStatus]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {xmlStatusOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            <span className={`${statusColors[option]} px-2 py-1 rounded-full`}>{option}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={item.isLocked}
                      onCheckedChange={(checked) =>
                        handleDasStatusChange(item.companyId, checked as boolean)
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Nenhuma empresa encontrada com os filtros aplicados.
                  <br/>
                  <span className="text-sm text-muted-foreground">Clique em "Configurar Empresas" para começar.</span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
