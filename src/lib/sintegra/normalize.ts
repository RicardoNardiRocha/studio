import { SintegraApiPayload, SintegraFinal } from './types';

const cleanString = (text: any): string | null => {
  if (typeof text !== 'string') return null;
  return text.replace(/\s\s+/g, ' ').replace(/\t/g, ' ').trim();
};

const sanitizeActivities = (activities: any): string[] => {
  if (!Array.isArray(activities)) return [];

  const activityKeywords = ["IE:", "CNPJ:", "Logradouro:", "Município:", "Nº:", "CEP:", "Bairro:"];
  const uniqueActivities = new Set<string>();

  activities.forEach(activity => {
    const cleaned = cleanString(activity);
    if (cleaned && !activityKeywords.some(keyword => cleaned.startsWith(keyword))) {
      uniqueActivities.add(cleaned);
    }
  });

  return Array.from(uniqueActivities);
};

const normalizeAddress = (data: any) => {
    const municipioRaw = cleanString(data.municipio) || '';
    const municipioCleaned = municipioRaw.replace(/UF:\s*[A-Z]{2}/, '').trim();

    return {
        logradouro: cleanString(data.logradouro),
        numero: cleanString(data.numero),
        complemento: cleanString(data.complemento),
        cep: cleanString(data.cep),
        bairro: cleanString(data.bairro),
        municipio: municipioCleaned,
        uf: cleanString(data.uf)
    };
};


export const normalizeAndSanitizeSintegraPayload = (payload: SintegraApiPayload): SintegraFinal | null => {
  const source = payload.sintegra || payload.parsed;

  if (!source || typeof source !== 'object') {
    return null;
  }

  // Fallback for text-based payload if structured data is missing
  if (!source.ie && payload.raw?.normalizedText) {
      // Basic text parsing as a last resort
      const text = payload.raw.normalizedText;
      const ieMatch = text.match(/IE:\s*([^\n\t]+)/);
      const cnpjMatch = text.match(/CNPJ:\s*([^\n\t]+)/);
      const situacaoMatch = text.match(/Situação Cadastral:\s*([^\t\n]+)/);
      // ... add more regex matches as needed ...

      source.ie = ieMatch ? ieMatch[1].trim() : null;
      source.cnpj = cnpjMatch ? cnpjMatch[1].trim() : null;
      source.situacaoCadastral = situacaoMatch ? situacaoMatch[1].trim() : null;
  }


  const situacao = cleanString(source.situacaoCadastral);
  const ocorrencia = cleanString(source.ocorrenciaFiscal);

  const reasons: string[] = [];
  if (situacao?.toLowerCase() !== 'ativo' && situacao?.toLowerCase() !== 'regular') {
    reasons.push(`Situação cadastral: ${situacao}`);
  }
  if (ocorrencia?.toLowerCase() !== 'ativa' && ocorrencia?.toLowerCase() !== 'regular' && ocorrencia?.toLowerCase() !== 'nenhuma') {
     reasons.push(`Ocorrência fiscal: ${ocorrencia}`);
  }

  const needsAttention = reasons.length > 0;
  const isOk = !needsAttention;
  const summary = needsAttention ? reasons.join(' | ') : 'Situação regular';

  const normalized: SintegraFinal = {
    ie: cleanString(source.ie),
    cnpj: cleanString(source.cnpj),
    uf: cleanString(source.uf),
    situacaoCadastral: situacao,
    dataSituacaoCadastral: cleanString(source.dataSituacaoCadastral),
    ocorrenciaFiscal: ocorrencia,
    postoFiscal: cleanString(source.postoFiscal),
    regimeApuracao: cleanString(source.regimeApuracao),
    endereco: normalizeAddress(source.endereco || source),
    atividadesEconomicas: sanitizeActivities(source.atividadesEconomicas),
    isOk,
    needsAttention,
    reasons,
    summary,
  };

  return normalized;
};
