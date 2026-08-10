import { NextResponse } from "next/server";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  const accessToken =
    process.env.INSTAGRAM_ACCESS_TOKEN ||
    process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, error: "Instagram access token not configured", posts: [] },
      { status: 400 }
    );
  }

  try {
    const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${accessToken}&limit=12`;

    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Instagram Graph API Error:", res.status, errorText);
      return NextResponse.json(
        { success: false, error: "Failed to fetch media from Instagram", posts: [] },
        { status: res.status }
      );
    }

    const data = await res.json();

    if (!data || !Array.isArray(data.data)) {
      return NextResponse.json(
        { success: false, error: "Invalid response structure from Instagram", posts: [] },
        { status: 500 }
      );
    }

    const posts = data.data.map((item: any) => ({
      id: item.id,
      mediaUrl: item.media_type === "VIDEO" ? (item.thumbnail_url || item.media_url) : item.media_url,
      permalink: item.permalink || "https://www.instagram.com/godsownculture/",
      caption: item.caption || "",
      mediaType: item.media_type,
      timestamp: item.timestamp,
    }));

    return NextResponse.json(
      { success: true, posts },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error: any) {
    console.error("Instagram fetch error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error", posts: [] },
      { status: 500 }
    );
  }
}
