import AsyncStorage from '@react-native-async-storage/async-storage';
import { Account, Client, Databases, Storage } from 'react-native-appwrite';

const APPWRITE_ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!;
const APPWRITE_PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!;
const APPWRITE_DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const APPWRITE_BACKUP_COLLECTION = 'backups';
const APPWRITE_STORAGE_BUCKET = 'images';

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

const databases = new Databases(client);
const storage = new Storage(client);
const account = new Account(client);

export interface BackupStatus {
  lastBackupTime: number | null;
  backupSize: number;
  itemsBackedUp: number;
  isDriving: boolean;
}

export interface BackupData {
  trips: any[];
  expenses: any[];
  bols: any[];
  timestamp: number;
  userId: string;
}

const BACKUP_STATUS_KEY = 'truckledger_backup_status';

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const user = await account.get();
    return !!user;
  } catch {
    return false;
  }
}

/**
 * Get current user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const user = await account.get();
    return user.$id;
  } catch {
    return null;
  }
}

/**
 * Create full backup of local data
 */
export async function createBackup(
  trips: any[],
  expenses: any[],
  bols: any[]
): Promise<{ success: boolean; backup_id?: string; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const backupData: BackupData = {
      trips,
      expenses,
      bols,
      timestamp: Date.now(),
      userId,
    };

    // Save to database
    const backupId = `backup_${userId}_${Date.now()}`;

    await databases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_BACKUP_COLLECTION,
      backupId,
      {
        user_id: userId,
        backup_data: JSON.stringify(backupData),
        item_count: trips.length + expenses.length + bols.length,
        backup_size: JSON.stringify(backupData).length,
        created_at: new Date().toISOString(),
      }
    );

    // Update local backup status
    await updateBackupStatus({
      lastBackupTime: Date.now(),
      backupSize: JSON.stringify(backupData).length,
      itemsBackedUp: trips.length + expenses.length + bols.length,
      isDriving: false,
    });

    return { success: true, backup_id: backupId };
  } catch (error) {
    console.error('Backup failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Restore backup from cloud
 */
export async function restoreBackup(
  backupId: string
): Promise<{ success: boolean; backup?: BackupData; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const doc = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_BACKUP_COLLECTION,
      backupId
    );

    if (doc.user_id !== userId) {
      return { success: false, error: 'Unauthorized access' };
    }

    const backup = JSON.parse(doc.backup_data) as BackupData;
    return { success: true, backup };
  } catch (error) {
    console.error('Restore failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get list of all backups for user
 */
export async function getBackupsList(): Promise<
  Array<{ id: string; createdAt: string; itemCount: number; size: number }>
> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_BACKUP_COLLECTION,
      [
        // Filter by user_id - adjust based on Appwrite query syntax
      ]
    );

    return (response.documents || [])
      .filter((doc: any) => doc.user_id === userId)
      .map((doc: any) => ({
        id: doc.$id,
        createdAt: doc.created_at,
        itemCount: doc.item_count,
        size: doc.backup_size,
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  } catch (error) {
    console.error('Failed to get backups list:', error);
    return [];
  }
}

/**
 * Delete a backup from cloud
 */
export async function deleteBackup(backupId: string): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const doc = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_BACKUP_COLLECTION,
      backupId
    );

    if (doc.user_id !== userId) {
      return false;
    }

    await databases.deleteDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_BACKUP_COLLECTION,
      backupId
    );

    return true;
  } catch (error) {
    console.error('Delete backup failed:', error);
    return false;
  }
}

/**
 * Upload receipt/BOL image to cloud storage
 */
export async function uploadImage(
  imageUri: string,
  fileName: string
): Promise<{ success: boolean; fileId?: string; url?: string; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    // Upload to storage
    const fileId = `${userId}/${fileName}`;

    // Note: In production, you'd use FormData to upload the actual file
    // This is a simplified version
    await storage.createFile(APPWRITE_STORAGE_BUCKET, fileId, imageUri as any);

    const url = `${APPWRITE_ENDPOINT}/v1/storage/buckets/${APPWRITE_STORAGE_BUCKET}/files/${fileId}/preview?project=${APPWRITE_PROJECT_ID}`;

    return { success: true, fileId, url };
  } catch (error) {
    console.error('Image upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get backup status
 */
export async function getBackupStatus(): Promise<BackupStatus> {
  try {
    const status = await AsyncStorage.getItem(BACKUP_STATUS_KEY);
    if (status) {
      return JSON.parse(status);
    }
    return {
      lastBackupTime: null,
      backupSize: 0,
      itemsBackedUp: 0,
      isDriving: false,
    };
  } catch {
    return {
      lastBackupTime: null,
      backupSize: 0,
      itemsBackedUp: 0,
      isDriving: false,
    };
  }
}

/**
 * Update backup status
 */
export async function updateBackupStatus(status: BackupStatus): Promise<void> {
  try {
    await AsyncStorage.setItem(BACKUP_STATUS_KEY, JSON.stringify(status));
  } catch (error) {
    console.error('Failed to update backup status:', error);
  }
}

/**
 * Format bytes to human readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
