
import { FileText, CalendarClock, AlertTriangle, Building, Workflow, Users, FileWarning } from 'lucide-react';

export const kpiData = [
  {
    title: 'Obrigações Pendentes',
    value: '12',
    icon: CalendarClock,
    change: '+2',
    changeType: 'increase',
    description: 'em relação ao mês passado',
  },
  {
    title: 'Certificados Vencendo',
    value: '3',
    icon: FileWarning,
    change: '-1',
    changeType: 'decrease',
    description: 'nos próximos 30 dias',
  },
  {
    title: 'Faturamento Mensal',
    value: 'R$ 45.231',
    icon: 'dollar-sign',
    change: '+5.2%',
    changeType: 'increase',
    description: 'em relação ao mês passado',
  },
  {
    title: 'Processos em Exigência',
    value: '2',
    icon: AlertTriangle,
    change: '0',
    changeType: 'neutral',
    description: 'aguardando ação',
  },
];

export const overviewChartData = [
  { name: 'Jan', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Fev', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Mar', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Abr', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Mai', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Jun', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Jul', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Ago', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Set', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Out', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Nov', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Dez', total: Math.floor(Math.random() * 5000) + 1000 },
];

export const recentActivities = [
  {
    company: 'Alpha Inovação Ltda.',
    activity: 'DEFIS 2023 entregue.',
    person: 'Ana Costa',
    avatar: 'https://i.pravatar.cc/40?img=1',
  },
  {
    company: 'Beta Soluções S.A.',
    activity: 'Alteração contratual concluída.',
    person: 'Carlos Dias',
    avatar: 'https://i.pravatar.cc/40?img=2',
  },
  {
    company: 'Gama Tech ME',
    activity: 'Certificado digital A1 emitido.',
    person: 'Beatriz Lima',
    avatar: 'https://i.pravatar.cc/40?img=3',
  },
  {
    company: 'Delta Comércio Eireli',
    activity: 'SPED Fiscal (Janeiro) conferido.',
    person: 'Daniel Alves',
    avatar: 'https://i.pravatar.cc/40?img=4',
  },
];

export const atRiskCompanies = [
  {
    company: 'Zeta Construções',
    cnpj: '11.222.333/0001-44',
    risk: 'Certificado vence em 5 dias',
    status: 'Inapto',
  },
  {
    company: 'Omega Transportes',
    cnpj: '44.555.666/0001-77',
    risk: 'Sem notas emitidas há 60 dias',
    status: 'Apto',
  },
  {
    company: 'Kappa Alimentos',
    cnpj: '77.888.999/0001-00',
    risk: 'Débito de DAS (Março)',
    status: 'Apto',
  },
];

export const obligations = [
  { id: '1', name: 'DAS', sector: 'Fiscal', due: '20/07/2024', status: 'gerar', assignee: 'Ana' },
  { id: '2', name: 'DEFIS', sector: 'Fiscal', due: '31/07/2024', status: 'conferir', assignee: 'Bruno' },
  { id: '3', name: 'SPED Contribuições', sector: 'Fiscal', due: '15/08/2024', status: 'protocolar', assignee: 'Carlos' },
  { id: '4', name: 'DCTFWeb', sector: 'DP', due: '15/07/2024', status: 'enviar', assignee: 'Daniela' },
  { id: '5', name: 'eSocial', sector: 'DP', due: '07/07/2024', status: 'arquivar', assignee: 'Eduardo' },
  { id: '6', name: 'Balanço Patrimonial', sector: 'Contábil', due: '30/04/2025', status: 'entregar', assignee: 'Fernanda' },
  { id: '7', name: 'GIA', sector: 'Fiscal', due: '10/08/2024', status: 'gerar', assignee: 'Ana' },
];

export const obligationStatusOptions = [
  { value: 'gerar', label: 'Gerar' },
  { value: 'conferir', label: 'Conferir' },
  { value: 'protocolar', label: 'Protocolar' },
  { value: 'enviar', label: 'Enviar' },
  { value: 'arquivar', label: 'Arquivar' },
  { value: 'entregar', label: 'Entregar ao Cliente' },
];

export const corporateProcesses = [
    {
        type: 'Abertura de Empresa',
        company: 'Nova Geração Tech',
        status: 'Em análise',
        stage: 'Junta Comercial',
        assignee: 'Carlos Dias',
        date: '20/06/2024',
        icon: Building
    },
    {
        type: 'Alteração Contratual',
        company: 'Soluções Integradas',
        status: 'Em exigência',
        stage: 'Receita Federal',
        assignee: 'Beatriz Lima',
        date: '15/06/2024',
        icon: Workflow
    },
    {
        type: 'Encerramento de Empresa',
        company: 'Antiga Distribuidora',
        status: 'Concluído',
        stage: 'Prefeitura',
        assignee: 'Ana Costa',
        date: '01/06/2024',
        icon: Building
    },
     {
        type: 'Inclusão de Sócio',
        company: 'Consultoria Premium',
        status: 'Em análise',
        stage: 'Junta Comercial',
        assignee: 'Carlos Dias',
        date: '25/06/2024',
        icon: Users
    },
];

export let initialCompanies = [
  {
    id: "1",
    name: "Alpha Inovação Ltda.",
    cnpj: "12.345.678/0001-90",
    taxRegime: "Simples Nacional",
    status: "Ativa",
    startDate: "15/01/2018",
  },
  {
    id: "2",
    name: "Beta Soluções S.A.",
    cnpj: "98.765.432/0001-21",
    taxRegime: "Lucro Presumido",
    status: "Ativa",
    startDate: "22/05/2020",
  },
  {
    id: "3",
    name: "Gama Tech ME",
    cnpj: "55.444.333/0001-11",
    taxRegime: "Simples Nacional",
    status: "Inapta",
    startDate: "10/11/2022",
  },
  {
    id: "4",
    name: "Delta Comércio Eireli",
    cnpj: "10.203.040/0001-50",
    taxRegime: "Lucro Real",
    status: "Baixada",
    startDate: "01/03/2015",
  },
];

export const documents = [
  {
    name: "Contrato Social - Alpha.pdf",
    type: "Contrato Social",
    company: "Alpha Inovação Ltda.",
    expiry: "N/A",
    assignee: "Sistema",
  },
  {
    name: "CND Federal - Beta.pdf",
    type: "Certidão",
    company: "Beta Soluções S.A.",
    expiry: "15/08/2024",
    assignee: "Ana Costa",
  },
  {
    name: "Alvará de Funcionamento - Gama.pdf",
    type: "Licença",
    company: "Gama Tech ME",
    expiry: "31/12/2024",
    assignee: "Carlos Dias",
  },
  {
    name: "NF-e 00123.xml",
    type: "Arquivo Fiscal",
    company: "Delta Comércio Eireli",
    expiry: "N/A",
    assignee: "Sistema",
  },
];
