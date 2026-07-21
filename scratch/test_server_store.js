const { getServerCustomerAddresses, saveServerCustomerAddress, removeServerCustomerAddress } = require('./lib/serverCustomerStore');

console.log("Testing server customer store...");
const testEmail = "kirenprakash08@gmail.com";

const addr = {
  id: "addr_12345",
  firstName: "Kiren",
  lastName: "Jayaprakash",
  address: "Kiren villa, pazhinjorkonam",
  city: "Alappuzha",
  state: "Kerala",
  pinCode: "690529",
  phone: "7909192145",
  isDefault: true
};

const updated = saveServerCustomerAddress(testEmail, addr);
console.log("Saved address result:\n", updated);

const retrieved = getServerCustomerAddresses(testEmail);
console.log("Retrieved addresses for email:\n", retrieved);
