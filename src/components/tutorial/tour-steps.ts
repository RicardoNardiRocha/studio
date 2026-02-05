import type { Step } from 'react-joyride';

export const tourSteps: Record<string, Step[]> = {
  '/dashboard': [
    {
      target: '#kpi-cards-grid',
      content: 'Estes são os Indicadores Chave de Desempenho (KPIs). Eles oferecem uma visão geral e rápida da saúde do seu escritório, com atalhos para os módulos correspondentes.',
      placement: 'bottom',
      title: 'Seus KPIs',
      disableBeacon: true,
    },
    {
      target: '#notifications-card',
      content: 'A Central de Notificações exibe alertas importantes, como certificados prestes a vencer, obrigações atrasadas e processos que precisam de sua atenção. Clique em um item para ser direcionado.',
      placement: 'left',
      title: 'Central de Notificações',
    },
    {
        target: '#quick-actions-card',
        content: 'Use as Ações Rápidas para iniciar tarefas comuns, como cadastrar uma nova empresa ou criar um processo, diretamente do seu painel principal.',
        placement: 'left',
        title: 'Ações Rápidas',
    }
  ],
  '/empresas': [
    {
      target: '#add-company-button',
      content: 'Clique aqui para adicionar uma nova empresa individualmente. Você só precisa do CNPJ e o sistema busca os dados da Receita Federal automaticamente.',
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
        target: '#sync-all-button',
        content: 'Esta ação poderosa verifica os dados de TODAS as empresas cadastradas com a Receita Federal, atualizando status e regime tributário. Ideal para detectar desenquadramentos do Simples Nacional.',
        placement: 'bottom',
        title: 'Sincronizar Todas',
    },
    {
        target: '#company-filters',
        content: 'Use os filtros para encontrar empresas por nome, regime tributário, situação cadastral ou status do certificado digital. Os resultados são atualizados instantaneamente.',
        placement: 'bottom',
        title: 'Filtros Avançados',
    },
    {
        target: '#company-table',
        content: "Aqui você visualiza todas as empresas. As linhas coloridas indicam certificados vencendo ou vencidos. Clique no botão de ações ('...') na primeira linha para ver os detalhes e continuar o tour.",
        placement: 'top',
        title: 'Tabela de Empresas',
    },
     {
      target: '#company-details-internal-contact',
      content: 'Nesta seção, você pode adicionar e editar informações de contato internas, como e-mail e telefone, para facilitar a comunicação da sua equipe com o cliente.',
      placement: 'bottom',
      title: 'Contato Interno',
    },
    {
      target: '#company-details-certificate',
      content: 'Gerencie o Certificado Digital A1 da empresa. Clique em "Adicionar/Atualizar" para fazer o upload do arquivo .pfx e da senha (ela não é salva). O sistema valida o CNPJ e extrai a data de validade automaticamente.',
      placement: 'bottom',
      title: 'Certificado Digital A1',
    },
    {
      target: '#company-details-qsa',
      content: 'Consulte o Quadro de Sócios e Administradores (QSA) conforme os dados mais recentes obtidos da Receita Federal. Esta informação é apenas para visualização.',
      placement: 'top',
      title: 'Quadro de Sócios',
    },
    {
      target: '#company-details-sync-button',
      content: 'Clique aqui para forçar uma sincronização dos dados desta empresa específica com a Receita Federal, atualizando status, endereço e regime tributário em tempo real.',
      placement: 'left',
      title: 'Sincronizar com a Receita',
    },
    {
      target: '#company-details-documents-tab-trigger',
      content: 'Navegue para a aba "Documentos" para ver, adicionar ou remover todos os arquivos relacionados exclusivamente a esta empresa.',
      placement: 'bottom',
      title: 'Documentos da Empresa',
    },
    {
      target: '#company-details-save-button',
      content: 'Após realizar qualquer alteração nos campos editáveis, clique aqui para salvá-las no sistema.',
      placement: 'left',
      title: 'Salvar Alterações',
    },
  ],
  '/fiscal': [
    {
        target: '#fiscal-tabs',
        content: 'Navegue entre as abas para monitorar o status do XML e DAS na aba "Controle", ou para gerenciar livros e notas fiscais enviadas ao sistema.',
        placement: 'bottom',
        title: 'Navegação do Módulo',
        disableBeacon: true,
    },
    {
        target: '#fiscal-control-kpis',
        content: 'Na aba "Controle", estes cartões mostram um resumo da competência selecionada. Clique em um deles para filtrar a tabela abaixo instantaneamente.',
        placement: 'bottom',
        title: 'Indicadores da Competência',
    },
    {
        target: '#fiscal-control-table',
        content: 'Esta tabela mostra o status do envio de XML e do DAS para cada empresa. Você pode alterar o status do XML diretamente no seletor. Marcar "DAS Enviado" trava a linha para evitar alterações acidentais.',
        placement: 'top',
        title: 'Controle de XML e DAS',
    },
    {
        target: '#configure-companies-button',
        content: 'Clique aqui para escolher quais empresas devem aparecer na tela de "Controle".',
        placement: 'left',
        title: 'Configurar Empresas do Controle',
    },
    {
        target: '#upload-document-button',
        content: 'Use este botão para enviar novos documentos fiscais (livros, notas). O sistema já sugere o tipo de documento baseado na aba em que você está.',
        placement: 'left',
        title: 'Enviar Documento Fiscal',
    },
    {
        target: '#fiscal-filters',
        content: 'Nas abas de Livros e Notas, use os filtros para refinar sua busca por empresa, competência e status.',
        placement: 'bottom',
        title: 'Filtragem de Documentos'
    },
    {
        target: 'body',
        placement: 'center',
        title: 'Detalhes do Documento Fiscal',
        content: "Ao clicar no botão '...' de um documento, você poderá:\n- **Ver Detalhes:** Conferir informações como empresa, competência e status.\n- **Adicionar Notas:** Use a aba 'Notas' para adicionar observações e comentários sobre o documento.\n- **Baixar e Excluir:** Faça o download do arquivo original ou exclua o registro do sistema.",
    }
  ],
  '/societario': [
    {
      target: '#add-partner-button',
      content: 'Use este botão para cadastrar um novo sócio ou administrador manualmente, preenchendo seus dados, incluindo informações do GOV.BR e vinculando a empresas.',
      placement: 'bottom',
      title: 'Adicionar Sócio',
      disableBeacon: true,
    },
    {
      target: '#sync-partners-button',
      content: 'Esta funcionalidade varre o Quadro de Sócios (QSA) de TODAS as suas empresas cadastradas no módulo de Empresas. Se um sócio não existir, ele é criado. Se já existir, seu vínculo com a nova empresa é adicionado.',
      placement: 'bottom',
      title: 'Sincronizar Sócios via QSA',
    },
    {
      target: '#partner-filters',
      content: 'Filtre a lista por nome do sócio, CPF, nome da empresa associada, ou pelo status do e-CPF (se possui ou não, e se está válido/vencendo/vencido).',
      placement: 'bottom',
      title: 'Filtros de Sócios',
    },
    {
      target: '#partner-table tbody tr:first-child button',
      content: 'Esta tabela lista todos os sócios. A cor da linha indica o status do e-CPF. Clique no botão "..." para ver os detalhes e continuar o tour.',
      placement: 'left',
      title: 'Lista de Sócios',
    },
    {
        target: '#partner-details-companies',
        content: 'Associe este sócio a uma ou mais empresas cadastradas no sistema para facilitar a organização.',
        placement: 'bottom',
        title: 'Empresas Associadas',
    },
    {
        target: '#partner-details-ecpf',
        content: 'Gerencie o e-CPF do sócio. Faça o upload do arquivo .pfx para que o sistema valide o CPF, extraia a data de validade e armazene o certificado com segurança.',
        placement: 'top',
        title: 'Certificado e-CPF',
    },
    {
        target: '#partner-details-govbr',
        content: 'Armazene as credenciais do portal GOV.BR do sócio aqui. A senha fica oculta por padrão por segurança.',
        placement: 'top',
        title: 'Acesso GOV.BR',
    },
    {
        target: '#partner-details-other-data',
        content: 'Use este campo para adicionar quaisquer informações ou observações relevantes sobre este sócio.',
        placement: 'top',
        title: 'Outros Dados',
    },
  ],
  '/processos': [
    {
      target: '#processes-kpis',
      content: 'Estes cartões fornecem uma visão rápida dos seus processos: o total em andamento, processos de abertura, os que estão em exigência e os de alta prioridade. Clique em um deles para filtrar a visualização abaixo.',
      placement: 'bottom',
      title: 'Indicadores de Processos',
      disableBeacon: true,
    },
    {
      target: '#add-process-button',
      content: 'Clique aqui para iniciar um novo processo. Para "Abertura", digite o nome da nova empresa. Para outros tipos (Alteração, Baixa), escolha uma empresa já cadastrada.',
      placement: 'left',
      title: 'Novo Processo Societário',
    },
    {
      target: '#process-filters',
      content: 'Use os filtros para encontrar processos por tipo, prioridade ou texto. Use os botões de visualização para alternar entre Lista e Kanban (cartões).',
      placement: 'bottom',
      title: 'Filtros e Visualização',
    },
    {
      target: '#process-board',
      content: 'Aqui você vê todos os seus processos. Tanto na lista quanto nos cartões, você pode alterar o status de um processo rapidamente usando o seletor de status. A cor indica a prioridade ou atraso.',
      placement: 'top',
      title: 'Quadro de Processos',
    },
     {
      target: 'body',
      content: "Clique no botão '...' de um processo na lista para abrir seus detalhes e continuar o tour.",
      placement: 'center',
      title: 'Acessando Detalhes do Processo',
    },
    {
        target: '#process-details-form',
        content: "Na aba 'Detalhes', você pode alterar o status, a prioridade, as datas do processo e adicionar notas internas importantes.",
        placement: 'bottom',
        title: 'Gerenciando Detalhes',
    },
    {
        target: '#process-details-attachments-tab-trigger',
        content: "Clique na aba 'Anexos' para fazer upload de arquivos essenciais (documentos, protocolos, etc.), baixar ou excluir anexos existentes.",
        placement: 'bottom',
        title: 'Anexos do Processo',
    },
    {
        target: '#process-details-history-tab-trigger',
        content: "A aba 'Histórico' mostra um registro cronológico de todas as mudanças de status e quem as realizou, garantindo total rastreabilidade.",
        placement: 'bottom',
        title: 'Histórico de Alterações',
    },
  ],
  '/obrigacoes': [
    {
      target: '#obligations-kpis',
      content: 'Estes indicadores mostram a situação das obrigações para o mês selecionado no filtro de competência. Clique em um cartão para filtrar a lista (ex: ver apenas as Atrasadas).',
      placement: 'bottom',
      title: 'Indicadores de Obrigações',
      disableBeacon: true,
    },
    {
      target: '#add-obligation-button',
      content: 'Use este botão para criar uma nova obrigação para uma empresa, definindo o tipo, competência, data de vencimento e um responsável.',
      placement: 'left',
      title: 'Nova Obrigação',
    },
    {
      target: '#obligations-filters',
      content: 'Selecione a competência (mês/ano) que deseja visualizar e use a busca para filtrar. Alterne entre a visualização em Kanban (cartões) ou Lista.',
      placement: 'bottom',
      title: 'Filtros e Visualização',
    },
    {
      target: '#obligation-board',
      content: 'Visualize e gerencie todas as obrigações do período. Você pode atualizar o status de cada uma diretamente no cartão ou na lista, clicando no seletor de status. Clique em um card para ver os detalhes.',
      placement: 'top',
      title: 'Quadro de Obrigações',
    },
     {
        target: 'body',
        content: 'Ao clicar em uma obrigação, você pode ajustar todos os seus detalhes: o nome, categoria, datas, responsável e status. Todas as alterações são salvas imediatamente.',
        placement: 'center',
        title: 'Editando uma Obrigação',
    }
  ],
  '/documentos': [
     {
      target: '#documents-filters',
      content: 'Este é o repositório central de TODOS os arquivos do sistema. Use os filtros avançados para encontrar qualquer documento por nome, módulo de origem (Empresas, Processos, etc.), tipo de arquivo, competência ou data.',
      placement: 'bottom',
      title: 'Filtros Avançados de Documentos',
      disableBeacon: true,
    },
    {
      target: '#documents-table',
      content: 'Todos os documentos do sistema são listados aqui, ordenados pelos mais recentes. Você pode baixá-los diretamente clicando no ícone de download.',
      placement: 'top',
      title: 'Repositório Central',
    },
  ],
  '/financeiro': [
     {
      target: '#add-invoice-button',
      content: 'Crie uma nova cobrança individual para uma empresa específica. Ideal para serviços avulsos como aberturas ou alterações.',
      placement: 'left',
      title: 'Nova Cobrança',
      disableBeacon: true,
    },
    {
      target: '#batch-invoice-button',
      content: 'Use esta opção para gerar as mensalidades de todas as empresas de uma só vez para um determinado mês de competência. O sistema ignora empresas que já foram faturadas no período.',
      placement: 'left',
      title: 'Gerar Mensalidades em Lote',
    },
    {
      target: '#invoice-filters',
      content: 'Filtre as faturas por nome da empresa, descrição da cobrança (ex: Mensalidade) ou status (Pendente, Paga, Atrasada).',
      placement: 'bottom',
      title: 'Filtros de Faturas',
    },
    {
        target: '#invoice-table tbody tr:first-child button',
        content: 'A tabela lista todas as cobranças. O status "Atrasada" é aplicado automaticamente. Clique no botão "..." para editar a fatura e continuar o tour.',
        placement: 'left',
        title: 'Lista de Cobranças',
    },
    {
        target: '#invoice-details-form',
        content: "Na tela de detalhes, você pode editar a descrição, valor e datas. Para registrar um pagamento, mude o status para 'Paga' e informe a 'Data de Pagamento'.",
        placement: 'bottom',
        title: 'Gerenciando uma Cobrança',
    }
  ],
   '/usuarios': [
     {
      target: '#user-list-card',
      content: 'Esta área exibe todos os usuários que já acessaram o sistema. Novos usuários precisam ser criados no Firebase Authentication primeiro. Após o primeiro login, eles aparecerão aqui para que suas permissões possam ser gerenciadas.',
      placement: 'bottom',
      title: 'Gerenciamento de Usuários',
      disableBeacon: true,
    },
    {
        target: 'body',
        placement: 'center',
        title: 'Configurando Permissões',
        content: "Ao clicar em 'Gerenciar Permissões', você entra na tela de controle de acesso:\n- **Tabela de Módulos:** Cada linha representa um módulo do sistema.\n- **Permissões Granulares:** Marque as caixas para dar acesso de 'Ver', 'Criar', 'Editar' ou 'Excluir'. Desmarcar 'Ver' desabilita as outras.\n- **Atalhos Rápidos:** Use o botão 'Tornar Administrador' para dar acesso total, ou o menu 'Configurações' em cada linha para aplicar perfis pré-definidos (Admin, Usuário, Nenhum).",
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
      content: 'Clique aqui para enviar uma nova foto de perfil. A foto aparecerá no menu e no log de atividades.',
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
      content: 'Para sua segurança, você pode alterar sua senha fornecendo a senha atual e a nova senha desejada.',
      placement: 'top',
      title: 'Alterar Senha',
    },
  ]
};
