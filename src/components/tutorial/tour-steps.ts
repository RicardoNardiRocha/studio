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
        content: "Aqui você visualiza todas as empresas. Clique no botão de ações ('...') em qualquer linha para abrir os detalhes da empresa.",
        placement: 'top',
        title: 'Tabela de Empresas',
    },
    {
        target: 'body',
        placement: 'center',
        title: 'Detalhes da Empresa',
        content: 'Na tela de detalhes, que abre ao clicar no botão "...", você pode editar contatos, gerenciar o Certificado A1, visualizar o Quadro de Sócios e acessar todos os documentos da empresa.',
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
  ],
  '/societario': [
    {
      target: '#add-partner-button',
      content: 'Use este botão para cadastrar um novo sócio ou administrador manualmente, preenchendo todos os seus dados.',
      placement: 'bottom',
      title: 'Adicionar Sócio',
      disableBeacon: true,
    },
    {
      target: '#sync-partners-button',
      content: 'Esta funcionalidade poderosa varre o Quadro de Sócios (QSA) de todas as suas empresas cadastradas e cria ou atualiza os sócios no sistema automaticamente.',
      placement: 'bottom',
      title: 'Sincronizar Sócios',
    },
    {
      target: '#partner-filters',
      content: 'Filtre a lista por nome, CPF, empresa associada, ou status do e-CPF para encontrar rapidamente a pessoa que procura.',
      placement: 'bottom',
      title: 'Filtros de Sócios',
    },
    {
      target: '#partner-table',
      content: 'Esta tabela lista todos os sócios. A cor da linha indica o status do certificado e-CPF (vermelho para vencido, amarelo para vencendo). Clique no botão "..." para ver os detalhes.',
      placement: 'top',
      title: 'Lista de Sócios',
    },
    {
        target: 'body',
        placement: 'center',
        title: 'Detalhes do Sócio',
        content: 'Na tela de detalhes, você pode atualizar informações de contato, vincular o sócio a empresas, e fazer o upload do certificado e-CPF para validar a data de vencimento.',
    }
  ],
  '/processos': [
    {
      target: '#processes-kpis',
      content: 'Estes cartões fornecem uma visão rápida dos seus processos: o total em andamento, processos de abertura, os que estão em exigência e os de alta prioridade. Clique em um deles para filtrar a lista.',
      placement: 'bottom',
      title: 'Indicadores de Processos',
      disableBeacon: true,
    },
    {
      target: '#add-process-button',
      content: 'Clique aqui para iniciar um novo processo, seja de Abertura, Alteração ou Baixa de uma empresa.',
      placement: 'left',
      title: 'Novo Processo',
    },
    {
      target: '#process-filters',
      content: 'Filtre os processos por tipo, prioridade ou use a busca para encontrar um processo específico. Você também pode alternar entre a visão de lista e a visão Kanban.',
      placement: 'bottom',
      title: 'Filtros e Visualização',
    },
    {
      target: '#process-board',
      content: 'Aqui você vê todos os seus processos, seja em formato de lista ou de cartões (Kanban). Você pode alterar o status de um processo diretamente por aqui.',
      placement: 'top',
      title: 'Quadro de Processos',
    },
    {
        target: 'body',
        placement: 'center',
        title: 'Detalhes do Processo',
        content: 'Ao clicar para ver os detalhes de um processo, você pode atualizar todas as suas informações, adicionar notas, anexar arquivos importantes e ver todo o histórico de alterações de status.',
    }
  ],
  '/obrigacoes': [
    {
      target: '#obligations-kpis',
      content: 'Estes indicadores mostram a situação das obrigações para o mês selecionado: o total, quantas estão pendentes, atrasadas e as que já foram entregues. Clique para filtrar a lista.',
      placement: 'bottom',
      title: 'Indicadores de Obrigações',
      disableBeacon: true,
    },
    {
      target: '#add-obligation-button',
      content: 'Use este botão para criar uma nova obrigação para uma empresa, definindo o tipo, competência e data de vencimento.',
      placement: 'left',
      title: 'Nova Obrigação',
    },
    {
      target: '#obligations-filters',
      content: 'Selecione a competência (mês/ano) que deseja visualizar, filtre por nome, e alterne entre a visualização em Kanban (cartões) ou Lista.',
      placement: 'bottom',
      title: 'Filtros e Visualização',
    },
    {
      target: '#obligation-board',
      content: 'Visualize e gerencie todas as obrigações do período. Você pode atualizar o status de cada uma diretamente no cartão ou na lista.',
      placement: 'top',
      title: 'Quadro de Obrigações',
    },
     {
        target: 'body',
        placement: 'center',
        title: 'Detalhes da Obrigação',
        content: 'Ao clicar em uma obrigação, você pode editar todos os seus detalhes, como nome, datas e responsável, além de ver o histórico de alterações.',
    }
  ],
  '/documentos': [
     {
      target: '#documents-filters',
      content: 'Este é o repositório central de todos os arquivos. Use os filtros avançados para encontrar qualquer documento por nome, módulo de origem (Empresas, Processos, etc.), tipo de arquivo ou competência.',
      placement: 'bottom',
      title: 'Filtros Avançados de Documentos',
      disableBeacon: true,
    },
    {
      target: '#documents-table',
      content: 'Todos os documentos do sistema são listados aqui. Você pode baixá-los diretamente clicando no ícone de download.',
      placement: 'top',
      title: 'Repositório Central',
    },
  ],
  '/financeiro': [
     {
      target: '#add-invoice-button',
      content: 'Crie uma nova cobrança individual para uma empresa específica.',
      placement: 'left',
      title: 'Nova Cobrança',
      disableBeacon: true,
    },
    {
      target: '#batch-invoice-button',
      content: 'Use esta opção para gerar as mensalidades de todas as empresas de uma só vez para um determinado mês de competência.',
      placement: 'left',
      title: 'Gerar Mensalidades em Lote',
    },
    {
      target: '#invoice-filters',
      content: 'Filtre as faturas por empresa, descrição da cobrança ou status (Pendente, Paga, Atrasada).',
      placement: 'bottom',
      title: 'Filtros de Faturas',
    },
    {
        target: '#invoice-table',
        content: 'A tabela lista todas as cobranças. O status "Atrasada" é aplicado automaticamente. Clique no botão "..." para editar uma fatura, marcar como paga e registrar a data do pagamento.',
        placement: 'top',
        title: 'Lista de Cobranças',
    },
  ],
   '/usuarios': [
     {
      target: '#user-list-card',
      content: 'Esta área exibe todos os usuários que já acessaram o sistema. Novos usuários precisam ser criados no Firebase Authentication primeiro e, após o primeiro login, aparecerão aqui para que suas permissões possam ser gerenciadas.',
      placement: 'bottom',
      title: 'Gerenciamento de Usuários',
      disableBeacon: true,
    },
    {
      target: '#activity-log-card',
      content: 'O Log de Atividades registra todas as ações importantes realizadas no sistema, mostrando quem fez o quê e quando. Essencial para auditoria e controle.',
      placement: 'top',
      title: 'Log de Atividades',
    },
  ],
  '/perfil': [
     {
      target: '#profile-photo-card',
      content: 'Clique aqui para enviar uma nova foto de perfil.',
      placement: 'bottom',
      title: 'Sua Foto',
      disableBeacon: true,
    },
     {
      target: '#profile-info-card',
      content: 'Você pode atualizar seu nome de exibição aqui. A alteração de e-mail é um processo mais complexo e está desabilitada na interface.',
      placement: 'bottom',
      title: 'Suas Informações',
    },
    {
      target: '#profile-password-card',
      content: 'Para sua segurança, você pode alterar sua senha fornecendo a senha atual e a nova.',
      placement: 'top',
      title: 'Alterar Senha',
    },
  ]
};
