import { getProduct } from '@/lib/shopify';
import ShopTheLookClient from './ShopTheLookClient';

export interface ProductInfo {
  handle: string;
  title: string;
  price: string;
  images: { url: string; altText: string | null; type: string }[];
  colors: { label: string; color: string }[];
}

export interface LookSlide {
  lifestyleImage: string;
  product: ProductInfo | null;
  plusPosition: { x: number; y: number };
  objectPosition: { x: number; y: number };
  layoutClass: string;
}

const SLIDE_CONFIG = [
  {
    lifestyleImage: '/images/shopthelook-1.png',
    productHandle: 'malayali-dept-tank-top',
    plusPosition: { x: 0.63, y: 0.43 },
    objectPosition: { x: 0.55, y: 0.4 },
    layoutClass: 'md:w-[40%]',
  },
  {
    lifestyleImage: '/images/shopthelook-2.png',
    productHandle: 'god-s-own-culture-t-shirt',
    plusPosition: { x: 0.68, y: 0.42 },
    objectPosition: { x: 0.6, y: 0.4 },
    layoutClass: 'md:w-[60%]',
  },
];

const FALLBACK_PRODUCTS: Record<string, ProductInfo> = {
  'malayali-dept-tank-top': {
    handle: 'malayali-dept-tank-top',
    title: 'MALAYALI DEPT. Tank Top',
    price: '0.0',
    images: [{ url: 'https://cdn.shopify.com/s/files/1/0653/4610/9534/files/ChatGPTImageSep8_2026_02_51_15PM.png?v=1789541482', altText: 'MALAYALI DEPT. Tank Top', type: 'IMAGE' }],
    colors: [{ label: 'Black', color: '#000000' }],
  },
  'god-s-own-culture-t-shirt': {
    handle: 'god-s-own-culture-t-shirt',
    title: 'GOD’S OWN CULTURE T-Shirt',
    price: '1.0',
    images: [{ url: 'https://cdn.shopify.com/s/files/1/0653/4610/9534/files/ChatGPT_Image_Sep_16_2026_12_22_50_PM.png?v=1789541590', altText: 'GOD’S OWN CULTURE T-Shirt', type: 'IMAGE' }],
    colors: [{ label: 'Black', color: '#000000' }],
  },
};

export default async function ShopTheLook() {
  const slides: LookSlide[] = await Promise.all(
    SLIDE_CONFIG.map(async (config) => {
      try {
        const product = await getProduct(config.productHandle);
        return {
          lifestyleImage: config.lifestyleImage,
          plusPosition: config.plusPosition,
          objectPosition: config.objectPosition,
          layoutClass: config.layoutClass,
          product: product
            ? {
                handle: product.handle,
                title: product.title,
                price: product.price,
                images: product.images
                  .filter((img: any) => img.type === 'IMAGE')
                  .slice(0, 4),
                colors: product.colors || [],
              }
            : FALLBACK_PRODUCTS[config.productHandle] || null,
        };
      } catch (e) {
        console.error(`Failed to fetch product: ${config.productHandle}`, e);
        return {
          lifestyleImage: config.lifestyleImage,
          plusPosition: config.plusPosition,
          objectPosition: config.objectPosition,
          layoutClass: config.layoutClass,
          product: FALLBACK_PRODUCTS[config.productHandle] || null,
        };
      }
    })
  );

  return <ShopTheLookClient slides={slides} />;
}
