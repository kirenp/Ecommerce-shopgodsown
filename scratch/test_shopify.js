const fs = require('fs');
const path = require('path');

// Load .env.local dynamically
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...rest] = trimmed.split('=');
      process.env[key.trim()] = rest.join('=').trim();
    }
  });
}

const domain = process.env.SHOPIFY_STORE_DOMAIN || "godsown-9751.myshopify.com";
const publicToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_API_VERSION || "2026-07";

async function test() {
  const query = `
    query {
      products(first: 1) {
        edges {
          node {
            id
            title
            variants(first: 5) {
              edges {
                node {
                  id
                  title
                  quantityAvailable
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch(`https://${domain}/api/${apiVersion}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": publicToken
      },
      body: JSON.stringify({ query })
    });
    const json = await res.json();
    console.log("Response status:", res.status);
    console.log("Response Body:", JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
