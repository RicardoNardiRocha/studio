import { NextResponse } from 'next/server';
import { getCompaniesData } from '@/lib/integration-utils';

export const dynamic = 'force-dynamic'; // Garante que a função seja executada dinamicamente

/**
 * Endpoint para obter a lista de todas as empresas.
 */
export async function GET() {
  try {
    const companies = await getCompaniesData();
    return NextResponse.json(companies);
  } catch (error: any) {
    console.error('Erro na API /api/integration/companies:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar dados das empresas.', error: error.message },
      { status: 500 }
    );
  }
}
