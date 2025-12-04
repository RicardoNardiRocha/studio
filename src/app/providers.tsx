'use client'
import { FirebaseClientProvider } from "@/firebase";

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <FirebaseClientProvider>
            {children}
        </FirebaseClientProvider>
    )
}