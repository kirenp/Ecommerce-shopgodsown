/**
 * Normalizes a path to its canonical root domain version.
 * Now that /dev-preview is retired, all preview prefixes are stripped.
 */
export function getPreviewPath(path: string, _isPreview?: boolean): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (cleanPath === '/dev-preview' || cleanPath === '/dev-preview/') {
    return '/';
  }

  if (cleanPath === '/dev-preview/products') {
    return '/catalog';
  }

  if (cleanPath.startsWith('/dev-preview/')) {
    return cleanPath.replace(/^\/dev-preview/, '');
  }

  return cleanPath;
}

export function usePreview() {
  return {
    isPreview: false,
    getPreviewPath: (path: string) => getPreviewPath(path, false),
  };
}
