import type { Category } from "@/lib/types";

export interface ParsedReceiptData {
	amount: number | null;
	date: string | null;
	vendor: string | null;
	category: Category | null;
}

const CATEGORY_KEYWORDS: Array<{ category: Category; keywords: string[] }> = [
	{
		category: "fuel",
		keywords: ["fuel", "diesel", "gas", "petrol", "shell", "chevron"],
	},
	{
		category: "food",
		keywords: ["restaurant", "cafe", "coffee", "pizza", "food", "diner"],
	},
	{
		category: "repair",
		keywords: ["repair", "service", "mechanic", "parts", "maintenance"],
	},
	{
		category: "toll",
		keywords: ["toll", "turnpike", "highway", "bridge fee"],
	},
	{
		category: "parking",
		keywords: ["parking", "garage", "meter", "lot"],
	},
];

function normalizeAmount(raw: string): number | null {
	const parsed = Number(raw.replace(/[^\d.-]/g, ""));
	if (!Number.isFinite(parsed) || parsed <= 0) return null;
	return Number(parsed.toFixed(2));
}

function extractAmount(text: string): number | null {
	const explicitTotal = text.match(
		/(?:total|amount\s*due|grand\s*total|balance\s*due|net\s*amount)[^\d]{0,10}(\d{1,6}(?:[.,]\d{2})?)/i
	);

	if (explicitTotal?.[1]) {
		return normalizeAmount(explicitTotal[1]);
	}

	const moneyCandidates = [...text.matchAll(/\$?\s?(\d{1,6}(?:[.,]\d{2}))/g)]
		.map((match) => normalizeAmount(match[1]))
		.filter((value): value is number => value !== null);

	if (!moneyCandidates.length) return null;

	return Math.max(...moneyCandidates);
}

function toIsoDate(year: number, month: number, day: number): string | null {
	if (year < 2000 || year > 2100) return null;
	if (month < 1 || month > 12) return null;
	if (day < 1 || day > 31) return null;

	const normalized = new Date(Date.UTC(year, month - 1, day));

	if (
		normalized.getUTCFullYear() !== year ||
		normalized.getUTCMonth() !== month - 1 ||
		normalized.getUTCDate() !== day
	) {
		return null;
	}

	return normalized.toISOString().split("T")[0];
}

function extractDate(text: string): string | null {
	const isoMatch = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
	if (isoMatch) {
		return toIsoDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
	}

	const usMatch = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/);
	if (usMatch) {
		return toIsoDate(Number(usMatch[3]), Number(usMatch[1]), Number(usMatch[2]));
	}

	const parsed = Date.parse(text);
	if (!Number.isNaN(parsed)) {
		return new Date(parsed).toISOString().split("T")[0];
	}

	return null;
}

function extractVendor(text: string): string | null {
	const lines = text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);

	for (const line of lines) {
		const normalized = line.toLowerCase();
		if (/^\d/.test(normalized)) continue;
		if (normalized.includes("total")) continue;
		if (normalized.includes("tax")) continue;
		if (normalized.includes("invoice")) continue;
		if (normalized.length < 3) continue;
		return line;
	}

	return null;
}

function extractCategory(text: string): Category | null {
	const lower = text.toLowerCase();

	for (const entry of CATEGORY_KEYWORDS) {
		if (entry.keywords.some((keyword) => lower.includes(keyword))) {
			return entry.category;
		}
	}

	return null;
}

export function parseReceiptText(text: string): ParsedReceiptData {
	const normalizedText = text.trim();

	if (!normalizedText) {
		return {
			amount: null,
			date: null,
			vendor: null,
			category: null,
		};
	}

	return {
		amount: extractAmount(normalizedText),
		date: extractDate(normalizedText),
		vendor: extractVendor(normalizedText),
		category: extractCategory(normalizedText),
	};
}

export function shouldUseAiFallback(parsed: ParsedReceiptData): boolean {
	return parsed.amount === null || parsed.date === null || parsed.category === null;
}

