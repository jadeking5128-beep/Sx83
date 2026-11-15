"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PortalShell from "@/components/portal-shell";
import styles from "@/components/portal-shell.module.css";
import { getSupabase } from "@/lib/supabase";

export default function AdministrationPage(){
 const [counts,setCounts]=useState({members:0,notices:0,events:0,resources:0});
 useEffect(()=>{const s=getSupabase();void Promise.all([s.from("profiles").select("id",{count:"exact",head:true}),s.from("community_announcements").select("id",{count:"exact",head:true}),s.from("community_events").select("id",{count:"exact",head:true}),s.from("community_resources").select("id",{count:"exact",head:true})]).then(([m,n,e,r])=>setCounts({members:m.count||0,notices:n.count||0,events:e.count||0,resources:r.count||0}))},[]);
 return <PortalShell adminOnly eyebrow="EXECUTIVE OFFICE / 00" title="Administration" description="Central administration for the existing SectorX83 membership and institutional records.">
  <div className={styles.grid}>{[["CURRENT MEMBERS",counts.members],["OFFICIAL NOTICES",counts.notices],["SCHEDULED EVENTS",counts.events],["ARCHIVE RECORDS",counts.resources]].map(([label,value])=><article className={styles.card} key={label}><small>{label}</small><div className={styles.stat}>{value}</div></article>)}</div>
  <div className={styles.grid} style={{marginTop:16}}><article className={styles.card}><small>MEMBERSHIP CONTROL</small><h2>Four existing administrators</h2><p>Administrator status is assigned only to profiles that existed at the time of this update. New registration is blocked at the authentication database.</p><Link href="/members">OPEN MEMBER REGISTRY →</Link></article><article className={styles.card}><small>OFFICIAL COMMUNICATIONS</small><h2>Publish institutional notices</h2><p>Issue approved announcements and preserve a chronological record of communications.</p><Link href="/bulletin">OPEN OFFICIAL BULLETIN →</Link></article><article className={styles.card}><small>DOCUMENT CONTROL</small><h2>Maintain the archives</h2><p>Catalogue constitutions, policies, guides and reference documents without replacing existing records.</p><Link href="/archives">OPEN INSTITUTIONAL ARCHIVES →</Link></article><article className={styles.card}><small>GOVERNANCE</small><h2>Constitution</h2><p>Review the published rules governing membership, accountability and responsible moderation.</p><Link href="/constitution">READ CONSTITUTION →</Link></article></div>
 </PortalShell>
}