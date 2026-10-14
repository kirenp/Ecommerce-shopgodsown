import fs from "fs";
import path from "path";
import os from "os";

export interface PendingCheckout {
  orderId: string; // Razorpay order_id
  items: any[];
  contact: string;
  shippingAddress: any;
  billingAddress?: any;
  discountCode?: string;
  discountAmount?: number;
  finalTotal?: number;
  amountInPaise: number;
  createdAt: number;
}

const memoryStore = new Map<string, PendingCheckout>();
const DATA_DIR = path.join(process.cwd(), "data");

function getStoreFilePath(): string {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const testFile = path.join(DATA_DIR, ".write-test");
    fs.writeFileSync(testFile, "ok", "utf8");
    fs.unlinkSync(testFile);
    return path.join(DATA_DIR, "pending_checkouts.json");
  } catch {
    return path.join(os.tmpdir(), "godsown_pending_checkouts.json");
  }
}

function ensureStoreFile(targetPath: string) {
  try {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(targetPath)) {
      fs.writeFileSync(targetPath, JSON.stringify({}), "utf8");
    }
  } catch {}
}

function loadStore(): Record<string, PendingCheckout> {
  const storeFile = getStoreFilePath();
  try {
    ensureStoreFile(storeFile);
    if (!fs.existsSync(storeFile)) return {};
    const content = fs.readFileSync(storeFile, "utf8");
    return content ? JSON.parse(content) : {};
  } catch {
    return {};
  }
}

function persistStore(data: Record<string, PendingCheckout>) {
  const storeFile = getStoreFilePath();
  try {
    ensureStoreFile(storeFile);
    fs.writeFileSync(storeFile, JSON.stringify(data, null, 2), "utf8");
  } catch {}
}

export function savePendingCheckout(orderId: string, checkout: PendingCheckout): void {
  if (!orderId) return;
  memoryStore.set(orderId, checkout);

  try {
    const data = loadStore();
    data[orderId] = checkout;
    // Prune entries older than 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    for (const key of Object.keys(data)) {
      if (data[key].createdAt && data[key].createdAt < oneDayAgo) {
        delete data[key];
        memoryStore.delete(key);
      }
    }
    persistStore(data);
  } catch {}
}

export function getPendingCheckout(orderId: string): PendingCheckout | null {
  if (!orderId) return null;
  if (memoryStore.has(orderId)) {
    return memoryStore.get(orderId)!;
  }

  try {
    const data = loadStore();
    const entry = data[orderId];
    if (entry) {
      memoryStore.set(orderId, entry);
      return entry;
    }
  } catch {}

  return null;
}

export function removePendingCheckout(orderId: string): void {
  if (!orderId) return;
  memoryStore.delete(orderId);
  try {
    const data = loadStore();
    if (data[orderId]) {
      delete data[orderId];
      persistStore(data);
    }
  } catch {}
}
