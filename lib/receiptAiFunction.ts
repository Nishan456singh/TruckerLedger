import { appwriteFunctions } from "./appwrite";
import type { Category } from "./types";

const DEFAULT_RECEIPT_AI_FUNCTION_ID = "69b4c5a5000a6e580608";

const ALLOWED_CATEGORIES: Category[] = [
  "fuel",
  "food",
  "repair",
  "toll",
  "parking",
  "other",
];

export interface ReceiptParseResult {
  vendor: string;
  amount: number;
  date: string;
  category: Category;
}

function normalizeCategory(value: unknown): Category {
  if (typeof value !== "string") return "other";

  const normalized = value.toLowerCase().trim();

  return ALLOWED_CATEGORIES.includes(normalized as Category)
    ? (normalized as Category)
    : "other";
}

function safeParseExecutionJson(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

export async function parseReceiptViaAppwriteFunction(
  ocrText: string
): Promise<ReceiptParseResult | null> {
  const functionId =
    process.env.EXPO_PUBLIC_APPWRITE_RECEIPT_AI_FUNCTION_ID ??
    DEFAULT_RECEIPT_AI_FUNCTION_ID;

  if (!functionId || !ocrText.trim()) {
    return null;
  }

  const execution = await appwriteFunctions.createExecution({
    functionId,
    async: false,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      text: ocrText,
    }),
  });

  if (!execution.responseBody) {
    return null;
  }

  const body = safeParseExecutionJson(execution.responseBody);

  if (!body || body.error) {
    return null;
  }

  const amountRaw = body.amount;
  const amount =
    typeof amountRaw === "number"
      ? amountRaw
      : Number(String(amountRaw ?? "0").replace(/[^\d.-]/g, ""));

  const date = typeof body.date === "string" ? body.date : "";
  const vendor = typeof body.vendor === "string" ? body.vendor : "";

  return {
    vendor: vendor.trim(),
    amount: Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0,
    date,
    category: normalizeCategory(body.category),
  };
}
