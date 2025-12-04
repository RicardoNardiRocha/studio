
import { AppHeader } from '@/components/layout/header';
import { ProfileClient } from '@/components/perfil/profile-client';

export default function ProfilePage() {
  return (
    <>
      <AppHeader pageTitle="Meu Perfil" />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <ProfileClient />
      </main>
    </>
  );
}
