import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  const query = '"nuclear energy" OR "defence policy" OR "defense policy" OR "international security" OR "geopolitical"';
  const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  url.searchParams.set("query", query);
  url.searchParams.set("mode", "ArtList");
  url.searchParams.set("format", "json");
  url.searchParams.set("maxrecords", "18");
  url.searchParams.set("sort", "HybridRel");

  try {
    const response = await fetch(url, { cache: "no-store", headers: { "User-Agent": "SectorX83-Research/1.0" }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`Source returned ${response.status}`);
    const payload = await response.json();
    const articles = Array.isArray(payload.articles) ? payload.articles : [];
    return NextResponse.json({
      source: "GDELT Project",
      updatedAt: new Date().toISOString(),
      articles: articles.map((article: Record<string, unknown>, index: number) => ({
        id: String(article.url || index),
        title: String(article.title || "Untitled report"),
        url: String(article.url || ""),
        domain: String(article.domain || "Source not listed"),
        language: String(article.language || "Unknown"),
        seen: String(article.seendate || ""),
        image: typeof article.socialimage === "string" ? article.socialimage : null,
      })).filter((article: { url: string; title: string }) => article.url && article.title),
    }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
  } catch {
    return NextResponse.json({ source: "GDELT Project", updatedAt: new Date().toISOString(), articles: [], unavailable: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
}
