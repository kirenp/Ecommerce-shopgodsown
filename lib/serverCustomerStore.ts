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
    console.warn("Failed to initialize server customer address store file:", e);
  }
}

function readStore(): Record<string, SavedCustomerAddress[]> {
  ensureStoreFile();
  try {
    if (!fs.existsSync(STORE_FILE)) return {};
    const content = fs.readFileSync(STORE_FILE, 'utf8');
    return content ? JSON.parse(content) : {};
  } catch (e) {
    console.warn("Failed to read customer address store:", e);
    return {};
  }
}

function writeStore(store: Record<string, SavedCustomerAddress[]>) {
  ensureStoreFile();
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    console.warn("Failed to write customer address store:", e);
  }
}

export function getServerCustomerAddresses(email: string): SavedCustomerAddress[] {
  if (!email) return [];
  const cleanEmail = email.trim().toLowerCase();
  const store = readStore();
  return store[cleanEmail] || [];
}

export function saveServerCustomerAddress(email: string, address: SavedCustomerAddress): SavedCustomerAddress[] {
  if (!email) return [];
  const cleanEmail = email.trim().toLowerCase();
  const store = readStore();
  const currentAddrs = store[cleanEmail] || [];

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

  store[cleanEmail] = newAddrs;
  writeStore(store);
  return newAddrs;
}

export function removeServerCustomerAddress(email: string, addressId: string): SavedCustomerAddress[] {
  if (!email || !addressId) return [];
  const cleanEmail = email.trim().toLowerCase();
  const store = readStore();
  const currentAddrs = store[cleanEmail] || [];

  const newAddrs = currentAddrs.filter(a => a.id !== addressId);
  if (newAddrs.length > 0 && !newAddrs.some(a => a.isDefault)) {
    newAddrs[0].isDefault = true;
  }

  store[cleanEmail] = newAddrs;
  writeStore(store);
  return newAddrs;
}
