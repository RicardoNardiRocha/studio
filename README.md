# ContabilX ERP - Sistema de Gestão para Escritórios de Contabilidade

O ContabilX é um ERP (Enterprise Resource Planning) moderno e inteligente, desenvolvido especificamente para atender às necessidades de escritórios de contabilidade. A plataforma centraliza e automatiza as operações diárias, permitindo que os contadores ganhem eficiência, reduzam erros e foquem em atividades estratégicas para seus clientes.

Construído com Next.js, React, Firebase e IA generativa do Google (Gemini), o ContabilX oferece uma interface intuitiva e funcionalidades robustas para a gestão contábil, fiscal e societária.

## Funcionalidades Principais

O sistema é organizado em módulos, cada um projetado para uma área específica da rotina contábil:

*   **Dashboard:** Uma visão geral (atualmente com dados simulados) dos principais indicadores (KPIs), atividades recentes e alertas sobre empresas que necessitam de atenção.
*   **Módulo de Empresas:** Centraliza o cadastro de todas as empresas clientes. Permite adicionar novas empresas buscando dados atualizados por CNPJ via API, além de gerenciar informações cadastrais e certificados.
*   **Módulo Societário:** Gerencia o cadastro de sócios e administradores, permitindo vinculá-los às empresas clientes e controlar a validade de certificados digitais como o e-CPF.
*   **Módulo de Processos:** Acompanha processos societários como abertura, alteração e encerramento de empresas, com um sistema de status para monitorar cada etapa.
*   **Módulo de Obrigações:** Oferece um controle completo das obrigações fiscais e acessórias dos clientes, com um sistema de status para gerenciar o andamento de cada entrega.
*   **Módulo de Documentos:** Funciona como um repositório seguro de arquivos, organizado por empresa. Permite o upload, download e exclusão de documentos, com acesso controlado.
*   **Módulo Fiscal com IA:** Utiliza a Inteligência Artificial do Google para automatizar tarefas, como:
    *   **Resumo de Documentos:** Extrai e resume informações chave de arquivos PDF e XML.
    *   **Classificação de Documentos:** Sugere classificações para textos de documentos fiscais.

## Tecnologias Utilizadas

*   **Frontend:** Next.js (com App Router), React, TypeScript.
*   **Estilização:** Tailwind CSS e ShadCN/UI para componentes.
*   **Backend & Banco de Dados:** Firebase (Firestore, Authentication, Storage).
*   **Inteligência Artificial:** Genkit com o modelo `googleai/gemini-2.5-flash`.
*   **APIs Externas:** `brasilapi.com.br` para consulta de CNPJ.

## Estrutura de Segurança

O sistema utiliza as regras de segurança do Firebase (Firestore e Storage) para garantir um acesso seguro e granular aos dados, onde os usuários só podem acessar informações das empresas às quais pertencem. O login é controlado por e-mail e senha, sem auto-registro, para garantir que apenas usuários autorizados tenham acesso.