import { MetadataRoute } from 'next';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, select, orderBy } from 'firebase/firestore';

const BASE_URL = 'https://arthyun.co.kr';

export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  
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

  // 2. Dynamic Media (Fetch from Firestore)
  try {
      // Note: In Client SDK, we fetch full docs. Optimization: limit fields if possible or just fetch all
      // Firestore Client SDK doesn't support 'select' fields easily without downloading document.
      // Given the size, it's acceptable for sitemap generation.
      const q = query(collection(db, "media_releases"));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
          const data = doc.data();
          routes.push({
            url: `${BASE_URL}/media/${doc.id}`,
            lastModified: data.created_at ? new Date(data.created_at) : new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
          });
      });
  } catch (e) {
      console.error("Sitemap generation error (Firebase):", e);
  }

  return routes;
}
