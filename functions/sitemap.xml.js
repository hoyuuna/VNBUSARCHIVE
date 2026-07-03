import { onRequest as sitemapHandler } from './api/sitemap.js';

export async function onRequest(context) {
  return sitemapHandler(context);
}
