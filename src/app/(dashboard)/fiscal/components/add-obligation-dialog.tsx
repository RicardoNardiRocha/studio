
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export function AddObligationDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">
           Nova Obrigação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Obrigação</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input id="name" placeholder="Nome da Obrigação" />
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Periodicidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensal</SelectItem>
              <SelectItem value="quarterly">Trimestral</SelectItem>
              <SelectItem value="annual">Anual</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                <span>Data de Vencimento</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" initialFocus />
            </PopoverContent>
          </Popover>
           <Select>
            <SelectTrigger>
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="company-a">Empresa A</SelectItem>
               <SelectItem value="company-b">Empresa B</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user-a">João</SelectItem>
              <SelectItem value="user-b">Maria</SelectItem>
            </SelectContent>
          </Select>

        </div>
         <div className="flex justify-end">
            <Button>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
