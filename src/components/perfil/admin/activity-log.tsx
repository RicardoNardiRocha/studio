'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface Activity {
  id: string;
  description: string;
  userName: string;
  userAvatarUrl?: string;
  timestamp: Timestamp;
}

export function ActivityLog() {
  const firestore = useFirestore();

  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'activities'), orderBy('timestamp', 'desc'));
  }, [firestore]);

  const { data: activities, isLoading } = useCollection<Activity>(activitiesQuery);

  const formatTimestamp = (timestamp: Timestamp | null) => {
    if (!timestamp) return 'Data indisponível';
    const date = timestamp.toDate();
    return format(date, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
  };

  return (
    <ScrollArea className="h-96">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Data/Hora</TableHead>
            <TableHead className="w-[200px]">Usuário</TableHead>
            <TableHead>Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-5 w-36" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : activities && activities.length > 0 ? (
            activities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell>
                  <Badge variant="outline">{formatTimestamp(activity.timestamp)}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={activity.userAvatarUrl} alt={activity.userName} />
                      <AvatarFallback>
                        {activity.userName?.substring(0, 2) || <User />}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{activity.userName}</span>
                  </div>
                </TableCell>
                <TableCell>{activity.description}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center">
                Nenhum registro de atividade encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
