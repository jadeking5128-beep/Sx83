import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const feeds = [
  { name: "IAEA", url: "https://www.iaea.org/feeds/topnews" },
  { name: "SIPRI", url: "https://www.sipri.org/rss" },
  { name: "UN News", url: "https://news.un.org/feed/subscribe/en/news/all/rss.xml" },
];

function decode(value: string) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/<[^>]+>/g, "").trim();
}

function readTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<(?:[\\w-]+:)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${tag}\\s*>`, "i"));
  return match ? decode(match[1]) : "";
}

export async function GET() {
  const results = await Promise.allSettled(feeds.map(async (feed) => {
    const response = await fetch(feed.url, { cache: "no-store", headers: { "User-Agent": "SectorX83Research/1.0", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" }, signal: AbortSignal.timeout(9000) });
    if (!response.ok) throw new Error(`${feed.name} returned ${response.status}`);
    const xml = await response.text();
    const blocks = [...xml.matchAll(/<(item|entry)\\b[^>]*>([\\s\\S]*?)<\\/\\1>/gi)].map((match) => match[2]);
    return blocks.map((block, index) => {
      const title = readTag(block, "title");
      const linkTag = block.match(/<link\\b[^>]*href=["']([^"']+)["'][^>]*\\/?\s*>/i);
      const link = readTag(block, "link") || linkTag?.[1] || readTag(block, "guid") || "";
      const date = readTag(block, "pubDate") || readTag(block, "published") || readTag(block, "updated");
      return { id: link || `${feed.name}-${index}`, title, url: link, domain: feed.name, language: "Source feed", seen: date, image: null };
    }).filter((article) => article.title && /^https?:\\/\\//i.test(article.url));
  }));

  const articles = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  articles.sort((a, b) => (Date.parse(b.seen) || 0) - (Date.parse(a.seen) || 0));
  return NextResponse.json({
    source: feeds.map((feed) => feed.name).join(", "),
    updatedAt: new Date().toISOString(),
    articles: articles.slice(0, 24),
    unavailable: articles.length === 0,
  }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
