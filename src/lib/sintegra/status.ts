import type { SintegraResult } from './types';

/**
 * Calculates the company's fitness status based on Sintegra data.
 * @param sintegra - The Sintegra consultation result object.
 * @returns 'Apto' if situation is 'Ativo' and fiscal occurrence is 'Ativa', otherwise 'Inapto'.
 */
export function getSintegraAptStatus(sintegra: SintegraResult | undefined): 'Apto' | 'Inapto' {
  // If there's no sintegra data at all, it's conservatively considered 'Inapto'.
  if (!sintegra?.data) {
    return 'Inapto';
  }

  const cadastral = (sintegra.data.situacaoCadastral || "").trim().toLowerCase();
  const fiscal = (sintegra.data.ocorrenciaFiscal || "").trim().toLowerCase();

  const isCadastralOk = cadastral === "ativo";
  const isFiscalOk = fiscal === "ativa";

  // Only if both conditions are met is the company considered 'Apto'.
  return (isCadastralOk && isFiscalOk) ? "Apto" : "Inapto";
}
