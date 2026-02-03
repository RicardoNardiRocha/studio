# Guia Completo de Utilização do ContabilX ERP

Bem-vindo ao ContabilX! Este guia detalha como utilizar todas as funcionalidades do seu sistema de gestão contábil, desde os primeiros passos até as operações mais avançadas de cada módulo.

## 1. Primeiros Passos e Acesso

### 1.1. Login
Acesse o sistema pela tela inicial utilizando seu e-mail e senha. Não há opção de auto-registro; todos os usuários devem ser criados previamente no painel de autenticação do Firebase.

### 1.2. O Primeiro Administrador
O **primeiro usuário a fazer login** no sistema se tornará automaticamente o **Administrador Geral**. Ele terá acesso irrestrito a todos os módulos, incluindo o gerenciamento de outros usuários.

### 1.3. Gerenciando Seu Perfil
- Acesse o menu **Perfil** (clicando no seu avatar no canto inferior esquerdo).
- Lá, você pode:
    - Alterar sua foto de perfil.
    - Atualizar seu nome.
    - Alterar sua senha de acesso.

## 2. Módulo de Usuários (Apenas Administradores)

O administrador pode gerenciar outros usuários e suas permissões.

- **Acesso:** Menu **Usuários**.
- **Como Funciona:**
    1.  Um novo usuário deve ser criado primeiro no **Firebase Authentication**.
    2.  Após o primeiro login desse novo usuário no ContabilX, seu perfil aparecerá na lista de gerenciamento.
    3.  O administrador pode então clicar no ícone de engrenagem (`UserCog`) para editar as permissões.
- **Permissões:** Você pode conceder acesso de Leitura (`read`), Criação (`create`), Atualização (`update`) e Exclusão (`delete`) para cada módulo do sistema. Use os atalhos (ex: "Tornar Administrador") para preencher permissões comuns rapidamente.
- **Log de Atividades:** A parte inferior da tela exibe um registro completo de todas as ações importantes realizadas no sistema, indicando quem fez o quê e quando.

## 3. Módulo de Empresas

Centraliza todas as informações das empresas clientes.

- **Acesso:** Menu **Empresas**.
- **Funcionalidades:**
    - **Adicionar Nova Empresa:**
        - Clique em "Nova Empresa".
        - Digite o CNPJ. O sistema buscará os dados públicos da empresa na API da Receita Federal e a cadastrará automaticamente.
    - **Importar em Lote:**
        - Clique em "Importar em Lote".
        - Cole uma lista de CNPJs (um por linha). O sistema irá consultar e cadastrar todas as empresas em sequência.
    - **Sincronizar Todas:**
        - Clique em "Sincronizar Todas".
        - Esta ação verifica os dados de todas as empresas cadastradas com a Receita Federal, atualizando informações como situação cadastral e regime tributário. É útil para detectar desenquadramentos do Simples Nacional.
    - **Detalhes da Empresa:**
        - Clique no ícone de "Mais" (`MoreHorizontal`) em uma empresa na lista.
        - Na tela de detalhes, você pode:
            - Editar informações internas (e-mail de contato, grupo de WhatsApp).
            - **Gerenciar Certificado A1:** Faça o upload do arquivo `.pfx` e digite a senha. O sistema valida o CNPJ, armazena o arquivo de forma segura e extrai a data de validade.
            - Visualizar o Quadro de Sócios e Administradores (QSA).
            - Acessar uma aba de **Documentos** específica para aquela empresa.

## 4. Módulo Societário

Gerencia as informações de sócios e administradores.

- **Acesso:** Menu **Societário**.
- **Funcionalidades:**
    - **Adicionar Sócio:**
        - Clique em "Adicionar Sócio".
        - Preencha os dados manualmente, como nome e CPF. Você pode associá-lo a uma ou mais empresas já cadastradas.
    - **Sincronizar Sócios via QSA:**
        - Clique em "Sincronizar Sócios via QSA".
        - O sistema irá varrer o QSA de **todas** as empresas cadastradas no Módulo de Empresas. Se um sócio encontrado ainda não existir no Módulo Societário, ele será criado automaticamente. Se já existir, a nova empresa será adicionada à sua lista de "Empresas Associadas".
    - **Detalhes do Sócio:**
        - Clique no ícone de "Mais" (`MoreHorizontal`) em um sócio.
        - Na tela de detalhes, você pode:
            - Editar informações como nome, empresas associadas e dados de acesso ao GOV.BR.
            - **Gerenciar e-CPF:** Faça o upload do arquivo `.pfx`. O sistema valida o nome e o CPF, armazena o arquivo e a data de validade.

## 5. Módulo Fiscal

Controle de documentos e apurações fiscais.

- **Acesso:** Menu **Fiscal**.
- **Abas Principais:**
    - **Controle:**
        - **Visão Geral:** Monitore o status de envio de arquivos XML e a geração do DAS para todas as empresas configuradas.
        - **Configurar Empresas:** Clique neste botão para selecionar quais empresas devem aparecer nesta tela de controle.
        - **Uso:** Para cada empresa e competência (mês/ano), você pode alterar o "Status do XML" (`Pendente`, `Aguardando Reenvio`, `Enviado`) e marcar a caixa "DAS Enviado". Marcar o DAS como enviado "trava" a linha, prevenindo alterações acidentais.
    - **Livros de Saída / Livros de Entrada:**
        - Listam os livros fiscais importados.
        - Use os filtros para encontrar documentos por empresa, competência ou status.
    - **Notas Fiscais:**
        - Sub-abas para "Notas de Saída" e "Notas de Entrada".
        - Permite o upload e a visualização de notas fiscais, incluindo seu status (Ativa, Cancelada, etc.).
- **Upload de Documento:**
    - O botão "Enviar Documento" abre um formulário onde você pode selecionar a empresa, o tipo de documento (Livro ou Nota), a competência e o status (se for uma nota).

## 6. Módulo de Obrigações

Acompanhamento de todas as obrigações acessórias.

- **Acesso:** Menu **Obrigações**.
- **Funcionalidades:**
    - **Visualização:** Alterne entre a visão em **Kanban** (cartões) e **Lista** (tabela).
    - **Filtros:** Filtre por competência (mês/ano) e busque por nome da obrigação ou da empresa.
    - **KPIs:** Os cartões no topo mostram um resumo do mês (Total, Pendentes, Atrasadas, Entregues).
    - **Criar Obrigação:**
        - Clique em "Nova Obrigação".
        - Preencha os dados: empresa, nome, categoria, periodicidade, competência e data de vencimento.
    - **Atualizar Status:**
        - Tanto na visão de cartão quanto na de lista, você pode alterar o status de uma obrigação (`Pendente`, `Em Andamento`, `Entregue`, `Atrasada`, `Cancelada`).
        - O status é atualizado automaticamente para "Atrasada" se a data de vencimento passar e ela estiver "Pendente".

## 7. Módulo de Processos

Gestão de processos societários como aberturas e alterações.

- **Acesso:** Menu **Processos**.
- **Funcionalidades:**
    - **Visualização:** Alterne entre a visão em **Lista** e **Kanban**.
    - **Filtros:** Filtre por tipo de processo, status ou prioridade.
    - **KPIs:** Os cartões no topo fornecem um resumo dos processos ativos.
    - **Criar Processo:**
        - Clique em "Novo Processo".
        - **Para Abertura:** Selecione "Abertura" e digite o nome da nova empresa.
        - **Para Outros Tipos:** Selecione o tipo e escolha uma empresa já cadastrada.
        - Defina a prioridade, status inicial e datas.
    - **Detalhes do Processo:**
        - Na tela de detalhes, você pode:
            - Alterar status, prioridade e datas.
            - Adicionar notas internas.
            - Anexar e baixar arquivos relacionados ao processo.
            - Visualizar o histórico completo de alterações.

## 8. Módulo Financeiro

Controle de faturas e recebimentos.

- **Acesso:** Menu **Financeiro**. (Requer permissão específica)
- **Funcionalidades:**
    - **Criar Cobrança:**
        - Clique em "Nova Cobrança" para lançar uma fatura individual.
        - Selecione a empresa, descrição (Mensalidade, Abertura, etc.), valor e vencimento.
    - **Gerar Mensalidades em Lote:**
        - Clique em "Gerar Mensalidades".
        - Defina uma competência (mês/ano) e um valor padrão.
        - O sistema irá gerar uma fatura de mensalidade para **todas** as empresas que ainda não tiverem uma cobrança com essa descrição para o período selecionado.
    - **Gerenciar Faturas:**
        - A lista mostra todas as cobranças. O status é atualizado para "Atrasada" automaticamente.
        - Clique em "Mais" (`MoreHorizontal`) para editar uma fatura, alterar seu status (ex: marcar como "Paga") e registrar a data de pagamento.

## 9. Módulo de Documentos

Repositório central para todos os arquivos do sistema.

- **Acesso:** Menu **Documentos**.
- **Funcionalidade:**
    - Esta tela unifica e exibe **todos os arquivos** anexados em qualquer parte do sistema (certificados de empresas, e-CPFs de sócios, anexos de processos, documentos fiscais, etc.).
    - Utilize os filtros avançados para encontrar arquivos por módulo de origem, tipo de arquivo, competência ou data de upload.
    - Permite baixar qualquer arquivo diretamente da lista.
