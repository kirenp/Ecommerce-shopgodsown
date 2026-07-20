const domain = process.env.SHOPIFY_STORE_DOMAIN;
const publicAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const privateAccessToken = process.env.SHOPIFY_PRIVATE_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_API_VERSION || '2026-01';

export async function shopifyFetch<T>({
  query,
  variables = {},
}: {
  query: string;
  variables?: any;
}): Promise<{ data: T } | never> {
  try {
    const endpoint = `https://${domain}/api/${apiVersion}/graphql.json`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (privateAccessToken) {
      headers["Shopify-Storefront-Private-Token"] = privateAccessToken;
    } else if (publicAccessToken) {
      headers["X-Shopify-Storefront-Access-Token"] = publicAccessToken;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 0 }, // Disable cache during debugging
    });

    const json = await res.json();
    if (json.errors) {
      console.warn("Shopify API non-fatal warnings/errors:", JSON.stringify(json.errors, null, 2));
    }
    if (!res.ok || !json.data) {
      console.error("Shopify API Fatal Error:", json.errors || res.statusText);
      throw new Error(`Shopify API error: ${res.statusText}`);
    }

    return json;
  } catch (error) {
    console.error("Shopify Fetch Error:", error);
    throw error;
  }
}

export const GET_PRODUCTS_QUERY = `
  query getProducts($first: Int!) {
    products(first: $first, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id
          title
          handle
          productType
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
            }
          }
          options {
            name
            values
          }
        }
      }
    }
  }
`;

export async function getProducts(first: number = 8) {
  const res = await shopifyFetch<any>({
    query: GET_PRODUCTS_QUERY,
    variables: { first },
  });

  if (!res.data?.products?.edges) {
    console.warn("No products found in Shopify response:", res);
    return [];
  }

  const products = res.data.products.edges.map((edge: any) => {
    const product = edge.node;
    const colorsOption = product.options?.find((o: any) => o.name.toLowerCase() === 'color');
    const sizesOption = product.options?.find((o: any) => o.name.toLowerCase() === 'size');
    return {
      id: product.id,
      title: product.title,
      handle: product.handle,
      image: product.images.edges[0]?.node.url || "/images/placeholder.png",
      price: product.priceRange.minVariantPrice.amount,
      maxPrice: product.priceRange.maxVariantPrice?.amount || product.priceRange.minVariantPrice.amount,
      category: product.productType || '',
      colors: colorsOption?.values || [],
      sizes: sizesOption?.values || [],
      isLive: true
    };
  });

  if (products.length === 0) {
    console.warn("Fetched 0 products. Full Response Body:", JSON.stringify(res, null, 2));
    return [];
  }

  console.log(`Fetched ${products.length} live products from Shopify.`);
  return products;
}

export const GET_COLLECTIONS_QUERY = `
  query getCollections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
          image {
            url
            altText
          }
          products(first: 4) {
            edges {
              node {
                id
                title
                handle
                images(first: 1) {
                  edges {
                    node {
                      url
                    }
                  }
                }
                priceRange {
                  minVariantPrice {
                    amount
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function getCollections(first: number = 4) {
  const res = await shopifyFetch<any>({
    query: GET_COLLECTIONS_QUERY,
    variables: { first },
  });

  if (!res.data?.collections?.edges) {
    console.warn("No collections found in Shopify response:", res);
    return [];
  }

  const collections = res.data.collections.edges
    .map((edge: any) => edge.node)
    .filter((collection: any) => collection.title !== "Home page") // Remove Home page collection
    .map((collection: any) => ({
      id: collection.id,
      title: collection.title,
      handle: collection.handle,
      description: collection.description,
      image: collection.image?.url || "/images/placeholder.png",
      products: collection.products.edges.map((productEdge: any) => {
        const product = productEdge.node;
        return {
          id: product.id,
          title: product.title,
          handle: product.handle,
          image: product.images.edges[0]?.node.url || "/images/placeholder.png",
          price: product.priceRange.minVariantPrice.amount,
        };
      }),
    }));

  console.log(`Fetched ${collections.length} collections from Shopify.`);
  return collections;
}

export const GET_COLLECTION_BY_HANDLE_QUERY = `
  query getCollectionByHandle($handle: String!) {
    collection(handle: $handle) {
      id
      title
      handle
      description
      image {
        url
      }
      products(first: 100) {
        edges {
          node {
            id
            title
            handle
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
            priceRange {
              minVariantPrice {
                amount
              }
            }
          }
        }
      }
    }
  }
`;

export async function getCollectionByHandle(handle: string) {
  const res = await shopifyFetch<any>({
    query: GET_COLLECTION_BY_HANDLE_QUERY,
    variables: { handle },
  });

  if (!res.data?.collection) {
    return null;
  }

  const collection = res.data.collection;
  return {
    id: collection.id,
    title: collection.title,
    handle: collection.handle,
    description: collection.description,
    image: collection.image?.url || "/images/placeholder.png",
    products: collection.products.edges.map((edge: any) => {
      const product = edge.node;
      return {
        id: product.id,
        title: product.title,
        handle: product.handle,
        image: product.images.edges[0]?.node.url || "/images/placeholder.png",
        price: product.priceRange.minVariantPrice.amount,
      };
    }),
  };
}

export const GET_PRODUCT_DETAILS_QUERY = `
  query getProduct($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      description
      descriptionHtml
      availableForSale
      productType
      vendor
      category {
        name
      }
      media(first: 10) {
        edges {
          node {
            mediaContentType
            ... on MediaImage {
              image {
                url
                altText
                width
                height
              }
            }
            ... on Video {
              id
              sources {
                url
                mimeType
                format
              }
            }
          }
        }
      }
      options {
        name
        values
      }
      metafields(identifiers: [
        {namespace: "custom", key: "color"},
        {namespace: "custom", key: "size"},
        {namespace: "custom", key: "category"},
        {namespace: "shopify", key: "color-pattern"},
        {namespace: "shopify", key: "size"}
      ]) {
        id
        namespace
        key
        value
        reference {
          ... on Metaobject {
            fields {
              key
              value
            }
          }
        }
        references(first: 10) {
          edges {
            node {
              ... on Metaobject {
                fields {
                  key
                  value
                }
              }
            }
          }
        }
      }
      variants(first: 20) {
        edges {
          node {
            id
            title
            availableForSale
            quantityAvailable
            selectedOptions {
              name
              value
            }
            price {
              amount
              currencyCode
            }
            image {
              url
              altText
              width
              height
            }
          }
        }
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
    }
  }
`;

export async function getProduct(handle: string) {
  const res = await shopifyFetch<any>({
    query: GET_PRODUCT_DETAILS_QUERY,
    variables: { handle },
  });

  if (!res.data?.product) {
    console.warn(`Product not found for handle: ${handle}`);
    return null;
  }

  const product = res.data.product;
  
  // Helper to extract values from metafield (handle direct value, single reference, or list of references)
  const getMetafieldValues = (key: string) => {
    const mf = product.metafields.find((m: any) => m?.key === key);
    if (!mf) return [];

    // 1. Handle Multiple References (List)
    if (mf.references?.edges?.length > 0) {
      return mf.references.edges
        .map((edge: any) => {
          const fields = edge.node.fields;
          const label = fields.find((f: any) => f.key === "label" || f.key === "name" || f.key === "value")?.value;
          const color = fields.find((f: any) => f.key === "color" || f.key === "hex" || f.key === "code")?.value;
          return { label, color: color || label };
        })
        .filter((v: any) => v.label);
    }

    // 2. Handle Single Reference
    if (mf.reference?.fields) {
      const fields = mf.reference.fields;
      const label = fields.find((f: any) => f.key === "label" || f.key === "name" || f.key === "value")?.value;
      const color = fields.find((f: any) => f.key === "color" || f.key === "hex" || f.key === "code")?.value;
      return [{ label, color: color || label }];
    }

    // 3. Fallback to direct value
    if (mf.value && !mf.value.includes("gid://shopify/")) {
      return mf.value.split(",").map((v: string) => ({ label: v.trim(), color: v.trim() }));
    }

    return [];
  };

  // Filter out "Default Title" which appears when there's only one variant
  const filteredOptions = product.options.filter(
    (option: any) => option.values.length > 1 || option.name !== "Title"
  );

  const colors = getMetafieldValues("color").length > 0 ? getMetafieldValues("color") : getMetafieldValues("color-pattern");
  const sizes = getMetafieldValues("size");

  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    description: product.description,
    descriptionHtml: product.descriptionHtml,
    available: product.availableForSale,
    images: product.media.edges.map((edge: any) => {
      const node = edge.node;
      if (node.mediaContentType === 'IMAGE' && node.image) {
        return {
          type: 'IMAGE',
          url: node.image.url,
          altText: node.image.altText || null
        };
      } else if (node.mediaContentType === 'VIDEO') {
        const source = node.sources.find((s: any) => s.format === 'mp4') || node.sources[0];
        let url = source?.url;
        // Fix for headless stores: Shopify custom domains proxy CDN assets 
        // through /cdn/shop/ prefix, but cdn.shopify.com serves them directly.
        // e.g. shopgodsown.com/cdn/shop/videos/... → cdn.shopify.com/videos/...
        if (url) {
          try {
            const urlObj = new URL(url);
            urlObj.hostname = 'cdn.shopify.com';
            // Strip the /cdn/shop proxy prefix that custom domains use
            if (urlObj.pathname.startsWith('/cdn/shop/')) {
              urlObj.pathname = urlObj.pathname.replace('/cdn/shop/', '/');
            }
            url = urlObj.toString();
          } catch (e) {
            console.error("Invalid video URL", url);
          }
        }
        return {
          type: 'VIDEO',
          url: url,
          altText: null
        };
      }
      return null;
    }).filter((m: any) => m && m.url),
    options: filteredOptions,
    colors,
    sizes,
    category: product.category?.name 
      ? `${product.productType || ''} in ${product.category.name}`.trim()
      : product.productType,
    vendor: product.vendor,
    price: product.priceRange.minVariantPrice.amount,
    currencyCode: product.priceRange.minVariantPrice.currencyCode,
    variants: product.variants.edges.map((edge: any) => ({
      id: edge.node.id,
      title: edge.node.title,
      available: edge.node.availableForSale,
      quantityAvailable: edge.node.quantityAvailable ?? 999, // default to 999 if null/scope denied, so it doesn't hard-restrict to 1
      price: edge.node.price.amount,
      options: edge.node.selectedOptions,
      image: edge.node.image?.url || null
    }))
  };
}
