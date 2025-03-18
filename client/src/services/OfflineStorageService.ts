/**
 * OfflineStorageService
 * 
 * This service manages offline data storage and synchronization with the backend.
 * It uses IndexedDB for persistent storage and handles the offline/online transitions.
 */

import { openDB, IDBPDatabase } from 'idb';
import { apiRequest } from '@/lib/queryClient';
import { Location, Barcode } from '@shared/schema';

// Database structure
interface OfflineDB {
  locations: {
    key: number;
    value: Partial<Location> & { pendingSync: boolean };
    indexes: { 'by-project': number };
  };
  barcodes: {
    key: number;
    value: Partial<Barcode> & { pendingSync: boolean; tempId?: string };
    indexes: { 'by-location': number };
  };
  syncQueue: {
    key: number;
    value: {
      id: number;
      type: 'location' | 'barcode';
      action: 'create' | 'update' | 'delete';
      data: any;
      timestamp: number;
    };
  };
  authCache: {
    key: string;
    value: any;
  };
}

class OfflineStorage {
  private db: IDBPDatabase<OfflineDB> | null = null;
  private initialized = false;
  private online = navigator.onLine;
  private syncInProgress = false;
  private syncInterval: number | null = null;

  /**
   * Initialize the offline storage database
   */
  async init(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      this.db = await openDB<OfflineDB>('inventory-offline-db', 1, {
        upgrade(db) {
          // Create locations store
          const locationsStore = db.createObjectStore('locations', { keyPath: 'id', autoIncrement: true });
          locationsStore.createIndex('by-project', 'projectId');

          // Create barcodes store
          const barcodesStore = db.createObjectStore('barcodes', { keyPath: 'id', autoIncrement: true });
          barcodesStore.createIndex('by-location', 'locationId');

          // Create sync queue store
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });

          // Create auth cache store
          db.createObjectStore('authCache', { keyPath: 'key' });
        },
      });

      // Set up online/offline event listeners
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);

      // Start sync process if online
      if (navigator.onLine) {
        this.startSyncInterval();
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
      return false;
    }
  }

  /**
   * Handle coming back online
   */
  private handleOnline = () => {
    this.online = true;
    // Start syncing when back online
    this.startSyncInterval();
    this.attemptSync();
  };

  /**
   * Handle going offline
   */
  private handleOffline = () => {
    this.online = false;
    // Stop syncing when offline
    this.stopSyncInterval();
  };

  /**
   * Start the sync interval for periodic syncing
   */
  private startSyncInterval() {
    if (this.syncInterval) return;
    
    // Sync every 30 seconds when online
    this.syncInterval = window.setInterval(() => {
      this.attemptSync();
    }, 30000);
  }

  /**
   * Stop the sync interval
   */
  private stopSyncInterval() {
    if (this.syncInterval) {
      window.clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Cache authentication data
   */
  async cacheAuthData(userData: any): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    await this.db.put('authCache', {
      key: 'currentUser',
      value: userData,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached authentication data
   */
  async getCachedAuthData(): Promise<any | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    try {
      const cachedAuth = await this.db.get('authCache', 'currentUser');
      return cachedAuth?.value || null;
    } catch (error) {
      console.error('Failed to get cached auth data:', error);
      return null;
    }
  }

  /**
   * Save location data offline
   */
  async saveLocation(locationData: Partial<Location>): Promise<number> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Offline storage not initialized');

    const locationWithMeta = {
      ...locationData,
      pendingSync: true,
      offlineCreatedAt: Date.now(),
    };

    // Save to local storage
    const id = await this.db.add('locations', locationWithMeta);

    // Add to sync queue if online
    await this.db.add('syncQueue', {
      type: 'location',
      action: 'create',
      data: locationData,
      timestamp: Date.now(),
    });

    // Try to sync immediately if online
    if (this.online) {
      this.attemptSync();
    }

    return id;
  }

  /**
   * Save barcode data offline
   */
  async saveBarcode(barcodeData: Partial<Barcode>): Promise<number> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Offline storage not initialized');

    const barcodeWithMeta = {
      ...barcodeData,
      pendingSync: true,
      tempId: `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      offlineCreatedAt: Date.now(),
    };

    // Save to local storage
    const id = await this.db.add('barcodes', barcodeWithMeta);

    // Add to sync queue if online
    await this.db.add('syncQueue', {
      type: 'barcode',
      action: 'create',
      data: barcodeData,
      timestamp: Date.now(),
    });

    // Try to sync immediately if online
    if (this.online) {
      this.attemptSync();
    }

    return id;
  }

  /**
   * Get locations by project ID
   */
  async getLocationsByProject(projectId: number): Promise<Array<Partial<Location>>> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    return await this.db.getAllFromIndex('locations', 'by-project', projectId);
  }

  /**
   * Get barcodes by location ID
   */
  async getBarcodesByLocation(locationId: number): Promise<Array<Partial<Barcode>>> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    return await this.db.getAllFromIndex('barcodes', 'by-location', locationId);
  }

  /**
   * Attempt to synchronize offline data with the server
   */
  async attemptSync(): Promise<boolean> {
    // Don't sync if offline or sync already in progress
    if (!this.online || this.syncInProgress) return false;
    if (!this.db) await this.init();
    if (!this.db) return false;

    this.syncInProgress = true;
    let success = false;

    try {
      // Get all sync queue items, ordered by timestamp
      const syncItems = await this.db.getAll('syncQueue');
      syncItems.sort((a, b) => a.timestamp - b.timestamp);

      // Process each item in the queue
      for (const item of syncItems) {
        try {
          switch (item.type) {
            case 'location':
              if (item.action === 'create') {
                // Send to server
                const locationResponse = await apiRequest('POST', '/api/locations', item.data);
                if (locationResponse.ok) {
                  // Update local record with server ID
                  const serverLocation = await locationResponse.json();
                  
                  // Find the local location by searching for unsynced items matching the data
                  const localLocations = await this.db.getAll('locations');
                  const matchingLocation = localLocations.find(loc => 
                    loc.pendingSync && 
                    loc.name === item.data.name && 
                    loc.projectId === item.data.projectId
                  );
                  
                  if (matchingLocation) {
                    // Update local record
                    await this.db.put('locations', {
                      ...matchingLocation,
                      id: serverLocation.id,
                      pendingSync: false
                    });
                  }
                  
                  // Remove from sync queue
                  await this.db.delete('syncQueue', item.id);
                }
              }
              break;

            case 'barcode':
              if (item.action === 'create') {
                // Send to server
                const barcodeResponse = await apiRequest('POST', '/api/barcodes', item.data);
                if (barcodeResponse.ok) {
                  // Update local record with server ID
                  const serverBarcode = await barcodeResponse.json();
                  
                  // Find the local barcode by searching for unsynced items matching the data
                  const localBarcodes = await this.db.getAll('barcodes');
                  const matchingBarcode = localBarcodes.find(bc => 
                    bc.pendingSync && 
                    bc.value === item.data.value && 
                    bc.locationId === item.data.locationId
                  );
                  
                  if (matchingBarcode) {
                    // Update local record
                    await this.db.put('barcodes', {
                      ...matchingBarcode,
                      id: serverBarcode.id,
                      pendingSync: false
                    });
                  }
                  
                  // Remove from sync queue
                  await this.db.delete('syncQueue', item.id);
                }
              }
              break;
          }
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          // Keep the item in the queue for retry
        }
      }

      success = true;
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }

    return success;
  }

  /**
   * Check if we have any pending data to sync
   */
  async hasPendingChanges(): Promise<boolean> {
    if (!this.db) await this.init();
    if (!this.db) return false;

    const syncCount = await this.db.count('syncQueue');
    return syncCount > 0;
  }

  /**
   * Clear all offline data (used for logout)
   */
  async clearOfflineData(): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    // Clear all object stores except authCache
    await this.db.clear('locations');
    await this.db.clear('barcodes');
    await this.db.clear('syncQueue');
  }

  /**
   * Clean up resources
   */
  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.stopSyncInterval();
    this.db?.close();
    this.db = null;
    this.initialized = false;
  }
}

// Create singleton instance
export const offlineStorage = new OfflineStorage();
export default offlineStorage;