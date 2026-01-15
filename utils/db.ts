
import { Transaction, RecurringTransaction, SavingsGoal, Budget, Asset, AllCategories } from '../types';

const DB_NAME = 'MoneyManagerDB';
const DB_VERSION = 2; // Nâng cấp version để thêm store mới

export const STORES = {
  TRANSACTIONS: 'transactions',
  RECURRING: 'recurring',
  GOALS: 'goals',
  BUDGETS: 'budgets',
  ASSETS: 'assets',
  METADATA: 'metadata',
  AI_CACHE: 'ai_cache' // Store mới cho lời khuyên AI
};

export class MoneyManagerDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(STORES.RECURRING)) db.createObjectStore(STORES.RECURRING, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(STORES.GOALS)) db.createObjectStore(STORES.GOALS, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(STORES.BUDGETS)) db.createObjectStore(STORES.BUDGETS, { keyPath: 'categoryId' });
        if (!db.objectStoreNames.contains(STORES.ASSETS)) db.createObjectStore(STORES.ASSETS, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(STORES.METADATA)) db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
        if (!db.objectStoreNames.contains(STORES.AI_CACHE)) db.createObjectStore(STORES.AI_CACHE, { keyPath: 'id' });
      };
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("DB not initialized");
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getMeta<T>(key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("DB not initialized");
      const transaction = this.db.transaction([STORES.METADATA], 'readonly');
      const store = transaction.objectStore(STORES.METADATA);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result ? request.result.value : null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveAll<T>(storeName: string, items: T[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("DB not initialized");
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      store.clear();
      items.forEach(item => store.add(item));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async saveMeta(key: string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!this.db) return reject("DB not initialized");
        const transaction = this.db.transaction([STORES.METADATA], 'readwrite');
        const store = transaction.objectStore(STORES.METADATA);
        store.put({ key, value });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
  }

  // Thêm phương thức lưu trữ đơn lẻ cho Cache
  async put(storeName: string, item: any): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!this.db) return reject("DB not initialized");
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        store.put(item);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const db = new MoneyManagerDB();
