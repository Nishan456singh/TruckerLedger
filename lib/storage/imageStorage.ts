import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * TYPES
 */

type ImageFolder = 'receipts' | 'bols';

interface ImageSaveResult {
  success: boolean;
  path?: string;
  error?: string;
}

/**
 * CONSTANTS
 */

const APP_STORAGE_DIR = 'truckledger/';

/**
 * HELPERS
 */

/**
 * Get the base directory for storage (with fallback)
 */
function getBaseDirectory(): string | null {
  return FileSystem.documentDirectory || FileSystem.cacheDirectory || null;
}

/**
 * Ensure app storage directories exist
 */
async function ensureAppDirectoryExists(): Promise<boolean> {
  try {
    const baseDir = getBaseDirectory();
    if (!baseDir) {
      console.error('No storage directory available (documentDirectory and cacheDirectory both null)');
      return false;
    }

    const appDir = `${baseDir}${APP_STORAGE_DIR}`;
    const receiptDir = `${appDir}receipts`;
    const bolDir = `${appDir}bols`;

    // Check if main dir exists
    const appDirInfo = await FileSystem.getInfoAsync(appDir);
    if (!appDirInfo.exists) {
      await FileSystem.makeDirectoryAsync(appDir, { intermediates: true });
      console.log('[ImageStorage] Created app directory:', appDir);
    }

    // Check if receipts dir exists
    const receiptDirInfo = await FileSystem.getInfoAsync(receiptDir);
    if (!receiptDirInfo.exists) {
      await FileSystem.makeDirectoryAsync(receiptDir, { intermediates: true });
      console.log('[ImageStorage] Created receipts directory:', receiptDir);
    }

    // Check if bols dir exists
    const bolDirInfo = await FileSystem.getInfoAsync(bolDir);
    if (!bolDirInfo.exists) {
      await FileSystem.makeDirectoryAsync(bolDir, { intermediates: true });
      console.log('[ImageStorage] Created bols directory:', bolDir);
    }

    return true;
  } catch (err) {
    console.error('[ImageStorage] Error ensuring directories:', err);
    return false;
  }
}

/**
 * Get the full directory path for a folder
 */
function getStorageDirectory(folder: ImageFolder): string | null {
  const baseDir = getBaseDirectory();
  if (!baseDir) {
    return null;
  }
  return `${baseDir}${APP_STORAGE_DIR}${folder}`;
}

/**
 * Get full image path
 */
function getImagePath(folder: ImageFolder, filename: string): string {
  const dir = getStorageDirectory(folder);
  if (!dir) return '';
  return `${dir}/${filename}`;
}

/**
 * Generate unique filename with timestamp
 */
function generateFilename(folder: ImageFolder): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${folder === 'receipts' ? 'receipt' : 'bol'}_${timestamp}_${random}.jpg`;
}

/**
 * MAIN FUNCTIONS
 */

/**
 * Save image locally to app storage (without compression)
 * - Copies image to stable local path
 * - Returns local path
 */
export async function saveImageLocally(
  uri: string,
  folder: ImageFolder
): Promise<ImageSaveResult> {
  try {
    // Check if FileSystem is available
    const baseDir = getBaseDirectory();
    if (!baseDir) {
      // Fallback: store the URI reference in AsyncStorage if FileSystem not available
      console.warn('[ImageStorage] FileSystem not available, storing URI reference in AsyncStorage');
      const filename = generateFilename(folder);
      const key = `image_${folder}_${filename}`;

      try {
        await AsyncStorage.setItem(key, uri);
        return {
          success: true,
          path: `async-storage://${key}`,
        };
      } catch (storageErr) {
        console.error('[ImageStorage] Failed to store in AsyncStorage:', storageErr);
        return {
          success: false,
          error: 'No storage available (FileSystem and AsyncStorage failed)',
        };
      }
    }

    // Ensure directories exist
    const dirExists = await ensureAppDirectoryExists();
    if (!dirExists) {
      return {
        success: false,
        error: 'Failed to create storage directories',
      };
    }

    // Get destination path
    const filename = generateFilename(folder);
    const destPath = getImagePath(folder, filename);

    if (!destPath) {
      return {
        success: false,
        error: 'Failed to determine destination path',
      };
    }

    // Copy image to app storage
    console.log('[ImageStorage] Copying image from', uri, 'to', destPath);
    await FileSystem.copyAsync({
      from: uri,
      to: destPath,
    });

    console.log('[ImageStorage] Image saved successfully:', destPath);

    return {
      success: true,
      path: destPath,
    };
  } catch (err) {
    console.error('[ImageStorage] Error saving image locally:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error saving image',
    };
  }
}

/**
 * Delete image from storage and return cleanup result
 * - Checks if file exists
 * - Removes file
 * - Handles errors gracefully
 */
export async function deleteImage(uri: string): Promise<ImageSaveResult> {
  try {
    if (!uri || uri.length === 0) {
      return {
        success: true, // Already deleted
        error: 'No image URI provided',
      };
    }

    // Handle AsyncStorage URIs
    if (uri.startsWith('async-storage://')) {
      const key = uri.replace('async-storage://', '');
      try {
        await AsyncStorage.removeItem(key);
        console.log('[ImageStorage] AsyncStorage entry deleted:', key);
        return { success: true };
      } catch (err) {
        console.error('[ImageStorage] Error deleting from AsyncStorage:', err);
        return { success: false, error: 'Failed to delete from AsyncStorage' };
      }
    }

    console.log('[ImageStorage] Checking if image exists:', uri);

    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      console.log('[ImageStorage] Image file already deleted:', uri);
      return {
        success: true,
      };
    }

    // Delete file
    console.log('[ImageStorage] Deleting image:', uri);
    await FileSystem.deleteAsync(uri);

    console.log('[ImageStorage] Image deleted successfully:', uri);

    return {
      success: true,
    };
  } catch (err) {
    console.error('[ImageStorage] Error deleting image:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error deleting image',
    };
  }
}

/**
 * Get image size for debugging/logging
 */
export async function getImageSize(uri: string): Promise<number | null> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });
    if (fileInfo.exists && 'size' in fileInfo) {
      return fileInfo.size as number;
    }
    return null;
  } catch (err) {
    console.error('[ImageStorage] Error getting image size:', err);
    return null;
  }
}

/**
 * Clear all images in a folder (for cleanup/reset)
 * Use with caution!
 */
export async function clearFolder(folder: ImageFolder): Promise<boolean> {
  try {
    const dirPath = getStorageDirectory(folder);
    if (!dirPath) return false;

    const fileInfo = await FileSystem.getInfoAsync(dirPath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(dirPath);
      console.log(`[ImageStorage] Cleared ${folder} folder`);
    }

    // Recreate empty folder
    await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });

    return true;
  } catch (err) {
    console.error(`[ImageStorage] Error clearing ${folder} folder:`, err);
    return false;
  }
}

/**
 * Get total storage used by images
 */
export async function getStorageUsage(): Promise<{
  receipts: number;
  bols: number;
  total: number;
} | null> {
  try {
    let receiptSize = 0;
    let bolSize = 0;

    // Get receipts folder size
    const receiptDir = getStorageDirectory('receipts');
    if (receiptDir) {
      const dirInfo = await FileSystem.getInfoAsync(receiptDir);
      if (dirInfo.exists && 'size' in dirInfo) {
        receiptSize = (dirInfo.size as number) || 0;
      }
    }

    // Get bols folder size
    const bolDir = getStorageDirectory('bols');
    if (bolDir) {
      const dirInfo = await FileSystem.getInfoAsync(bolDir);
      if (dirInfo.exists && 'size' in dirInfo) {
        bolSize = (dirInfo.size as number) || 0;
      }
    }

    const total = receiptSize + bolSize;

    console.log('[ImageStorage] Storage usage:', {
      receipts: (receiptSize / 1024 / 1024).toFixed(2) + 'MB',
      bols: (bolSize / 1024 / 1024).toFixed(2) + 'MB',
      total: (total / 1024 / 1024).toFixed(2) + 'MB',
    });

    return {
      receipts: receiptSize,
      bols: bolSize,
      total,
    };
  } catch (err) {
    console.error('[ImageStorage] Error getting storage usage:', err);
    return null;
  }
}

export type { ImageFolder, ImageSaveResult };
