'use server';

import { NextResponse } from 'next/server';
import { getSintegraStatus } from '@/lib/sintegra/api';

export async function POST(request: Request) {
  try {
    const { requestIds } = await request.json();

    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      return NextResponse.json({ message: 'requestIds must be a non-empty array.' }, { status: 400 });
    }

    // Limit the number of requestIds that can be processed at once for safety
    if (requestIds.length > 200) {
        return NextResponse.json({ message: 'Cannot process more than 200 requestIds per batch.' }, { status: 400 });
    }

    const statusPromises = requestIds.map(async (id) => {
        try {
            // Using the existing getSintegraStatus which calls the external API
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

    const results = await Promise.all(statusPromises);
    
    return NextResponse.json(results);

  } catch (error: any) {
    console.error('[API /status-batch] Internal Server Error:', error);
    return NextResponse.json({ message: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
