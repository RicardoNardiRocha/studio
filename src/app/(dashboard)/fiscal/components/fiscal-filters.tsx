
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export function FiscalFilters() {
  return (
    <div className="flex items-center space-x-4">
      <Select>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Empresa" />
        </SelectTrigger>
        <SelectContent>
          {/* Populate with companies */}
          <SelectItem value="company-a">Empresa A</SelectItem>
          <SelectItem value="company-b">Empresa B</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant={"outline"} className="w-[240px] justify-start text-left font-normal">
            {/* Calendar icon */}
            <span>Selecione o mês</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" initialFocus />
        </PopoverContent>
      </Popover>

      <Select>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Tipo de Obrigação" />
        </SelectTrigger>
        <SelectContent>
          {/* Populate with obligation types */}
          <SelectItem value="federal">Federal</SelectItem>
          <SelectItem value="estadual">Estadual</SelectItem>
          <SelectItem value="municipal">Municipal</SelectItem>
        </SelectContent>
      </Select>

      <Button>Filtrar</Button>
    </div>
  );
}
