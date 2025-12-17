'use client';

import { useParams } from 'next/navigation';
import { useDocument, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { CompanyEditForm } from '@/app/(dashboard)/companies/components/company-edit-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Define a estrutura de dados da empresa
type Company = {
  id: string;
  name: string;
  cnpj?: string;
  receivesXml?: boolean;
};

export default function EditCompanyPage() {
  const { id } = useParams();
  const companyId = Array.isArray(id) ? id[0] : id;
  const firestore = useFirestore();

  // Busca o documento da empresa no Firestore
  const companyRef = firestore ? doc(firestore, 'companies', companyId) : null;
  const { data: company, isLoading } = useDocument<Company>(companyRef);

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Editar Empresa</CardTitle>
          <CardDescription>Atualize os dados da empresa e as configurações fiscais.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            // Mostra um skeleton enquanto os dados carregam
            <div className="space-y-8">
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          ) : company ? (
            // Renderiza o formulário com os dados da empresa
            <CompanyEditForm companyId={companyId} initialData={company} />
          ) : (
            // Mensagem caso a empresa não seja encontrada
            <p>Empresa não encontrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
