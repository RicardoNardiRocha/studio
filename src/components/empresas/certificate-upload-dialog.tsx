'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Company } from './company-details-dialog';
import { saveCertificateAction } from '@/lib/actions/certificate-actions';

interface CertificateUploadDialogProps {
  company: Company;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCertificateUpdated: () => void;
}

export function CertificateUploadDialog({
  company,
  open,
  onOpenChange,
  onCertificateUpdated,
}: CertificateUploadDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    formData.append('companyId', company.id);

    const result = await saveCertificateAction(formData);

    if (result.success) {
      toast({
        title: 'Certificado Atualizado!',
        description: result.message,
      });
      onCertificateUpdated();
      onOpenChange(false);
    } else {
      toast({
        title: 'Erro ao Salvar',
        description: result.message,
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar/Atualizar Certificado A1</DialogTitle>
            <DialogDescription>
              Faça o upload do arquivo .pfx e digite a senha. Os dados serão processados e salvos de forma segura no servidor.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="file">Arquivo do Certificado (.pfx)</Label>
              <Input id="file" name="file" type="file" accept=".pfx" required />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="password">Senha do Certificado</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Processar e Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
