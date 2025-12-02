
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, BarChart, FileText, Layers, Shield } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-background sticky top-0 z-50 border-b">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Layers className="h-6 w-6 text-primary" />
          <span className="sr-only">ContabilX ERP</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="#features"
            className="text-sm font-medium hover:underline underline-offset-4"
            prefetch={false}
          >
            Funcionalidades
          </Link>
          <Link
            href="#testimonials"
            className="text-sm font-medium hover:underline underline-offset-4"
            prefetch={false}
          >
            Depoimentos
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium hover:underline underline-offset-4"
            prefetch={false}
          >
            Preços
          </Link>
          <Button asChild>
            <Link href="/login">Acessar Plataforma</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    O ERP Inteligente para Escritórios de Contabilidade
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Automatize tarefas, gerencie clientes e ganhe tempo com o ContabilX. A plataforma completa que integra todos os seus processos.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild>
                    <Link href="/login">
                      Começar Agora
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline">
                    Agendar Demonstração
                  </Button>
                </div>
              </div>
              <Image
                src="https://picsum.photos/seed/erp/1200/800"
                width="1200"
                height="800"
                alt="Hero"
                data-ai-hint="accounting software dashboard"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square shadow-lg"
              />
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Principais Funcionalidades</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Tudo que seu escritório precisa</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Desde a gestão de clientes e obrigações até a automação de processos fiscais e contábeis com Inteligência Artificial.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="grid gap-1 text-center">
                <Layers className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-xl font-bold font-headline">Gestão Centralizada</h3>
                <p className="text-muted-foreground">
                  Painel único para todas as empresas, obrigações, processos e documentos.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <Shield className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-xl font-bold font-headline">Controle de Obrigações</h3>
                <p className="text-muted-foreground">
                  Nunca mais perca um prazo. Visualize e gerencie todas as obrigações em um Kanban intuitivo.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <FileText className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-xl font-bold font-headline">Automação com IA</h3>
                <p className="text-muted-foreground">
                  Use IA para resumir documentos fiscais, classificar lançamentos e muito mais.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">
                O que nossos clientes dizem
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Veja como o ContabilX está transformando escritórios de contabilidade.
              </p>
            </div>
            <div className="grid w-full grid-cols-1 lg:grid-cols-3 gap-6 pt-8">
              <Card>
                <CardContent className="p-6">
                  <p className="text-lg font-normal">"O ContabilX revolucionou nossa forma de trabalhar. A automação de tarefas repetitivas nos deu mais tempo para focar na estratégia dos clientes."</p>
                </CardContent>
                <CardHeader className="flex flex-row items-center gap-4 pt-0">
                  <Avatar>
                    <AvatarImage src="https://i.pravatar.cc/40?img=1" />
                    <AvatarFallback>JS</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">Joana Silva</CardTitle>
                    <CardDescription>CEO, Contabiliza+</CardDescription>
                  </div>
                </CardHeader>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-lg font-normal">"A gestão de obrigações ficou muito mais clara e segura. Reduzimos em 90% os erros relacionados a prazos."</p>
                </CardContent>
                <CardHeader className="flex flex-row items-center gap-4 pt-0">
                  <Avatar>
                    <AvatarImage src="https://i.pravatar.cc/40?img=2" />
                    <AvatarFallback>RM</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">Roberto Martins</CardTitle>
                    <CardDescription>Sócio, RM Contadores</CardDescription>
                  </div>
                </CardHeader>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-lg font-normal">"A integração com IA é um diferencial incrível. A classificação de documentos economiza horas de trabalho manual por semana."</p>
                </CardContent>
                <CardHeader className="flex flex-row items-center gap-4 pt-0">
                  <Avatar>
                    <AvatarImage src="https://i.pravatar.cc/40?img=3" />
                    <AvatarFallback>CP</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">Carla Pereira</CardTitle>
                    <CardDescription>Gestora Fiscal, Focus Contabilidade</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6 lg:gap-10">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">Planos Flexíveis para seu Escritório</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Escolha o plano que melhor se adapta ao tamanho e às necessidades da sua equipe.
              </p>
            </div>
            <div className="grid w-full max-w-4xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>Básico</CardTitle>
                  <CardDescription>Para contadores autônomos e pequenos escritórios.</CardDescription>
                  <div className="text-4xl font-bold pt-4">R$99<span className="text-lg font-normal text-muted-foreground">/mês</span></div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <ul className="grid gap-2 text-sm text-left">
                    <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" />Até 10 clientes</li>
                    <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" />Módulos básicos</li>
                    <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" />Suporte por e-mail</li>
                  </ul>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button className="w-full">Assinar Básico</Button>
                </div>
              </Card>
              <Card className="flex flex-col border-primary shadow-lg">
                <CardHeader>
                  <CardTitle>Profissional</CardTitle>
                  <CardDescription>Para escritórios em crescimento com equipes.</CardDescription>
                  <div className="text-4xl font-bold pt-4">R$249<span className="text-lg font-normal text-muted-foreground">/mês</span></div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                   <ul className="grid gap-2 text-sm text-left">
                    <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" />Até 50 clientes</li>
                    <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" />Todos os Módulos</li>
                    <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" />Funções com IA</li>
                    <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" />Suporte prioritário</li>
                  </ul>
                </CardContent>
                 <div className="p-6 pt-0">
                  <Button className="w-full">Assinar Profissional</Button>
                </div>
              </Card>
               <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription>Para grandes operações e necessidades customizadas.</CardDescription>
                  <div className="text-4xl font-bold pt-4">Contato</div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                   <ul className="grid gap-2 text-sm text-left">
                    <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" />Clientes ilimitados</li>
                    <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" />Integrações customizadas</li>
                    <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" />Gerente de conta dedicado</li>
                  </ul>
                </CardContent>
                 <div className="p-6 pt-0">
                  <Button variant="outline" className="w-full">Fale Conosco</Button>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 ContabilX ERP. Todos os direitos reservados.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Termos de Serviço
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Política de Privacidade
          </Link>
        </nav>
      </footer>
    </div>
  )
}
