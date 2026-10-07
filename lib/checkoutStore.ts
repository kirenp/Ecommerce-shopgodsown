import fs from "fs";
import path from "path";

export interface PendingCheckout {
  orderId: string; // Razorpay order_id
  items: any[];
  contact: string;
  shippingAddress: any;
  billingAddress?: any;
  discountCode?: string;
  amountInPaise: number;
  createdAt: number;
}

const memoryStore = new Map<string, PendingCheckout>();
const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "pending_checkouts.json");

function ensureStoreFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      fs.writeFileSync(STORE_FILE, JSON.stringify({}), "utf8");
    }
  } catch {}
}

function loadStore(): Record<string, PendingCheckout> {
  try {
    ensureStoreFile();
    if (!fs.existsSync(STORE_FILE)) return {};
    const content = fs.readFileSync(STORE_FILE, "utf8");
    return content ? JSON.parse(content) : {};
  } catch {
    return {};
  }
}

function persistStore(data: Record<string, PendingCheckout>) {
  try {
    ensureStoreFile();
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf8");
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
