import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8">
        <div className="text-center">
            <Link href="/" className="inline-block" prefetch={false}>
                <Layers className="h-10 w-10 text-primary mx-auto" />
            </Link>
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100 font-headline">
            Acesse sua conta
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Bem-vindo de volta ao ContaFlow
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Insira seu e-mail e senha para continuar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="password">Senha</Label>
                <Link href="#" className="ml-auto inline-block text-sm underline" prefetch={false}>
                  Esqueceu sua senha?
                </Link>
              </div>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              Entrar
            </Button>
            <Button variant="outline" className="w-full">
              Entrar com Google
            </Button>
          </CardContent>
        </Card>
         <div className="text-center text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <Link href="#" className="underline" prefetch={false}>
                Cadastre-se
            </Link>
         </div>
      </div>
    </div>
  );
}
