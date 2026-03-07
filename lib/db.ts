import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (Platform.OS === 'web') throw new Error('SQLite is not available on web.');
  if (db) return db;
  db = await SQLite.openDatabaseAsync('truckerledger.db');
  return db;
}

export async function initDatabase(): Promise<void> {
  if (Platform.OS === 'web') return;

  const database = await getDatabase();

  await database.execAsync('PRAGMA journal_mode = WAL;');

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      note TEXT DEFAULT '',
      date TEXT NOT NULL,
      receipt_uri TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await database.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);'
  );

  await database.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);'
  );
}
