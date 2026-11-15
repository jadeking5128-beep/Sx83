"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

export default function JoinPage() {
  const router = useRouter();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError("");
    try{
      const {error:authError}=await getSupabase().auth.signInWithPassword({email:email.trim(),password});
      if(authError)throw authError;
      router.push("/");
    }catch(err){setError(err instanceof Error?err.message:"Sign-in failed. Please try again.");}
    finally{setBusy(false);}
  }

  return <main className="sx-auth-page">
    <div className="sx-auth-grid" aria-hidden="true"/>
    <section className="sx-auth-card">
      <div className="sx-mark"><span>SX</span><b>83</b></div>
      <div className="sx-kicker">SECTORX83 / MEMBER ACCESS</div>
      <h1>Member sign-in.</h1>
      <p className="sx-auth-intro">The SectorX83 membership register is currently closed to new registrations. Existing members may sign in using their registered credentials.</p>
      <form className="sx-auth-form" onSubmit={submit}>
        <label>EMAIL ADDRESS<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" placeholder="Registered email address"/></label>
        <label>PASSWORD<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" placeholder="Your password"/></label>
        <button className="sx-gold-button" disabled={busy}>{busy?"VERIFYING…":"SIGN IN"} <ArrowUpRight size={15}/></button>
      </form>
      {error&&<div className="sx-alert error">{error}</div>}
      <div className="sx-auth-foot"><ShieldCheck size={15}/> Existing accounts remain active. New account creation is disabled.</div>
      <p className="sx-auth-terms">Membership is voluntary and governed by the <Link href="/constitution">SectorX83 Constitution</Link>.</p>
      <Link className="sx-back-link" href="/">← RETURN TO COMMUNITY</Link>
    </section>
  </main>;
}
