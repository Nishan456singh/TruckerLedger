import { parseReceiptViaAppwriteFunction } from "./receiptAiFunction";
import type { Category } from "./types";

export interface ExpenseFormSetters {
  setAmount: (value: string) => void;
  setCategory: (value: Category) => void;
  setDate: (value: string) => void;
  setNote: (value: string) => void;
}

export async function autofillExpenseFormFromOcr(
  ocrText: string,
  setters: ExpenseFormSetters
): Promise<boolean> {
  const parsed = await parseReceiptViaAppwriteFunction(ocrText);

  if (!parsed) {
    return false;
  }

  setters.setAmount(parsed.amount > 0 ? String(parsed.amount) : "");
  setters.setCategory(parsed.category);

  if (parsed.date) {
    setters.setDate(parsed.date);
  }

  if (parsed.vendor) {
    setters.setNote(`Vendor: ${parsed.vendor}`);
  }

  return true;
}
