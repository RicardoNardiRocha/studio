
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, Timestamp, collectionGroup, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileWarning, CalendarClock, AlertTriangle, ArrowUpDown, Filter } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { parse, isBefore, startOfDay, endOfDay, addDays, formatDistanceToNow, differenceInDays, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface Alert {
  type: 'Certificado Vencendo' | 'Certificado Vencido' | 'Obrigação Atrasada' | 'Processo em Exigência' | 'Obrigação Vencendo';
  entityName: string;
  details: string;
  date: Date;
  link: string;
}

const alertTypes: Alert['type'][] = ['Certificado Vencendo', 'Certificado Vencido', 'Obrigação Atrasada', 'Processo em Exigência', 'Obrigação Vencendo'];

const getAlertInfo = (alertType: Alert['type']) => {
    switch (alertType) {
        case 'Certificado Vencendo':
            return { Icon: FileWarning, variant: 'warning' as const };
        case 'Certificado Vencido':
            return { Icon: FileWarning, variant: 'destructive' as const };
        case 'Obrigação Atrasada':
            return { Icon: CalendarClock, variant: 'destructive' as const };
        case 'Obrigação Vencendo':
            return { Icon: CalendarClock, variant: 'warning' as const };
        case 'Processo em Exigência':
            return { Icon: AlertTriangle, variant: 'destructive' as const };
        default:
            return { Icon: AlertTriangle, variant: 'destructive' as const };
    }
}

export function AlertsTable() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Alert, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [filterType, setFilterType] = useState('Todos');
  const firestore = useFirestore();

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!firestore) return;

      setIsLoading(true);
      const identifiedAlerts: Alert[] = [];
      const today = startOfDay(new Date());
      const next7days = endOfDay(addDays(today, 7));

      try {
        // --- Certificados de Empresas (A1) ---
        const companiesSnapshot = await getDocs(collection(firestore, 'companies'));
        companiesSnapshot.forEach(doc => {
          const company = doc.data();
          if (company.certificateA1Validity) {
             const validityDate = new Date(company.certificateA1Validity + 'T00:00:00-03:00');
              if (!isValid(validityDate)) return;

              const daysLeft = differenceInDays(validityDate, today);

              if (daysLeft < 0) {
                identifiedAlerts.push({ type: 'Certificado Vencido', entityName: company.name, details: `Certificado A1 venceu`, date: validityDate, link: '/empresas' });
              } else if (daysLeft <= 60) {
                identifiedAlerts.push({ type: 'Certificado Vencendo', entityName: company.name, details: `Certificado A1 vence em ${daysLeft + 1} dias`, date: validityDate, link: '/empresas' });
              }
          }
        });
        
        // --- Certificados de Sócios (e-CPF) ---
        const partnersSnapshot = await getDocs(collection(firestore, 'partners'));
        partnersSnapshot.forEach(doc => {
          const partner = doc.data();
          if (partner.ecpfValidity) {
            const validityDate = new Date(partner.ecpfValidity + 'T00:00:00-03:00');
            if (!isValid(validityDate)) return;

            const daysLeft = differenceInDays(validityDate, today);

            if (daysLeft < 0) {
              identifiedAlerts.push({ type: 'Certificado Vencido', entityName: partner.name, details: `e-CPF do sócio venceu`, date: validityDate, link: '/societario' });
            } else if (daysLeft <= 60) {
              identifiedAlerts.push({ type: 'Certificado Vencendo', entityName: partner.name, details: `e-CPF vence em ${daysLeft + 1} dias`, date: validityDate, link: '/societario' });
            }
          }
        });

        // --- Obrigações ---
        const obligationsQuery = query(collectionGroup(firestore, 'taxObligations'), where('status', 'in', ['Pendente', 'Atrasada']));
        const obligationsSnapshot = await getDocs(obligationsQuery);
        obligationsSnapshot.forEach(doc => {
            const ob = doc.data();
            const dueDate = (ob.dataVencimento as Timestamp).toDate();
            if (ob.status === 'Atrasada' || (ob.status === 'Pendente' && isBefore(dueDate, today))) {
                 identifiedAlerts.push({ type: 'Obrigação Atrasada', entityName: ob.companyName, details: ob.nome, date: dueDate, link: '/obrigacoes' });
            } else if (ob.status === 'Pendente' && isBefore(dueDate, next7days)) {
                 identifiedAlerts.push({ type: 'Obrigação Vencendo', entityName: ob.companyName, details: `${ob.nome} vence ${formatDistanceToNow(dueDate, { locale: ptBR, addSuffix: true })}`, date: dueDate, link: '/obrigacoes' });
            }
        });

        // --- Processos ---
        const processesQuery = query(collectionGroup(firestore, 'corporateProcesses'), where('status', '==', 'Em Exigência'));
        const processesSnapshot = await getDocs(processesQuery);
        processesSnapshot.forEach(doc => {
            const proc = doc.data();
            const startDate = (proc.startDate as Timestamp).toDate();
            identifiedAlerts.push({ type: 'Processo em Exigência', entityName: proc.companyName, details: proc.processType, date: startDate, link: '/processos' });
        });
        
        setAlerts(identifiedAlerts);

      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, [firestore]);
  
  const sortedAndFilteredAlerts = useMemo(() => {
    let sortableItems = [...alerts];
    if (filterType !== 'Todos') {
        sortableItems = sortableItems.filter(alert => alert.type === filterType);
    }
    sortableItems.sort((a, b) => {
        const key = sortConfig.key;
        if (a[key] < b[key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[key] > b[key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
    return sortableItems;
  }, [alerts, sortConfig, filterType]);

  const requestSort = (key: keyof Alert) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='font-headline'>Alertas e Notificações</CardTitle>
        <CardDescription>Itens que necessitam de atenção imediata.</CardDescription>
        <div className="flex items-center gap-2 pt-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
             <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-[220px]">
                    <SelectValue placeholder="Filtrar por tipo..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Todos">Todos os Tipos</SelectItem>
                    {alertTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort('type')} className="cursor-pointer">
                <div className="flex items-center gap-2">Tipo <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
              <TableHead onClick={() => requestSort('entityName')} className="cursor-pointer">
                 <div className="flex items-center gap-2">Entidade <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead><span className="sr-only">Ações</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : sortedAndFilteredAlerts.length > 0 ? (
              sortedAndFilteredAlerts.map((alert, index) => {
                const { Icon, variant } = getAlertInfo(alert.type);
                let badgeVariant: 'warning' | 'destructive' = variant;
                if (alert.type === 'Certificado Vencendo') {
                    const daysLeft = differenceInDays(alert.date, new Date());
                    if (daysLeft <= 30) badgeVariant = 'destructive';
                }

                return (
                    <TableRow key={index}>
                    <TableCell>
                        <Badge variant={badgeVariant} className="gap-1.5 whitespace-nowrap">
                            <Icon className="h-3 w-3" />
                            {alert.type}
                        </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{alert.entityName}</TableCell>
                    <TableCell>{alert.details}</TableCell>
                    <TableCell>
                        <Button size="icon" variant="ghost" asChild>
                        <Link href={alert.link}>
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        </Button>
                    </TableCell>
                    </TableRow>
                )
              })
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        Nenhum alerta no momento. Tudo em ordem!
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

