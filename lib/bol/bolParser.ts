/**
 * BOL Parser - Extract structured data from BOL OCR text.
 *
 * Looks for:
 * - Pickup Location: FROM, ORIGIN, SHIPPER, PICKUP
 * - Delivery Location: TO, DESTINATION, RECEIVER, DELIVERY
 * - Broker: BROKER, CARRIER, COMPANY
 * - Load Amount: RATE, AMOUNT, PAYMENT
 * - Date: Common date formats
 */

export interface ParsedBOL {
  pickupLocation: string | null;
  deliveryLocation: string | null;
  loadAmount: number | null;
  date: string | null;
  broker: string | null;
  confidence: {
    pickup: "high" | "medium" | "low";
    delivery: "high" | "medium" | "low";
    loadAmount: "high" | "medium" | "low";
    date: "high" | "medium" | "low";
    broker: "high" | "medium" | "low";
  };
}

/**
 * Extract location from lines following a keyword.
 * Looks for lines after "FROM", "PICKUP", "TO", "DELIVERY", etc.
 */
function extractLocationAfterKeyword(
  lines: string[],
  keywords: string[]
): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toUpperCase();

    for (const keyword of keywords) {
      if (line.includes(keyword)) {
        // Next non-empty line is usually the location
        const nextLine = lines[i + 1];
        if (nextLine && nextLine.length > 2) {
          return nextLine.substring(0, 80); // Cap at 80 chars
        }

        // Or extract from current line after the keyword
        const match = line.split(keyword)[1];
        if (match && match.trim().length > 2) {
          return match.trim().substring(0, 80);
        }
      }
    }
  }

  return null;
}

/**
 * Extract location from pairs of lines that look like address-like data.
 * Heuristic: look for consecutive lines with capitalized words (city, state pairs).
 */
function extractLocationFromContext(lines: string[]): string | null {
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1];

    // Look for state abbreviations (2 uppercase letters) as hint
    const stateMatch = nextLine.match(/\b[A-Z]{2}\b/);
    if (stateMatch && line.length > 3 && line.length < 50) {
      // Looks like a location
      return `${line}, ${nextLine}`.substring(0, 80);
    }
  }

  return null;
}

/**
 * Extract pickup location.
 */
function extractPickup(lines: string[]): string | null {
  return (
    extractLocationAfterKeyword(lines, ["FROM", "ORIGIN", "SHIPPER", "PICKUP"]) ||
    extractLocationFromContext(lines)
  );
}

/**
 * Extract delivery location.
 */
function extractDelivery(lines: string[]): string | null {
  return extractLocationAfterKeyword(lines, ["TO", "DESTINATION", "RECEIVER", "DELIVERY"]);
}

/**
 * Extract broker name.
 */
function extractBroker(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toUpperCase();

    if (line.includes("BROKER") || line.includes("CARRIER") || line.includes("TRUCKING")) {
      const nextLine = lines[i + 1];
      if (nextLine && nextLine.length > 2) {
        return nextLine.substring(0, 60);
      }

      const afterKeyword = line.split("BROKER")[1] || line.split("CARRIER")[1];
      if (afterKeyword && afterKeyword.trim().length > 2) {
        return afterKeyword.trim().substring(0, 60);
      }
    }
  }

  // Alternative: look for company-like names in first few lines
  if (lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine.length > 3 && firstLine.length < 60 && /[A-Z]/.test(firstLine)) {
      return firstLine;
    }
  }

  return null;
}

/**
 * Extract load amount (rate/payment).
 */
function extractLoadAmount(lines: string[]): number | null {
  const fullText = lines.join(" ");

  // Look for $ followed by number
  const dollarMatch = fullText.match(/\$\s?([\d,]+(?:\.\d{2})?)/);
  if (dollarMatch) {
    const amountStr = dollarMatch[1].replace(/,/g, "");
    const amount = parseFloat(amountStr);
    if (!isNaN(amount) && amount > 0 && amount < 100000) {
      return Number(amount.toFixed(2));
    }
  }

  // Look for "RATE" or "AMOUNT" followed by number
  const rateMatch = fullText.match(/(RATE|AMOUNT|PAYMENT|LOAD\s+AMOUNT)[\s:$]*(\d+[.,]\d{2})?/i);
  if (rateMatch && rateMatch[2]) {
    const amountStr = rateMatch[2].replace(",", ".");
    const amount = parseFloat(amountStr);
    if (!isNaN(amount) && amount > 0 && amount < 100000) {
      return Number(amount.toFixed(2));
    }
  }

  return null;
}

/**
 * Extract date from BOL OCR text.
 */
function extractBOLDate(lines: string[]): string | null {
  const fullText = lines.join(" ");

  // Common patterns
  const patterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // MM/DD/YYYY
    /(\d{1,2})-(\d{1,2})-(\d{4})/,    // MM-DD-YYYY
    /(\d{4})\/(\d{1,2})\/(\d{1,2})/, // YYYY/MM/DD
    /(\d{4})-(\d{1,2})-(\d{1,2})/,    // YYYY-MM-DD
  ];

  for (const pattern of patterns) {
    const match = fullText.match(pattern);
    if (match) {
      if (match[3].length === 4) {
        // YYYY at position 3: MM/DD/YYYY format
        const year = match[3];
        const month = String(parseInt(match[1])).padStart(2, "0");
        const day = String(parseInt(match[2])).padStart(2, "0");
        return `${year}-${month}-${day}`;
      } else {
        // YYYY at position 1: YYYY/MM/DD format
        const year = match[1];
        const month = String(parseInt(match[2])).padStart(2, "0");
        const day = String(parseInt(match[3])).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    }
  }

  return null;
}

/**
 * Parse BOL OCR text into structured fields.
 */
export function parseBOL(ocrText: string): ParsedBOL {
  const lines = ocrText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return {
      pickupLocation: null,
      deliveryLocation: null,
      loadAmount: null,
      date: null,
      broker: null,
      confidence: {
        pickup: "low",
        delivery: "low",
        loadAmount: "low",
        date: "low",
        broker: "low",
      },
    };
  }

  const pickupLocation = extractPickup(lines);
  const deliveryLocation = extractDelivery(lines);
  const loadAmount = extractLoadAmount(lines);
  const date = extractBOLDate(lines);
  const broker = extractBroker(lines);

  return {
    pickupLocation,
    deliveryLocation,
    loadAmount,
    date,
    broker,
    confidence: {
      pickup: pickupLocation ? "high" : "low",
      delivery: deliveryLocation ? "high" : "low",
      loadAmount: loadAmount ? "high" : "low",
      date: date ? "high" : "low",
      broker: broker ? "medium" : "low",
    },
  };
}

/**
 * Validate parsed BOL has minimum required fields.
 */
export function isValidParsedBOL(
  parsed: ParsedBOL
): {
  valid: boolean;
  reason?: string;
} {
  // At least pickup OR delivery is required
  if (!parsed.pickupLocation && !parsed.deliveryLocation) {
    return {
      valid: false,
      reason: "At least pickup or delivery location required",
    };
  }

  return { valid: true };
}
