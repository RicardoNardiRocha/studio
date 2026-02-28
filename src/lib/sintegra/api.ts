'use server';

import { z } from 'zod';
import type { SintegraApiPayload } from './types';


const CreateJobResponseSchema = z.object({
  status: z.string(),
  requestId: z.string(),
});

const GetStatusResponseSchema = z.object({
  status: z.enum(['PENDING', 'DONE', 'ERROR']),
  requestId: z.string(),
  data: z.any().nullable(),
  error: z.any().nullable(),
});

const SINTEGRA_API_URL = 'https://controle-bots.vercel.app/api/sintegra';


async function getSintegraHeaders() {
  const apiKey = process.env.SINTEGRA_API_KEY;
  if (!apiKey) {
    throw new Error('A chave de API do Sintegra (SINTEGRA_API_KEY) não está configurada no ambiente do servidor.');
  }
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
  };
}

export async function startSintegraJob(
  cnpj: string,
  uf: string
): Promise<{ requestId: string }> {
  try {
    const headers = await getSintegraHeaders();
    const response = await fetch(`${SINTEGRA_API_URL}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ cnpj, uf }),
    });

    if (!response.ok) {
      const errorBodyText = await response.text();
      console.error(`[SINTEGRA API ERROR] Falha na criação do job. Endpoint: ${SINTEGRA_API_URL}/query, Status: ${response.status}, Payload: ${JSON.stringify({ cnpj, uf })}`);
      console.error('[SINTEGRA API ERROR] Response Body:', errorBodyText);
      throw new Error(`API de consulta retornou status ${response.status}: ${errorBodyText || 'Sem corpo de resposta'}`);
    }

    const data = await response.json();
    const parsed = CreateJobResponseSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Resposta inesperada da API ao criar a consulta.');
    }

    return { requestId: parsed.data.requestId };
  } catch (error) {
    console.error('Falha ao iniciar a consulta Sintegra:', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('Ocorreu um erro desconhecido ao iniciar a consulta.');
  }
}

export async function getSintegraStatus(
  requestId: string
): Promise<{ status: 'PENDING' | 'DONE' | 'ERROR'; payload: SintegraApiPayload | null; error: string | null }> {
  try {
    const headers = await getSintegraHeaders();
    const response = await fetch(`${SINTEGRA_API_URL}/requests/${requestId}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    
    if (!response.ok) {
       throw new Error(`API retornou status ${response.status}`);
    }

    const rawApiData = await response.json();
    const parsed = GetStatusResponseSchema.safeParse(rawApiData);
    
    if (!parsed.success) {
      console.error("Failed to parse Sintegra status response:", parsed.error);
      throw new Error('Resposta de status inesperada da API.');
    }
    
    return {
      status: parsed.data.status,
      payload: parsed.data.data,
      error: parsed.data.error ? JSON.stringify(parsed.data.error) : null,
    };

  } catch (error) {
     console.error(`Falha ao obter status para o request ID ${requestId}:`, error);
     if (error instanceof Error) {
        throw new Error(`Falha ao consultar status: ${error.message}`);
    }
    throw new Error('Ocorreu um erro desconhecido ao consultar o status.');
  }
}
