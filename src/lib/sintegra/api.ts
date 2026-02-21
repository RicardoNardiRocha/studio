'use server';

import { z } from 'zod';

// Zod schemas for validating API responses, ensuring type safety.
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

/**
 * Retrieves the necessary headers for making requests to the Sintegra API,
 * including the API key from environment variables.
 * @throws {Error} If the SINTEGRA_API_KEY is not configured.
 */
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

/**
 * Starts a new Sintegra consultation job by sending a POST request.
 * @param cnpj The company's CNPJ.
 * @param uf The company's state (UF).
 * @returns A promise that resolves to an object containing the requestId.
 * @throws {Error} If the API call fails or returns an unexpected response.
 */
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
      const errorBody = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
      throw new Error(errorBody.message || `API retornou status ${response.status}`);
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

/**
 * Fetches the current status of a Sintegra consultation job.
 * @param requestId The ID of the job to check.
 * @returns A promise that resolves to the job's status, data, and error information.
 * @throws {Error} If the API call fails or returns an unexpected response.
 */
export async function getSintegraStatus(
  requestId: string
): Promise<{ status: 'PENDING' | 'DONE' | 'ERROR'; data: any | null; error: any | null }> {
  try {
    const headers = await getSintegraHeaders();
    const response = await fetch(`${SINTEGRA_API_URL}/requests/${requestId}`, {
      method: 'GET',
      headers,
      cache: 'no-store', // Ensure we always get the latest status
    });
    
    if (!response.ok) {
       throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();
    const parsed = GetStatusResponseSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Resposta de status inesperada da API.');
    }

    return {
      status: parsed.data.status,
      data: parsed.data.data,
      error: parsed.data.error,
    };
  } catch (error) {
     console.error(`Falha ao obter status para o request ID ${requestId}:`, error);
     if (error instanceof Error) {
        throw new Error(`Falha ao consultar status: ${error.message}`);
    }
    throw new Error('Ocorreu um erro desconhecido ao consultar o status.');
  }
}
