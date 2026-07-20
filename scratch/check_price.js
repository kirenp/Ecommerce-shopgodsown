const domain = 'godsown-9751.myshopify.com';
const token = '015b0ffcb5edb0548a642245e0401bb4';
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

fetch(`https://${domain}/api/2026-01/graphql.json`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': token
  },
  body: JSON.stringify({ query })
}).then(res => res.json()).then(data => {
  console.log(JSON.stringify(data, null, 2));
}).catch(err => console.error(err));
