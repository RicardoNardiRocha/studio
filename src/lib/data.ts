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
  { company: 'Inovatech Soluções', activity: 'Obrigação DASN-SIMEI entregue.', person: 'Ana' },
  { company: 'Construart Engenharia', activity: 'Processo de alteração contratual iniciado.', person: 'Carlos' },
  { company: 'Padaria Pão Quente', activity: 'Certificado digital A1 vence em 15 dias.', person: 'Sistema' },
  { company: 'Agro forte Produtos', activity: 'Documento fiscal (NFS-e) importado.', person: 'Beatriz' },
  { company: 'Techware Software', activity: 'DEFIS protocolada com sucesso.', person: 'Ana' },
];

export const atRiskCompanies = [
    { company: 'Mercado Preço Baixo', cnpj: '11.222.333/0001-44', risk: 'Certificado Vencido', status: 'Apto' },
    { company: 'Transportadora Veloz', cnpj: '44.555.666/0001-77', risk: 'DASN-SIMEI Atrasada', status: 'Inapto' },
    { company: 'Consultoria Estratégica', cnpj: '77.888.999/0001-00', risk: 'Em Exigência na JUCESP', status: 'Apto' },
];


export const documents: any[] = [];

export const obligations = [
  { id: '1', name: 'DASN-SIMEI', sector: 'Fiscal', due: '31/05/2025', assignee: 'Ana', status: 'gerar' },
  { id: '2', name: 'DEFIS', sector: 'Fiscal', due: '31/03/2025', assignee: 'Ana', status: 'conferir' },
  { id: '3', name: 'Folha de Pagamento', sector: 'DP', due: '05/08/2024', assignee: 'Beatriz', status: 'protocolar' },
  { id: '4', name: 'eSocial - Fechamento', sector: 'DP', due: '15/08/2024', assignee: 'Beatriz', status: 'enviar' },
  { id: '5', name: 'Balanço Patrimonial', sector: 'Contábil', due: '30/04/2025', assignee: 'Carlos', status: 'arquivar' },
  { id: '6', name: 'DCTFWeb', sector: 'Fiscal', due: '15/08/2024', assignee: 'Ana', status: 'entregar' },
];

export const obligationStatusOptions = [
  { value: 'gerar', label: 'Gerar' },
  { value: 'conferir', label: 'Conferir' },
  { value: 'protocolar', label: 'Protocolar' },
  { value: 'enviar', label: 'Enviar ao cliente' },
  { value: 'arquivar', label: 'Arquivar' },
  { value: 'entregar', label: 'Entregue' },
];
