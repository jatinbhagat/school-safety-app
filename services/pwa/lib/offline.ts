/**
 * Offline queue management for school safety reports
 * Uses IndexedDB with localStorage fallback
 */

const DB_NAME = 'school-safety-reports';
const STORE_NAME = 'pending-reports';
const DB_VERSION = 1;

export interface Report {
  id?: string;
  schoolSlug: string;
  category: string;
  description?: string;
  timestamp: number;
}

class OfflineQueue {
  private db: IDBDatabase | null = null;
  private useLocalStorage = false;

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Try IndexedDB first
      await this.initIndexedDB();
    } catch (error) {
      console.warn('IndexedDB not available, falling back to localStorage', error);
      this.useLocalStorage = true;
    }
  }

  private initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  /**
   * Enqueue a report for later sync (offline mode)
   */
  async enqueueReport(report: Report): Promise<void> {
    if (!this.db && !this.useLocalStorage) {
      await this.init();
    }

    const reportWithTimestamp = {
      ...report,
      timestamp: Date.now(),
    };

    if (this.useLocalStorage) {
      return this.enqueueToLocalStorage(reportWithTimestamp);
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(reportWithTimestamp);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private enqueueToLocalStorage(report: Report): void {
    const queue = this.getLocalStorageQueue();
    queue.push(report);
    localStorage.setItem('pending-reports', JSON.stringify(queue));
  }

  private getLocalStorageQueue(): Report[] {
    try {
      const data = localStorage.getItem('pending-reports');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get all pending reports
   */
  async getPendingReports(): Promise<Report[]> {
    if (!this.db && !this.useLocalStorage) {
      await this.init();
    }

    if (this.useLocalStorage) {
      return this.getLocalStorageQueue();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all pending reports (after successful sync)
   */
  async clearQueue(): Promise<void> {
    if (this.useLocalStorage) {
      localStorage.removeItem('pending-reports');
      return;
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Sync pending reports to the server
   * This is a stub - implement retry logic and error handling as needed
   */
  async syncReports(apiUrl: string = 'http://localhost:3001/report'): Promise<void> {
    const pending = await this.getPendingReports();

    if (pending.length === 0) {
      console.log('No pending reports to sync');
      return;
    }

    console.log(`Syncing ${pending.length} pending reports...`);

    // TODO: Implement actual sync logic with proper error handling
    // For now, this is a stub that would:
    // 1. Iterate through pending reports
    // 2. POST each to the API
    // 3. Remove from queue on success
    // 4. Implement exponential backoff on failure

    for (const report of pending) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            schoolSlug: report.schoolSlug,
            category: report.category,
            description: report.description,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to sync report: ${response.statusText}`);
        }

        console.log('Report synced successfully:', report.id);
      } catch (error) {
        console.error('Failed to sync report:', error);
        // TODO: Implement retry logic
        throw error;
      }
    }

    // Clear queue after successful sync
    await this.clearQueue();
    console.log('All reports synced successfully');
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueue();
