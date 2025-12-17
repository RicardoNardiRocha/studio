// Atenção: Este é um script de desenvolvimento para fins de depuração.
// Ele concede permissões de administrador totais a um usuário específico.
// Não deve ser usado em produção.

import { initializeFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

const setAdminPermissions = async () => {
  console.log('Iniciando script para definir permissões de administrador...');

  const { firestore } = initializeFirebase();
  if (!firestore) {
    console.error('Falha ao inicializar o Firestore.');
    return;
  }

  // UID do usuário que precisa de permissões de admin (obtido do log de erro)
  const userId = 'wK9BRBsngobSOBFZEYacPLYAHXl2';
  const userRef = doc(firestore, 'users', userId);

  console.log(`Tentando definir permissões para o usuário: ${userId}`);

  // Permissões de administrador completas para todos os módulos
  const adminPermissions = {
    dashboard: { read: true, create: true, update: true, delete: true },
    empresas: { read: true, create: true, update: true, delete: true },
    societario: { read: true, create: true, update: true, delete: true },
    processos: { read: true, create: true, update: true, delete: true },
    obrigacoes: { read: true, create: true, update: true, delete: true },
    fiscal: { read: true, create: true, update: true, delete: true },
    documentos: { read: true, create: true, update: true, delete: true },
    financeiro: { read: true, create: true, update: true, delete: true },
    usuarios: { read: true, create: true, update: true, delete: true },
  };

  try {
    await setDoc(userRef, { permissions: adminPermissions }, { merge: true });
    console.log(`SUCESSO: Permissões de administrador concedidas para o usuário ${userId}.`);
    alert(`Permissões do usuário ${userId} atualizadas para administrador. Por favor, atualize a página.`);
  } catch (error) {
    console.error('ERRO ao definir permissões de administrador:', error);
    alert('Ocorreu um erro ao tentar atualizar as permissões. Verifique o console.');
  }
};

// Para executar esta função, chame-a a partir do console do navegador:
// (window as any).setAdmin();
if (typeof window !== 'undefined') {
  (window as any).setAdmin = setAdminPermissions;
}

console.log('Script de administrador carregado. Chame window.setAdmin() no console para executar.');
