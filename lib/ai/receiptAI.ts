import { executeAiTask } from "@/lib/ai/aiFunctionClient";
import type { Category } from "@/lib/types";

const ALLOWED_CATEGORIES: Category[] = [
	"fuel",
	"food",
	"repair",
	"toll",
	"parking",
	"other",
];

export interface AIParsedReceipt {
	vendor: string | null;
	amount: number | null;
	date: string | null;
	category: Category | null;
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

function normalizeDate(value: unknown): string | null {
	if (typeof value !== "string") return null;

	const trimmed = value.trim();
	if (!trimmed) return null;

	if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
		return trimmed;
	}

	const parsed = new Date(trimmed);
	if (Number.isNaN(parsed.getTime())) {
		return null;
	}

	return parsed.toISOString().split("T")[0];
}

function normalizeCategory(value: unknown): Category | null {
	if (typeof value !== "string") return null;
	const normalized = value.toLowerCase().trim();
	return ALLOWED_CATEGORIES.includes(normalized as Category)
		? (normalized as Category)
		: null;
}

export async function parseReceiptWithAI(text: string): Promise<AIParsedReceipt | null> {
	const trimmed = text.trim();

	if (!trimmed) {
		console.log("Receipt AI: Empty text provided");
		return null;
	}

	try {
		console.log("Receipt AI: Sending to AI function, text length:", trimmed.length);
		const body = await executeAiTask<Record<string, unknown>>("receipt_parse", {
			text: trimmed,
		});

		if (!body) {
			console.log("Receipt AI: No response from AI function");
			return null;
		}

		console.log("Receipt AI: Raw response from AI", body);

		const result = {
			vendor: typeof body.vendor === "string" ? body.vendor.trim() || null : null,
			amount: normalizeAmount(body.amount ?? body.total_amount),
			date: normalizeDate(body.date),
			category: normalizeCategory(body.category),
		};

		console.log("Receipt AI: Parsed result", result);
		return result;
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error("Receipt AI: Exception during parsing -", message);
		return null;
	}
}

