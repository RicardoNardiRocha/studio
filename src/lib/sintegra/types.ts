'use server';

/**
 * The canonical, sanitized Sintegra data structure used throughout the client application.
 */
export type SintegraFinal = {
  ie: string | null,
  cnpj: string | null,
  uf: string | null,
  situacaoCadastral: string | null,
  dataSituacaoCadastral: string | null,
  ocorrenciaFiscal: string | null,
  postoFiscal: string | null,
  regimeApuracao: string | null,
  endereco: {
    logradouro: string | null,
    numero: string | null,
    complemento: string | null,
    cep: string | null,
    bairro: string | null,
    municipio: string | null,
    uf: string | null
  },
  atividadesEconomicas: string[],
  isOk: boolean,
  needsAttention: boolean,
  reasons: string[],
  summary: string
};


/**
 * Represents the raw payload structure that might be received from the Sintegra API.
 * It can contain various formats that need to be normalized.
 */
export interface SintegraApiPayload {
  raw?: any;
  parsed?: Record<string, any>;
  sintegra?: Record<string, any>;
  [key: string]: any;
}


/**
 * Represents the complete result of a Sintegra consultation, including status and data.
 * This is the structure that should be stored (in memory or Firestore).
 */
export interface SintegraResult {
  updatedAt: Date;
  requestId: string;
  status: 'DONE' | 'ERROR' | 'PENDING' | 'TIMEOUT';
  data: SintegraFinal | null;
  error?: string | null;
  raw?: any;
}


// Client-side types
export interface CompanyForSintegra {
  id: string;
  name: string;
  cnpj: string;
  uf: string;
  sintegra?: SintegraResult;
  sintegraSituacao?: SintegraStatus;
}

export type JobStatus = 'QUEUED' | 'PENDING' | 'DONE' | 'DONE_NO_DATA' | 'ERROR' | 'TIMEOUT';


export interface SintegraJob {
  company: CompanyForSintegra;
  status: JobStatus;
  requestId?: string;
  result?: SintegraResult | null;
  error?: string;
}
