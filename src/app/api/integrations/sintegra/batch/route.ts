'use server';

import { NextResponse } from 'next/server';
import { startSintegraJob } from '@/lib/sintegra/api';
import { z } from 'zod';

const CompanySchema = z.object({
  id: z.string(),
  cnpj: z.string(),
  uf: z.string(),
});

const BatchRequestSchema = z.object({
  companies: z.array(CompanySchema),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = BatchRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid request body.', error: validation.error.format() }, { status: 400 });
    }

    const { companies } = validation.data;

    if (companies.length > 500) {
        return NextResponse.json({ message: 'Cannot process more than 500 companies per batch.' }, { status: 400 });
    }

    const jobPromises = companies.map(async (company) => {
      try {
        const { requestId } = await startSintegraJob(company.cnpj, company.uf);
        return {
          companyId: company.id,
          requestId,
          status: 'QUEUED',
          error: null,
        };
      } catch (e: any) {
        console.error(`[API /sintegra/batch] Failed to start job for ${company.cnpj}:`, e.message);
        return {
          companyId: company.id,
          requestId: null,
          status: 'ERROR',
          error: e.message || 'Failed to start job on external API.',
        };
      }
    });

    const results = await Promise.all(jobPromises);
    
    return NextResponse.json({ items: results });

  } catch (error: any) {
    console.error('[API /sintegra/batch] Internal Server Error:', error);
    return NextResponse.json({ message: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}

    