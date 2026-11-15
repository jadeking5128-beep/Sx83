"use client";

import { FormEvent, useEffect, useState } from "react";
import PortalShell from "@/components/portal-shell";
import styles from "@/components/portal-shell.module.css";
import { getSupabase } from "@/lib/supabase";

type Resource={id:string;title:string;description:string;url:string;category:string;created_at:string};
export default function ArchivesPage(){
 const [rows,setRows]=useState<Resource[]>([]),[admin,setAdmin]=useState(false),[title,setTitle]=useState(""),[description,setDescription]=useState(""),[url,setUrl]=useState(""),[category,setCategory]=useState("DOCUMENT"),[message,setMessage]=useState("");
 async function load(){const s=getSupabase();const [{data},{data:role}]=await Promise.all([s.from("community_resources").select("id,title,description,url,category,created_at").order("created_at",{ascending:false}).limit(200),s.rpc("is_current_moderator")]);setRows((data||[]) as Resource[]);setAdmin(Boolean(role));}
 useEffect(()=>{void load()},[]);
 async function add(e:FormEvent){e.preventDefault();const s=getSupabase();const {data:{user}}=await s.auth.getUser();if(!user)return;const {error}=await s.from("community_resources").insert({title:title.trim(),description:description.trim(),url:url.trim(),category,created_by:user.id});if(error){setMessage(error.message);return;}setTitle("");setDescription("");setUrl("");setMessage("Archive entry added.");await load();}
 return <PortalShell eyebrow="RECORDS DIVISION / 03" title="Institutional Archives" description="A searchable catalogue of approved documents, policies, guides and reference material.">
  {admin&&<form className={styles.form} onSubmit={add}><label>DOCUMENT TITLE<input required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>DESCRIPTION<textarea maxLength={1000} value={description} onChange={e=>setDescription(e.target.value)}/></label><label>HTTPS RESOURCE URL<input required type="url" pattern="https://.*" value={url} onChange={e=>setUrl(e.target.value)}/></label><label>CATEGORY<select value={category} onChange={e=>setCategory(e.target.value)}><option>DOCUMENT</option><option>POLICY</option><option>GUIDE</option><option>REFERENCE</option></select></label><button>ADD TO ARCHIVE</button>{message&&<span>{message}</span>}</form>}
  <div className={styles.list}>{rows.map(r=><article className={styles.row} key={r.id}><div className={styles.meta}><span className={styles.badge}>{r.category}</span><span>{new Date(r.created_at).toLocaleDateString()}</span></div><h3>{r.title}</h3><p>{r.description}</p><div className={styles.meta}><a href={r.url} target="_blank" rel="noreferrer">OPEN RESOURCE ↗</a></div></article>)}{!rows.length&&<div className={styles.notice}>The archive is ready. No documents have been catalogued yet.</div>}</div>
 </PortalShell>
}