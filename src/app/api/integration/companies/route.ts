import { NextResponse } from 'next/server';
import { getCompaniesData } from '@/lib/integration-utils';

export const dynamic = 'force-dynamic';

/**
 * Endpoint para obter a lista de todas as empresas.
 */
export async function GET() {
  console.log('GET /api/integration/companies: Request received.');
  try {
    const companies = await getCompaniesData();
    console.log(`GET /api/integration/companies: Found ${companies.length} companies. Returning data.`);
    return NextResponse.json(companies);
  } catch (error: any) {
    console.error(`[API ERROR] Error in GET /api/integration/companies: ${error.message}`);
    return NextResponse.json(
      { message: 'Erro ao buscar dados das empresas.', error: error.message },
      { status: 500 }
    );
  }
}
