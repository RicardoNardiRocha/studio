
import type { SintegraFinal } from './types';

export type SintegraStatus = 'APTO' | 'INAPTO' | 'SEM IE' | 'BAIXADA' | 'SUSPENSA';

/**
 * Calculates the company's registration status based on Sintegra data.
 * @param sintegraData - The normalized Sintegra data object for a company.
 * @returns The calculated status: 'BAIXADA', 'SEM IE', 'APTO', or 'INAPTO'.
 */
export function calculateSintegraSituacao(sintegraData: SintegraFinal | null | undefined): SintegraStatus {
  if (!sintegraData) {
    return 'INAPTO'; // Default if no data
  }

  const { ie, situacaoCadastral, ocorrenciaFiscal } = sintegraData;

  // Rule 1: BAIXADA
  if (situacaoCadastral && situacaoCadastral.toUpperCase().includes('BAIXADO')) {
    return 'BAIXADA';
  }

  // Rule 2: SUSPENSA
  if (situacaoCadastral && situacaoCadastral.toUpperCase().includes('SUSPENSO')) {
    return 'SUSPENSA';
  }

  // Rule 3: SEM IE
  const ieIsMissing = !ie || ie === 'N/A';
  const isNotApplicable = situacaoCadastral === 'N/A' && ocorrenciaFiscal === 'N/A';
  if (ieIsMissing || isNotApplicable) {
    return 'SEM IE';
  }

  // Rule 4: APTO
  const isCadastralOk = situacaoCadastral?.toLowerCase() === 'ativo';
  const isFiscalOk = ocorrenciaFiscal?.toLowerCase() === 'ativa';
  if (isCadastralOk && isFiscalOk) {
    return 'APTO';
  }

  // Rule 5: INAPTO (fallback for all other cases)
  return 'INAPTO';
}
