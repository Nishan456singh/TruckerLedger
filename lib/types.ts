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
  receipt_image: string | null;
  ocr_text: string | null;
  created_at: string;
}

// ─── Input when creating a new expense ─────────────

export interface ExpenseInput {
  amount: number;
  category: Category;
  note?: string;
  date: string;
  receipt_uri?: string | null;
  receipt_image?: string | null;
  ocr_text?: string | null;
}

// ─── Partial update for editing an expense ─────────

export interface ExpenseUpdate {
  amount?: number;
  category?: Category;
  note?: string;
  date?: string;
  receipt_uri?: string | null;
  receipt_image?: string | null;
  ocr_text?: string | null;
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

// ─── Trip Profit ───────────────────────────────────

export interface TripInput {
  income: number;
  fuel: number;
  tolls: number;
  food: number;
  parking: number;
  repairs: number;
  other_expenses: number;
  date: string;
  note?: string;
}

export interface Trip extends TripInput {
  id: number;
  total_expenses: number;
  profit: number;
  created_at: string;
}

// ─── BOL ───────────────────────────────────────────

export interface BOLInput {
  pickup_location: string;
  delivery_location: string;
  load_amount: number | null;
  date: string;
  broker: string;
  image_uri: string | null;
  ocr_text?: string | null;
}

export interface BOLRecord extends BOLInput {
  id: number;
  created_at: string;
}