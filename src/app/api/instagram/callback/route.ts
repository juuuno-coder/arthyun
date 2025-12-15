import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/settings?error=access_denied`);
  }

  try {
    const clientId = process.env.INSTAGRAM_CLIENT_ID || "651498561285702";
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || "298d89a30d43c218254472474e440cb3";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://arthyun.co.kr";
    const redirectUri = `${appUrl}/api/instagram/callback`;

    // 1. Exchange Code for Short Token
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${clientId}&redirect_uri=${redirectUri}&client_secret=${clientSecret}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
       console.error("Token Error:", tokenData);
       return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/settings?error=token_failed`);
    }

    let accessToken = tokenData.access_token;

    // 2. Exchange for Long-lived Token
    const longTokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${accessToken}`;
    // Note: Graph API tokens usually last 60 days.
    const longTokenRes = await fetch(longTokenUrl);
    const longTokenData = await longTokenRes.json();
    
    if (longTokenData.access_token) {
        accessToken = longTokenData.access_token;
    }

    // 3. Get User Pages & Instagram ID
    // We need to find the Instagram Business Account linked to the user's Page
    const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=instagram_business_account&access_token=${accessToken}`;
    const pagesRes = await fetch(pagesUrl);
    const pagesData = await pagesRes.json();

    let instagramUserId = null;

    if (pagesData.data && pagesData.data.length > 0) {
        for (const page of pagesData.data) {
            if (page.instagram_business_account) {
                instagramUserId = page.instagram_business_account.id;
                // Important: We need a Page Access Token for some ops, but for Basic Display style read, User Token with permissions might work.
                // Actually, for reading IG Media, we need the IG Business ID and the Token.
                break;
            }
        }
    }

    if (!instagramUserId) {
         // Fallback: Try fetching as direct IG User if it was Basic Display (but this is FB Login)
         // If no IG business account found, we might warn user.
         console.warn("No Instagram Business Account found linked to Pages.");
    }

    // 4. Save to Firestore
    await setDoc(doc(db, "site_settings", "1"), {
        instagram_access_token: accessToken,
        instagram_user_id: instagramUserId || null,
        is_instagram_active: true, // Auto activate
        updated_at: new Date().toISOString(),
    }, { merge: true });

    return NextResponse.redirect(`${appUrl}/admin/settings?success=true`);

  } catch (e: any) {
    console.error("Callback Error:", e);
    // Return JSON to debug the 500 error
    return NextResponse.json({ 
        error: "Callback Failed", 
        message: e.message, 
        stack: e.stack,
        envCheck: {
            hasClientId: !!process.env.INSTAGRAM_CLIENT_ID,
            hasFirebaseKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            appUrl: process.env.NEXT_PUBLIC_APP_URL
        }
    }, { status: 500 });
  }
}
