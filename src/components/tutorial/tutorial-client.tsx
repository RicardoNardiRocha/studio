'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const tutorialData = [
  {
    title: "1. Primeiros Passos e Acesso",
    content: [
      {
        subtitle: "1.1. Login",
        text: "Acesse o sistema pela tela inicial utilizando seu e-mail e senha. Não há opção de auto-registro; todos os usuários devem ser criados previamente no painel de autenticação do Firebase.",
      },
      {
        subtitle: "1.2. Gerenciando Seu Perfil",
        text: "Acesse o menu **Perfil** (clicando no seu avatar no canto inferior esquerdo).\nLá, você pode:\n- Alterar sua foto de perfil.\n- Atualizar seu nome.\n- Alterar sua senha de acesso.",
      },
    ],
  },
  {
    title: "2. Módulo de Usuários (Apenas Administradores)",
    content: [
      {
        subtitle: "Acesso e Como Funciona",
        text: "Acesse o menu **Usuários**.\n1.  Um novo usuário deve ser criado primeiro no **Firebase Authentication**.\n2.  Após o primeiro login desse novo usuário no ContabilX, seu perfil aparecerá na lista de gerenciamento.\n3.  O administrador pode então clicar no ícone de engrenagem (`UserCog`) para editar as permissões.",
      },
      {
        subtitle: "Permissões e Log de Atividades",
        text: 'Você pode conceder acesso de Leitura (`read`), Criação (`create`), Atualização (`update`) e Exclusão (`delete`) para cada módulo. Use os atalhos para preencher permissões comuns rapidamente.\nA parte inferior da tela exibe um registro completo de todas as ações realizadas no sistema.',
      },
    ],
  },
  {
    title: "3. Módulo de Empresas",
    content: [
      {
        subtitle: "Adicionar, Importar e Sincronizar",
        text: "- **Adicionar Nova Empresa:** Clique em \"Nova Empresa\" e digite o CNPJ para buscar os dados automaticamente.\n- **Importar em Lote:** Clique em \"Importar em Lote\" e cole uma lista de CNPJs (um por linha) para cadastrar várias empresas de uma vez.\n- **Sincronizar Todas:** Esta ação verifica e atualiza os dados de todas as empresas com a Receita Federal, ideal para detectar desenquadramentos do Simples Nacional.",
      },
      {
        subtitle: "Detalhes da Empresa",
        text: "Clique em \"Mais\" (`MoreHorizontal`) em uma empresa para:\n  - Editar informações internas (e-mail, WhatsApp).\n  - **Gerenciar Certificado A1:** Fazer upload do arquivo `.pfx` e senha. O sistema valida o CNPJ e extrai a data de validade.\n  - Visualizar o Quadro de Sócios e Administradores (QSA).\n  - Acessar uma aba de **Documentos** específica para aquela empresa.",
      },
    ]
  },
  {
    title: "4. Módulo Societário",
    content: [
      {
        subtitle: "Adicionar e Sincronizar Sócios",
        text: "- **Adicionar Sócio:** Clique em \"Adicionar Sócio\" para preencher os dados manualmente.\n- **Sincronizar Sócios via QSA:** O sistema varre o QSA de todas as empresas. Se um sócio não existir, ele é criado; se já existir, sua associação com a nova empresa é registrada.",
      },
      {
        subtitle: "Detalhes do Sócio",
        text: "Clique em \"Mais\" (`MoreHorizontal`) em um sócio para:\n- Editar informações como nome e dados de acesso ao GOV.BR.\n- **Gerenciar e-CPF:** Faça o upload do arquivo `.pfx` para validar o CPF, armazenar o arquivo e a data de validade.",
      },
    ]
  },
  {
    title: "5. Módulo Fiscal",
    content: [
      {
        subtitle: "Controle Fiscal",
        text: "- **Visão Geral:** Monitore o status de envio de XML e a geração do DAS.\n- **Configurar Empresas:** Selecione quais empresas aparecerão nesta tela de controle.\n- **Uso:** Altere o status do XML (`Pendente`, `Aguardando Reenvio`, `Enviado`) e marque se o DAS foi enviado para \"travar\" a linha.",
      },
      {
        subtitle: "Livros e Notas Fiscais",
        text: "As abas **Livros de Saída / Entrada** e **Notas Fiscais** listam os documentos importados. Use os filtros e o botão \"Enviar Documento\" para fazer upload de novos arquivos.",
      },
    ]
  },
  {
    title: "6. Módulo de Obrigações",
    content: [
      {
        subtitle: "Visualização e Acompanhamento",
        text: "- Alterne entre a visão em **Kanban** (cartões) e **Lista** (tabela).\n- Os KPIs no topo mostram um resumo do mês (Total, Pendentes, Atrasadas, Entregues).\n- **Criar Obrigação:** Clique para adicionar uma nova tarefa, definindo empresa, nome, categoria, periodicidade e vencimento.",
      },
      {
        subtitle: "Atualização de Status",
        text: "Altere o status de uma obrigação (`Pendente`, `Entregue`, etc.) diretamente no cartão ou na lista. O status muda para \"Atrasada\" automaticamente se o prazo for perdido.",
      },
    ]
  },
  {
    title: "7. Módulo de Processos",
    content: [
      {
        subtitle: "Gestão de Processos Societários",
        text: "- Alterne entre a visão em **Lista** e **Kanban** e use os filtros para organizar.\n- **Criar Processo:** Para \"Abertura\", digite o nome da nova empresa. Para outros tipos (Alteração, Baixa), escolha uma empresa já cadastrada.",
      },
      {
        subtitle: "Detalhes do Processo",
        text: "Dentro de um processo, você pode alterar seu status, adicionar notas, anexar arquivos e visualizar todo o histórico de alterações.",
      },
    ]
  },
  {
    title: "8. Módulo Financeiro",
    content: [
      {
        subtitle: "Cobranças Individuais e em Lote",
        text: "- **Nova Cobrança:** Crie uma fatura individual para uma empresa.\n- **Gerar Mensalidades:** Crie faturas de mensalidade para todas as empresas de uma vez, para uma competência específica.",
      },
      {
        subtitle: "Gerenciar Faturas",
        text: "A lista mostra todas as cobranças. O status muda para \"Atrasada\" automaticamente. Edite uma fatura para alterar seu status (ex: marcar como \"Paga\") e registrar a data de pagamento.",
      },
    ]
  },
  {
    title: "9. Módulo de Documentos",
    content: [
      {
        subtitle: "Repositório Central de Arquivos",
        text: "Esta tela unifica **todos os arquivos** do sistema. Use os filtros avançados para encontrar o que precisa por módulo, tipo, competência ou data. Você pode baixar qualquer arquivo diretamente da lista.",
      },
    ]
  }
];

export const FormattedText = ({ text }: { text: string }) => {
  return (
    <div className="space-y-2 text-sm text-muted-foreground prose-sm dark:prose-invert">
      {text.split('\n').map((line, index) => {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={index}>
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
              }
              if (part.startsWith('- ')) {
                return <span key={i}><span className="mr-2">&bull;</span>{part.substring(2)}</span>;
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
};


export function TutorialClient() {
  return (
    <div className="space-y-4">
      {tutorialData.map((section, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {section.content.map((item, itemIndex) => (
                <AccordionItem value={`item-${index}-${itemIndex}`} key={itemIndex}>
                  <AccordionTrigger className="font-semibold text-left">
                    {item.subtitle}
                  </AccordionTrigger>
                  <AccordionContent>
                    <FormattedText text={item.text} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
