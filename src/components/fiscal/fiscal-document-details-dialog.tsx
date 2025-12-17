'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { FiscalDocument } from '@/app/(dashboard)/fiscal/components/fiscal-client';
import { Download } from 'lucide-react';

interface FiscalDocumentDetailsDialogProps {
  document: FiscalDocument;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FiscalDocumentDetailsDialog({ document, open, onOpenChange }: FiscalDocumentDetailsDialogProps) {

  const getStatusVariant = (status: FiscalDocument['status']): 'default' | 'secondary' | 'destructive' | 'outline' | null | undefined => {
    switch (status) {
      case 'Ativa': return 'default';
      case 'Cancelada': return 'destructive';
      case 'Inutilizada': return 'secondary';
      case 'Denegada': return 'destructive';
      case 'Rejeitada': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalhes do Documento Fiscal</DialogTitle>
          <DialogDescription>
            {document.documentType} - {document.companyName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Empresa</span>
                <span className="font-medium">{document.companyName}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">CNPJ</span>
                <span className="font-medium">{document.companyCnpj}</span>
            </div>
             <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Competência</span>
                <span className="font-medium">{document.competencia}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={getStatusVariant(document.status)}>{document.status}</Badge>
            </div>
             <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Data do Upload</span>
                <span className="font-medium">{new Date(document.uploadedAt).toLocaleString('pt-BR')}</span>
            </div>
        </div>
        <DialogFooter className='sm:justify-between'>
            <Button asChild variant="outline">
                <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Arquivo
                </a>
            </Button>
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
