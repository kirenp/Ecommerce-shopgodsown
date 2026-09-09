import { NextResponse } from 'next/server';
import { validateProductHandles } from '@/lib/shopify';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawHandles = Array.isArray(body?.handles) ? body.handles : [];
    
    if (rawHandles.length === 0) {
      return NextResponse.json({ validHandles: [], validProducts: [] });
    }

    const result = await validateProductHandles(rawHandles);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/products/validate POST:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
