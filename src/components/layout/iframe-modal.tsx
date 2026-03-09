'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface IframeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  src: string;
}

export function IframeModal({
  open,
  onOpenChange,
  title,
  description,
  src,
}: IframeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden px-6 pb-6">
          <iframe
            src={src}
            className="w-full h-full border-0 rounded-md"
            title={title}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
