export type Category = 'fuel' | 'toll' | 'parking' | 'food' | 'repair' | 'other';

export interface Expense {
  id: number;
  amount: number;
  category: Category;
  note: string;
  date: string; // ISO date string
  receipt_uri: string | null;
  created_at: string;
}

export interface ExpenseInput {
  amount: number;
  category: Category;
  note: string;
  date: string;
  receipt_uri?: string | null;
}

export interface DashboardStats {
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
  todayCount: number;
  weekCount: number;
  monthCount: number;
}
