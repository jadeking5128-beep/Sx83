"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

export default function JoinPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"join" | "login">("join");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(""); setError("");
    try {
      const supabase = getSupabase();
      if (mode === "join") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { username: username.trim().toLowerCase(), display_name: displayName.trim() } },
        });
        if (authError) throw authError;
        if (data.session) router.push("/community");
        else setMessage("Your account has been created. Check your email to confirm it, then sign in.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        router.push("/community");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Please try again.");
    } finally { setBusy(false); }
  }

  return <main className="sx-auth-page">
    <div className="sx-auth-grid" aria-hidden="true" />
    <section className="sx-auth-card">
      <div className="sx-mark"><span>SX</span><b>83</b></div>
      <div className="sx-kicker">SECTORX83 / NETWORK ACCESS</div>
      <h1>{mode === "join" ? "Join the network." : "Welcome back."}</h1>
      <p className="sx-auth-intro">A public, independent community for research, discussion and shared learning. Membership is voluntary and open to everyone who agrees to the community standards.</p>
      <div className="sx-auth-tabs">
        <button className={mode === "join" ? "selected" : ""} onClick={() => { setMode("join"); setError(""); setMessage(""); }}>CREATE ACCOUNT</button>
        <button className={mode === "login" ? "selected" : ""} onClick={() => { setMode("login"); setError(""); setMessage(""); }}>SIGN IN</button>
      </div>
      <form className="sx-auth-form" onSubmit={submit}>
        {mode === "join" && <>
          <label>DISPLAY NAME<input value={displayName} onChange={e => setDisplayName(e.target.value)} required minLength={1} maxLength={48} placeholder="How members will see you" /></label>
          <label>USERNAME<input value={username} onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 24))} required minLength={3} maxLength={24} placeholder="letters, numbers and underscore" /></label>
        </>}
        <label>EMAIL ADDRESS<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" /></label>
        <label>PASSWORD<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete={mode === "join" ? "new-password" : "current-password"} placeholder="At least 8 characters" /></label>
        <button className="sx-gold-button" disabled={busy}>{busy ? "PLEASE WAIT…" : mode === "join" ? "CREATE MEMBERSHIP" : "SIGN IN"} <ArrowUpRight size={15}/></button>
      </form>
      {error && <div className="sx-alert error">{error}</div>}
      {message && <div className="sx-alert success">{message}</div>}
      <div className="sx-auth-foot"><ShieldCheck size={15}/> Accounts use Supabase authentication. Passwords are never stored by SectorX83.</div>
      <p className="sx-auth-terms">By joining, you agree to the <Link href="/constitution">community constitution</Link>. No forced loyalty, no harassment, and no authority over non-members.</p>
      <Link className="sx-back-link" href="/">← RETURN TO COMMUNITY</Link>
    </section>
  </main>;
}
