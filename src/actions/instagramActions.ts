"use server";

export async function fetchInstagramFeed(accessToken: string, userId?: string) {
  try {
    const fields = "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username";
    let url = "";

    if (userId) {
        // Facebook Graph API (Business/Creator Accounts)
        url = `https://graph.facebook.com/v21.0/${userId}/media?fields=${fields}&access_token=${accessToken}&limit=50`;
    } else {
        // Legacy Basic Display API (Fallback)
        url = `https://graph.instagram.com/me/media?fields=${fields}&access_token=${accessToken}&limit=50`;
    }

    // Note: Graph API response structure is slightly different?
    // Basic Display: { data: [...] }
    // Graph API: { data: [...] } - Same top level structure for media list.

    const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour

    if (!response.ok) {
      const errText = await response.text();
      console.error("Instagram API Error:", errText);
      // If Graph API fails, maybe token is for Basic Display? Try fallback? 
      // Only if userId was falsy. If userId passed, we expect Graph API.
      return null;
    }

    const data = await response.json();
    return data.data; // Array of media objects

  } catch (error) {
    console.error("Fetch Instagram Feed Failed:", error);
    return null;
  }
}
