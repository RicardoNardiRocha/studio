// It's good practice to keep server-only code marked, even in type files.
'use server';

/**
 * Represents the essential data for a company to be processed by the Sintegra job.
 */
export interface CompanyForSintegra {
  id: string;
  name: string;
  cnpj: string;
  uf: string;
}

/**
 * Represents the state of a single Sintegra consultation job.
 */
export interface SintegraJob {
  company: CompanyForSintegra;
  status: 'QUEUED' | 'PENDING' | 'DONE' | 'ERROR' | 'TIMEOUT';
  requestId?: string;
  data?: any;
  rawData?: string;
  error?: string;
}

/**
 * The expected structure of the response from the GET /status endpoint.
 */
export type JobStatusResponse = {
  status: 'PENDING' | 'DONE' | 'ERROR';
  requestId: string;
  data: any | null;
  error: any | null;
};
