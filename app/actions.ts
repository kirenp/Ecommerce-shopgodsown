'use server';

import { getProduct, getProducts } from "@/lib/shopify";

export async function getProductDetails(handle: string) {
    try {
        const product = await getProduct(handle);
        return product;
    } catch (error) {
        console.error("Error fetching product details:", error);
        return null;
    }
}

export async function getRecommendedProducts(limit: number = 4) {
    try {
        const products = await getProducts(limit);
        return products;
    } catch (error) {
        console.error("Error fetching recommended products:", error);
        return [];
    }
}
