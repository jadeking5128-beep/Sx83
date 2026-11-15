"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import PortalShell from "@/components/portal-shell";
import styles from "./directory.module.css";

type Contact = { name: string; category: string; focus: string; website: string; contact: string };

const contacts: Contact[] = [
  { name: "Rothschild & Co", category: "Financial services", focus: "Global advisory, wealth and asset management", website: "https://www.rothschildandco.com/", contact: "https://www.rothschildandco.com/en/contact-us/" },
  { name: "JPMorganChase", category: "Banking", focus: "Consumer, commercial and investment banking", website: "https://www.jpmorganchase.com/", contact: "https://www.jpmorganchase.com/contact-us" },
  { name: "BlackRock", category: "Asset management", focus: "Investment management and financial technology", website: "https://www.blackrock.com/", contact: "https://www.blackrock.com/corporate/about-us/who-we-are/contacts-and-locations" },
  { name: "The Rockefeller Foundation", category: "Philanthropy", focus: "Global development, health, energy and food systems", website: "https://www.rockefellerfoundation.org/", contact: "https://www.rockefellerfoundation.org/about-us/contact/" },
  { name: "Rockefeller Capital Management", category: "Wealth management", focus: "Financial advisory and wealth management", website: "https://www.rockco.com/", contact: "https://www.rockco.com/about-rcm/contact/" },
  { name: "Goldman Sachs", category: "Financial services", focus: "Investment banking, markets and asset management", website: "https://www.goldmansachs.com/", contact: "https://www.goldmansachs.com/contact-us" },
  { name: "Morgan Stanley", category: "Financial services", focus: "Institutional securities and wealth management", website: "https://www.morganstanley.com/", contact: "https://www.morganstanley.com/contact-us" },
  { name: "UBS", category: "Banking", focus: "Global wealth management and investment banking", website: "https://www.ubs.com/", contact: "https://www.ubs.com/global/en/our-firm/contact.html" },
  { name: "HSBC", category: "Banking", focus: "International banking and financial services", website: "https://www.hsbc.com/", contact: "https://www.hsbc.com/contact-us" },
  { name: "World Economic Forum", category: "International organization", focus: "Public-private cooperation and global dialogue", website: "https://www.weforum.org/", contact: "https://www.weforum.org/contact/" },
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
      <div className={styles.links}><a href={item.contact} target="_blank" rel="noreferrer">PUBLIC CONTACT <ExternalLink size={13}/></a><a href={item.website} target="_blank" rel="noreferrer">WEBSITE <ExternalLink size={13}/></a></div>
    </article>)}</div>
    <p className={styles.disclaimer}>Listing an organization does not indicate a relationship, endorsement, sponsorship or existing correspondence with SectorX83. Contact details are routed through each organization's own published channels; no private or personal contact information is included.</p>
  </PortalShell>;
}
