import { Platform } from "react-native";
import { getDatabase } from "./db";
import type { Trip, TripInput } from "./types";

const WEB = Platform.OS === "web";

export function calculateTripProfit(input: Omit<TripInput, "date" | "note">): {
  totalExpenses: number;
  profit: number;
} {
  const totalExpenses =
    input.fuel +
    input.tolls +
    input.food +
    input.parking +
    input.repairs +
    input.other_expenses;

  const profit = input.income - totalExpenses;

  return {
    totalExpenses: Number(totalExpenses.toFixed(2)),
    profit: Number(profit.toFixed(2)),
  };
}

export async function createTrip(input: TripInput): Promise<number> {
  if (WEB) throw new Error("Trips require the mobile app.");

  const db = await getDatabase();

  const { totalExpenses, profit } = calculateTripProfit({
    income: input.income,
    fuel: input.fuel,
    tolls: input.tolls,
    food: input.food,
    parking: input.parking,
    repairs: input.repairs,
    other_expenses: input.other_expenses,
  });

  const result = await db.runAsync(
    `INSERT INTO trips (
      income,
      fuel,
      tolls,
      food,
      parking,
      repairs,
      other_expenses,
      total_expenses,
      profit,
      date,
      note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.income,
      input.fuel,
      input.tolls,
      input.food,
      input.parking,
      input.repairs,
      input.other_expenses,
      totalExpenses,
      profit,
      input.date,
      input.note ?? "",
    ]
  );

  return Number(result.lastInsertRowId);
}

export async function getTripById(id: number): Promise<Trip | null> {
  if (WEB) return null;

  const db = await getDatabase();

  const row = await db.getFirstAsync<Trip>(
    `SELECT
      id,
      income,
      fuel,
      tolls,
      food,
      parking,
      repairs,
      other_expenses,
      total_expenses,
      profit,
      date,
      note,
      created_at
    FROM trips
    WHERE id = ?`,
    [id]
  );

  return row ?? null;
}

export async function updateTrip(id: number, input: Partial<TripInput>): Promise<void> {
  if (WEB) throw new Error("Trips require the mobile app.");

  const db = await getDatabase();

  // Get current trip to preserve existing values
  const current = await getTripById(id);
  if (!current) throw new Error("Trip not found");

  // Merge with new values
  const updated: TripInput = {
    income: input.income ?? current.income,
    fuel: input.fuel ?? current.fuel,
    tolls: input.tolls ?? current.tolls,
    food: input.food ?? current.food,
    parking: input.parking ?? current.parking,
    repairs: input.repairs ?? current.repairs,
    other_expenses: input.other_expenses ?? current.other_expenses,
    date: input.date ?? current.date,
    note: input.note ?? current.note,
  };

  // Recalculate expenses and profit
  const { totalExpenses, profit } = calculateTripProfit({
    income: updated.income,
    fuel: updated.fuel,
    tolls: updated.tolls,
    food: updated.food,
    parking: updated.parking,
    repairs: updated.repairs,
    other_expenses: updated.other_expenses,
  });

  await db.runAsync(
    `UPDATE trips SET
      income = ?,
      fuel = ?,
      tolls = ?,
      food = ?,
      parking = ?,
      repairs = ?,
      other_expenses = ?,
      total_expenses = ?,
      profit = ?,
      date = ?,
      note = ?
    WHERE id = ?`,
    [
      updated.income,
      updated.fuel,
      updated.tolls,
      updated.food,
      updated.parking,
      updated.repairs,
      updated.other_expenses,
      totalExpenses,
      profit,
      updated.date,
      updated.note,
      id,
    ]
  );
}

export async function deleteTrip(id: number): Promise<void> {
  if (WEB) throw new Error("Trips require the mobile app.");

  const db = await getDatabase();

  await db.runAsync(`DELETE FROM trips WHERE id = ?`, [id]);
}

export async function getTripCount(): Promise<number> {
  if (WEB) return 0;

  const db = await getDatabase();

  type CountRow = { count: number };

  const row = await db.getFirstAsync<CountRow>(`SELECT COUNT(*) AS count FROM trips`);

  return row?.count ?? 0;
}

export async function getTrips(): Promise<Trip[]> {
  if (WEB) return [];

  const db = await getDatabase();

  const rows = await db.getAllAsync<Trip>(
    `SELECT
      id,
      income,
      fuel,
      tolls,
      food,
      parking,
      repairs,
      other_expenses,
      total_expenses,
      profit,
      date,
      note,
      created_at
    FROM trips
    ORDER BY date DESC, created_at DESC`
  );

  return rows ?? [];
}

export async function getWeeklyTripSnapshot(): Promise<{
  income: number;
  fuel: number;
  otherExpenses: number;
  profit: number;
}> {
  if (WEB) {
    return {
      income: 0,
      fuel: 0,
      otherExpenses: 0,
      profit: 0,
    };
  }

  const db = await getDatabase();

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));

  const fromDate = weekStart.toISOString().split("T")[0];
  const toDate = now.toISOString().split("T")[0];

  type Row = {
    income: number;
    fuel: number;
    other_expenses: number;
    profit: number;
  };

  const row = await db.getFirstAsync<Row>(
    `SELECT
      COALESCE(SUM(income),0) AS income,
      COALESCE(SUM(fuel),0) AS fuel,
      COALESCE(SUM(tolls + food + parking + repairs + other_expenses),0) AS other_expenses,
      COALESCE(SUM(profit),0) AS profit
    FROM trips
    WHERE date >= ? AND date <= ?`,
    [fromDate, toDate]
  );

  return {
    income: row?.income ?? 0,
    fuel: row?.fuel ?? 0,
    otherExpenses: row?.other_expenses ?? 0,
    profit: row?.profit ?? 0,
  };
}

export async function getMonthlyTripSnapshot(): Promise<{
  income: number;
  fuel: number;
  otherExpenses: number;
  profit: number;
  tripCount: number;
}> {
  if (WEB) {
    return {
      income: 0,
      fuel: 0,
      otherExpenses: 0,
      profit: 0,
      tripCount: 0,
    };
  }

  const db = await getDatabase();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const monthEnd = now.toISOString().split("T")[0];

  type Row = {
    income: number;
    fuel: number;
    other_expenses: number;
    profit: number;
    trip_count: number;
  };

  const row = await db.getFirstAsync<Row>(
    `SELECT
      COALESCE(SUM(income),0) AS income,
      COALESCE(SUM(fuel),0) AS fuel,
      COALESCE(SUM(tolls + food + parking + repairs + other_expenses),0) AS other_expenses,
      COALESCE(SUM(profit),0) AS profit,
      COUNT(*) AS trip_count
    FROM trips
    WHERE date >= ? AND date <= ?`,
    [monthStart, monthEnd]
  );

  return {
    income: row?.income ?? 0,
    fuel: row?.fuel ?? 0,
    otherExpenses: row?.other_expenses ?? 0,
    profit: row?.profit ?? 0,
    tripCount: row?.trip_count ?? 0,
  };
}

export async function getMonthlyInsights(): Promise<{
  bestTripProfit: number;
  profitableTripsCount: number;
  totalTripsCount: number;
  averageTripProfit: number;
}> {
  if (WEB) {
    return {
      bestTripProfit: 0,
      profitableTripsCount: 0,
      totalTripsCount: 0,
      averageTripProfit: 0,
    };
  }

  const db = await getDatabase();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const monthEnd = now.toISOString().split("T")[0];

  type InsightRow = {
    best_profit: number;
    profitable_count: number;
    total_count: number;
    avg_profit: number;
  };

  const row = await db.getFirstAsync<InsightRow>(
    `SELECT
      MAX(profit) AS best_profit,
      SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END) AS profitable_count,
      COUNT(*) AS total_count,
      AVG(profit) AS avg_profit
    FROM trips
    WHERE date >= ? AND date <= ?`,
    [monthStart, monthEnd]
  );

  return {
    bestTripProfit: row?.best_profit ?? 0,
    profitableTripsCount: row?.profitable_count ?? 0,
    totalTripsCount: row?.total_count ?? 0,
    averageTripProfit: Number((row?.avg_profit ?? 0).toFixed(2)),
  };
}

// ─── Analytics Data ─────────────────────────────────────

export interface ProfitTrendPoint {
  date: string;
  profit: number;
  income: number;
  expenses: number;
}

export async function getProfitTrend(days: number = 30): Promise<ProfitTrendPoint[]> {
  if (WEB) return [];

  const db = await getDatabase();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const fromDate = startDate.toISOString().split("T")[0];

  const rows = await db.getAllAsync<{
    date: string;
    profit: number;
    income: number;
    total_expenses: number;
  }>(
    `SELECT
      date,
      COALESCE(SUM(profit),0) AS profit,
      COALESCE(SUM(income),0) AS income,
      COALESCE(SUM(total_expenses),0) AS total_expenses
    FROM trips
    WHERE date >= ?
    GROUP BY date
    ORDER BY date ASC`,
    [fromDate]
  );

  return (rows ?? []).map((row) => ({
    date: row.date,
    profit: row.profit,
    income: row.income,
    expenses: row.total_expenses,
  }));
}

export interface DailyStats {
  bestDay: { date: string; profit: number };
  worstDay: { date: string; profit: number };
  averageDailyProfit: number;
  totalDays: number;
}

export async function getDailyStats(month?: number, year?: number): Promise<DailyStats> {
  if (WEB) {
    return {
      bestDay: { date: "", profit: 0 },
      worstDay: { date: "", profit: 0 },
      averageDailyProfit: 0,
      totalDays: 0,
    };
  }

  const db = await getDatabase();

  const now = new Date();
  const queryMonth = month ?? now.getMonth() + 1;
  const queryYear = year ?? now.getFullYear();

  const monthStart = new Date(queryYear, queryMonth - 1, 1)
    .toISOString()
    .split("T")[0];
  const monthEnd = new Date(queryYear, queryMonth, 0)
    .toISOString()
    .split("T")[0];

  type DayRow = {
    date: string;
    daily_profit: number;
  };

  const rows = await db.getAllAsync<DayRow>(
    `SELECT
      date,
      SUM(profit) AS daily_profit
    FROM trips
    WHERE date >= ? AND date <= ?
    GROUP BY date
    ORDER BY daily_profit DESC`,
    [monthStart, monthEnd]
  );

  if (!rows || rows.length === 0) {
    return {
      bestDay: { date: "", profit: 0 },
      worstDay: { date: "", profit: 0 },
      averageDailyProfit: 0,
      totalDays: 0,
    };
  }

  const bestDay = rows[0];
  const worstDay = rows[rows.length - 1];
  const avgProfit =
    rows.reduce((sum, row) => sum + row.daily_profit, 0) / rows.length;

  return {
    bestDay: { date: bestDay.date, profit: bestDay.daily_profit },
    worstDay: { date: worstDay.date, profit: worstDay.daily_profit },
    averageDailyProfit: Number(avgProfit.toFixed(2)),
    totalDays: rows.length,
  };
}

export interface CategoryAnalysis {
  category: string;
  totalAmount: number;
  tripCount: number;
  averagePerTrip: number;
  percentage: number;
}

export async function getCategoryAnalysis(month?: number, year?: number): Promise<CategoryAnalysis[]> {
  if (WEB) return [];

  const db = await getDatabase();

  const now = new Date();
  const queryMonth = month ?? now.getMonth() + 1;
  const queryYear = year ?? now.getFullYear();

  const monthStart = new Date(queryYear, queryMonth - 1, 1)
    .toISOString()
    .split("T")[0];
  const monthEnd = new Date(queryYear, queryMonth, 0)
    .toISOString()
    .split("T")[0];

  type CategoryRow = {
    category: string;
    total_amount: number;
    trip_count: number;
  };

  const categoryData = await db.getAllAsync<CategoryRow>(
    `SELECT
      'fuel' as category,
      SUM(fuel) as total_amount,
      COUNT(*) as trip_count
    FROM trips
    WHERE date >= ? AND date <= ? AND fuel > 0
    GROUP BY category
    UNION ALL
    SELECT 'tolls', SUM(tolls), COUNT(*)
    FROM trips WHERE date >= ? AND date <= ? AND tolls > 0
    UNION ALL
    SELECT 'food', SUM(food), COUNT(*)
    FROM trips WHERE date >= ? AND date <= ? AND food > 0
    UNION ALL
    SELECT 'parking', SUM(parking), COUNT(*)
    FROM trips WHERE date >= ? AND date <= ? AND parking > 0
    UNION ALL
    SELECT 'repairs', SUM(repairs), COUNT(*)
    FROM trips WHERE date >= ? AND date <= ? AND repairs > 0
    UNION ALL
    SELECT 'other', SUM(other_expenses), COUNT(*)
    FROM trips WHERE date >= ? AND date <= ? AND other_expenses > 0`,
    [
      monthStart, monthEnd,
      monthStart, monthEnd,
      monthStart, monthEnd,
      monthStart, monthEnd,
      monthStart, monthEnd,
      monthStart, monthEnd,
    ]
  );

  const totalExpenses = (categoryData ?? []).reduce(
    (sum, row) => sum + (row.total_amount ?? 0),
    0
  );

  return (categoryData ?? [])
    .filter((row) => row.total_amount && row.total_amount > 0)
    .map((row) => ({
      category: row.category,
      totalAmount: row.total_amount ?? 0,
      tripCount: row.trip_count ?? 0,
      averagePerTrip: Number(
        (((row.total_amount ?? 0) / (row.trip_count ?? 1)).toFixed(2))
      ),
      percentage: totalExpenses > 0
        ? Number((((row.total_amount ?? 0) / totalExpenses) * 100).toFixed(1))
        : 0,
    }));
}

export interface FuelEfficiencyData {
  monthlyFuelCost: number;
  monthlyIncome: number;
  tripCount: number;
  averageFuelPerTrip: number;
  fuelAsPercentage: number;
}

export async function getFuelEfficiencyData(month?: number, year?: number): Promise<FuelEfficiencyData> {
  if (WEB) {
    return {
      monthlyFuelCost: 0,
      monthlyIncome: 0,
      tripCount: 0,
      averageFuelPerTrip: 0,
      fuelAsPercentage: 0,
    };
  }

  const db = await getDatabase();

  const now = new Date();
  const queryMonth = month ?? now.getMonth() + 1;
  const queryYear = year ?? now.getFullYear();

  const monthStart = new Date(queryYear, queryMonth - 1, 1)
    .toISOString()
    .split("T")[0];
  const monthEnd = new Date(queryYear, queryMonth, 0)
    .toISOString()
    .split("T")[0];

  type FuelRow = {
    total_fuel: number;
    total_income: number;
    trip_count: number;
  };

  const row = await db.getFirstAsync<FuelRow>(
    `SELECT
      COALESCE(SUM(fuel),0) AS total_fuel,
      COALESCE(SUM(income),0) AS total_income,
      COUNT(*) AS trip_count
    FROM trips
    WHERE date >= ? AND date <= ?`,
    [monthStart, monthEnd]
  );

  const monthlyFuelCost = row?.total_fuel ?? 0;
  const monthlyIncome = row?.total_income ?? 0;
  const tripCount = row?.trip_count ?? 0;
  const averageFuelPerTrip = tripCount > 0 ? monthlyFuelCost / tripCount : 0;
  const fuelAsPercentage = monthlyIncome > 0 ? (monthlyFuelCost / monthlyIncome) * 100 : 0;

  return {
    monthlyFuelCost: Number(monthlyFuelCost.toFixed(2)),
    monthlyIncome: Number(monthlyIncome.toFixed(2)),
    tripCount,
    averageFuelPerTrip: Number(averageFuelPerTrip.toFixed(2)),
    fuelAsPercentage: Number(fuelAsPercentage.toFixed(1)),
  };
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

export async function exportTrips(): Promise<string> {
  if (WEB) throw new Error("Exports require the mobile app.");

  const trips = await getTrips();

  const header =
    "Date,Income,Fuel,Tolls,Food,Parking,Repairs,Other,Total Expenses,Profit,Note";

  const rows = trips.map((t) =>
    [
      escapeCsvField(t.date),
      escapeCsvField(t.income),
      escapeCsvField(t.fuel),
      escapeCsvField(t.tolls),
      escapeCsvField(t.food),
      escapeCsvField(t.parking),
      escapeCsvField(t.repairs),
      escapeCsvField(t.other_expenses),
      escapeCsvField(t.total_expenses),
      escapeCsvField(t.profit),
      escapeCsvField(t.note),
    ].join(",")
  );

  return [header, ...rows].join("\n");
}
