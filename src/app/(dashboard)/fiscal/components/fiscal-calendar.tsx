
'use client';

import { Calendar } from "@/components/ui/calendar";
import { useState } from 'react';

export function FiscalCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Mock data - replace with actual obligations
  const obligations = [
    { date: new Date(2024, 6, 10), status: 'delivered' },
    { date: new Date(2024, 6, 15), status: 'pending' },
    { date: new Date(2024, 6, 20), status: 'overdue' },
  ];

  const getDayClassName = (day: Date) => {
    const obligation = obligations.find(o => o.date.toDateString() === day.toDateString());
    if (obligation) {
      if (obligation.status === 'delivered') return 'bg-green-200 text-green-800';
      if (obligation.status === 'pending') return 'bg-yellow-200 text-yellow-800';
      if (obligation.status === 'overdue') return 'bg-red-200 text-red-800';
    }
    return '';
  };

  return (
    <Calendar
      mode="month"
      selected={date}
      onSelect={setDate}
      className="rounded-md border"
      classNames={{
        day: (day) => getDayClassName(day),
      }}
    />
  );
}
