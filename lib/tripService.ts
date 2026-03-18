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
