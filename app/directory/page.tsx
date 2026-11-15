"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import PortalShell from "@/components/portal-shell";
import styles from "./directory.module.css";

type Contact = { name: string; category: string; focus: string; website: string; phone?: string; email?: string; contactNote?: string };

const contacts: Contact[] = [
  { name: "Rothschild & Co", category: "Financial services", focus: "Global advisory, wealth and asset management", website: "https://www.rothschildandco.com/", phone: "+33 1 40 74 40 74", email: "contact@rothschildandco.com" },
  { name: "JPMorganChase", category: "Banking", focus: "Consumer, commercial and investment banking", website: "https://www.jpmorganchase.com/", phone: "+1 212 270 6000", email: "corporate.secretary@jpmchase.com", contactNote: "Corporate Secretary" },
  { name: "BlackRock", category: "Asset management", focus: "Investment management and financial technology", website: "https://www.blackrock.com/", phone: "+1 212 810 5800" },
  { name: "The Rockefeller Foundation", category: "Philanthropy", focus: "Global development, health, energy and food systems", website: "https://www.rockefellerfoundation.org/", phone: "+1 212 869 8500" },
  { name: "Rockefeller Capital Management", category: "Wealth management", focus: "Financial advisory and wealth management", website: "https://www.rockco.com/", phone: "+1 212 549 5100" },
  { name: "Goldman Sachs", category: "Financial services", focus: "Investment banking, markets and asset management", website: "https://www.goldmansachs.com/", phone: "+1 212 902 1000", email: "gs-investor-relations@gs.com", contactNote: "Investor Relations email" },
  { name: "Morgan Stanley", category: "Financial services", focus: "Institutional securities and wealth management", website: "https://www.morganstanley.com/", phone: "+1 212 761 4000" },
  { name: "UBS", category: "Banking", focus: "Global wealth management and investment banking", website: "https://www.ubs.com/", phone: "+41 44 234 11 11" },
  { name: "HSBC", category: "Banking", focus: "International banking and financial services", website: "https://www.hsbc.com/", phone: "+44 20 7991 8888" },
  { name: "World Economic Forum", category: "International organization", focus: "Public-private cooperation and global dialogue", website: "https://www.weforum.org/", contactNote: "No general public phone or email verified" },
];

export default function DirectoryPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const categories = ["ALL", ...Array.from(new Set(contacts.map(item => item.category)))];
  const filtered = useMemo(() => contacts.filter(item => {
    const term = query.trim().toLowerCase();
    return (category === "ALL" || item.category === category) &&
      (!term || [item.name, item.category, item.focus].some(value => value.toLowerCase().includes(term)));
  }), [query, category]);

  return <PortalShell eyebrow="MEMBER SERVICES / DIRECTORY" title="Institutional Directory" description="A member-only directory of SectorX83 members and selected institutional organizations.">
    <div className={styles.note}>DIRECTORY INDEX <span>MEMBERS &amp; INSTITUTIONAL CONTACTS</span></div><div className={styles.directoryLinks}><a href="/members"><strong>MEMBERS DIRECTORY</strong><span>Browse registered SectorX83 members →</span></a><a href="#institutional-contacts"><strong>INSTITUTIONAL CONTACTS</strong><span>Browse selected organizations →</span></a></div><div id="institutional-contacts" className={styles.sectionLabel}>INSTITUTIONAL CONTACTS</div>
    <div className={styles.controls}>
      <label className={styles.search}><Search size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search organizations or fields"/></label>
      <div className={styles.filters}>{categories.map(item => <button key={item} className={category === item ? styles.active : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
    </div>
    <div className={styles.count}>SHOWING {filtered.length} OF {contacts.length} ORGANIZATIONS</div>
    <div className={styles.grid}>{filtered.map((item, index) => <article className={styles.card} key={item.name}>
      <div className={styles.cardTop}><span>{String(index + 1).padStart(2, "0")} / CONTACT</span><span>{item.category}</span></div>
      <h2>{item.name}</h2><p>{item.focus}</p>
      <div className={styles.links}>
        {item.phone && <a href={`tel:${item.phone.replace(/[^+\\d]/g, "")}`}>PHONE: {item.phone}</a>}
        {item.email && <a href={`mailto:${item.email}`}>EMAIL: {item.email}{item.contactNote ? ` · ${item.contactNote}` : ""}</a>}
        {!item.phone && !item.email && <span>{item.contactNote}</span>}
        <a href={item.website} target="_blank" rel="noreferrer">OFFICIAL WEBSITE <ExternalLink size={13}/></a>
      </div>
    </article>)}</div>
    <p className={styles.disclaimer}>Contacts are publicly listed organizational switchboards or designated corporate contacts, not personal contacts. Some email addresses are department-specific. Listing an organization does not imply a relationship, endorsement, sponsorship or existing correspondence with SectorX83.</p>
  </PortalShell>;
}
