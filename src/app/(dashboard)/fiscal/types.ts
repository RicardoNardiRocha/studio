
export type ObligationStatus = "pending" | "delivered" | "overdue";

export interface ObligationDocument {
  id: string;
  name: string;
  url: string;
  userId: string;
  createdAt: Date;
}

export interface ObligationHistory {
  id: string;
  action: string;
  userId: string;
  createdAt: Date;
}

export interface Obligation {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  responsibleId: string;
  status: ObligationStatus;
  periodicity: "monthly" | "quarterly" | "annual";
  dueDate: Date;
  documents: ObligationDocument[];
  history: ObligationHistory[];
  notes?: string;
}
