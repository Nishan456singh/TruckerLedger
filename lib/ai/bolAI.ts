import { executeAiTask } from "@/lib/ai/aiFunctionClient";

export interface AIParsedBOL {
  pickup_location: string;
  delivery_location: string;
  load_amount: number | null;
  date: string;
  broker: string;
}

function normalizeAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Number(value.toFixed(2));
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(parsed) && parsed > 0) {
      return Number(parsed.toFixed(2));
    }
  }

  return null;
}

function normalizeDate(value: unknown): string {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();

  if (!trimmed) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().split("T")[0];
}

export async function parseBOLWithAI(text: string): Promise<AIParsedBOL | null> {
  const trimmed = text.trim();

  if (!trimmed) {
    return null;
  }

  const body = await executeAiTask<Record<string, unknown>>("bol_parse", {
    text: trimmed,
  });

  if (!body) {
    return null;
  }

  return {
    pickup_location:
      typeof body.pickup_location === "string" ? body.pickup_location.trim() : "",
    delivery_location:
      typeof body.delivery_location === "string" ? body.delivery_location.trim() : "",
    load_amount: normalizeAmount(body.load_amount),
    date: normalizeDate(body.date),
    broker: typeof body.broker === "string" ? body.broker.trim() : "",
  };
}