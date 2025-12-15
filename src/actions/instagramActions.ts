"use server";

export async function fetchInstagramFeed(accessToken: string) {
  try {
    // 1. Get User ID (Me)
    // Actually, simple way is 'me/media'.
    const fields = "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username";
    const url = `https://graph.instagram.com/me/media?fields=${fields}&access_token=${accessToken}&limit=50`;

    const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour

    if (!response.ok) {
      console.error("Instagram API Error:", await response.text());
      return null;
    }

    const data = await response.json();
    return data.data; // Array of media objects

  } catch (error) {
    console.error("Fetch Instagram Feed Failed:", error);
    return null;
  }
}
