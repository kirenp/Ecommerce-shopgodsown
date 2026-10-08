import fs from "fs";
import path from "path";

export interface ProcessedOrderRecord {
  id: string; // Shopify Order ID (GID or numeric string)
  name: string; // e.g. "#1024"
  financialStatus: string;
  orderId?: string; // Razorpay order_id
  paymentId?: string; // Razorpay payment_id
  processedAt: number;
}

interface OrderLockRecord {
  orderId: string;
  lockedAt: number;
}

// In-memory quick lookup caches
const memoryStore = new Map<string, ProcessedOrderRecord>();
const inFlightPromises = new Map<string, Promise<any>>();
const inFlightLocks = new Map<string, number>();

let hasLoadedFromDisk = false;

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "processed_orders.json");
const LOCKS_FILE = path.join(DATA_DIR, "order_locks.json");

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {}
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    ensureDataDir();
    if (!fs.existsSync(filePath)) return fallback;
    const content = fs.readFileSync(filePath, "utf8");
    return content ? JSON.parse(content) : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    ensureDataDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch {}
}

function loadInitialStore() {
  if (hasLoadedFromDisk) return;
  hasLoadedFromDisk = true;
  try {
    const diskData = readJsonFile<Record<string, ProcessedOrderRecord>>(STORE_FILE, {});
    for (const [key, record] of Object.entries(diskData)) {
      if (record && record.name) {
        memoryStore.set(key, record);
        if (record.orderId) memoryStore.set(record.orderId, record);
        if (record.paymentId) memoryStore.set(record.paymentId, record);
        if (record.id) memoryStore.set(record.id, record);
      }
    }
  } catch {}
}

/**
 * Retrieves a processed Shopify order summary by Razorpay orderId or paymentId.
 */
export function getProcessedOrder(orderId?: string, paymentId?: string): ProcessedOrderRecord | null {
  loadInitialStore();

  if (orderId && memoryStore.has(orderId)) {
    return memoryStore.get(orderId)!;
  }
  if (paymentId && memoryStore.has(paymentId)) {
    return memoryStore.get(paymentId)!;
  }

  // Refresh from disk in case another process wrote it
  try {
    const diskData = readJsonFile<Record<string, ProcessedOrderRecord>>(STORE_FILE, {});
    if (orderId && diskData[orderId]) {
      const rec = diskData[orderId];
      memoryStore.set(orderId, rec);
      if (paymentId) memoryStore.set(paymentId, rec);
      return rec;
    }
    if (paymentId && diskData[paymentId]) {
      const rec = diskData[paymentId];
      if (orderId) memoryStore.set(orderId, rec);
      memoryStore.set(paymentId, rec);
      return rec;
    }
  } catch {}

  return null;
}

/**
 * Persists a processed Shopify order summary both in memory and on disk.
 */
export function saveProcessedOrder(
  record: ProcessedOrderRecord,
  orderId?: string,
  paymentId?: string
): void {
  loadInitialStore();

  if (orderId) memoryStore.set(orderId, record);
  if (paymentId) memoryStore.set(paymentId, record);
  if (record.id) memoryStore.set(record.id, record);

  try {
    const diskData = readJsonFile<Record<string, ProcessedOrderRecord>>(STORE_FILE, {});
    if (orderId) diskData[orderId] = record;
    if (paymentId) diskData[paymentId] = record;
    if (record.id) diskData[record.id] = record;

    // Prune entries older than 14 days
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    for (const [k, v] of Object.entries(diskData)) {
      if (v.processedAt && v.processedAt < fourteenDaysAgo) {
        delete diskData[k];
        memoryStore.delete(k);
      }
    }

    writeJsonFile(STORE_FILE, diskData);
  } catch {}
}

/**
 * Registers an in-flight promise for concurrent requests in the same process.
 */
export function setInFlightOrderPromise(key: string, promise: Promise<any>): void {
  if (!key) return;
  inFlightPromises.set(key, promise);
}

/**
 * Retrieves an active in-flight promise if one exists.
 */
export function getInFlightOrderPromise(orderId?: string, paymentId?: string): Promise<any> | undefined {
  if (orderId && inFlightPromises.has(orderId)) {
    return inFlightPromises.get(orderId);
  }
  if (paymentId && inFlightPromises.has(paymentId)) {
    return inFlightPromises.get(paymentId);
  }
  return undefined;
}

/**
 * Clears an in-flight promise upon completion.
 */
export function clearInFlightOrderPromise(orderId?: string, paymentId?: string): void {
  if (orderId) inFlightPromises.delete(orderId);
  if (paymentId) inFlightPromises.delete(paymentId);
}

/**
 * Attempts to acquire an inter-process execution lock for an orderId.
 * Lock automatically expires after 30 seconds to prevent deadlocks.
 */
export function acquireOrderLock(orderId: string): boolean {
  if (!orderId) return false;
  const now = Date.now();
  const LOCK_TIMEOUT_MS = 30000;

  // Check in-memory lock
  const localLock = inFlightLocks.get(orderId);
  if (localLock && now - localLock < LOCK_TIMEOUT_MS) {
    return false;
  }

  // Check disk lock for multi-instance deployments
  try {
    const diskLocks = readJsonFile<Record<string, OrderLockRecord>>(LOCKS_FILE, {});
    const existing = diskLocks[orderId];
    if (existing && now - existing.lockedAt < LOCK_TIMEOUT_MS) {
      return false;
    }

    // Acquire lock
    inFlightLocks.set(orderId, now);
    diskLocks[orderId] = { orderId, lockedAt: now };
    writeJsonFile(LOCKS_FILE, diskLocks);
    return true;
  } catch {
    inFlightLocks.set(orderId, now);
    return true;
  }
}

/**
 * Releases the execution lock for an orderId.
 */
export function releaseOrderLock(orderId: string): void {
  if (!orderId) return;
  inFlightLocks.delete(orderId);
  try {
    const diskLocks = readJsonFile<Record<string, OrderLockRecord>>(LOCKS_FILE, {});
    if (diskLocks[orderId]) {
      delete diskLocks[orderId];
      writeJsonFile(LOCKS_FILE, diskLocks);
    }
  } catch {}
}

/**
 * Waits for an in-flight order creation to complete, polling the persistent store.
 * Returns the created order summary, or null if timed out.
 */
export async function waitForProcessedOrder(
  orderId: string,
  paymentId?: string,
  maxWaitMs = 15000
): Promise<ProcessedOrderRecord | null> {
  const inFlight = getInFlightOrderPromise(orderId, paymentId);
  if (inFlight) {
    try {
      const res = await inFlight;
      if (res && res.orderNumber) {
        return {
          id: res.orderId,
          name: res.orderNumber,
          financialStatus: "PAID",
          orderId,
          paymentId,
          processedAt: Date.now(),
        };
      }
    } catch {}
  }

  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const existing = getProcessedOrder(orderId, paymentId);
    if (existing) return existing;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return getProcessedOrder(orderId, paymentId);
}
