"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import styles from "./portal-shell.module.css";

export default function PortalShell({ eyebrow, title, description, adminOnly = false, children }: {
  eyebrow: string; title: string; description: string; adminOnly?: boolean; children: ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [name, setName] = useState("Member");

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace("/join"); return; }
        const [{ data: profile }, { data: role }] = await Promise.all([
          supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
          supabase.rpc("is_current_moderator")
        ]);
        if (!active) return;
        if (!profile) { router.replace("/join"); return; }
        const allowed = Boolean(role);
        setAdmin(allowed);
        setName(profile.display_name || "Member");
        if (adminOnly && !allowed) { router.replace("/"); return; }
        setReady(true);
      } catch { router.replace("/join"); }
    }
    void check();
    return () => { active = false; };
  }, [adminOnly, router]);

  async function signOut() {
    await getSupabase().auth.signOut();
    router.replace("/join");
  }

  if (!ready) return <main className={styles.loading}>VERIFYING MEMBER ACCESS…</main>;

  return <main className={styles.page}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand}><span className={styles.mark}>SX<span>83</span></span><span>SECTORX83<small>INSTITUTIONAL NETWORK</small></span></Link>
      <nav className={styles.nav}>
        <Link href="/">Community</Link><Link href="/bulletin">Bulletin</Link><Link href="/members">Registry</Link><Link href="/archives">Archives</Link><Link href="/constitution">Constitution</Link>
        {admin && <Link href="/administration">Administration</Link>}
      </nav>
      <div className={styles.account}><span>{name}{admin ? " · ADMIN" : ""}</span><button onClick={signOut}>SIGN OUT</button></div>
    </header>
    <section className={styles.content}>
      <div className={styles.eyebrow}>{eyebrow}</div>
      <h1>{title}</h1>
      <p className={styles.description}>{description}</p>
      {children}
    </section>
    <footer className={styles.footer}>SECTORX83 · MEMBER SERVICES <span>VOLUNTARY · ACCOUNTABLE · LAWFUL</span></footer>
  </main>;
}
