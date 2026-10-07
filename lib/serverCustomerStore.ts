import fs from 'fs';
import path from 'path';

export interface SavedCustomerAddress {
  id: string;
  firstName: string;
  lastName?: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  isDefault?: boolean;
}

const memoryStore = new Map<string, SavedCustomerAddress[]>();
let hasLoadedFromDisk = false;

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'customer_addresses.json');

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

function readStore(): Record<string, SavedCustomerAddress[]> {
  try {
    ensureStoreFile();
    if (!fs.existsSync(STORE_FILE)) return {};
    const content = fs.readFileSync(STORE_FILE, 'utf8');
    return content ? JSON.parse(content) : {};
  } catch (e) {
    return {};
  }
}

function writeStore(store: Record<string, SavedCustomerAddress[]>) {
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
    for (const [email, addrs] of Object.entries(diskData)) {
      if (Array.isArray(addrs)) {
        memoryStore.set(email.toLowerCase(), addrs);
      }
    }
  } catch {}
}

export function getServerCustomerAddresses(email: string): SavedCustomerAddress[] {
  if (!email) return [];
  loadInitialMemoryStore();
  const cleanEmail = email.trim().toLowerCase();
  return memoryStore.get(cleanEmail) || [];
}

export function saveServerCustomerAddress(email: string, address: SavedCustomerAddress): SavedCustomerAddress[] {
  if (!email) return [];
  loadInitialMemoryStore();
  const cleanEmail = email.trim().toLowerCase();
  const currentAddrs = memoryStore.get(cleanEmail) || [];

  const existingIndex = currentAddrs.findIndex(
    a => a.id === address.id || (a.address.toLowerCase() === address.address.toLowerCase() && a.pinCode === address.pinCode)
  );

  const updatedAddress: SavedCustomerAddress = {
    ...address,
    id: address.id || `addr_${Date.now()}`,
    isDefault: currentAddrs.length === 0 ? true : (address.isDefault ?? false)
  };

  let newAddrs: SavedCustomerAddress[];
  if (existingIndex >= 0) {
    newAddrs = [...currentAddrs];
    newAddrs[existingIndex] = updatedAddress;
  } else {
    newAddrs = [updatedAddress, ...currentAddrs];
  }

  // If new/updated address is marked as default, unset other defaults
  if (updatedAddress.isDefault) {
    newAddrs = newAddrs.map(a => a.id === updatedAddress.id ? a : { ...a, isDefault: false });
  }

  memoryStore.set(cleanEmail, newAddrs);

  // Guarded background file sync
  try {
    const diskStore = readStore();
    diskStore[cleanEmail] = newAddrs;
    writeStore(diskStore);
  } catch {}

  return newAddrs;
}

export function removeServerCustomerAddress(email: string, addressId: string): SavedCustomerAddress[] {
  if (!email || !addressId) return [];
  loadInitialMemoryStore();
  const cleanEmail = email.trim().toLowerCase();
  const currentAddrs = memoryStore.get(cleanEmail) || [];

  const newAddrs = currentAddrs.filter(a => a.id !== addressId);
  if (newAddrs.length > 0 && !newAddrs.some(a => a.isDefault)) {
    newAddrs[0].isDefault = true;
  }

  memoryStore.set(cleanEmail, newAddrs);

  // Guarded background file sync
  try {
    const diskStore = readStore();
    diskStore[cleanEmail] = newAddrs;
    writeStore(diskStore);
  } catch {}

  return newAddrs;
}
