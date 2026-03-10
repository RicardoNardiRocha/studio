import { NextResponse } from 'next/server';
import { getCompaniesData } from '@/lib/integration-utils';

export const dynamic = 'force-dynamic'; // Garante que a função seja executada dinamicamente

/**
 * Endpoint para obter a lista de todas as empresas.
 */
export async function GET() {
  console.log('GET /api/integration/companies: Request received.');
  try {
    console.log('GET /api/integration/companies: Fetching all companies data.');
    const companies = await getCompaniesData();
    console.log(`GET /api/integration/companies: Found ${companies.length} companies.`);
    return NextResponse.json(companies);
  } catch (error: any) {
    console.error('Error in GET /api/integration/companies:', error.message);
    return NextResponse.json(
      { message: 'Erro ao buscar dados das empresas.', error: error.message },
      { status: 500 }
    );
  }
}
