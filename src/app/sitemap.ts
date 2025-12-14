import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://arthyun.co.kr';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Static Routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/archive`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/portfolio`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/media`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/mall`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  // 2. Dynamic Portfolios
  const { data: portfolios } = await supabase
    .from('portfolios')
    .select('id, updated_at')
    .eq('is_visible', true);

  if (portfolios) {
    portfolios.forEach((item) => {
      routes.push({
        url: `${BASE_URL}/portfolio/${item.id}`,
        lastModified: new Date(item.updated_at || new Date()),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    });
  }

  // 3. Dynamic Media
  const { data: media } = await supabase
    .from('media_releases')
    .select('id, created_at');

  if (media) {
    media.forEach((item) => {
      routes.push({
        url: `${BASE_URL}/media/${item.id}`,
        lastModified: new Date(item.created_at || new Date()),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    });
  }

  return routes;
}
