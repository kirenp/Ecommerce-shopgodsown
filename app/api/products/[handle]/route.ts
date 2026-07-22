import { getProduct } from '@/lib/shopify';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;

  try {
    const product = await getProduct(handle);
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      handle: product.handle,
      title: product.title,
      price: product.price,
      images: product.images.filter((img: any) => img.type === 'IMAGE').slice(0, 4),
      colors: product.colors || [],
      sizes: product.sizes || [],
      variants: product.variants || [],
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
