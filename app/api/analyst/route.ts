import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "The analyst is not connected yet. Add GROQ_API_KEY in Vercel project environment variables during Phase 2." }, { status: 503 });

  try {
    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 4000) : "";
    if (!prompt) return NextResponse.json({ error: "Enter a research question." }, { status: 400 });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        temperature: 0.2,
        max_tokens: 1200,
        messages: [
          { role: "system", content: "You are X83 Analyst, an independent public-source research assistant. Separate verified facts, attributed claims, and analysis. Never invent citations, sources, dates, or certainty. Do not provide real-time tactical military tracking, targeting, weapons-facility vulnerabilities, or operational nuclear-weapons assistance. Focus on public policy, history, diplomacy, civil nuclear energy, and institutional research. State when evidence is insufficient." },
          { role: "user", content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(25000),
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data?.error?.message || "Groq request failed." }, { status: 502 });
    return NextResponse.json({ answer: data?.choices?.[0]?.message?.content || "No analysis was returned.", model: data?.model || process.env.GROQ_MODEL || "Groq" });
  } catch {
    return NextResponse.json({ error: "The analyst could not complete this request. Try again shortly." }, { status: 500 });
  }
}
