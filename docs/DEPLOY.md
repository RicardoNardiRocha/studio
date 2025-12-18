# Guia de Deploy para a Vercel

Este guia irá orientá-lo no processo de deploy do seu sistema ContabilX ERP na plataforma da Vercel. Siga os passos abaixo para garantir que sua aplicação seja publicada com sucesso e que todos os serviços, como Firebase e IA do Google, funcionem corretamente.

## Passo 1: Preparar seu Código

Seu código já está quase pronto. As principais alterações foram feitas para garantir que as chaves de API e outras informações sensíveis não fiquem expostas diretamente no código. Elas serão gerenciadas por meio de Variáveis de Ambiente.

## Passo 2: Configurar a Conta na Vercel

1.  **Crie uma Conta:** Se você ainda não tem uma, crie uma conta no site da [Vercel](https://vercel.com/signup). A maneira mais fácil é se registrar usando sua conta do GitHub, GitLab ou Bitbucket.
2.  **Instale a CLI da Vercel (Opcional, mas recomendado):**
    ```bash
    npm install -g vercel
    ```

## Passo 3: Fazer o Deploy

1.  **Importe o Projeto:**
    *   No seu dashboard da Vercel, clique em **"Add New... > Project"**.
    *   Selecione o repositório Git onde seu projeto está hospedado. A Vercel irá detectar automaticamente que é um projeto Next.js.

2.  **Configure o Projeto:**
    *   A Vercel geralmente acerta as configurações padrão (Framework Preset: Next.js, Build Command: `next build`). Você não precisa alterar nada aqui.

3.  **Adicione as Variáveis de Ambiente (Passo Crucial):**
    *   Na tela de configuração do projeto, expanda a seção **"Environment Variables"**.
    *   Aqui, você precisará adicionar as chaves para o Firebase e para a API de IA do Google (Gemini). Copie o **Nome** e o **Valor** de cada variável da tabela abaixo.

### Variáveis de Ambiente Necessárias

| Nome da Variável                          | Valor                                         | Descrição                                                                      |
| ----------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------ |
| `GEMINI_API_KEY`                          | `SUA_CHAVE_DE_API_DO_GEMINI`                  | Sua chave de API para o Google AI Studio (Gemini).                             |
| `NEXT_PUBLIC_FIREBASE_API_KEY`            | `AIzaSy...` (do seu projeto Firebase)         | Valor de `apiKey` do seu objeto de configuração do Firebase.                   |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`        | `seu-projeto.firebaseapp.com`                 | Valor de `authDomain` do seu objeto de configuração do Firebase.               |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`         | `seu-projeto-id`                              | Valor de `projectId` do seu objeto de configuração do Firebase.                |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`     | `seu-projeto.appspot.com`                     | Valor de `storageBucket` do seu objeto de configuração do Firebase.            |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `1234567890`                                  | Valor de `messagingSenderId` do seu objeto de configuração do Firebase.        |
| `NEXT_PUBLIC_FIREBASE_APP_ID`             | `1:1234...` (do seu projeto Firebase)         | Valor de `appId` do seu objeto de configuração do Firebase.                    |

**Como encontrar os valores do Firebase?**
1.  Vá para o [Console do Firebase](https://console.firebase.google.com/).
2.  Selecione seu projeto.
3.  Clique no ícone de engrenagem (Configurações do projeto) ao lado de "Visão geral do projeto".
4.  Na aba "Geral", role para baixo até a seção "Seus apps".
5.  Selecione seu aplicativo da web. Você verá um objeto de configuração `firebaseConfig`. Copie os valores correspondentes para as variáveis de ambiente na Vercel.

**Como encontrar a `GEMINI_API_KEY`?**
1.  Acesse o [Google AI Studio](https://aistudio.google.com/).
2.  Clique em **"Get API key"** no menu à esquerda.
3.  Crie ou copie sua chave de API existente.

4.  **Clique em "Deploy":**
    *   Após adicionar todas as variáveis, clique no botão **"Deploy"**.
    *   A Vercel irá construir e publicar sua aplicação. Você receberá um link para o site ao vivo assim que o processo for concluído.

## Passo 4: Configurar o Domínio (Opcional)

Após o deploy, a Vercel fornecerá um domínio padrão (`.vercel.app`). Você pode ir para a aba **"Domains"** nas configurações do seu projeto na Vercel para adicionar um domínio personalizado.

É isso! Seu sistema ContabilX ERP estará no ar.
