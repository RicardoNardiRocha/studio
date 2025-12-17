'use client';
import { useState } from 'react';

// Mock data - replace with real data fetching later
export const useFiscalSummary = () => {
  const [summary] = useState({
    inDay: 42,
    withPendencies: 8,
    monthDocuments: 312,
  });
  const [isLoading] = useState(false);

  return { ...summary, isLoading };
};
