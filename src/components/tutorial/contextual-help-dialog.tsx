'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { tutorialData, FormattedText } from "./tutorial-client";
import { useMemo } from "react";
import { HelpCircle } from "lucide-react";

interface ContextualHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
}

const moduleMapping: { [key: string]: string } = {
  '/dashboard': '1. Primeiros Passos e Acesso',
  '/empresas': '3. Módulo de Empresas',
  '/societario': '4. Módulo Societário',
  '/processos': '7. Módulo de Processos',
  '/obrigacoes': '6. Módulo de Obrigações',
  '/fiscal': '5. Módulo Fiscal',
  '/documentos': '9. Módulo de Documentos',
  '/financeiro': '8. Módulo Financeiro',
  '/usuarios': '2. Módulo de Usuários (Apenas Administradores)',
  '/perfil': '1. Primeiros Passos e Acesso',
  '/tutorial': 'all' // Special case to show all
};

export function ContextualHelpDialog({ open, onOpenChange, pathname }: ContextualHelpDialogProps) {
  const relevantTutorial = useMemo(() => {
    const matchingKey = Object.keys(moduleMapping).find(key => pathname.startsWith(key));
    const title = matchingKey ? moduleMapping[matchingKey] : null;

    if (!title) {
        return null;
    }
    if (title === 'all') {
        return tutorialData;
    }

    return tutorialData.filter(section => section.title === title);
  }, [pathname]);

  const dialogTitle = relevantTutorial && relevantTutorial.length === 1 ? relevantTutorial[0].title : "Ajuda do Módulo";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            Aqui está um guia rápido sobre as funcionalidades desta tela. Para o tutorial completo, visite a página "Tutorial".
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-4">
          {relevantTutorial && relevantTutorial.length > 0 ? (
            <Accordion type="single" collapsible className="w-full" defaultValue={`item-0-0`}>
              {relevantTutorial.map((section, sectionIndex) =>
                section.content.map((item, itemIndex) => (
                  <AccordionItem value={`item-${sectionIndex}-${itemIndex}`} key={itemIndex}>
                    <AccordionTrigger className="font-semibold text-left">
                      {item.subtitle}
                    </AccordionTrigger>
                    <AccordionContent>
                      <FormattedText text={item.text} />
                    </AccordionContent>
                  </AccordionItem>
                ))
              )}
            </Accordion>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma ajuda contextual encontrada para esta página.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
