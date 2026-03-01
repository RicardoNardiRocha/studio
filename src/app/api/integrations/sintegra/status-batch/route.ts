'use server';

import { NextResponse } from 'next/server';
import { getSintegraStatus } from '@/lib/sintegra/api';

const CONCURRENCY_LIMIT = 15; // Limite de requisições simultâneas para a API externa

export async function POST(request: Request) {
  try {
    const { requestIds } = await request.json();

    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      return NextResponse.json({ message: 'requestIds must be a non-empty array.' }, { status: 400 });
    }

    // Aumentado o limite, já que o processamento agora é em chunks
    if (requestIds.length > 1000) {
        return NextResponse.json({ message: 'Cannot process more than 1000 requestIds per batch.' }, { status: 400 });
    }

    const results = [];
    const queue = [...requestIds];

    while (queue.length > 0) {
      const chunkToProcess = queue.splice(0, CONCURRENCY_LIMIT);
      
      const chunkPromises = chunkToProcess.map(async (id) => {
        try {
            const { status, payload, error } = await getSintegraStatus(id);
            return {
                requestId: id,
                status,
                data: payload,
                error,
            };
        } catch (e: any) {
            console.error(`[API /status-batch] Error fetching status for ${id}:`, e.message);
            return {
                requestId: id,
                status: 'ERROR',
                data: null,
                error: e.message || 'Failed to fetch status for this ID.',
            };
        }
      });
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }
    
    return NextResponse.json(results);

  } catch (error: any) {
    console.error('[API /status-batch] Internal Server Error:', error);
    return NextResponse.json({ message: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
