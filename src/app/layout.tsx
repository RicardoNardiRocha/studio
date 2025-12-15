
'use client';

import type { Metadata } from 'next';
import { Poppins, Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { ClientProviders } from './providers';
import { AuthHandler } from '@/components/layout/auth-handler';

const fontPoppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-headline',
});

const fontInter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

// export const metadata: Metadata = {
//   title: 'ContabilX ERP',
//   description: 'Plataforma completa para gestão de escritórios de contabilidade.',
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={cn('font-body antialiased', fontPoppins.variable, fontInter.variable)}>
        <ClientProviders>
          <AuthHandler>{children}</AuthHandler>
          <Toaster />
        </ClientProviders>
      </body>
    </html>
  );
}

