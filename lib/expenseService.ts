import { Platform } from "react-native";
import { getDatabase } from "./db";
import type { Category, DashboardStats, Expense, ExpenseInput } from "./types";

const WEB = Platform.OS === "web";
const WEB_ERR =
  "Expenses require the mobile app — SQLite is not available in the web preview.";

const EMPTY_STATS: DashboardStats = {
  todayTotal: 0,
  weekTotal: 0,
  monthTotal: 0,
  todayCount: 0,
  weekCount: 0,
  monthCount: 0,
};

// ─── Create ─────────────────────────────────────────

export async function addExpense(input: ExpenseInput): Promise<number> {
  if (WEB) throw new Error(WEB_ERR);

  const db = await getDatabase();

  const result = await db.runAsync(
    `INSERT INTO expenses (amount, category, note, date, receipt_uri)
     VALUES (?, ?, ?, ?, ?)`,
    [
      input.amount,
      input.category,
      input.note ?? "",
      input.date,
      input.receipt_uri ?? null,
    ]
  );

  return Number(result.lastInsertRowId);
}

// ─── Read ───────────────────────────────────────────

export async function getAllExpenses(): Promise<Expense[]> {
  if (WEB) return [];

  const db = await getDatabase();

  const rows = await db.getAllAsync<Expense>(
    `SELECT * FROM expenses
     ORDER BY date DESC, created_at DESC`
  );

  return rows ?? [];
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
    `SELECT *
     FROM expenses
     WHERE date >= ? AND date <= ?
     ORDER BY date DESC, created_at DESC`,
    [fromDate, toDate]
  );

  return rows ?? [];
}

// ─── Dashboard Stats ─────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  if (WEB) return EMPTY_STATS;

  const db = await getDatabase();

  const now = new Date();

  const todayStr = now.toISOString().split("T")[0];

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const weekStartStr = weekStart.toISOString().split("T")[0];

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  type SumRow = { total: number; count: number };

  const [todayRow, weekRow, monthRow] = await Promise.all([
    db.getFirstAsync<SumRow>(
      `SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS count
       FROM expenses WHERE date = ?`,
      [todayStr]
    ),
    db.getFirstAsync<SumRow>(
      `SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS count
       FROM expenses WHERE date >= ? AND date <= ?`,
      [weekStartStr, todayStr]
    ),
    db.getFirstAsync<SumRow>(
      `SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS count
       FROM expenses WHERE date >= ? AND date <= ?`,
      [monthStart, todayStr]
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

// ─── Update ─────────────────────────────────────────

export async function updateExpense(
  id: number,
  input: Partial<ExpenseInput>
): Promise<void> {
  if (WEB) throw new Error(WEB_ERR);

  const db = await getDatabase();

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.amount !== undefined) {
    fields.push("amount = ?");
    values.push(input.amount);
  }

  if (input.category !== undefined) {
    fields.push("category = ?");
    values.push(input.category);
  }

  if (input.note !== undefined) {
    fields.push("note = ?");
    values.push(input.note);
  }

  if (input.date !== undefined) {
    fields.push("date = ?");
    values.push(input.date);
  }

  if (input.receipt_uri !== undefined) {
    fields.push("receipt_uri = ?");
    values.push(input.receipt_uri ?? null);
  }

  if (!fields.length) return;

  values.push(id);

  await db.runAsync(
    `UPDATE expenses
     SET ${fields.join(", ")}
     WHERE id = ?`,
    values
  );
}

// ─── Delete ─────────────────────────────────────────

export async function deleteExpense(id: number): Promise<void> {
  if (WEB) throw new Error(WEB_ERR);

  const db = await getDatabase();

  await db.runAsync(`DELETE FROM expenses WHERE id = ?`, [id]);
}

// ─── Analytics ──────────────────────────────────────

export interface CategoryStat {
  category: Category;
  total: number;
  count: number;
}

function buildMonthRange(month: number, year: number): {
  fromDate: string;
  toDate: string;
} {
  const monthIndex = month - 1;
  const fromDate = new Date(year, monthIndex, 1).toISOString().split("T")[0];
  const toDate = new Date(year, monthIndex + 1, 0).toISOString().split("T")[0];

  return { fromDate, toDate };
}

export async function getCategoryStats(): Promise<CategoryStat[]> {
  if (WEB) return [];

  const db = await getDatabase();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const today = now.toISOString().split("T")[0];

  const rows = await db.getAllAsync<CategoryStat>(
    `SELECT
       category,
       COALESCE(SUM(amount),0) AS total,
       COUNT(*) AS count
     FROM expenses
     WHERE date >= ? AND date <= ?
     GROUP BY category
     ORDER BY total DESC`,
    [monthStart, today]
  );

  return rows ?? [];
}

export async function getCurrentMonthCategoryTotals(): Promise<
  Record<Category, number>
> {
  const rows = await getCategoryStats();

  const totals: Record<Category, number> = {
    fuel: 0,
    food: 0,
    repair: 0,
    parking: 0,
    toll: 0,
    other: 0,
  };

  for (const row of rows) {
    totals[row.category] = row.total;
  }

  return totals;
}

export async function getMonthlyExpenses(
  month: number,
  year: number
): Promise<Expense[]> {
  if (WEB) return [];

  const db = await getDatabase();
  const { fromDate, toDate } = buildMonthRange(month, year);

  const rows = await db.getAllAsync<Expense>(
    `SELECT *
     FROM expenses
     WHERE date >= ? AND date <= ?
     ORDER BY date DESC, created_at DESC`,
    [fromDate, toDate]
  );

  return rows ?? [];
}

export async function getCategoryTotals(
  month: number,
  year: number
): Promise<Record<Category, number>> {
  if (WEB) {
    return {
      fuel: 0,
      toll: 0,
      parking: 0,
      food: 0,
      repair: 0,
      other: 0,
    };
  }

  const db = await getDatabase();
  const { fromDate, toDate } = buildMonthRange(month, year);

  type CategoryTotalRow = {
    category: Category;
    total: number;
  };

  const rows = await db.getAllAsync<CategoryTotalRow>(
    `SELECT
       category,
       COALESCE(SUM(amount),0) AS total
     FROM expenses
     WHERE date >= ? AND date <= ?
     GROUP BY category`,
    [fromDate, toDate]
  );

  const totals: Record<Category, number> = {
    fuel: 0,
    toll: 0,
    parking: 0,
    food: 0,
    repair: 0,
    other: 0,
  };

  for (const row of rows ?? []) {
    totals[row.category] = row.total;
  }

  return totals;
}

export async function getReceiptCount(
  month?: number,
  year?: number
): Promise<number> {
  if (WEB) return 0;

  const db = await getDatabase();

  type CountRow = { count: number };

  if (month !== undefined && year !== undefined) {
    const { fromDate, toDate } = buildMonthRange(month, year);

    const row = await db.getFirstAsync<CountRow>(
      `SELECT COUNT(*) AS count
       FROM expenses
       WHERE date >= ? AND date <= ?
         AND receipt_uri IS NOT NULL
         AND receipt_uri != ''`,
      [fromDate, toDate]
    );

    return row?.count ?? 0;
  }

  const row = await db.getFirstAsync<CountRow>(
    `SELECT COUNT(*) AS count
     FROM expenses
     WHERE receipt_uri IS NOT NULL
       AND receipt_uri != ''`
  );

  return row?.count ?? 0;
}

export async function getMonthlyTotal(
  month: number,
  year: number
): Promise<number> {
  if (WEB) return 0;

  const db = await getDatabase();
  const { fromDate, toDate } = buildMonthRange(month, year);

  type TotalRow = { total: number };

  const row = await db.getFirstAsync<TotalRow>(
    `SELECT COALESCE(SUM(amount),0) AS total
     FROM expenses
     WHERE date >= ? AND date <= ?`,
    [fromDate, toDate]
  );

  return row?.total ?? 0;
}

// ─── CSV Export ─────────────────────────────────────

function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";

  const s = String(value);

  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }

  return s;
}

export async function exportExpenses(): Promise<string> {
  if (WEB) throw new Error(WEB_ERR);

  const expenses = await getAllExpenses();

  const header = "Date,Category,Amount,Note";

  const rows = expenses.map((e) =>
    [
      escapeCsvField(e.date),
      escapeCsvField(e.category),
      escapeCsvField(e.amount),
      escapeCsvField(e.note),
    ].join(",")
  );

  return [header, ...rows].join("\n");
}