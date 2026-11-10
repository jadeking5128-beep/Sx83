"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, MessageCircle, Pencil, RefreshCw, ScrollText, Send, Users, X } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

type Profile = { id: string; username: string; display_name: string; bio?: string | null; location?: string | null; website_url?: string | null; avatar_url?: string | null; skills?: string[]; interests?: string[] };
type ChatMessage = { id: string; body: string; created_at: string; author_id: string };

export default function CommunityPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ username: "", display_name: "", bio: "", location: "", website_url: "", avatar_url: "", skills: "", interests: "" });
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileNotice, setProfileNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const chatLogRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setError("");
    const supabase = getSupabase();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) {
      router.replace("/join");
      return;
    }

    setUserId(auth.user.id);
    const [profileResult, memberResult, chatResult] = await Promise.all([
      supabase.from("profiles").select("id,username,display_name,bio,location,website_url,avatar_url,skills,interests").eq("id", auth.user.id).maybeSingle(),
      supabase.from("profiles").select("id,username,display_name").order("display_name").limit(100),
      supabase.from("community_messages").select("id,body,created_at,author_id").order("created_at", { ascending: false }).limit(100),
    ]);

    if (profileResult.error) setError(profileResult.error.message);
    else if (!profileResult.data) setError("Your account is authenticated, but its member profile is missing. Contact a community administrator.");
    else {
      setProfile(profileResult.data);
      setProfileDraft({ username: profileResult.data.username || "", display_name: profileResult.data.display_name || "", bio: profileResult.data.bio || "", location: profileResult.data.location || "", website_url: profileResult.data.website_url || "", avatar_url: profileResult.data.avatar_url || "", skills: (profileResult.data.skills || []).join(", "), interests: (profileResult.data.interests || []).join(", ") });
    }

    if (memberResult.error) setError(memberResult.error.message);
    else setProfiles(memberResult.data || []);

    if (chatResult.error) setError(chatResult.error.message);
    else setMessages([...(chatResult.data || [])].reverse());

    setLoading(false);
  }, [router]);

  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof getSupabase>["channel"]> | null = null;
    let active = true;
    void load().then(() => {
      if (!active || !userId) return;
      channel = getSupabase().channel("sx83-community-chat")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_messages" }, payload => {
          const next = payload.new as ChatMessage;
          setMessages(current => current.some(item => item.id === next.id) ? current : [...current, next].slice(-100));
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
          void getSupabase().from("profiles").select("id,username,display_name").order("display_name").limit(100)
            .then(({ data }) => { if (data) setProfiles(data); });
        })
        .subscribe();
    }).catch(() => { if (active) { setError("Could not connect to the community database."); setLoading(false); } });
    return () => { active = false; if (channel) void getSupabase().removeChannel(channel); };
  }, [load, userId]);

  useEffect(() => {
    const log = chatLogRef.current;
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = chatText.trim();
    if (!body || !userId || !profile) return;
    setBusy(true);
    setError("");
    const { error: insertError } = await getSupabase().from("community_messages").insert({ author_id: userId, body });
    if (insertError) setError(insertError.message);
    else setChatText("");
    setBusy(false);
  }

  async function signOut() {
    await getSupabase().auth.signOut();
    router.replace("/join");
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;
    setProfileBusy(true); setProfileNotice(""); setError("");
    const cleanList = (value: string) => value.split(",").map(item => item.trim()).filter(Boolean).slice(0, 12);
    const payload = {
      username: profileDraft.username.trim().toLowerCase(),
      display_name: profileDraft.display_name.trim(),
      bio: profileDraft.bio.trim() || null,
      location: profileDraft.location.trim() || null,
      website_url: profileDraft.website_url.trim() || null,
      avatar_url: profileDraft.avatar_url.trim() || null,
      skills: cleanList(profileDraft.skills),
      interests: cleanList(profileDraft.interests),
    };
    try {
      const { data, error: updateError } = await getSupabase().from("profiles").update(payload).eq("id", userId)
        .select("id,username,display_name,bio,location,website_url,avatar_url,skills,interests").single();
      if (updateError) throw updateError;
      setProfile(data);
      setProfiles(current => current.map(person => person.id === userId ? data : person));
      setProfileNotice("Profile saved.");
      setProfileOpen(false);
    } catch (err) {
      setProfileNotice(err instanceof Error ? err.message : "Could not save your profile.");
    } finally { setProfileBusy(false); }
  }


  const authorMap = new Map(profiles.map(person => [person.id, person]));

  return <main className="sx-community-page chat-active">
    <header className="sx-community-top">
      <Link href="/community" className="sx-community-brand"><span className="sx-mark small"><span>SX</span><b>83</b></span><span>SECTORX83 <small>COMMUNITY NETWORK</small></span></Link>
      <nav className="sx-floating-nav" aria-label="Main navigation">
        <Link className="is-current" href="/community"><MessageCircle size={15}/> <span>CHAT</span></Link>
        <Link href="/constitution"><ScrollText size={15}/> <span>CONSTITUTION</span></Link>
      </nav>
      <div className="sx-community-actions"><button className="sx-profile-edit-trigger" onClick={() => { setProfileNotice(""); setProfileOpen(true); }} disabled={!profile}><Pencil size={14}/> EDIT PROFILE</button><span>{profile?.display_name || "MEMBER"}</span><button onClick={signOut}><LogOut size={14}/> SIGN OUT</button></div>
    </header>
    <section className="sx-community-shell chat-mode">
      <div className="sx-community-heading">
        <div><div className="sx-kicker">MEMBER SPACE / LIVE ROOM</div><h1>Community <span>chat.</span></h1><p>One shared room. Real members. Live messages.</p></div>
        <div className="sx-member-count"><Users size={17}/><strong>{profiles.length.toString().padStart(2, "0")}</strong><small>REGISTERED MEMBERS</small></div>
      </div>
      {profileOpen && profile && <div className="sx-profile-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setProfileOpen(false); }}>
        <section className="sx-profile-editor" role="dialog" aria-modal="true" aria-labelledby="sx-profile-editor-title">
          <header><div><div className="sx-kicker">MEMBER SETTINGS</div><h2 id="sx-profile-editor-title">Edit your profile</h2><p>Control how you appear to other SX83 members.</p></div><button className="sx-profile-close" onClick={() => setProfileOpen(false)} aria-label="Close profile editor"><X size={18}/></button></header>
          <form onSubmit={saveProfile}>
            <div className="sx-profile-form-grid">
              <label>DISPLAY NAME<input required minLength={1} maxLength={48} value={profileDraft.display_name} onChange={event => setProfileDraft(d => ({...d,display_name:event.target.value}))}/></label>
              <label>USERNAME<input required minLength={3} maxLength={32} pattern="[a-zA-Z0-9_]+" value={profileDraft.username} onChange={event => setProfileDraft(d => ({...d,username:event.target.value.replace(/[^a-zA-Z0-9_]/g,"")}))}/></label>
              <label className="wide">BIO<textarea maxLength={240} rows={3} value={profileDraft.bio} onChange={event => setProfileDraft(d => ({...d,bio:event.target.value}))} placeholder="A short introduction…"/></label>
              <label>LOCATION<input maxLength={80} value={profileDraft.location} onChange={event => setProfileDraft(d => ({...d,location:event.target.value}))} placeholder="City / region"/></label>
              <label>WEBSITE URL<input type="url" pattern="https://.*" value={profileDraft.website_url} onChange={event => setProfileDraft(d => ({...d,website_url:event.target.value}))} placeholder="https://…"/></label>
              <label className="wide">AVATAR IMAGE URL<input type="url" pattern="https://.*" value={profileDraft.avatar_url} onChange={event => setProfileDraft(d => ({...d,avatar_url:event.target.value}))} placeholder="https://…"/></label>
              <label className="wide">SKILLS <small>Comma-separated · up to 12</small><input value={profileDraft.skills} onChange={event => setProfileDraft(d => ({...d,skills:event.target.value}))} placeholder="Python, UI design, Linux"/></label>
              <label className="wide">INTERESTS <small>Comma-separated · up to 12</small><input value={profileDraft.interests} onChange={event => setProfileDraft(d => ({...d,interests:event.target.value}))} placeholder="Open source, robotics, music"/></label>
            </div>
            {profileNotice && <p className="sx-profile-notice" role="status">{profileNotice}</p>}
            <footer><span>Profile changes are saved to your member record.</span><button className="sx-gold-button" disabled={profileBusy}>{profileBusy ? "SAVING…" : "SAVE PROFILE"}</button></footer>
          </form>
        </section>
      </div>}
      {error && <div className="sx-alert error">{error}</div>}
      {!loading && !profile && <div className="sx-empty">CHAT ACCESS IS LOCKED UNTIL YOUR DATABASE MEMBER PROFILE IS VERIFIED.</div>}
      {loading ? <div className="sx-empty">VERIFYING MEMBER ACCOUNT…</div> : profile && <>
        <section className="sx-chat-panel sx-chat-fullscreen">
          <div className="sx-section-title"><div><div className="sx-kicker">SUPABASE REALTIME</div><h2>Community room</h2></div><div className="sx-chat-tools"><span className="sx-live-label">LIVE MEMBER ROOM</span><button className="sx-icon-action" onClick={() => void load()} aria-label="Refresh chat"><RefreshCw size={15}/></button></div></div>
          <div className="sx-chat-log" ref={chatLogRef} aria-live="polite">
            {messages.map(message => {
              const author = authorMap.get(message.author_id);
              return <article className={message.author_id === userId ? "sx-chat-message own-message" : "sx-chat-message"} key={message.id}>
                <div><strong>{author?.display_name || "Member"}</strong><small>@{author?.username || "member"} · {new Date(message.created_at).toLocaleTimeString()}</small></div>
                <p>{message.body}</p>
              </article>;
            })}
            {!messages.length && <div className="sx-empty">No messages yet. Start the conversation.</div>}
          </div>
          <form className="sx-chat-form" onSubmit={sendMessage}>
            <input value={chatText} onChange={event => setChatText(event.target.value)} maxLength={2000} placeholder="Write a message…" aria-label="Chat message"/>
            <button className="sx-gold-button" disabled={busy || !chatText.trim()}>{busy ? "SENDING…" : <><Send size={15}/> SEND</>}</button>
          </form>
        </section>
      </>}
      <footer className="sx-community-footer"><span>SECTORX83 · INDEPENDENT BY DESIGN</span><span><Link href="/constitution">COMMUNITY CONSTITUTION</Link></span></footer>
    </section>
  </main>;
}
