import { Platform } from "react-native";
import { getDatabase } from "./db";
import type { BOLInput, BOLRecord } from "./types";

const WEB = Platform.OS === "web";

export async function createBOL(input: BOLInput): Promise<number> {
  if (WEB) throw new Error("BOL history requires the mobile app.");

  const db = await getDatabase();

  const result = await db.runAsync(
    `INSERT INTO bols (
      pickup_location,
      delivery_location,
      load_amount,
      date,
      broker,
      image_uri,
      ocr_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.pickup_location,
      input.delivery_location,
      input.load_amount,
      input.date,
      input.broker,
      input.image_uri,
      input.ocr_text ?? null,
    ]
  );

  return Number(result.lastInsertRowId);
}

export async function getBOLHistory(): Promise<BOLRecord[]> {
  if (WEB) return [];

  const db = await getDatabase();

  const rows = await db.getAllAsync<BOLRecord>(
    `SELECT
      id,
      pickup_location,
      delivery_location,
      load_amount,
      date,
      broker,
      image_uri,
      ocr_text,
      created_at
    FROM bols
    ORDER BY date DESC, created_at DESC`
  );

  return rows ?? [];
}
