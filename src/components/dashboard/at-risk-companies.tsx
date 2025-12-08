'use client';
import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { parseISO, isBefore, startOfDay } from 'date-fns';
import Link from 'next/link';

interface Company {
  id: string;
  name: string;
  cnpj: string;
  status: string;
  certificateA1Validity?: string;
}

interface Risk {
  company: Company;
  risk: string;
}

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!status) return 'secondary';
  switch (status.toLowerCase()) {
    case 'ativa': return 'default';
    case 'inapta': return 'destructive';
    case 'baixada': return 'outline';
    default: return 'secondary';
  }
};


export function AtRiskCompaniesTable() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchAtRiskCompanies = async () => {
      if (!firestore) return;

      setIsLoading(true);
      const identifiedRisks: Risk[] = [];
      const companiesAtRisk = new Map<string, Risk>();
      const today = startOfDay(new Date());

      try {
        const companiesSnapshot = await getDocs(collection(firestore, 'companies'));
        const companiesList: Company[] = companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));

        for (const company of companiesList) {
          // Check for overdue obligations
          const obligationsQuery = query(
            collection(firestore, `companies/${company.id}/taxObligations`),
            where('status', '==', 'Atrasada')
          );
          const obligationsSnapshot = await getDocs(obligationsQuery);
          if (!obligationsSnapshot.empty) {
            companiesAtRisk.set(company.id, { company, risk: 'Obrigação Atrasada' });
          }

          // Check for processes 'Em Exigência'
          const processesQuery = query(
            collection(firestore, `companies/${company.id}/corporateProcesses`),
            where('status', '==', 'Em Exigência')
          );
          const processesSnapshot = await getDocs(processesQuery);
          if (!processesSnapshot.empty) {
            companiesAtRisk.set(company.id, { company, risk: 'Processo em Exigência' });
          }

          // Check for expired A1 certificates
          if (company.certificateA1Validity) {
            try {
              const validityDate = parseISO(company.certificateA1Validity);
              if (isBefore(validityDate, today)) {
                companiesAtRisk.set(company.id, { company, risk: 'Certificado Vencido' });
              }
            } catch (e) {
                console.warn(`Invalid certificate date for company ${company.id}`);
            }
          }
        }
        
        setRisks(Array.from(companiesAtRisk.values()));
      } catch (error) {
        console.error('Error fetching at-risk companies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAtRiskCompanies();
  }, [firestore]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='font-headline'>Empresas em Risco</CardTitle>
        <CardDescription>Empresas que necessitam de atenção imediata.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead className="hidden sm:table-cell">CNPJ</TableHead>
              <TableHead>Risco Identificado</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead><span className="sr-only">Ações</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : risks.length > 0 ? (
              risks.map(({ company, risk }) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{company.cnpj}</TableCell>
                  <TableCell>
                    <Badge variant="destructive" className="whitespace-nowrap">{risk}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(company.status)}>
                      {company.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" asChild>
                      <Link href={`/empresas`}>
                        <MoreVertical className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        Nenhuma empresa em situação de risco encontrada.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
