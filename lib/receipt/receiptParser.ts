import type { Category } from "../types";

export interface ParsedReceipt {
  amount: number | null;
  category: Category | null;
  date: string | null;
  vendor: string | null;
  confidence: {
    amount: "high" | "medium" | "low";
    category: "high" | "medium" | "low";
    date: "high" | "medium" | "low";
  };
}

/**
 * Vendor name patterns to infer category.
 * More specific patterns should come first.
 */
const VENDOR_PATTERNS: Array<{
  pattern: RegExp;
  category: Category;
}> = [
  // FUEL stations
  { pattern: /shell|chevron|exxon|bp|mobil|sunoco|pilot|love\'s|ta\/petro|love truck/i, category: "fuel" },
  { pattern: /gas\s?station|fuel|ethanol/i, category: "fuel" },
  { pattern: /speedway|circle k|kwik-e-mart|chevrolet gas|diesel/i, category: "fuel" },

  // TOLLS
  { pattern: /toll|pike|turnpike|expressway|highway toll|e-?z\s*pass|transponder/i, category: "toll" },

  // PARKING
  { pattern: /parking|park|lot|garage|meter|valet/i, category: "parking" },

  // FOOD & RESTAURANTS
  { pattern: /mcdonald\'?s|burger king|wendy\'?s|taco bell|kfc|popeyes|subway|chick-?fil|arby\'?s|sonic|chipotle|panera|starbucks|dunkin|denny\'?s|ihop|waffle house|cracker barrel/i, category: "food" },
  { pattern: /restaurant|cafe|caf(e|é)|diner|pizza|grill|bbq|bar|pub|bistro|eatery|burger|taco|sandwich/i, category: "food" },
  { pattern: /fast food|quick service|qsr|doordash|uber eats|delivery/i, category: "food" },

  // REPAIRS & MAINTENANCE
  { pattern: /truck stop|love\'?s|ta\/petro|repair|maintenance|diesel|oil change|tire|brake|suspension|service|mechanic|shop|automotive/i, category: "repair" },
  { pattern: /firestone|goodyear|michelin|bridgestone|yokohama|continental|o\'?reilly|autozone|napa/i, category: "repair" },

  // OTHER (default for misc)
];

/**
 * Extract amount from OCR text.
 * Looks for $ signs and decimal patterns.
 */
function extractAmount(lines: string[]): number | null {
  // Look for lines with $ and numbers
  for (const line of lines) {
    // Pattern: $ followed by digits and optional decimals
    const match = line.match(/\$\s?([\d,]+(?:\.\d{2})?)/);
    if (match) {
      const amountStr = match[1].replace(/,/g, ""); // Remove commas
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0 && amount < 1000) {
        return Number(amount.toFixed(2));
      }
    }

    // Also try: number followed by cents (XX.XX pattern without $)
    const simpleMatch = line.match(/^\s*(?:total|amount|subtotal|due)[\s:]*(\d+[.,]\d{2})?/i);
    if (simpleMatch && simpleMatch[1]) {
      const amountStr = simpleMatch[1].replace(",", ".");
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0 && amount < 1000) {
        return Number(amount.toFixed(2));
      }
    }
  }

  return null;
}

/**
 * Extract vendor name from OCR text.
 * Takes first recognizable line that looks like a business name.
 */
function extractVendor(lines: string[]): string | null {
  if (lines.length === 0) return null;

  // Usually first few lines contain vendor name
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    // Skip lines that are too short or are numbers
    if (line.length > 3 && !/^\d+$/.test(line)) {
      return line.substring(0, 50); // Cap at 50 chars
    }
  }

  return null;
}

/**
 * Infer category from vendor name or entire receipt text.
 */
function inferCategory(vendorOrText: string | null): Category | null {
  if (!vendorOrText) return null;

  for (const { pattern, category } of VENDOR_PATTERNS) {
    if (pattern.test(vendorOrText)) {
      return category;
    }
  }

  return null;
}

/**
 * Extract date from OCR text.
 * Looks for common date formats: MM/DD/YYYY, MM-DD-YYYY, DD/MM/YYYY, etc.
 */
function extractDate(lines: string[]): string | null {
  const fullText = lines.join(" ");

  // Common patterns: MM/DD/YYYY, MM-DD-YYYY, DD/MM/YYYY
  const patterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // MM/DD/YYYY or DD/MM/YYYY
    /(\d{1,2})-(\d{1,2})-(\d{4})/,    // MM-DD-YYYY or DD-MM-YYYY
    /(\d{4})\/(\d{1,2})\/(\d{1,2})/, // YYYY/MM/DD
    /(\d{4})-(\d{1,2})-(\d{1,2})/,    // YYYY-MM-DD
  ];

  for (const pattern of patterns) {
    const match = fullText.match(pattern);
    if (match) {
      // Determine format and convert to YYYY-MM-DD
      if (match[3].length === 4) {
        // First pair is year (YYYY/MM/DD or YYYY-MM-DD)
        const year = match[1];
        const month = match[2].padStart(2, "0");
        const day = match[3].padStart(2, "0");
        return `${year}-${month}-${day}`;
      } else if (match[3].length === 4) {
        // Third pair is year (MM/DD/YYYY or MM-DD-YYYY or DD/MM/YYYY)
        const year = match[3];
        const first = parseInt(match[1]);
        const second = parseInt(match[2]);

        // Heuristic: if first number > 12, it's day (European format)
        // Otherwise assume MM/DD/YYYY (US format)
        const month = first > 12 ? second : first;
        const day = first > 12 ? first : second;

        const monthStr = String(month).padStart(2, "0");
        const dayStr = String(day).padStart(2, "0");
        return `${year}-${monthStr}-${dayStr}`;
      }
    }
  }

  return null;
}

/**
 * Parse OCR text from a receipt into structured fields.
 * Returns best-guess extraction with confidence levels.
 * Gracefully handles incomplete/bad OCR.
 */
export function parseReceipt(ocrText: string): ParsedReceipt {
  const lines = ocrText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return {
      amount: null,
      category: null,
      date: null,
      vendor: null,
      confidence: {
        amount: "low",
        category: "low",
        date: "low",
      },
    };
  }

  // Extract fields
  const vendor = extractVendor(lines);
  const amount = extractAmount(lines);
  const category = inferCategory(vendor || ocrText);
  const date = extractDate(lines);

  // Assess confidence
  return {
    amount,
    category: category ?? null,
    date,
    vendor,
    confidence: {
      amount: amount ? (amount > 0 ? "high" : "low") : "low",
      category: category ? (vendor ? "high" : "medium") : "low",
      date: date ? "high" : "low",
    },
  };
}

/**
 * Validate a parsed receipt has minimum required fields.
 * Amount is required; category and date are optional but helpful.
 */
export function isValidParsedReceipt(
  parsed: ParsedReceipt
): {
  valid: boolean;
  reason?: string;
} {
  if (parsed.amount === null) {
    return {
      valid: false,
      reason: "No amount detected",
    };
  }

  if (parsed.amount <= 0) {
    return {
      valid: false,
      reason: "Amount must be positive",
    };
  }

  if (parsed.amount > 10000) {
    return {
      valid: false,
      reason: "Amount seems too high",
    };
  }

  return { valid: true };
}
