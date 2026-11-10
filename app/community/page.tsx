"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, BookOpen, LogOut, MessageCircle, RefreshCw, Send, Users, UserCircle2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

type Profile = { id: string; username: string; display_name: string; bio?: string | null; location?: string | null; skills?: string[]; interests?: string[] };
type Post = { id: string; title: string; body: string; category: string; is_announcement: boolean; created_at: string; author_id: string };
type ChatMessage = { id: string; body: string; created_at: string; author_id: string };

export default function CommunityPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tab, setTab] = useState<"discussions" | "chat" | "members" | "profile">("discussions");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [chatText, setChatText] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const supabase = getSupabase();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { router.replace("/join"); return; }
    setUserId(auth.user.id);
    const [profileResult, memberResult, postResult, chatResult] = await Promise.all([
      supabase.from("profiles").select("id,username,display_name,bio,location,skills,interests").eq("id", auth.user.id).maybeSingle(),
      supabase.from("profiles").select("id,username,display_name,bio,location,skills,interests").order("display_name").limit(100),
      supabase.from("posts").select("id,title,body,category,is_announcement,created_at,author_id").order("created_at", { ascending: false }).limit(40),
      supabase.from("community_messages").select("id,body,created_at,author_id").order("created_at", { ascending: true }).limit(80),
    ]);
    if (profileResult.data) { setProfile(profileResult.data); setBio(profileResult.data.bio || ""); }
    if (memberResult.data) setProfiles(memberResult.data);
    if (postResult.data) setPosts(postResult.data);
    if (chatResult.data) setMessages(chatResult.data);
    const firstError = profileResult.error || memberResult.error || postResult.error || chatResult.error;
    if (firstError) setError(firstError.message);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof getSupabase>["channel"]> | null = null;
    void load().then(() => {
      try {
        channel = getSupabase().channel("sx83-community-live")
          .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => { void load(); })
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_messages" }, payload => {
            const next = payload.new as ChatMessage;
            setMessages(current => current.some(item => item.id === next.id) ? current : [...current, next].slice(-80));
          }).subscribe();
      } catch { /* Realtime is optional; manual refresh remains available. */ }
    }).catch(() => setLoading(false));
    return () => { if (channel) void getSupabase().removeChannel(channel); };
  }, [load]);

  const authorMap = useMemo(() => new Map(profiles.map(person => [person.id, person])), [profiles]);

  async function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const { error: insertError } = await getSupabase().from("posts").insert({ author_id: userId, title: title.trim(), body: body.trim(), category: "DISCUSSION" });
    if (insertError) setError(insertError.message);
    else { setTitle(""); setBody(""); setNotice("Discussion published."); await load(); }
    setBusy(false);
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!chatText.trim()) return;
    setBusy(true); setError("");
    const { error: insertError } = await getSupabase().from("community_messages").insert({ author_id: userId, body: chatText.trim() });
    if (insertError) setError(insertError.message);
    else setChatText("");
    setBusy(false);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const { error: updateError } = await getSupabase().from("profiles").update({ bio: bio.trim() }).eq("id", userId);
    if (updateError) setError(updateError.message);
    else { setNotice("Profile updated."); await load(); }
    setBusy(false);
  }

  async function signOut() { await getSupabase().auth.signOut(); router.replace("/join"); }

  return <main className={`sx-community-page ${tab === "chat" ? "chat-active" : ""}`}>
    <header className="sx-community-top"><Link href="/" className="sx-community-brand"><span className="sx-mark small"><span>SX</span><b>83</b></span><span>SECTORX83 <small>COMMUNITY NETWORK</small></span></Link><div className="sx-community-actions"><Link href="/constitution">CONSTITUTION</Link><button onClick={signOut}><LogOut size={14}/> SIGN OUT</button></div></header>
    <section className={`sx-community-shell ${tab === "chat" ? "chat-mode" : ""}`}>
      <div className="sx-community-heading"><div><div className="sx-kicker">MEMBER SPACE / OPEN COMMUNITY</div><h1>Community <span>network.</span></h1><p>Research, exchange ideas and build a useful public knowledge network.</p></div><div className="sx-member-count"><Users size={17}/><strong>{profiles.length.toString().padStart(2,"0")}</strong><small>REGISTERED PROFILES</small></div></div>
      <nav className="sx-community-tabs">{([{id:"discussions",label:"DISCUSSIONS",icon:BookOpen},{id:"chat",label:"COMMUNITY CHAT",icon:MessageCircle},{id:"members",label:"MEMBERS",icon:Users},{id:"profile",label:"MY PROFILE",icon:UserCircle2}] as const).map(item => <button key={item.id} className={tab===item.id?"active":""} onClick={()=>setTab(item.id)}><item.icon size={15}/>{item.label}</button>)}</nav>
      {notice && <div className="sx-alert success">{notice}</div>}{error && <div className="sx-alert error">{error}</div>}
      {loading ? <div className="sx-empty">CONNECTING TO THE NETWORK…</div> : <>
        {tab === "discussions" && <div className="sx-community-grid"><section className="sx-feed-column"><div className="sx-section-title"><div><div className="sx-kicker">PUBLIC EXCHANGE</div><h2>Recent discussions</h2></div><button className="sx-icon-action" onClick={()=>void load()}><RefreshCw size={15}/></button></div>{posts.length ? posts.map(post => { const author=authorMap.get(post.author_id); return <article className="sx-post-card" key={post.id}><div className="sx-post-meta"><span>{post.is_announcement?"COMMUNITY NOTICE":post.category}</span><time>{new Date(post.created_at).toLocaleString()}</time></div><h3>{post.title}</h3><p>{post.body}</p><div className="sx-post-author">BY {author?.display_name || "Community member"} <span>@{author?.username || "member"}</span></div></article>; }) : <div className="sx-empty">No discussions yet. Start the first one.</div>}</section><aside className="sx-compose-card"><div className="sx-kicker">CONTRIBUTE</div><h2>Start a discussion.</h2><form onSubmit={createPost}><label>SUBJECT<input value={title} onChange={e=>setTitle(e.target.value)} required maxLength={120} placeholder="A clear discussion title"/></label><label>YOUR POST<textarea value={body} onChange={e=>setBody(e.target.value)} required maxLength={10000} rows={6} placeholder="Share an idea, question or useful research…"/></label><button className="sx-gold-button" disabled={busy}>PUBLISH DISCUSSION <ArrowUpRight size={15}/></button></form><p className="sx-compose-note">Keep discussions respectful, evidence-led and open to disagreement.</p></aside></div>}
        {tab === "chat" && <section className="sx-chat-panel sx-chat-fullscreen"><div className="sx-section-title"><div><div className="sx-kicker">SHARED ROOM</div><h2>Community chat</h2></div><span className="sx-live-label">LIVE MEMBER ROOM</span></div><div className="sx-chat-log">{messages.map(message=>{const author=authorMap.get(message.author_id);return <article className="sx-chat-message" key={message.id}><div><strong>{author?.display_name || "Member"}</strong><small>@{author?.username || "member"} · {new Date(message.created_at).toLocaleTimeString()}</small></div><p>{message.body}</p></article>;})}{!messages.length&&<div className="sx-empty">No messages yet. Start the conversation.</div>}</div><form className="sx-chat-form" onSubmit={sendMessage}><input value={chatText} onChange={e=>setChatText(e.target.value)} maxLength={2000} placeholder="Write a message…" aria-label="Chat message"/><button className="sx-gold-button" disabled={busy||!chatText.trim()}><Send size={15}/> SEND</button></form></section>}
        {tab === "members" && <section><div className="sx-section-title"><div><div className="sx-kicker">DIRECTORY</div><h2>Member directory</h2></div><span className="sx-muted">Profiles are visible to signed-in members.</span></div><div className="sx-member-grid">{profiles.map(person=><article className="sx-member-card" key={person.id}><div className="sx-member-avatar">{(person.display_name||"S").slice(0,1).toUpperCase()}</div><h3>{person.display_name}</h3><span>@{person.username}</span><p>{person.bio||"No profile description added yet."}</p>{person.location&&<small>{person.location}</small>}</article>)}</div></section>}
        {tab === "profile" && <section className="sx-profile-panel"><div className="sx-kicker">YOUR MEMBER RECORD</div><h2>Profile details</h2><div className="sx-profile-identity"><div className="sx-member-avatar">{(profile?.display_name||"S").slice(0,1).toUpperCase()}</div><div><strong>{profile?.display_name}</strong><span>@{profile?.username}</span></div></div><form onSubmit={saveProfile}><label>ABOUT YOU<textarea value={bio} onChange={e=>setBio(e.target.value)} maxLength={240} rows={4} placeholder="A short introduction…"/></label><button className="sx-gold-button" disabled={busy}>SAVE PROFILE <ArrowUpRight size={15}/></button></form></section>}
      </>}
      <footer className="sx-community-footer"><span>SECTORX83 · INDEPENDENT BY DESIGN</span><span><Link href="/constitution">READ THE CONSTITUTION</Link> · <Link href="/">RESEARCH DASHBOARD</Link></span></footer>
    </section>
  </main>;
}
