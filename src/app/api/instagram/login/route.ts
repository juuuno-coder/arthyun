import { NextResponse } from "next/server";

export async function GET() {
  // Fallback to hardcoded keys if environment variables fail loading (Temporary Fix)
  const clientId = process.env.INSTAGRAM_CLIENT_ID || "651498561285702";
  const appUrl = "https://arthyun.co.kr"; // Force non-www to match Facebook Settings
  // Better: use relative? No, OAuth needs absolute.
  
  const redirectUri = `${appUrl}/api/instagram/callback`;
  const scope = "public_profile,instagram_basic,pages_show_list"; 
  
  if (!clientId) {
    return NextResponse.json({ error: "Missing Client ID" }, { status: 500 });
  }

  // Generate a random state for security (Simplified here)
  const state = Math.random().toString(36).substring(7);

  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}&response_type=code`;

  return NextResponse.redirect(authUrl);
}
