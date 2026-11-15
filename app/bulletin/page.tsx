"use client";

import { FormEvent, useEffect, useState } from "react";
import PortalShell from "@/components/portal-shell";
import styles from "@/components/portal-shell.module.css";
import { getSupabase } from "@/lib/supabase";

type Notice = { id: string; title: string; body: string; created_at: string; pinned: boolean };
export default function BulletinPage() {
  const [rows,setRows]=useState<Notice[]>([]),[admin,setAdmin]=useState(false),[title,setTitle]=useState(""),[body,setBody]=useState(""),[message,setMessage]=useState("");
  async function load(){const s=getSupabase();const [{data},{data:role}]=await Promise.all([s.from("community_announcements").select("id,title,body,created_at,pinned").order("pinned",{ascending:false}).order("created_at",{ascending:false}).limit(100),s.rpc("is_current_moderator")]);setRows((data||[]) as Notice[]);setAdmin(Boolean(role));}
  useEffect(()=>{void load()},[]);
  async function publish(e:FormEvent){e.preventDefault();setMessage("");const s=getSupabase();const {data:{user}}=await s.auth.getUser();if(!user)return;const {error}=await s.from("community_announcements").insert({author_id:user.id,title:title.trim(),body:body.trim(),pinned:false});if(error){setMessage(error.message);return;}setTitle("");setBody("");setMessage("Notice published.");await load();}
  return <PortalShell eyebrow="INSTITUTIONAL COMMUNICATIONS / 01" title="Official Bulletin" description="Executive notices, issued orders, policy updates and published community agendas.">
    {admin&&<form className={styles.form} onSubmit={publish}><label>NOTICE TITLE<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={120} required/></label><label>NOTICE TEXT<textarea value={body} onChange={e=>setBody(e.target.value)} maxLength={5000} required/></label><button>PUBLISH NOTICE</button>{message&&<span>{message}</span>}</form>}
    {!admin&&message&&<div className={styles.notice}>{message}</div>}
    <div className={styles.list}>{rows.map(row=><article className={styles.row} key={row.id}><div className={styles.meta}>{row.pinned&&<span className={styles.badge}>PINNED</span>}<span>{new Date(row.created_at).toLocaleString()}</span></div><h3>{row.title}</h3><p>{row.body}</p></article>)}{!rows.length&&<div className={styles.notice}>No official notices have been published.</div>}</div>
  </PortalShell>;
}