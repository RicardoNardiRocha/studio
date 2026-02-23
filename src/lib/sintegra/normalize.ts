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

const parseSintegraText = (text: string): Record<string, any> => {
    const lines = text.split('\n');
    const data: Record<string, any> = { atividadesEconomicas: [] };
    let currentSection = '';

    const patterns = {
        ie: /IE:\s*(.*)/i,
        cnpj: /CNPJ:\s*(.*)/i,
        nomeEmpresarial: /Nome Empresarial:\s*(.*)/i,
        nomeFantasia: /Nome Fantasia:\s*(.*)/i,
        naturezaJuridica: /Natureza Jurídica:\s*(.*)/i,
        logradouro: /Logradouro:\s*(.*)/i,
        numero: /Nº:\s*(.*)/i,
        complemento: /Complemento:\s*(.*)/i,
        cep: /CEP:\s*(.*)/i,
        bairro: /Bairro:\s*(.*)/i,
        municipio: /Município:\s*(.*)/i,
        uf: /UF:\s*([A-Z]{2})/i,
        situacaoCadastral: /Situação Cadastral:\s*(.*?)\s*Data/i,
        dataSituacaoCadastral: /Data da Situação Cadastral:\s*(.*)/i,
        ocorrenciaFiscal: /Ocorrência Fiscal:\s*(.*?)\s*Posto/i,
        postoFiscal: /Posto Fiscal:\s*(.*)/i,
        regimeApuracao: /Regime de Apuração:\s*(.*)/i,
    };

    let isActivitySection = false;

    for (const line of lines) {
        if (line.includes('=== ESTABELECIMENTO ===')) {
            currentSection = 'establishment';
            continue;
        }
        if (line.includes('=== ENDEREÇO ===')) {
            currentSection = 'address';
            continue;
        }
        if (line.includes('=== INFORMAÇÕES COMPLEMENTARES ===')) {
            currentSection = 'complementary';
            isActivitySection = false; // reset
            continue;
        }
        if (line.includes('Atividades Econômicas:')) {
            isActivitySection = true;
            const parts = line.split('Atividades Econômicas:');
            if (parts[1] && parts[1].trim()) {
                data.atividadesEconomicas.push(parts[1].trim());
            }
            continue;
        }

        if (isActivitySection) {
            if (line.trim()) data.atividadesEconomicas.push(line.trim());
            continue;
        }

        for (const [key, regex] of Object.entries(patterns)) {
            const match = line.match(regex);
            if (match && match[1]) {
                data[key] = match[1].trim();
                break; // move to next line once a match is found
            }
        }
    }
    return data;
};


export const normalizeAndSanitizeSintegraPayload = (payload: SintegraApiPayload): SintegraFinal | null => {
  let source = payload.sintegra || payload.parsed;

  if (!source && payload.raw?.normalizedText) {
      source = parseSintegraText(payload.raw.normalizedText);
  }

  if (!source || typeof source !== 'object') {
    return null;
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
