import type { Step } from 'react-joyride';

export const tourSteps: Record<string, Step[]> = {
  '/dashboard': [
    {
      target: '#kpi-cards-grid',
      content: 'Estes são os Indicadores Chave de Desempenho (KPIs). Eles oferecem uma visão geral e rápida da saúde do seu escritório.',
      placement: 'bottom',
      title: 'Seus KPIs',
      disableBeacon: true,
    },
    {
      target: '#notifications-card',
      content: 'A Central de Notificações exibe alertas importantes, como certificados prestes a vencer, obrigações atrasadas e processos que precisam de sua atenção.',
      placement: 'left',
      title: 'Central de Notificações',
    },
    {
        target: '#quick-actions-card',
        content: 'Use as Ações Rápidas para iniciar tarefas comuns, como cadastrar uma nova empresa ou criar um processo, diretamente do dashboard.',
        placement: 'left',
        title: 'Ações Rápidas',
    }
  ],
  '/empresas': [
    {
      target: '#add-company-button',
      content: 'Clique aqui para adicionar uma nova empresa individualmente. Você só precisa do CNPJ e o sistema busca os dados automaticamente.',
      placement: 'bottom',
      title: 'Adicionar Empresa',
      disableBeacon: true,
    },
    {
        target: '#bulk-import-button',
        content: 'Tem muitas empresas para cadastrar? Use esta opção para importar várias de uma vez, simplesmente colando uma lista de CNPJs.',
        placement: 'bottom',
        title: 'Importar em Lote',
    },
    {
        target: '#company-filters',
        content: 'Filtre sua lista de empresas por nome, regime tributário ou status do certificado digital para encontrar o que precisa rapidamente.',
        placement: 'bottom',
        title: 'Filtros Avançados',
    },
    {
        target: '#company-table',
        content: 'Aqui você visualiza todas as empresas cadastradas. Clique no botão de ações (...) em qualquer linha para ver detalhes, gerenciar certificados e mais.',
        placement: 'top',
        title: 'Tabela de Empresas',
    }
  ],
  '/fiscal': [
    {
        target: '#fiscal-tabs',
        content: 'Navegue entre as abas para monitorar o status do XML e DAS na aba "Controle", ou para gerenciar livros e notas fiscais.',
        placement: 'bottom',
        title: 'Navegação do Módulo',
        disableBeacon: true,
    },
    {
        target: '#fiscal-filters',
        content: 'Use os filtros para localizar documentos por empresa, competência (mês/ano) ou status (Ativa, Cancelada, etc).',
        placement: 'bottom',
        title: 'Filtros de Documentos',
    },
    {
        target: '#upload-document-button',
        content: 'Clique aqui para enviar novos documentos fiscais, como livros ou notas, para o sistema.',
        placement: 'bottom',
        title: 'Enviar Documento',
    }
  ]
};
