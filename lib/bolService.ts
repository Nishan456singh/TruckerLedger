import { Platform } from "react-native";
import { getDatabase } from "./db";
import { deleteImage } from "./storage/imageStorage";
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

export async function searchBOLs(searchQuery: string): Promise<BOLRecord[]> {
  if (WEB) return [];

  const db = await getDatabase();
  const query = `%${searchQuery.toLowerCase()}%`;

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
    WHERE LOWER(pickup_location) LIKE ?
      OR LOWER(delivery_location) LIKE ?
      OR LOWER(broker) LIKE ?
    ORDER BY date DESC, created_at DESC`,
    [query, query, query]
  );

  return rows ?? [];
}

export async function getBOLsByDateRange(startDate: string, endDate: string): Promise<BOLRecord[]> {
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
    WHERE date >= ? AND date <= ?
    ORDER BY date DESC, created_at DESC`,
    [startDate, endDate]
  );

  return rows ?? [];
}

export async function getBOLsByBroker(brokerName: string): Promise<BOLRecord[]> {
  if (WEB) return [];

  const db = await getDatabase();
  const query = `%${brokerName.toLowerCase()}%`;

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
    WHERE LOWER(broker) LIKE ?
    ORDER BY date DESC, created_at DESC`,
    [query]
  );

  return rows ?? [];
}

export async function getBOLsByLocation(location: string): Promise<BOLRecord[]> {
  if (WEB) return [];

  const db = await getDatabase();
  const query = `%${location.toLowerCase()}%`;

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
    WHERE LOWER(pickup_location) LIKE ? OR LOWER(delivery_location) LIKE ?
    ORDER BY date DESC, created_at DESC`,
    [query, query]
  );

  return rows ?? [];
}

export async function getBOLById(id: number): Promise<BOLRecord | null> {
  try {
    if (!id || Number.isNaN(id)) {
      console.warn("⚠️ Invalid BOL ID:", id);
      return null;
    }

    if (WEB) {
      console.warn("⚠️ getBOLById not supported on web");
      return null;
    }

    const db = await getDatabase();

    const row = await db.getFirstAsync<BOLRecord>(
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
      WHERE id = ?
      LIMIT 1`,
      [id]
    );

    if (!row) {
      console.warn("⚠️ No BOL found for ID:", id);
      return null;
    }

    return {
      ...row,
      load_amount:
        typeof row.load_amount === "number"
          ? row.load_amount
          : Number(row.load_amount ?? 0),
    };
  } catch (error) {
    console.error("❌ getBOLById failed:", error);
    return null;
  }
}

export async function updateBOL(id: number, input: Partial<BOLInput>): Promise<void> {
  if (WEB) throw new Error("BOL update requires the mobile app.");

  const db = await getDatabase();

  // Get current BOL to preserve existing values
  const current = await getBOLById(id);
  if (!current) throw new Error("BOL not found");

  // Merge with new values
  const updated: BOLInput = {
    pickup_location: input.pickup_location ?? current.pickup_location,
    delivery_location: input.delivery_location ?? current.delivery_location,
    load_amount: input.load_amount ?? current.load_amount,
    date: input.date ?? current.date,
    broker: input.broker ?? current.broker,
    image_uri: input.image_uri ?? current.image_uri,
    ocr_text: input.ocr_text ?? current.ocr_text,
  };

  await db.runAsync(
    `UPDATE bols SET
      pickup_location = ?,
      delivery_location = ?,
      load_amount = ?,
      date = ?,
      broker = ?,
      image_uri = ?,
      ocr_text = ?
    WHERE id = ?`,
    [
      updated.pickup_location,
      updated.delivery_location,
      updated.load_amount,
      updated.date,
      updated.broker,
      updated.image_uri,
      updated.ocr_text ?? null,
      id,
    ]
  );
}

export async function getBOLCount(): Promise<number> {
  if (WEB) return 0;

  const db = await getDatabase();

  type CountRow = { count: number };

  const row = await db.getFirstAsync<CountRow>(`SELECT COUNT(*) AS count FROM bols`);

  return row?.count ?? 0;
}

export async function deleteBOL(id: number): Promise<void> {
  if (WEB) throw new Error("BOL deletion requires the mobile app.");

  const db = await getDatabase();

  // Get BOL to find image URI
  const bol = await db.getFirstAsync<{ image_uri: string | null }>(
    `SELECT image_uri FROM bols WHERE id = ?`,
    [id]
  );

  // Delete image file if it exists
  if (bol?.image_uri) {
    try {
      await deleteImage(bol.image_uri);
    } catch (err) {
      console.error("[BOLService] Error deleting image:", err);
      // Don't fail the whole delete if image cleanup fails
    }
  }

  // Delete database record
  await db.runAsync(`DELETE FROM bols WHERE id = ?`, [id]);
}

// ─── CSV Export ─────────────────────────────────────

function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";

  const s = String(value);

  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }

  return s;
}

export async function exportBOLs(): Promise<string> {
  if (WEB) throw new Error("Exports require the mobile app.");

  const bols = await getBOLHistory();

  const header = "Date,Broker,Pickup Location,Delivery Location,Load Amount";

  const rows = bols.map((b) =>
    [
      escapeCsvField(b.date),
      escapeCsvField(b.broker),
      escapeCsvField(b.pickup_location),
      escapeCsvField(b.delivery_location),
      escapeCsvField(b.load_amount),
    ].join(",")
  );

  return [header, ...rows].join("\n");
}
