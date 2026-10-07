import fs from 'fs';
import path from 'path';

export interface ServerOrderItem {
  title: string;
  quantity: number;
  price: string;
  image?: string;
  size?: string;
  color?: string;
}

export interface ServerCustomerOrder {
  id: string;
  email: string;
  orderNumber: string;
  processedAt: string;
  totalPrice: string;
  fulfillmentStatus: 'FULFILLED' | 'UNFULFILLED' | 'IN_TRANSIT' | 'DELIVERED';
  financialStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  items: ServerOrderItem[];
  shippingAddress?: any;
  paymentId?: string;
}

const memoryStore = new Map<string, ServerCustomerOrder[]>();
let hasLoadedFromDisk = false;

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'customer_orders.json');

function ensureStoreFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      fs.writeFileSync(STORE_FILE, JSON.stringify({}), 'utf8');
    }
  } catch (e) {
    // Non-blocking in serverless / restricted container environments
  }
}

function readStore(): Record<string, ServerCustomerOrder[]> {
  try {
    ensureStoreFile();
    if (!fs.existsSync(STORE_FILE)) return {};
    const content = fs.readFileSync(STORE_FILE, 'utf8');
    return content ? JSON.parse(content) : {};
  } catch (e) {
    return {};
  }
}

function writeStore(store: Record<string, ServerCustomerOrder[]>) {
  try {
    ensureStoreFile();
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    // Non-blocking write failure; in-memory store remains active
  }
}

function loadInitialMemoryStore() {
  if (hasLoadedFromDisk) return;
  hasLoadedFromDisk = true;
  try {
    const diskData = readStore();
    for (const [email, orders] of Object.entries(diskData)) {
      if (Array.isArray(orders)) {
        memoryStore.set(email.toLowerCase(), orders);
      }
    }
  } catch {}
}

export function getServerCustomerOrders(email: string): ServerCustomerOrder[] {
  if (!email) return [];
  loadInitialMemoryStore();
  const cleanEmail = email.trim().toLowerCase();
  return memoryStore.get(cleanEmail) || [];
}

export function saveServerCustomerOrder(order: ServerCustomerOrder): ServerCustomerOrder[] {
  if (!order.email) return [];
  loadInitialMemoryStore();
  const cleanEmail = order.email.trim().toLowerCase();
  const currentOrders = memoryStore.get(cleanEmail) || [];

  const existingIndex = currentOrders.findIndex(o => o.orderNumber === order.orderNumber || o.id === order.id);

  let newOrders: ServerCustomerOrder[];
  if (existingIndex >= 0) {
    newOrders = [...currentOrders];
    newOrders[existingIndex] = order;
  } else {
    newOrders = [order, ...currentOrders];
  }

  memoryStore.set(cleanEmail, newOrders);

  // Guarded background file sync
  try {
    const diskStore = readStore();
    diskStore[cleanEmail] = newOrders;
    writeStore(diskStore);
  } catch {}

  return newOrders;
}
