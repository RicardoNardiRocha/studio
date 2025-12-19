'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell, 
  AlertTriangle, 
  FileWarning, 
  CalendarClock, 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getNotifications, Notification, NotificationType } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const notificationIcons = {
  certificate_expiring: FileWarning,
  certificate_expired: FileWarning,
  obligation_due: CalendarClock,
  obligation_overdue: CalendarClock,
  process_status_change: AlertTriangle,
  new_document_added: AlertTriangle,
};

const getSeverityClass = (severity: Notification['severity']) => {
  switch (severity) {
    case 'critical': return 'border-red-500/50 hover:border-red-500/80';
    case 'high': return 'border-orange-400/50 hover:border-orange-400/80';
    case 'medium': return 'border-yellow-400/50 hover:border-yellow-400/80';
    default: return 'border-gray-200 dark:border-gray-700';
  }
};

const filterOptions = {
    todos: 'Todos',
    certificados: 'Certificados',
    obrigações: 'Obrigações',
    processos: 'Processos',
}

export function Notifications() {
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('todos');

  useEffect(() => {
    async function loadNotifications() {
      setIsLoading(true);
      try {
        const fetchedNotifications = await getNotifications();
        setAllNotifications(fetchedNotifications);
        setFilteredNotifications(fetchedNotifications); 
      } catch (error) {
        console.error("Failed to load notifications:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadNotifications();
  }, []);

  useEffect(() => {
    let filtered = allNotifications;
    if (filter !== 'todos') {
        filtered = allNotifications.filter(n => {
            if (filter === 'certificados') {
                return n.type === 'certificate_expired' || n.type === 'certificate_expiring';
            }
            if (filter === 'obrigações') {
                return n.type === 'obligation_due' || n.type === 'obligation_overdue';
            }
            if (filter === 'processos') {
                return n.type === 'process_status_change';
            }
            return false;
        });
    }
    setFilteredNotifications(filtered.sort((a, b) => b.date.getTime() - a.date.getTime()));
  }, [filter, allNotifications]);


  const NotificationItem = ({ item }: { item: Notification }) => {
    const Icon = notificationIcons[item.type] || AlertTriangle;

    return (
      <div className={cn(
        'flex items-start gap-4 p-3 rounded-lg border transition-all',
        getSeverityClass(item.severity)
      )}>
        <div className="mt-1">
          <Icon className={cn('h-5 w-5', {
            'text-red-500': item.severity === 'critical',
            'text-orange-400': item.severity === 'high',
            'text-yellow-400': item.severity === 'medium',
            'text-gray-500': item.severity === 'low',
          })} />
        </div>
        <div className="flex-1">
          <Link href={item.link} className="hover:underline">
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.message}</p>
          </Link>
          <time className="text-xs text-muted-foreground/80">
            {formatDistanceToNow(item.date, { locale: ptBR, addSuffix: true })}
          </time>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className='mb-4 sm:mb-0'>
                <CardTitle className='font-headline flex items-center'>
                    Central de Notificações
                    <span className='ml-3 h-6 w-auto px-2.5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold'>
                        {allNotifications.length}
                    </span>
                </CardTitle>
                <CardDescription>Avisos importantes sobre suas empresas e processos.</CardDescription>
            </div>
            <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrar..." />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(filterOptions).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mt-4">
            {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 p-3 rounded-lg border">
                    <div className='bg-muted rounded-full h-8 w-8 animate-pulse'></div>
                    <div className='flex-1 space-y-2'>
                    <div className='bg-muted h-5 w-3/4 rounded animate-pulse'></div>
                    <div className='bg-muted h-4 w-1/2 rounded animate-pulse'></div>
                    </div>
                </div>
            ))
            ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map(item => <NotificationItem key={item.id} item={item} />)
            ) : (
            <div className="text-center py-10">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">Tudo em ordem! Você não tem notificações no momento.</p>
            </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
