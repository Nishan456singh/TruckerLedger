import { Platform } from 'react-native';
import { getDatabase } from './db';
import type { DashboardStats, Expense, ExpenseInput } from './types';

// expo-sqlite is not available on web.
// Reads return empty defaults so the UI renders without crashing.
// Writes throw so the caller can surface a clear error to the user.
const WEB = Platform.OS === 'web';
const WEB_ERR = 'Expenses require the mobile app — SQLite is not available in the web preview.';

const EMPTY_STATS: DashboardStats = {
  todayTotal: 0,
  weekTotal: 0,
  monthTotal: 0,
  todayCount: 0,
  weekCount: 0,
  monthCount: 0,
};

// ─── Create ────────────────────────────────────────────────────────────────────

export async function addExpense(input: ExpenseInput): Promise<number> {
  if (WEB) throw new Error(WEB_ERR);
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO expenses (amount, category, note, date, receipt_uri)
     VALUES (?, ?, ?, ?, ?)`,
    [
      input.amount,
      input.category,
      input.note,
      input.date,
      input.receipt_uri ?? null,
    ]
  );
  return result.lastInsertRowId;
}

// ─── Read ──────────────────────────────────────────────────────────────────────

export async function getAllExpenses(): Promise<Expense[]> {
  if (WEB) return [];
  const db = await getDatabase();
  const rows = await db.getAllAsync<Expense>(
    `SELECT * FROM expenses ORDER BY date DESC, created_at DESC`
  );
  return rows;
}

export async function getExpenseById(id: number): Promise<Expense | null> {
  if (WEB) return null;
  const db = await getDatabase();
  const row = await db.getFirstAsync<Expense>(
    `SELECT * FROM expenses WHERE id = ?`,
    [id]
  );
  return row ?? null;
}

export async function getExpensesByDateRange(
  fromDate: string,
  toDate: string
): Promise<Expense[]> {
  if (WEB) return [];
  const db = await getDatabase();
  const rows = await db.getAllAsync<Expense>(
    `SELECT * FROM expenses
     WHERE date >= ? AND date <= ?
     ORDER BY date DESC, created_at DESC`,
    [fromDate, toDate]
  );
  return rows;
}

// ─── Dashboard Stats ───────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  if (WEB) return EMPTY_STATS;
  const db = await getDatabase();

  const now = new Date();

  // Today
  const todayStr = now.toISOString().split('T')[0];

  // Start of this week (Monday)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  const weekStartStr = weekStart.toISOString().split('T')[0];

  // Start of this month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  type SumRow = { total: number; count: number };

  const [todayRow, weekRow, monthRow] = await Promise.all([
    db.getFirstAsync<SumRow>(
      `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
       FROM expenses WHERE date = ?`,
      [todayStr]
    ),
    db.getFirstAsync<SumRow>(
      `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
       FROM expenses WHERE date >= ? AND date <= ?`,
      [weekStartStr, todayStr]
    ),
    db.getFirstAsync<SumRow>(
      `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
       FROM expenses WHERE date >= ? AND date <= ?`,
      [monthStartStr, todayStr]
    ),
  ]);

  return {
    todayTotal: todayRow?.total ?? 0,
    weekTotal: weekRow?.total ?? 0,
    monthTotal: monthRow?.total ?? 0,
    todayCount: todayRow?.count ?? 0,
    weekCount: weekRow?.count ?? 0,
    monthCount: monthRow?.count ?? 0,
  };
}

// ─── Update ────────────────────────────────────────────────────────────────────

export async function updateExpense(
  id: number,
  input: Partial<ExpenseInput>
): Promise<void> {
  if (WEB) throw new Error(WEB_ERR);
  const db = await getDatabase();

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.amount !== undefined) {
    fields.push('amount = ?');
    values.push(input.amount);
  }
  if (input.category !== undefined) {
    fields.push('category = ?');
    values.push(input.category);
  }
  if (input.note !== undefined) {
    fields.push('note = ?');
    values.push(input.note);
  }
  if (input.date !== undefined) {
    fields.push('date = ?');
    values.push(input.date);
  }
  if (input.receipt_uri !== undefined) {
    fields.push('receipt_uri = ?');
    values.push(input.receipt_uri ?? null);
  }

  if (fields.length === 0) return;

  values.push(id);
  await db.runAsync(
    `UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

// ─── Delete ────────────────────────────────────────────────────────────────────

export async function deleteExpense(id: number): Promise<void> {
  if (WEB) throw new Error(WEB_ERR);
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM expenses WHERE id = ?`, [id]);
}
