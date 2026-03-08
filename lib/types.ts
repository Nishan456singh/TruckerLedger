// ─── Expense Categories ─────────────────────────────

export type Category =
  | "fuel"
  | "toll"
  | "parking"
  | "food"
  | "repair"
  | "other";

// ─── Expense record stored in SQLite ───────────────

export interface Expense {
  id: number;
  amount: number;
  category: Category;
  note: string;
  date: string; // format: YYYY-MM-DD
  receipt_uri: string | null;
  created_at: string;
}

// ─── Input when creating a new expense ─────────────

export interface ExpenseInput {
  amount: number;
  category: Category;
  note?: string;
  date: string;
  receipt_uri?: string | null;
}

// ─── Partial update for editing an expense ─────────

export interface ExpenseUpdate {
  amount?: number;
  category?: Category;
  note?: string;
  date?: string;
  receipt_uri?: string | null;
}

// ─── Dashboard statistics ──────────────────────────

export interface DashboardStats {
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;

  todayCount: number;
  weekCount: number;
  monthCount: number;
}

// ─── Analytics: category breakdown ─────────────────

export interface CategoryStat {
  category: Category;
  total: number;
  count: number;
}