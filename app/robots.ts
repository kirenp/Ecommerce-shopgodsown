import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dev-preview/'],
      },
    ],
    sitemap: 'https://shopgodsown.com/sitemap.xml',
    host: 'https://shopgodsown.com',
  };
}
