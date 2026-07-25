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

const domain = process.env.SHOPIFY_STORE_DOMAIN || 'godsown-9751.myshopify.com';
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const query = `
  query getProduct {
    product(handle: "gods-own-limited-edition-tees") {
      id
      title
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      variants(first: 5) {
        edges {
          node {
            id
            title
            price {
              amount
            }
          }
        }
      }
    }
  }
`;

fetch(`https://${domain}/api/2026-07/graphql.json`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': token
  },
  body: JSON.stringify({ query })
}).then(res => res.json()).then(data => {
  console.log(JSON.stringify(data, null, 2));
}).catch(err => console.error(err));
