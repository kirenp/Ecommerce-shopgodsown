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
    lifestyleImage: '/images/productnavig-2.png',
    productHandle: 'malayali-dept-oversized-tank-top-limited-edition',
    plusPosition: { x: 0.52, y: 0.62 },
    objectPosition: { x: 0.5, y: 0.4 },
    layoutClass: 'md:w-[40%]',
  },
  {
    lifestyleImage: '/images/IMG_9026.JPG.jpeg',
    productHandle: 'gods-own-limited-edition-tees',
    plusPosition: { x: 0.68, y: 0.42 },
    objectPosition: { x: 0.6, y: 0.5 },
    layoutClass: 'md:w-[60%]',
  },
];

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
            : null,
        };
      } catch (e) {
        console.error(`Failed to fetch product: ${config.productHandle}`, e);
        return {
          lifestyleImage: config.lifestyleImage,
          plusPosition: config.plusPosition,
          objectPosition: config.objectPosition,
          layoutClass: config.layoutClass,
          product: null,
        };
      }
    })
  );

  return <ShopTheLookClient slides={slides} />;
}
