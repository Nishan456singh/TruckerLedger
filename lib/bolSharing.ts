import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Alert, Clipboard, Platform, Share } from "react-native";
import type { BOLRecord } from "./types";

/**
 * Format BOL data as human-readable text
 */
export function formatBOLAsText(bol: BOLRecord): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BILL OF LADING (BOL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Broker: ${bol.broker || "—"}
Date: ${formatDateFull(bol.date)}

Pickup Location:
${bol.pickup_location || "—"}

Delivery Location:
${bol.delivery_location || "—"}

Load Amount: $${formatAmount(bol.load_amount)}

${bol.ocr_text ? `Extracted Details:\n${bol.ocr_text}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated from TruckerLedger
  `.trim();
}

/**
 * Format BOL as CSV row
 */
export function formatBOLAsCSV(bol: BOLRecord): string {
  const fields = [
    bol.date,
    bol.broker || "",
    bol.pickup_location || "",
    bol.delivery_location || "",
    bol.load_amount ?? "",
    bol.ocr_text || "",
  ];

  // Escape CSV fields
  return fields
    .map((field) => {
      const str = String(field);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
    .join(",");
}

/**
 * Share BOL via native Share API
 */
export async function shareBOLData(bol: BOLRecord): Promise<void> {
  try {
    const text = formatBOLAsText(bol);
    const message = `Bill of Lading from TruckerLedger\n\n${text}`;

    await Share.share({
      message,
      title: `BOL - ${bol.broker || "Document"}`,
      url: undefined, // iOS file sharing
    });
  } catch (err) {
    console.error("Share error:", err);
    throw new Error("Failed to share BOL");
  }
}

/**
 * Share BOL image file
 */
export async function shareBOLImage(imageUri: string, bol: BOLRecord): Promise<void> {
  try {
    if (Platform.OS === "web") {
      Alert.alert("Not supported", "Image sharing is not available on web.");
      return;
    }

    // For native platforms, use expo-sharing
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("Not supported", "Sharing is not available on this device.");
      return;
    }

    await Sharing.shareAsync(imageUri, {
      mimeType: "image/jpeg",
      UTI: "public.jpeg",
      dialogTitle: `Share BOL - ${bol.broker || "Document"}`,
    });
  } catch (err) {
    console.error("Image share error:", err);
    throw new Error("Failed to share BOL image");
  }
}

/**
 * Copy BOL data to clipboard
 */
export async function copyBOLToClipboard(bol: BOLRecord): Promise<void> {
  try {
    const text = formatBOLAsText(bol);
    await Clipboard.setString(text);
  } catch (err) {
    console.error("Copy to clipboard error:", err);
    throw new Error("Failed to copy to clipboard");
  }
}

/**
 * Export BOL as a text file
 */
export async function exportBOLAsFile(bol: BOLRecord): Promise<string> {
  try {
    if (Platform.OS === "web") {
      throw new Error("File export not available on web");
    }

    const text = formatBOLAsText(bol);
    const filename = `BOL-${bol.broker}-${bol.date}.txt`;
    const filepath = `${FileSystem.documentDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(filepath, text, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return filepath;
  } catch (err) {
    console.error("Export error:", err);
    throw new Error("Failed to export BOL");
  }
}

/**
 * Share exported BOL file
 */
export async function shareExportedBOL(bol: BOLRecord): Promise<void> {
  try {
    if (Platform.OS === "web") {
      Alert.alert("Not supported", "File sharing is not available on web.");
      return;
    }

    const filepath = await exportBOLAsFile(bol);

    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("Not supported", "Sharing is not available on this device.");
      return;
    }

    await Sharing.shareAsync(filepath, {
      mimeType: "text/plain",
      dialogTitle: `Share BOL - ${bol.broker || "Document"}`,
    });
  } catch (err) {
    console.error("Export and share error:", err);
    throw new Error("Failed to export and share BOL");
  }
}

/**
 * Helper: Format amount as currency
 */
function formatAmount(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "0.00";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Helper: Format date as full readable string
 */
function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
