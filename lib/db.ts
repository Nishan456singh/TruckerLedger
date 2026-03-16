import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

let db: SQLite.SQLiteDatabase | null = null;
let schemaReady = false;

// ─── Apply schema migrations ─────────────────────────

async function ensureColumn(
  database: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  definition: string
): Promise<void> {
  const columns = await database.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${table});`
  );

  const exists = columns.some((row) => row.name === column);

  if (!exists) {
    await database.execAsync(
      `ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`
    );
  }
}

async function applySchema(database: SQLite.SQLiteDatabase): Promise<void> {
  try {
    await database.execAsync("PRAGMA journal_mode = WAL;");

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        note TEXT DEFAULT '',
        date TEXT NOT NULL,
        receipt_uri TEXT,
        receipt_image TEXT,
        ocr_text TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    await ensureColumn(database, "expenses", "receipt_image", "TEXT");
    await ensureColumn(database, "expenses", "ocr_text", "TEXT");

    await database.execAsync(
      "CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);"
    );

    await database.execAsync(
      "CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);"
    );
  } catch (error) {
    console.error("Database schema migration failed:", error);
    throw error;
  }
}

// ─── Get database connection ─────────────────────────

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (Platform.OS === "web") {
    throw new Error("SQLite is not available on web.");
  }

  try {
    if (!db) {
      db = await SQLite.openDatabaseAsync("truckerledger.db");
    }

    if (!schemaReady) {
      await applySchema(db);
      schemaReady = true;
    }

    return db;
  } catch (error) {
    console.error("Failed to open database:", error);
    throw error;
  }
}

// ─── Init database (warmup) ─────────────────────────

export async function initDatabase(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    await getDatabase();
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
}