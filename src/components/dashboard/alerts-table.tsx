
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, getDocs, Timestamp, collectionGroup } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileWarning, CalendarClock, AlertTriangle } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { parseISO, isBefore, startOfDay, endOfDay, addDays, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

interface Alert {
  type: 'Certificado Vencido' | 'Obrigação Atrasada' | 'Processo em Exigência' | 'Obrigação Vencendo';
  entityName: string;
  details: string;
  date: Date;
  link: string;
}

const getAlertInfo = (alertType: Alert['type']) => {
    switch (alertType) {
        case 'Certificado Vencido':
            return { Icon: FileWarning, variant: 'destructive' as const };
        case 'Obrigação Atrasada':
            return { Icon: CalendarClock, variant: 'destructive' as const };
        case 'Obrigação Vencendo':
            return { Icon: CalendarClock, variant: 'secondary' as const };
        case 'Processo em Exigência':
            return { Icon: AlertTriangle, variant: 'destructive' as const };
        default:
            return { Icon: AlertTriangle, variant: 'destructive' as const };
    }
}

export function AlertsTable() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!firestore) return;

      setIsLoading(true);
      const identifiedAlerts: Alert[] = [];
      const today = startOfDay(new Date());
      const next7days = endOfDay(addDays(today, 7));

      try {
        const companiesSnapshot = await getDocs(collection(firestore, 'companies'));

        // Check for expired certificates from companies and partners
        for (const doc of companiesSnapshot.docs) {
          const company = doc.data();
          if (company.certificateA1Validity) {
            try {
              const validityDate = parseISO(company.certificateA1Validity);
              if (isBefore(validityDate, today)) {
                identifiedAlerts.push({
                  type: 'Certificado Vencido',
                  entityName: company.name,
                  details: `Certificado A1 da empresa venceu`,
                  date: validityDate,
                  link: '/empresas'
                });
              }
            } catch (e) {
                console.warn(`Invalid certificate date for company ${company.id}`);
            }
          }
        }
        
        const partnersSnapshot = await getDocs(collection(firestore, 'partners'));
         for (const doc of partnersSnapshot.docs) {
          const partner = doc.data();
          if (partner.ecpfValidity) {
            try {
              const validityDate = parseISO(partner.ecpfValidity);
              if (isBefore(validityDate, today)) {
                identifiedAlerts.push({
                  type: 'Certificado Vencido',
                  entityName: partner.name,
                  details: `e-CPF do sócio venceu`,
                  date: validityDate,
                  link: '/societario'
                });
              }
            } catch (e) {
                console.warn(`Invalid certificate date for partner ${partner.id}`);
            }
          }
        }


        // Check for overdue and upcoming obligations
        const obligationsQuery = query(
          collectionGroup(firestore, `taxObligations`),
          where('status', 'in', ['Pendente', 'Atrasada'])
        );
        const obligationsSnapshot = await getDocs(obligationsQuery);
        obligationsSnapshot.forEach(doc => {
            const ob = doc.data();
            const dueDate = (ob.dataVencimento as Timestamp).toDate();
            if(ob.status === 'Atrasada' || isBefore(dueDate, today)) {
                 identifiedAlerts.push({
                  type: 'Obrigação Atrasada',
                  entityName: ob.companyName,
                  details: ob.nome,
                  date: dueDate,
                  link: '/obrigacoes'
                });
            } else if (isBefore(dueDate, next7days)) {
                 identifiedAlerts.push({
                  type: 'Obrigação Vencendo',
                  entityName: ob.companyName,
                  details: `${ob.nome} vence ${formatDistanceToNow(dueDate, { locale: ptBR, addSuffix: true })}`,
                  date: dueDate,
                  link: '/obrigacoes'
                });
            }
        });

        // Check for processes 'Em Exigência'
        const processesQuery = query(
          collectionGroup(firestore, `corporateProcesses`),
          where('status', '==', 'Em Exigência')
        );
        const processesSnapshot = await getDocs(processesQuery);
        processesSnapshot.forEach(doc => {
            const proc = doc.data();
            const startDate = (proc.startDate as Timestamp).toDate();
            identifiedAlerts.push({
                type: 'Processo em Exigência',
                entityName: proc.companyName,
                details: proc.processType,
                date: startDate,
                link: '/processos'
            });
        });
        
        // Sort alerts by date, most recent first
        identifiedAlerts.sort((a, b) => b.date.getTime() - a.date.getTime());
        setAlerts(identifiedAlerts);

      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, [firestore]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='font-headline'>Alertas e Notificações</CardTitle>
        <CardDescription>Itens que necessitam de atenção imediata.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo de Alerta</TableHead>
              <TableHead>Entidade</TableHead>
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
            ) : alerts.length > 0 ? (
              alerts.map((alert, index) => {
                const { Icon, variant } = getAlertInfo(alert.type);
                return (
                    <TableRow key={index}>
                    <TableCell>
                        <Badge variant={variant} className="gap-1.5 whitespace-nowrap">
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
