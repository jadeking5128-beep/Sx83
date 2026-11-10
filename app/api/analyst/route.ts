import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "The chat engine is not connected. Add GROQ_API_KEY to the Vercel project environment variables." },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const rawMessages: unknown[] = Array.isArray(body.messages)
      ? body.messages
      : typeof body.prompt === "string"
        ? [{ role: "user", content: body.prompt }]
        : [];

    const messages: ChatMessage[] = rawMessages
      .slice(-20)
      .filter((item): item is { role: string; content: string } =>
        !!item && typeof item === "object" &&
        typeof (item as { role?: unknown }).role === "string" &&
        typeof (item as { content?: unknown }).content === "string",
      )
      .filter((item) => item.role === "user" || item.role === "assistant")
      .map((item) => ({ role: item.role as "user" | "assistant", content: item.content.trim().slice(0, 5000) }))
      .filter((item) => item.content.length > 0);

    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return NextResponse.json({ error: "Send a message to start the conversation." }, { status: 400 });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        temperature: 0.35,
        max_tokens: 1800,
        messages: [
          {
            role: "system",
            content: "You are SX83, a capable conversational research and general-purpose assistant. Be precise, useful, and direct. Maintain continuity across the conversation and use prior messages when relevant. For research, distinguish verified facts, attributed claims, and analysis. Never invent citations, sources, dates, or certainty. Do not provide real-time tactical military tracking, targeting, weapons-facility vulnerabilities, or operational nuclear-weapons assistance. Focus on public policy, history, diplomacy, civil nuclear energy, technology, education, coding, and institutional research. State clearly when evidence is insufficient.",
          },
          ...messages,
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "The model provider could not complete the request." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      answer: data?.choices?.[0]?.message?.content || "No response was returned.",
      model: data?.model || process.env.GROQ_MODEL || "Groq",
    });
  } catch {
    return NextResponse.json(
      { error: "The chat request failed. Check the connection and try again." },
      { status: 500 },
    );
  }
}
