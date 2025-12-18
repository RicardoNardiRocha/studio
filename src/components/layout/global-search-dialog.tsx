'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useFirestore } from '@/firebase';
import {
  collection,
  query,
  orderBy,
  getDocs,
  collectionGroup,
} from 'firebase/firestore';
import {
  Building,
  Briefcase,
  Users,
  Workflow,
  ShieldCheck,
  Search as SearchIcon,
  Loader2,
} from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  category: string;
  title: string;
  description: string;
  path: string;
}

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryInfo = {
  Empresas: { icon: Building, color: 'text-sky-500' },
  Sócios: { icon: Briefcase, color: 'text-teal-500' },
  Usuários: { icon: Users, color: 'text-indigo-500' },
  Processos: { icon: Workflow, color: 'text-purple-500' },
  Obrigações: { icon: ShieldCheck, color: 'text-amber-500' },
};

export function GlobalSearchDialog({
  open,
  onOpenChange,
}: GlobalSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    const performSearch = async () => {
      if (!firestore || searchTerm.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      const searchLower = searchTerm.toLowerCase();
      let allResults: SearchResult[] = [];

      try {
        const queries = [
          {
            q: query(collection(firestore, 'companies')),
            category: 'Empresas',
            fields: ['name', 'cnpj'],
            path: '/empresas'
          },
          {
            q: query(collection(firestore, 'partners')),
            category: 'Sócios',
            fields: ['name', 'cpf'],
            path: '/societario'
          },
          {
            q: query(collection(firestore, 'users')),
            category: 'Usuários',
            fields: ['displayName', 'email'],
            path: '/usuarios'
          },
          {
            q: query(collectionGroup(firestore, 'corporateProcesses')),
            category: 'Processos',
            fields: ['processType', 'companyName'],
            path: '/processos'
          },
          {
            q: query(collectionGroup(firestore, 'taxObligations')),
            category: 'Obrigações',
            fields: ['nome', 'companyName'],
            path: '/obrigacoes'
          },
        ];

        const promises = queries.map(async ({ q, category, fields, path }) => {
          const snapshot = await getDocs(q);
          snapshot.forEach((doc) => {
            const data = doc.data();
            for (const field of fields) {
              if (
                data[field] &&
                data[field].toString().toLowerCase().includes(searchLower)
              ) {
                allResults.push({
                  id: doc.id,
                  category,
                  title: data.name || data.displayName || data.processType || data.nome,
                  description: `Relacionado a: ${data.companyName || data.email || data.cpf || ''}`,
                  path,
                });
                break; 
              }
            }
          });
        });

        await Promise.all(promises);

        allResults.sort((a, b) => a.category.localeCompare(b.category));

        setResults(allResults);
      } catch (error) {
        console.error('Error performing global search:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, firestore]);

  const groupedResults = useMemo(() => {
    return results.reduce((acc, result) => {
      (acc[result.category] = acc[result.category] || []).push(result);
      return acc;
    }, {} as Record<string, SearchResult[]>);
  }, [results]);

  const handleResultClick = (path: string) => {
    router.push(path);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[70vh] flex flex-col p-0">
        <DialogHeader className='p-6 pb-0'>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar em todo o sistema..."
              className="pl-10 text-lg h-12"
              autoFocus
            />
             {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin" />}
          </div>
        </DialogHeader>
        <ScrollArea className="flex-grow">
            <div className="p-6 pt-2">
            {Object.keys(groupedResults).length > 0 ? (
                <div className="space-y-4">
                {Object.entries(groupedResults).map(([category, items]) => {
                    const Info = categoryInfo[category as keyof typeof categoryInfo];
                    const Icon = Info?.icon || Building;
                    const color = Info?.color || 'text-foreground';
                    return (
                    <div key={category}>
                        <h3 className={`font-semibold text-sm flex items-center gap-2 mb-2 ${color}`}>
                            <Icon className="h-4 w-4" />
                            {category}
                        </h3>
                        <ul className="space-y-1">
                        {items.map((item) => (
                            <li
                                key={`${item.category}-${item.id}`}
                                className="p-2 rounded-md hover:bg-accent cursor-pointer"
                                onClick={() => handleResultClick(item.path)}
                            >
                                <p className="font-medium truncate">{item.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                            </li>
                        ))}
                        </ul>
                    </div>
                    )
                })}
                </div>
            ) : (
                !isLoading && searchTerm.length > 1 && (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">Nenhum resultado encontrado para "{searchTerm}".</p>
                </div>
                )
            )}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
