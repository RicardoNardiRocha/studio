import { NextResponse } from 'next/server';
import { getCompaniesData } from '@/lib/integration-utils';

export const dynamic = 'force-dynamic';

interface Params {
  id: string;
}

/**
 * Endpoint para obter os dados de uma empresa específica.
 */
export async function GET(request: Request, context: { params: Params }) {
  const companyId = context.params.id;
  console.log(`GET /api/integration/companies/${companyId}: Request received.`);


  if (!companyId) {
    return NextResponse.json({ message: 'ID da empresa é obrigatório.' }, { status: 400 });
  }

  try {
    console.log(`GET /api/integration/companies/${companyId}: Fetching data for company ID: ${companyId}`);
    const companyData = await getCompaniesData(companyId);
    
    if (!companyData || (Array.isArray(companyData) && companyData.length === 0)) {
      return NextResponse.json({ message: 'Empresa não encontrada.' }, { status: 404 });
    }

    // Se getCompaniesData retornar um array, pegamos o primeiro elemento
    const result = Array.isArray(companyData) ? companyData[0] : companyData;
    console.log(`GET /api/integration/companies/${companyId}: Data found for ${result.razaoSocial}.`);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`Error in GET /api/integration/companies/${companyId}:`, error.message);
    return NextResponse.json(
      { message: 'Erro ao buscar dados da empresa.', error: error.message },
      { status: 500 }
    );
  }
}
