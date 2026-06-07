import { usePathname } from 'next/navigation';

/**
 * Returns a preview-aware version of a path.
 * If in preview mode, routes like /products, /catalog, /about, /contact, /cart, /collections/[handle], etc.
 * are prefixed with /dev-preview.
 */
export function getPreviewPath(path: string, isPreview: boolean): string {
  if (!isPreview) return path;

  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (cleanPath === '/') {
    return '/dev-preview';
  }

  if (cleanPath.startsWith('/dev-preview')) {
    return cleanPath;
  }

  // Handle "/products" or "/catalog" links
  if (cleanPath === '/products' || cleanPath === '/catalog') {
    return '/dev-preview/products';
  }

  // Handle "/cart" links
  if (cleanPath === '/cart') {
    return '/dev-preview/cart';
  }

  // Handle anchor links (e.g. /#collections)
  if (cleanPath.startsWith('/#')) {
    return `/dev-preview${cleanPath.substring(1)}`;
  }

  // Prevent double prefixing if path already includes /dev-preview
  return `/dev-preview${cleanPath}`;
}

export function usePreview() {
  const pathname = usePathname();
  const isPreview = pathname?.startsWith('/dev-preview') || false;

  return {
    isPreview,
    getPreviewPath: (path: string) => getPreviewPath(path, isPreview),
  };
}
