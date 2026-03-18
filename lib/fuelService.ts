import { Platform } from "react-native";
import { getCategoryTotals, getMonthlyExpenses } from "./expenseService";

const WEB = Platform.OS === "web";

export interface FuelStats {
  fuelThisMonth: number;
  milesDriven: number;
  fuelCostPerMile: number;
  fuelCostPerTrip: number;
  tripCount: number;
}

export async function getFuelStats(
  milesDriven: number,
  month: number,
  year: number
): Promise<FuelStats> {
  if (WEB) {
    return {
      fuelThisMonth: 0,
      milesDriven,
      fuelCostPerMile: 0,
      fuelCostPerTrip: 0,
      tripCount: 0,
    };
  }

  const [categoryTotals, monthExpenses] = await Promise.all([
    getCategoryTotals(month, year),
    getMonthlyExpenses(month, year),
  ]);

  const fuelThisMonth = categoryTotals.fuel ?? 0;
  const tripCount = monthExpenses.length;

  return {
    fuelThisMonth,
    milesDriven,
    fuelCostPerMile:
      milesDriven > 0 ? Number((fuelThisMonth / milesDriven).toFixed(4)) : 0,
    fuelCostPerTrip:
      tripCount > 0 ? Number((fuelThisMonth / tripCount).toFixed(2)) : 0,
    tripCount,
  };
}
