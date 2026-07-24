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
    console.warn("Failed to initialize server customer order store file:", e);
  }
}

function readStore(): Record<string, ServerCustomerOrder[]> {
  ensureStoreFile();
  try {
    if (!fs.existsSync(STORE_FILE)) return {};
    const content = fs.readFileSync(STORE_FILE, 'utf8');
    return content ? JSON.parse(content) : {};
  } catch (e) {
    console.warn("Failed to read customer order store:", e);
    return {};
  }
}

function writeStore(store: Record<string, ServerCustomerOrder[]>) {
  ensureStoreFile();
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    console.warn("Failed to write customer order store:", e);
  }
}

export function getServerCustomerOrders(email: string): ServerCustomerOrder[] {
  if (!email) return [];
  const cleanEmail = email.trim().toLowerCase();
  const store = readStore();
  return store[cleanEmail] || [];
}

export function saveServerCustomerOrder(order: ServerCustomerOrder): ServerCustomerOrder[] {
  if (!order.email) return [];
  const cleanEmail = order.email.trim().toLowerCase();
  const store = readStore();
  const currentOrders = store[cleanEmail] || [];

  const existingIndex = currentOrders.findIndex(o => o.orderNumber === order.orderNumber || o.id === order.id);

  let newOrders: ServerCustomerOrder[];
  if (existingIndex >= 0) {
    newOrders = [...currentOrders];
    newOrders[existingIndex] = order;
  } else {
    newOrders = [order, ...currentOrders];
  }

  store[cleanEmail] = newOrders;
  writeStore(store);
  return newOrders;
}
