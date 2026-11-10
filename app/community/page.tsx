"use client";

import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Bell, Check, CheckCheck, ChevronDown, FileText,
  LogOut, MessageCircle, Mic, MoreHorizontal, Paperclip, Pencil,
  Pin, Plus, RefreshCw, Reply, Search, Send, Shield, StopCircle,
  Trash2, Users, X, Volume2
} from "lucide-react";
import { getSupabase } from "@/lib/supabase";

type Profile = {
  id: string; username: string; display_name: string; bio?: string | null;
  location?: string | null; website_url?: string | null; avatar_url?: string | null;
  skills?: string[]; interests?: string[];
};
type ChatMessage = {
  id: string; body: string; created_at: string; author_id?: string;
  sender_id?: string; recipient_id?: string; read_at?: string | null;
  edited_at?: string | null; reply_to_id?: string | null;
  attachment_path?: string | null; attachment_name?: string | null;
  attachment_mime?: string | null; attachment_size?: number | null;
  attachment_url?: string | null;
};
type Reaction = { id: string; message_id: string; user_id: string; emoji: string };
type TypingUser = { user_id: string; user_name: string; context: string };

const MEDIA_BUCKET = "sx83-chat-media";
const REACTIONS = ["👍", "❤️", "😂", "🔥", "👏", "👀"];

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase() || "SX";
}
function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatBytes(value?: number | null) {
  if (!value) return "";
  return value < 1024 * 1024 ? Math.round(value / 1024) + " KB" : (value / 1024 / 1024).toFixed(1) + " MB";
}
function pairContext(a: string, b: string) {
  return "dm-" + [a, b].sort().join("-");
}

export default function CommunityPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activePeerId, setActivePeerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [onlineIds, setOnlineIds] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [chatText, setChatText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [editTarget, setEditTarget] = useState<ChatMessage | null>(null);
  const [profileTarget, setProfileTarget] = useState<Profile | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ username: "", display_name: "", bio: "", location: "", website_url: "", avatar_url: "", skills: "", interests: "" });
  const [profileBusy, setProfileBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [, setNotificationsEnabled] = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const chatLogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<ReturnType<typeof getSupabase>["channel"]> | null>(null);
  const lastTypingRef = useRef(0);

  const activePeer = useMemo(() => profiles.find(person => person.id === activePeerId) || null, [profiles, activePeerId]);
  const context = activePeerId && userId ? pairContext(userId, activePeerId) : "community";
  const visibleMessages = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return query ? messages.filter(message => message.body.toLowerCase().includes(query) || (message.attachment_name || "").toLowerCase().includes(query)) : messages;
  }, [messages, searchText]);
  const filteredMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();
    return profiles.filter(person => person.id !== userId && (!query || person.display_name.toLowerCase().includes(query) || person.username.toLowerCase().includes(query)));
  }, [profiles, memberSearch, userId]);

  const hydrateMessages = useCallback(async (rows: ChatMessage[]) => {
    const supabase = getSupabase();
    return Promise.all(rows.map(async row => {
      if (!row.attachment_path) return row;
      const { data } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(row.attachment_path, 3600);
      return { ...row, attachment_url: data?.signedUrl || null };
    }));
  }, []);

  const refreshInbox = useCallback(async (uid: string) => {
    const supabase = getSupabase();
    const { data } = await supabase.from("direct_messages")
      .select("id,sender_id,recipient_id,read_at,created_at,body")
      .or("sender_id.eq." + uid + ",recipient_id.eq." + uid)
      .order("created_at", { ascending: false }).limit(500);
    const counts: Record<string, number> = {};
    const latest = new Map<string, ChatMessage>();
    (data || []).forEach((row: any) => {
      const peer = row.sender_id === uid ? row.recipient_id : row.sender_id;
      if (!latest.has(peer)) latest.set(peer, row);
      if (row.recipient_id === uid && !row.read_at) counts[peer] = (counts[peer] || 0) + 1;
    });
    setUnread(counts);
  }, []);

  const loadMessages = useCallback(async (peerId: string | null, uid = userId) => {
    if (!uid) return;
    const supabase = getSupabase();
    const query = peerId
      ? supabase.from("direct_messages").select("*")
          .or("and(sender_id.eq." + uid + ",recipient_id.eq." + peerId + "),and(sender_id.eq." + peerId + ",recipient_id.eq." + uid + ")")
          .order("created_at", { ascending: true }).limit(200)
      : supabase.from("community_messages").select("*").order("created_at", { ascending: true }).limit(200);
    const { data, error: queryError } = await query;
    if (queryError) { setError(queryError.message); return; }
    const hydrated = await hydrateMessages((data || []) as ChatMessage[]);
    setMessages(hydrated);
    const ids = hydrated.map(message => message.id);
    if (ids.length) {
      const { data: reactionRows } = await supabase.from("message_reactions").select("*")
        .eq("message_type", peerId ? "direct" : "community").in("message_id", ids);
      setReactions(reactionRows || []);
    } else setReactions([]);
    const { data: pins } = await supabase.from("pinned_messages").select("message_id")
      .eq("user_id", uid).eq("message_type", peerId ? "direct" : "community");
    setPinnedIds((pins || []).map((pin: any) => pin.message_id));
    if (peerId) {
      await supabase.from("direct_messages").update({ read_at: new Date().toISOString() })
        .eq("sender_id", peerId).eq("recipient_id", uid).is("read_at", null);
      await refreshInbox(uid);
    }
  }, [userId, hydrateMessages, refreshInbox]);

  const load = useCallback(async () => {
    setError("");
    const supabase = getSupabase();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) { router.replace("/join"); return; }
    const uid = auth.user.id;
    setUserId(uid);
    const [own, members, blocks] = await Promise.all([
      supabase.from("profiles").select("id,username,display_name,bio,location,website_url,avatar_url,skills,interests").eq("id", uid).maybeSingle(),
      supabase.from("profiles").select("id,username,display_name,bio,location,website_url,avatar_url,skills,interests").order("display_name").limit(200),
      supabase.from("member_blocks").select("blocked_id").eq("blocker_id", uid)
    ]);
    if (own.error) setError(own.error.message);
    else if (own.data) {
      setProfile(own.data);
      setProfileDraft({
        username: own.data.username || "", display_name: own.data.display_name || "",
        bio: own.data.bio || "", location: own.data.location || "",
        website_url: own.data.website_url || "", avatar_url: own.data.avatar_url || "",
        skills: (own.data.skills || []).join(", "), interests: (own.data.interests || []).join(", ")
      });
    } else setError("Your member profile is missing. Contact a community administrator.");
    if (members.error) setError(members.error.message); else setProfiles(members.data || []);
    setBlockedIds((blocks.data || []).map((row: any) => row.blocked_id));
    await Promise.all([loadMessages(null, uid), refreshInbox(uid)]);
    setLoading(false);
  }, [router, loadMessages, refreshInbox]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabase();
    const channel = supabase.channel("sx83-community-live-data")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_messages" }, () => {
        if (!activePeerId) void loadMessages(null);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages" }, payload => {
        const row = (payload.new || payload.old) as any;
        if (row && (row.sender_id === userId || row.recipient_id === userId)) {
          if (activePeerId && (row.sender_id === activePeerId || row.recipient_id === activePeerId)) void loadMessages(activePeerId);
          if (payload.eventType === "INSERT" && row.sender_id !== userId && row.recipient_id === userId && document.hidden && "Notification" in window && Notification.permission === "granted") {
            const sender = profiles.find(person => person.id === row.sender_id);
            new Notification(sender?.display_name || "SX83 message", { body: row.body || "Sent an attachment" });
          }
          void refreshInbox(userId);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, payload => {
        const row = (payload.new || payload.old) as any;
        if (row?.message_id) {
          setReactions(current => {
            const filtered = current.filter(item => item.id !== row.id);
            return payload.eventType === "DELETE" ? filtered : [...filtered, row as Reaction];
          });
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        void supabase.from("profiles").select("id,username,display_name,bio,location,website_url,avatar_url,skills,interests")
          .order("display_name").limit(200).then(({ data }) => { if (data) setProfiles(data); });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, activePeerId, loadMessages, refreshInbox]);

  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabase();
    const channel = supabase.channel("sx83-presence", { config: { presence: { key: userId } } });
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      setOnlineIds(Object.keys(state));
    }).subscribe(async status => {
      if (status === "SUBSCRIBED") {
        await channel.track({ user_id: userId, display_name: profile?.display_name || "Member", online_at: new Date().toISOString() });
      }
    });
    return () => { void supabase.removeChannel(channel); };
  }, [userId, profile?.display_name]);

  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabase();
    const channel = supabase.channel("sx83-typing-" + context);
    channel.on("broadcast", { event: "typing" }, ({ payload }) => {
      const data = payload as TypingUser;
      if (data.user_id !== userId && data.context === context) {
        setTypingUsers(current => [...current.filter(item => item.user_id !== data.user_id), data]);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setTypingUsers([]), 2400);
      }
    }).subscribe();
    typingChannelRef.current = channel;
    return () => { typingChannelRef.current = null; void supabase.removeChannel(channel); };
  }, [userId, context]);

  useEffect(() => {
    const log = chatLogRef.current;
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
  }, [messages, typingUsers]);

  useEffect(() => {
    if (activePeerId) void loadMessages(activePeerId);
    else if (userId) void loadMessages(null);
    setReplyTarget(null); setEditTarget(null); setChatText(""); setSearchText("");
  }, [activePeerId, userId, loadMessages]);

  function switchConversation(peerId: string | null) {
    setActivePeerId(peerId);
    setError(""); setNotice("");
  }

  function sendTyping() {
    if (!userId || Date.now() - lastTypingRef.current < 1000) return;
    lastTypingRef.current = Date.now();
    void typingChannelRef.current?.send({ type: "broadcast", event: "typing", payload: {
      user_id: userId, user_name: profile?.display_name || "Member", context
    } });
  }

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = chatText.trim();
    if ((!body && !replyTarget) || !userId || !profile || busy) return;
    if (activePeerId && blockedIds.includes(activePeerId)) { setError("Unblock this member before sending a direct message."); return; }
    setBusy(true); setError("");
    const table = activePeerId ? "direct_messages" : "community_messages";
    const payload: Record<string, any> = activePeerId
      ? { sender_id: userId, recipient_id: activePeerId, body: body || "Attachment", reply_to_id: replyTarget?.id || null }
      : { author_id: userId, body: body || "Attachment", reply_to_id: replyTarget?.id || null };
    const { error: insertError } = await getSupabase().from(table).insert(payload);
    if (insertError) setError(insertError.message);
    else { setChatText(""); setReplyTarget(null); }
    setBusy(false);
  }

  async function uploadAttachment(file: File) {
    if (!userId || !profile || busy) return;
    if (file.size > 25 * 1024 * 1024) { setError("Files must be 25 MB or smaller."); return; }
    setBusy(true); setError("");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-90);
    const path = userId + "/" + crypto.randomUUID() + "-" + safeName;
    const { error: uploadError } = await getSupabase().storage.from(MEDIA_BUCKET).upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
    if (uploadError) { setError(uploadError.message); setBusy(false); return; }
    const table = activePeerId ? "direct_messages" : "community_messages";
    const payload: Record<string, any> = {
      body: chatText.trim() || file.name, attachment_path: path, attachment_name: file.name,
      attachment_mime: file.type || "application/octet-stream", attachment_size: file.size,
      reply_to_id: replyTarget?.id || null
    };
    if (activePeerId) { payload.sender_id = userId; payload.recipient_id = activePeerId; }
    else payload.author_id = userId;
    const { error: insertError } = await getSupabase().from(table).insert(payload);
    if (insertError) {
      setError(insertError.message);
      await getSupabase().storage.from(MEDIA_BUCKET).remove([path]);
    } else { setChatText(""); setReplyTarget(null); }
    setBusy(false);
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Voice recording is not supported in this browser."); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        const file = new File([blob], "voice-message-" + Date.now() + ".webm", { type: blob.type });
        void uploadAttachment(file);
        setRecording(false);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(); setRecording(true);
    } catch { setError("Microphone permission was denied or unavailable."); }
  }

  function stopRecording() { mediaRecorderRef.current?.stop(); }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;
    setProfileBusy(true); setError("");
    const cleanList = (value: string) => value.split(",").map(item => item.trim()).filter(Boolean).slice(0, 12);
    const payload = {
      username: profileDraft.username.trim().toLowerCase(), display_name: profileDraft.display_name.trim(),
      bio: profileDraft.bio.trim() || null, location: profileDraft.location.trim() || null,
      website_url: profileDraft.website_url.trim() || null, avatar_url: profileDraft.avatar_url.trim() || null,
      skills: cleanList(profileDraft.skills), interests: cleanList(profileDraft.interests)
    };
    const { data, error: updateError } = await getSupabase().from("profiles").update(payload).eq("id", userId)
      .select("id,username,display_name,bio,location,website_url,avatar_url,skills,interests").single();
    if (updateError) setError(updateError.message);
    else { setProfile(data); setProfiles(current => current.map(item => item.id === userId ? data : item)); setProfileOpen(false); setNotice("Profile saved."); }
    setProfileBusy(false);
  }

  async function editMessage(message: ChatMessage) {
    const body = chatText.trim();
    if (!body) return;
    const table = activePeerId ? "direct_messages" : "community_messages";
    const { error: updateError } = await getSupabase().from(table).update({ body, edited_at: new Date().toISOString() }).eq("id", message.id);
    if (updateError) setError(updateError.message);
    else { setEditTarget(null); setChatText(""); setNotice("Message updated."); await loadMessages(activePeerId); }
  }

  async function deleteMessage(message: ChatMessage) {
    if (!window.confirm("Delete this message?")) return;
    const table = activePeerId ? "direct_messages" : "community_messages";
    const { error: deleteError } = await getSupabase().from(table).delete().eq("id", message.id);
    if (deleteError) setError(deleteError.message);
    else { setMessages(current => current.filter(item => item.id !== message.id)); setNotice("Message deleted."); }
  }

  async function toggleReaction(message: ChatMessage, emoji: string) {
    const type = activePeerId ? "direct" : "community";
    const existing = reactions.find(item => item.message_id === message.id && item.user_id === userId && item.emoji === emoji);
    if (existing) {
      const { error: deleteError } = await getSupabase().from("message_reactions").delete().eq("id", existing.id);
      if (deleteError) setError(deleteError.message);
      else setReactions(current => current.filter(item => item.id !== existing.id));
    } else {
      const { data, error: insertError } = await getSupabase().from("message_reactions")
        .insert({ message_type: type, message_id: message.id, user_id: userId, emoji }).select("*").single();
      if (insertError) setError(insertError.message);
      else setReactions(current => [...current, data]);
    }
  }

  async function togglePin(message: ChatMessage) {
    const type = activePeerId ? "direct" : "community";
    const exists = pinnedIds.includes(message.id);
    if (exists) {
      const { error: deleteError } = await getSupabase().from("pinned_messages").delete()
        .eq("user_id", userId).eq("message_type", type).eq("message_id", message.id);
      if (deleteError) setError(deleteError.message); else setPinnedIds(current => current.filter(id => id !== message.id));
    } else {
      const { error: insertError } = await getSupabase().from("pinned_messages").insert({ user_id: userId, message_type: type, message_id: message.id });
      if (insertError) setError(insertError.message); else setPinnedIds(current => [...current, message.id]);
    }
  }

  async function toggleBlock(person: Profile) {
    const isBlocked = blockedIds.includes(person.id);
    if (isBlocked) {
      const { error: resultError } = await getSupabase().from("member_blocks").delete().eq("blocker_id", userId).eq("blocked_id", person.id);
      if (resultError) setError(resultError.message);
      else setBlockedIds(current => current.filter(id => id !== person.id));
    } else {
      const { error: resultError } = await getSupabase().from("member_blocks").insert({ blocker_id: userId, blocked_id: person.id });
      if (resultError) setError(resultError.message);
      else { setBlockedIds(current => [...current, person.id]); if (activePeerId === person.id) switchConversation(null); }
    }
  }

  async function reportMessage(message: ChatMessage) {
    if (!activePeerId) { setError("Reporting community-room messages is not configured yet."); return; }
    const reason = window.prompt("Why are you reporting this message? (At least 5 characters)");
    if (!reason || reason.trim().length < 5) return;
    const { error: reportError } = await getSupabase().from("message_reports").insert({ reporter_id: userId, message_id: message.id, reason: reason.trim() });
    if (reportError) setError(reportError.message); else setNotice("Report submitted to moderators.");
  }

  async function enableNotifications() {
    if (!("Notification" in window)) { setError("Browser notifications are unavailable."); return; }
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
    if (permission !== "granted") setNotice("Notifications were not enabled.");
    else setNotice("Browser notifications enabled.");
  }

  function handleComposerKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      inputRef.current?.form?.requestSubmit();
    }
  }

  async function signOut() {
    await getSupabase().auth.signOut();
    router.replace("/join");
  }

  const memberMap = useMemo(() => new Map(profiles.map(person => [person.id, person])), [profiles]);
  return <main className="sx-community-page chat-active sx-messenger">
    <header className="sx-community-top">
      <Link href="/community" className="sx-community-brand"><span className="sx-mark small"><span>SX</span><b>83</b></span><span>SECTORX83 <small>COMMUNITY NETWORK</small></span></Link>
      <nav className="sx-floating-nav" aria-label="Main navigation">
        <Link className="is-current" href="/community"><MessageCircle size={15}/> <span>MESSAGES</span></Link>
        <Link href="/constitution"><FileText size={15}/> <span>CONSTITUTION</span></Link>
      </nav>
      <div className="sx-community-actions">
        <button className="sx-profile-edit-trigger" onClick={() => setProfileOpen(true)} disabled={!profile}><Pencil size={14}/> PROFILE</button>
        <span>{profile?.display_name || "MEMBER"}</span>
        <button onClick={signOut}><LogOut size={14}/> SIGN OUT</button>
      </div>
    </header>

    <section className="sx-community-shell sx-messenger-shell">
      <div className="sx-messenger-heading">
        <div><div className="sx-kicker">SX83 / MEMBER NETWORK</div><h1>Messages<span>.</span></h1><p>One community. Direct conversations. No noise.</p></div>
        <div className="sx-messenger-heading-actions">
          <span className="sx-online-indicator"><i/> {onlineIds.length.toString().padStart(2, "0")} ONLINE</span>
          <button className="sx-secondary-button" onClick={enableNotifications}><Bell size={14}/> NOTIFICATIONS</button>
        </div>
      </div>

      {error && <div className="sx-alert error">{error}<button onClick={() => setError("")}><X size={14}/></button></div>}
      {notice && <div className="sx-alert success">{notice}<button onClick={() => setNotice("")}><X size={14}/></button></div>}

      <div className="sx-messenger-layout">
        <aside className="sx-inbox glass-panel">
          <div className="sx-inbox-head">
            <div><div className="sx-kicker">YOUR NETWORK</div><h2>Inbox</h2></div>
            <button className="sx-icon-action" onClick={() => void refreshInbox(userId)} aria-label="Refresh inbox"><RefreshCw size={15}/></button>
          </div>
          <button className={"sx-inbox-room " + (!activePeerId ? "active" : "")} onClick={() => switchConversation(null)}>
            <span className="sx-room-avatar"><MessageCircle size={18}/></span>
            <span className="sx-inbox-copy"><strong>Community room</strong><small>Public · everyone</small></span>
            <span className="sx-room-live">LIVE</span>
          </button>
          <div className="sx-inbox-section"><span>DIRECT MESSAGES</span><button onClick={() => setShowMembers(value => !value)} aria-label="Toggle members"><Plus size={14}/></button></div>
          <label className="sx-search-field"><Search size={14}/><input value={memberSearch} onChange={event => setMemberSearch(event.target.value)} placeholder="Find a member…"/></label>
          <div className="sx-inbox-list">
            {filteredMembers.map(person => <button key={person.id} className={"sx-inbox-person " + (activePeerId === person.id ? "active" : "")} onClick={() => switchConversation(person.id)}>
              <span className="sx-avatar-wrap"><span className="sx-avatar">{person.avatar_url ? <img src={person.avatar_url} alt=""/> : initials(person.display_name)}</span><i className={onlineIds.includes(person.id) ? "online" : ""}/></span>
              <span className="sx-inbox-copy"><strong>{person.display_name}</strong><small>@{person.username}</small></span>
              {unread[person.id] > 0 && <span className="sx-unread-count">{unread[person.id] > 99 ? "99+" : unread[person.id]}</span>}
            </button>)}
            {!filteredMembers.length && <p className="sx-inbox-empty">No members found.</p>}
          </div>
          <div className="sx-inbox-foot"><Users size={14}/>{profiles.length.toString().padStart(2, "0")} MEMBERS <span>·</span> {onlineIds.length.toString().padStart(2, "0")} ONLINE</div>
        </aside>

        <section className="sx-chat-panel sx-messenger-main glass-panel">
          <div className="sx-chat-topline">
            <div className="sx-chat-title">
              {activePeerId && <button className="sx-mobile-back" onClick={() => switchConversation(null)} aria-label="Back to community"><ArrowLeft size={17}/></button>}
              <span className="sx-chat-title-avatar">{activePeer ? (activePeer.avatar_url ? <img src={activePeer.avatar_url} alt=""/> : initials(activePeer.display_name)) : <MessageCircle size={17}/>}</span>
              <div><div className="sx-kicker">{activePeer ? "PRIVATE CONVERSATION" : "PUBLIC CHANNEL"}</div><h2>{activePeer?.display_name || "Community room"}</h2><small>{activePeer ? (onlineIds.includes(activePeer.id) ? "Online now" : "Direct messages are private") : "Visible to all SX83 members"}</small></div>
            </div>
            <div className="sx-chat-top-actions">
              <label className="sx-chat-search"><Search size={14}/><input value={searchText} onChange={event => setSearchText(event.target.value)} placeholder="Search messages…"/></label>
              {activePeer && <button className="sx-icon-action" onClick={() => setProfileTarget(activePeer)} aria-label="Member details"><MoreHorizontal size={18}/></button>}
            </div>
          </div>

          {pinnedIds.length > 0 && <div className="sx-pinned-strip"><Pin size={13}/><span>{pinnedIds.length} saved message{pinnedIds.length === 1 ? "" : "s"} in this conversation</span><button onClick={() => {
            const pinned = messages.find(item => pinnedIds.includes(item.id));
            if (pinned) chatLogRef.current?.querySelector('[data-message-id="' + pinned.id + '"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}>JUMP TO PIN</button></div>}

          <div className="sx-chat-log sx-messenger-log" ref={chatLogRef} aria-live="polite">
            {loading ? <div className="sx-chat-loading"><span/><span/><span/> Connecting to SX83…</div> : visibleMessages.map(message => {
              const authorId = activePeerId ? message.sender_id : message.author_id;
              const author = memberMap.get(authorId || "");
              const own = authorId === userId;
              const reply = message.reply_to_id ? messages.find(item => item.id === message.reply_to_id) : null;
              const grouped = reactions.filter(item => item.message_id === message.id);
              const counts = REACTIONS.map(emoji => ({ emoji, count: grouped.filter(item => item.emoji === emoji).length, mine: grouped.some(item => item.emoji === emoji && item.user_id === userId) })).filter(item => item.count > 0);
              return <article key={message.id} data-message-id={message.id} className={"sx-chat-message sx-rich-message " + (own ? "own-message" : "")}>
                <button className="sx-message-avatar" onClick={() => author && setProfileTarget(author)}>{author?.avatar_url ? <img src={author.avatar_url} alt=""/> : initials(author?.display_name || "Member")}</button>
                <div className="sx-message-content">
                  <div className="sx-message-meta"><button onClick={() => author && setProfileTarget(author)}>{own ? "You" : author?.display_name || "Member"}</button><span>@{author?.username || "member"}</span><time>{formatTime(message.created_at)}</time>{message.edited_at && <em>EDITED</em>}{activePeerId && own && <span className="sx-read-state">{message.read_at ? <CheckCheck size={13}/> : <Check size={13}/>}</span>}</div>
                  {reply && <button className="sx-reply-preview" onClick={() => chatLogRef.current?.querySelector('[data-message-id="' + reply.id + '"]')?.scrollIntoView({ behavior: "smooth", block: "center" })}><Reply size={12}/>{reply.body.slice(0, 110)}</button>}
                  {message.body && <p className="sx-message-body">{message.body}</p>}
                  {message.attachment_url && <div className="sx-attachment">
                    {message.attachment_mime?.startsWith("image/") ? <a href={message.attachment_url} target="_blank" rel="noreferrer"><img src={message.attachment_url} alt={message.attachment_name || "Shared image"}/></a>
                    : message.attachment_mime?.startsWith("audio/") ? <audio controls src={message.attachment_url}/>
                    : <a className="sx-file-card" href={message.attachment_url} target="_blank" rel="noreferrer"><FileText size={19}/><span><strong>{message.attachment_name || "Attachment"}</strong><small>{formatBytes(message.attachment_size)}</small></span><ChevronDown size={14}/></a>}
                  </div>}
                  <div className="sx-message-actions">
                    {counts.map(item => <button key={item.emoji} className={item.mine ? "reacted" : ""} onClick={() => void toggleReaction(message, item.emoji)}>{item.emoji} {item.count}</button>)}
                    <div className="sx-message-tools">
                      <div className="sx-reaction-picker">{REACTIONS.map(emoji => <button key={emoji} onClick={() => void toggleReaction(message, emoji)}>{emoji}</button>)}</div>
                      <button title="Reply" onClick={() => { setReplyTarget(message); setEditTarget(null); inputRef.current?.focus(); }}><Reply size={13}/></button>
                      <button title="Save message" onClick={() => void togglePin(message)} className={pinnedIds.includes(message.id) ? "is-pinned" : ""}><Pin size={13}/></button>
                      {own && <button title="Edit message" onClick={() => { setEditTarget(message); setReplyTarget(null); setChatText(message.body); inputRef.current?.focus(); }}><Pencil size={13}/></button>}
                      {own && <button title="Delete message" onClick={() => void deleteMessage(message)}><Trash2 size={13}/></button>}
                      {!own && activePeerId && <button title="Report message" onClick={() => void reportMessage(message)}><Shield size={13}/></button>}
                    </div>
                  </div>
                </div>
              </article>;
            })}
            {!loading && !visibleMessages.length && <div className="sx-empty sx-chat-empty">{searchText ? "No messages match your search." : "No messages yet. Start the conversation."}</div>}
            {typingUsers.length > 0 && <div className="sx-typing-indicator"><span/><span/><span/> {typingUsers[0].user_name} is typing</div>}
          </div>

          <div className="sx-composer-wrap">
            {replyTarget && <div className="sx-composer-context"><Reply size={13}/><span>Replying to <strong>{memberMap.get((activePeerId ? replyTarget.sender_id : replyTarget.author_id) || "")?.display_name || "member"}</strong>: {replyTarget.body.slice(0, 90)}</span><button onClick={() => setReplyTarget(null)}><X size={14}/></button></div>}
            {editTarget && <div className="sx-composer-context"><Pencil size={13}/><span>Editing message</span><button onClick={() => { setEditTarget(null); setChatText(""); }}><X size={14}/></button></div>}
            <form className="sx-chat-form sx-rich-composer" onSubmit={editTarget ? event => { event.preventDefault(); void editMessage(editTarget); } : submitMessage}>
              <div className="sx-composer-tools">
                <button type="button" title="Attach a file" onClick={() => fileRef.current?.click()} disabled={busy}><Paperclip size={17}/></button>
                <button type="button" title="Record voice message" onClick={() => recording ? stopRecording() : void startRecording()} className={recording ? "recording" : ""}><Mic size={17}/></button>
                <input ref={fileRef} type="file" hidden accept="image/*,application/pdf,text/plain,audio/*" onChange={event => { const file = event.target.files?.[0]; if (file) void uploadAttachment(file); event.currentTarget.value = ""; }}/>
              </div>
              <textarea ref={inputRef} value={chatText} onChange={event => { setChatText(event.target.value); sendTyping(); }} onKeyDown={handleComposerKey} rows={1} maxLength={2000} placeholder={recording ? "Recording voice message…" : activePeer ? "Message " + activePeer.display_name + "…" : "Write to the community…"} aria-label="Message"/>
              {recording ? <button type="button" className="sx-send-button recording" onClick={stopRecording}><StopCircle size={17}/></button>
                : <button className="sx-send-button" disabled={busy || !chatText.trim()} aria-label={editTarget ? "Save message" : "Send message"}>{busy ? <RefreshCw size={16} className="sx-spin"/> : editTarget ? <Check size={17}/> : <Send size={17}/>}</button>}
            </form>
            <div className="sx-composer-foot"><span>{activePeer ? "PRIVATE · END-TO-END TRANSPORT VIA SUPABASE AUTH" : "COMMUNITY ROOM · VISIBLE TO ALL MEMBERS"}</span><span>ENTER TO SEND · SHIFT + ENTER FOR NEW LINE</span></div>
          </div>
        </section>

        <aside className={"sx-member-rail glass-panel " + (showMembers ? "" : "collapsed")}>
          <div className="sx-inbox-head"><div><div className="sx-kicker">COMMUNITY</div><h2>Members</h2></div><button className="sx-icon-action" onClick={() => setShowMembers(value => !value)}><X size={15}/></button></div>
          <div className="sx-rail-stats"><span><i className="online"/> {onlineIds.length} ONLINE</span><span>{profiles.length} TOTAL</span></div>
          <div className="sx-member-rail-list">{profiles.filter(person => person.id !== userId).sort((a,b) => Number(onlineIds.includes(b.id))-Number(onlineIds.includes(a.id))).map(person => <button key={person.id} onClick={() => switchConversation(person.id)} className="sx-rail-member">
            <span className="sx-avatar-wrap"><span className="sx-avatar">{person.avatar_url ? <img src={person.avatar_url} alt=""/> : initials(person.display_name)}</span><i className={onlineIds.includes(person.id) ? "online" : ""}/></span>
            <span><strong>{person.display_name}</strong><small>{onlineIds.includes(person.id) ? "Online" : "Offline"}</small></span>
          </button>)}</div>
          <div className="sx-rail-bottom"><Volume2 size={14}/> Keep it respectful. Keep it useful.</div>
        </aside>
      </div>

      <footer className="sx-community-footer"><span>SECTORX83 · INDEPENDENT BY DESIGN</span><span><Link href="/constitution">COMMUNITY CONSTITUTION</Link></span></footer>
    </section>

    {profileOpen && profile && <div className="sx-profile-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setProfileOpen(false); }}>
      <section className="sx-profile-editor" role="dialog" aria-modal="true" aria-labelledby="sx-profile-editor-title">
        <header><div><div className="sx-kicker">MEMBER SETTINGS</div><h2 id="sx-profile-editor-title">Edit your profile</h2><p>Control how you appear to other SX83 members.</p></div><button className="sx-profile-close" onClick={() => setProfileOpen(false)} aria-label="Close profile editor"><X size={18}/></button></header>
        <form onSubmit={saveProfile}><div className="sx-profile-form-grid">
          <label>DISPLAY NAME<input required minLength={1} maxLength={48} value={profileDraft.display_name} onChange={event => setProfileDraft(d => ({...d,display_name:event.target.value}))}/></label>
          <label>USERNAME<input required minLength={3} maxLength={32} pattern="[a-zA-Z0-9_]+" value={profileDraft.username} onChange={event => setProfileDraft(d => ({...d,username:event.target.value.replace(/[^a-zA-Z0-9_]/g,"")}))}/></label>
          <label className="wide">BIO<textarea maxLength={240} rows={3} value={profileDraft.bio} onChange={event => setProfileDraft(d => ({...d,bio:event.target.value}))}/></label>
          <label>LOCATION<input maxLength={80} value={profileDraft.location} onChange={event => setProfileDraft(d => ({...d,location:event.target.value}))}/></label>
          <label>WEBSITE URL<input type="url" pattern="https://.*" value={profileDraft.website_url} onChange={event => setProfileDraft(d => ({...d,website_url:event.target.value}))}/></label>
          <label className="wide">AVATAR IMAGE URL<input type="url" pattern="https://.*" value={profileDraft.avatar_url} onChange={event => setProfileDraft(d => ({...d,avatar_url:event.target.value}))}/></label>
          <label className="wide">SKILLS<input value={profileDraft.skills} onChange={event => setProfileDraft(d => ({...d,skills:event.target.value}))} placeholder="Python, UI design, Linux"/></label>
          <label className="wide">INTERESTS<input value={profileDraft.interests} onChange={event => setProfileDraft(d => ({...d,interests:event.target.value}))} placeholder="Open source, robotics, music"/></label>
        </div><footer><span>Saved to your member record.</span><button className="sx-gold-button" disabled={profileBusy}>{profileBusy ? "SAVING…" : "SAVE PROFILE"}</button></footer></form>
      </section>
    </div>}

    {profileTarget && <div className="sx-profile-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setProfileTarget(null); }}>
      <section className="sx-member-card" role="dialog" aria-modal="true">
        <button className="sx-profile-close" onClick={() => setProfileTarget(null)}><X size={18}/></button>
        <div className="sx-member-card-avatar">{profileTarget.avatar_url ? <img src={profileTarget.avatar_url} alt=""/> : initials(profileTarget.display_name)}</div>
        <div className="sx-kicker">SX83 MEMBER</div><h2>{profileTarget.display_name}</h2><p>@{profileTarget.username}</p>
        {profileTarget.bio && <p className="sx-member-bio">{profileTarget.bio}</p>}
        {profileTarget.location && <small>{profileTarget.location}</small>}
        {profileTarget.website_url && <a href={profileTarget.website_url} target="_blank" rel="noreferrer">{profileTarget.website_url}</a>}
        {!!profileTarget.skills?.length && <div className="sx-member-tags">{profileTarget.skills.map(tag => <span key={tag}>{tag}</span>)}</div>}
        <div className="sx-member-card-actions"><button className="sx-gold-button" onClick={() => { switchConversation(profileTarget.id); setProfileTarget(null); }}>MESSAGE MEMBER</button><button className="sx-secondary-button" onClick={() => void toggleBlock(profileTarget)}>{blockedIds.includes(profileTarget.id) ? "UNBLOCK" : "BLOCK MEMBER"}</button></div>
      </section>
    </div>}
  </main>;
}
