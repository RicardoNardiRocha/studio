'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { collection, limit, orderBy, query, Timestamp } from 'firebase/firestore';
import { User } from 'lucide-react';

interface Activity {
  id: string;
  description: string;
  userName: string;
  userAvatarUrl?: string;
  timestamp: Timestamp;
}


export function RecentActivities() {
  const firestore = useFirestore();

  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'activities'), orderBy('timestamp', 'desc'), limit(5));
  }, [firestore]);

  const { data: activities, isLoading } = useCollection<Activity>(activitiesQuery);

  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="ml-4 space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))
      ) : activities && activities.length > 0 ? (
        activities.map((activity) => (
          <div key={activity.id} className="flex items-center">
            <Avatar className="h-9 w-9">
               <AvatarImage src={activity.userAvatarUrl} alt={activity.userName} />
               <AvatarFallback>{activity.userName?.substring(0, 2) || <User />}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">{activity.description}</p>
              <p className="text-sm text-muted-foreground">{formatTimestamp(activity.timestamp)} por {activity.userName}</p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente.</p>
      )}
    </div>
  );
}
