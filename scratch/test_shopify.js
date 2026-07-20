const domain = "godsown-9751.myshopify.com";
const publicToken = "015b0ffcb5edb0548a642245e0401bb4";
const apiVersion = "2026-01";

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
