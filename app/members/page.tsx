"use client";

import { useEffect, useState } from "react";
import PortalShell from "@/components/portal-shell";
import styles from "@/components/portal-shell.module.css";
import { getSupabase } from "@/lib/supabase";

type Member={id:string;username:string;display_name:string;bio:string|null;created_at:string};
export default function MembersPage(){
 const [rows,setRows]=useState<Member[]>([]);
 useEffect(()=>{void getSupabase().from("profiles").select("id,username,display_name,bio,created_at").order("created_at",{ascending:true}).then(({data})=>setRows((data||[]) as Member[]))},[]);
 return <PortalShell eyebrow="MEMBERSHIP DIVISION / 02" title="Member Registry" description="The current institutional directory. Entries are drawn from the existing membership database.">
  <div className={styles.grid}><article className={styles.card}><small>REGISTERED MEMBERS</small><div className={styles.stat}>{rows.length}</div><p>Current profiles retained in the existing database.</p></article><article className={styles.card}><small>ADMINISTRATIVE STATUS</small><div className={styles.stat}>ALL</div><p>All current registered members have administrator privileges. Future account creation is closed.</p></article></div>
  <div className={styles.list}>{rows.map((m,i)=><article className={styles.row} key={m.id}><div className={styles.meta}><span>MEMBER {String(i+1).padStart(3,"0")}</span><span className={styles.badge}>ADMINISTRATOR</span></div><h3>{m.display_name}</h3><p>@{m.username}{m.bio?" · "+m.bio:""}</p><div className={styles.meta}>REGISTERED {new Date(m.created_at).toLocaleDateString()}</div></article>)}</div>
 </PortalShell>
}