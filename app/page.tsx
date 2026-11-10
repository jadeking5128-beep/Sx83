"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, Atom, Bell, BookOpen, Building2,
  CalendarClock, ChevronDown, ChevronRight, CircleDot, Clock3, Database,
  FileText, Globe2, Landmark, Menu, Newspaper, RadioTower,
  RefreshCw, Search, ShieldCheck, Sparkles, TrendingUp, X,
} from "lucide-react";
import { researchSources } from "@/lib/sources";

const WorldMap = dynamic(() => import("@/components/WorldMap"), {
  ssr: false,
  loading: () => <div className="map-loading">Loading geographic data…</div>,
});

type Article = { id: string; title: string; url: string; domain: string; language: string; seen: string; image: string | null };
type Section = "overview" | "global" | "nuclear" | "observatories" | "defence" | "finance" | "analyst" | "archive";
type Source = { name: string; url: string; note?: string };

const nav: { id: Section; label: string; group: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Executive overview", group: "WORKSPACE", icon: Activity },
  { id: "global", label: "Global monitor", group: "WORKSPACE", icon: Globe2 },
  { id: "nuclear", label: "Nuclear observatory", group: "RESEARCH", icon: Atom },
  { id: "observatories", label: "Public observatories", group: "RESEARCH", icon: RadioTower },
  { id: "defence", label: "Defence & policy", group: "RESEARCH", icon: ShieldCheck },
  { id: "finance", label: "Power & finance", group: "RESEARCH", icon: TrendingUp },
  { id: "analyst", label: "X83 Analyst", group: "TOOLS", icon: Sparkles },
  { id: "archive", label: "Research library", group: "TOOLS", icon: BookOpen },
];

const cameraFeeds = [
  {
    id: "moscow",
    title: "Moscow 24 · live city broadcast",
    location: "Moscow, Russian Federation",
    source: "Moscow 24 · official public broadcast",
    embed: "https://www.youtube-nocookie.com/embed/tgp1Kjtzbmw?rel=0&modestbranding=1&playsinline=1",
    kind: "LIVE CITY BROADCAST",
    note: "Public city news coverage with live reports. This is a broadcaster feed, not a fixed webcam or a government-facility camera.",
  },
  {
    id: "washington",
    title: "Washington Monument panorama",
    location: "Washington, D.C., United States",
    source: "EarthCam · public landmark stream",
    embed: "https://www.youtube-nocookie.com/embed/oDCAAfOSqvA?rel=0&modestbranding=1",
    kind: "PUBLIC LANDMARK",
    note: "Public National Mall view. Not a Pentagon camera or a view inside a restricted site.",
  },
];

const projectSources: Source[] = [
  { name: "Global Nuclear Power Tracker", url: "https://globalenergymonitor.org/projects/global-nuclear-power-tracker/", note: "Publicly documented civilian reactor projects and construction records." },
  { name: "IAEA Power Reactor Information System", url: "https://pris.iaea.org/PRIS/home.aspx", note: "Official reactor records, operating status and construction milestones." },
  { name: "NASA Worldview", url: "https://worldview.earthdata.nasa.gov/", note: "Earth-observation layers and historical imagery dates." },
  { name: "Copernicus Browser", url: "https://browser.dataspace.copernicus.eu/", note: "Public Sentinel satellite imagery and dated acquisitions." },
  { name: "World Nuclear Industry Status Report", url: "https://www.worldnuclearreport.org/", note: "Independent research on nuclear energy status and projects." },
];

const policySources: Source[] = [
  { name: "U.S. Department of Defense", url: "https://www.defense.gov/News/", note: "Official public releases and policy announcements." },
  { name: "SIPRI", url: "https://www.sipri.org/", note: "Independent research on arms, disarmament and international security." },
  { name: "United Nations Treaty Collection", url: "https://treaties.un.org/", note: "Published treaty records and multilateral agreements." },
  { name: "EU Sanctions Map", url: "https://www.sanctionsmap.eu/", note: "Public sanctions and restrictive-measures information." },
];

const financeSources: Source[] = [
  { name: "EU Transparency Register", url: "https://transparency-register.europa.eu/", note: "Declared interest representation and lobbying disclosures." },
  { name: "OpenCorporates", url: "https://opencorporates.com/", note: "Searchable company registry data across jurisdictions." },
  { name: "International Monetary Fund", url: "https://www.imf.org/", note: "Macroeconomic and financial stability research." },
  { name: "Transparency International", url: "https://www.transparency.org/", note: "Governance, integrity and anti-corruption research." },
];

function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="section-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function SourceCard({ source, onOpen, index }: { source: Source; onOpen: (source: Source) => void; index: number }) {
  return <button className="source-card" onClick={() => onOpen(source)}><div className="source-card-top"><span>REF {String(index + 1).padStart(2, "0")}</span><ArrowUpRight size={15}/></div><h3>{source.name}</h3><p>{source.note}</p><span className="source-card-foot">OPEN IN RESEARCH VIEWER <ChevronRight size={13}/></span></button>;
}

export default function Home() {
  const [active, setActive] = useState<Section>("overview");
  const [articles, setArticles] = useState<Article[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedUpdated, setFeedUpdated] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [analystBusy, setAnalystBusy] = useState(false);
  const [analystError, setAnalystError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clock, setClock] = useState("--:--:-- UTC");
  const [viewer, setViewer] = useState<Source | null>(null);

  async function loadBriefings() {
    setFeedLoading(true);
    try {
      const response = await fetch("/api/briefings", { cache: "no-store" });
      const data = await response.json();
      setArticles(Array.isArray(data.articles) ? data.articles : []);
      setFeedUpdated(data.updatedAt || new Date().toISOString());
    } catch { setArticles([]); }
    finally { setFeedLoading(false); }
  }

  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().slice(11, 19) + " UTC");
    tick();
    const timer = window.setInterval(tick, 1000);
    void loadBriefings();
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) { if (event.key === "Escape") setViewer(null); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const currentNav = nav.find((item) => item.id === active);
  const filteredArticles = useMemo(() => articles.filter((article) => (article.title + " " + article.domain).toLowerCase().includes(filter.toLowerCase())), [articles, filter]);

  async function askAnalyst(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAnalystBusy(true); setAnalystError(""); setAnswer("");
    try {
      const response = await fetch("/api/analyst", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: query }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analyst request failed.");
      setAnswer(data.answer || "No analysis returned.");
    } catch (error) { setAnalystError(error instanceof Error ? error.message : "Unable to reach analyst."); }
    finally { setAnalystBusy(false); }
  }

  function go(section: Section) { setActive(section); setMobileOpen(false); }
  const openSource = (source: Source) => setViewer(source);

  return <main className="app-shell">
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <div className="brand">
        <div className="brand-symbol"><span>SX</span><b>83</b></div>
        <div className="brand-copy"><strong>SECTORX83</strong><small>RESEARCH & ANALYSIS</small></div>
        <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18}/></button>
      </div>
      <div className="workspace-switch"><div className="workspace-icon">X</div><div><strong>Research workspace</strong><small>Independent network</small></div><ChevronDown size={14}/></div>
      {["WORKSPACE", "RESEARCH", "TOOLS"].map((group) => <div className="nav-group" key={group}><div className="nav-label">{group}</div>{nav.filter((item) => item.group === group).map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => go(item.id)} className={`nav-item ${active === item.id ? "active" : ""}`}><Icon size={17}/><span>{item.label}</span>{item.id === "analyst" && <span className="nav-ai">AI</span>}</button>; })}</div>)}
      <div className="sidebar-bottom"><div className="system-card"><div><i className="status-pulse"/> PLATFORM STATUS</div><strong>Research environment</strong><small>Public-source data layer · Phase 1</small></div><div className="user-row"><div className="avatar">SX</div><div><strong>SectorX83</strong><small>Independent research network</small></div><span className="user-state">ACTIVE</span></div></div>
    </aside>
    {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close menu"/>}
    <section className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={19}/></button><div className="breadcrumb"><span>SECTORX83</span><ChevronRight size={13}/><strong>{currentNav?.label.toUpperCase()}</strong></div></div><div className="topbar-right"><div className="clock"><Clock3 size={14}/>{clock}</div><span className="top-divider"/><span className="topbar-status"><i className="status-pulse"/> PUBLIC DATA</span><button className="icon-button" aria-label="Notifications"><Bell size={17}/></button><div className="avatar avatar-small">SX</div></div></header>
      <div className="content-wrap">
        {active === "overview" && <>
          <div className="welcome-row"><div><div className="eyebrow">INDEPENDENT RESEARCH NETWORK <span className="eyebrow-sep">/</span> GLOBAL DESK</div><h1>Executive overview</h1><p className="welcome-copy">A structured view of public developments, institutions and global systems.</p></div><div className="date-stamp"><span>REFERENCE TIME</span><strong>{new Date().toISOString().slice(0, 10)}</strong><small>UTC · UPDATED {feedUpdated ? new Date(feedUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "PENDING"}</small></div></div>
          <div className="stat-grid"><div className="stat-card"><div className="stat-head">PUBLIC REPORTS <Newspaper size={16}/></div><div className="stat-value">{articles.length ? String(articles.length).padStart(2, "0") : "—"}</div><div className="stat-foot">Institutional and news feeds</div></div><div className="stat-card"><div className="stat-head">REFERENCE SOURCES <Database size={16}/></div><div className="stat-value">{String(researchSources.length).padStart(2, "0")}</div><div className="stat-foot">Curated research catalog</div></div><div className="stat-card"><div className="stat-head">NUCLEAR PROJECTS <Atom size={16}/></div><div className="stat-value">OPEN DATA</div><div className="stat-foot">Civil-energy records and imagery</div></div><div className="stat-card"><div className="stat-head">ANALYST ENGINE <Sparkles size={16}/></div><div className="stat-value">STAGED</div><div className="stat-foot">Groq activation · Phase 2</div></div></div>
          <div className="overview-grid"><div className="panel map-panel"><div className="panel-header"><div><div className="eyebrow">GEOGRAPHIC REFERENCE</div><h2>Global context</h2></div><button className="text-action" onClick={() => go("global")}>EXPAND MAP <ArrowUpRight size={14}/></button></div><WorldMap compact/><div className="panel-foot"><span>Map: OpenStreetMap · CARTO</span><span>Reference locations only</span></div></div><div className="panel brief-panel"><div className="panel-header"><div><div className="eyebrow">CURRENT REPORTING</div><h2>Latest briefings</h2></div><button className="icon-button subtle" onClick={() => void loadBriefings()} aria-label="Refresh briefings"><RefreshCw size={15}/></button></div>{feedLoading ? <div className="empty-state">Loading institutional and public reports…</div> : articles.slice(0, 5).map((article, i) => <button className="brief-row" key={article.id} onClick={() => openSource({ name: article.title, url: article.url, note: article.domain + " · " + (article.seen || "Publication date not supplied") })}><span className="brief-index">{String(i + 1).padStart(2, "0")}</span><span className="brief-main"><strong>{article.title}</strong><small>{article.domain} · {article.seen || "Date not supplied"}</small></span><ArrowUpRight size={14}/></button>)}{!feedLoading && articles.length === 0 && <div className="empty-state">The public feed is temporarily unavailable. Refresh to retry.</div>}<div className="panel-foot"><span>IAEA · SIPRI · UN News</span><span>{feedUpdated ? new Date(feedUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Awaiting update"}</span></div></div></div>
          <div className="lower-grid"><div className="panel"><div className="panel-header"><div><div className="eyebrow">RESEARCH AREAS</div><h2>Monitoring desks</h2></div></div><div className="desk-list"><button onClick={() => go("nuclear")}><span className="desk-icon"><Atom size={18}/></span><span><strong>Nuclear observatory</strong><small>Civil projects, reactor records and satellite imagery</small></span><ChevronRight size={16}/></button><button onClick={() => go("observatories")}><span className="desk-icon"><RadioTower size={18}/></span><span><strong>Public observatories</strong><small>Embedded public city cameras and broadcasts</small></span><ChevronRight size={16}/></button><button onClick={() => go("defence")}><span className="desk-icon"><ShieldCheck size={18}/></span><span><strong>Defence & policy</strong><small>Official announcements and attributed reporting</small></span><ChevronRight size={16}/></button><button onClick={() => go("finance")}><span className="desk-icon"><Landmark size={18}/></span><span><strong>Power & finance</strong><small>Public records, ownership and institutional influence</small></span><ChevronRight size={16}/></button></div></div><div className="panel analyst-teaser"><div className="eyebrow">RESEARCH ASSISTANT</div><div className="analyst-symbol"><Sparkles size={22}/></div><h2>X83 Analyst</h2><p>Compare public claims, organise evidence and prepare source-linked research briefings.</p><button className="primary-button" onClick={() => go("analyst")}>Open analyst <ArrowUpRight size={15}/></button><small className="phase-note">GROQ CONNECTION · PHASE 2</small></div></div>
        </>}
        {active === "global" && <><SectionHeading eyebrow="01 / GEOGRAPHIC REFERENCE" title="Global monitor" description="A real, navigable geographic basemap with selected institutional reference points. No simulated events or fabricated live positions."/><div className="panel large-map-panel"><div className="panel-header"><div><div className="eyebrow">WORLD REFERENCE LAYER</div><h2>Geographic overview</h2></div><span className="tag">LIVE MAP TILES</span></div><WorldMap/><div className="map-note">Map tiles are provided by OpenStreetMap contributors and CARTO. Pins mark public research and government reference cities only, not military units, facilities or operational activity.</div></div><div className="panel feed-panel"><div className="panel-header"><div><div className="eyebrow">ATTRIBUTED PUBLIC REPORTING</div><h2>Recent reporting</h2></div><div className="search-box"><Search size={15}/><input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter headlines…"/></div></div>{filteredArticles.map((article) => <button className="article-row" key={article.id} onClick={() => openSource({ name: article.title, url: article.url, note: article.domain + " · " + (article.seen || "Date not supplied") })}><div><strong>{article.title}</strong><small>{article.domain} · {article.language} · {article.seen || "Date not supplied"}</small></div><ArrowUpRight size={15}/></button>)}{!filteredArticles.length && <div className="empty-state">No matching reports.</div>}</div></>}
        {active === "nuclear" && <><SectionHeading eyebrow="02 / CIVIL NUCLEAR RESEARCH" title="Nuclear observatory" description="Public civil-energy projects, reactor records and dated Earth-observation imagery." action={<span className="tag tag-red"><Atom size={13}/> OPEN DATA</span>}/><div className="nuclear-hero"><div className="nuclear-hero-copy"><div className="eyebrow">PROJECT INTELLIGENCE / EARTH OBSERVATION</div><h2>Track the documented lifecycle of nuclear energy.</h2><p>Review public project records and inspect satellite imagery within this workspace. Every image and milestone must retain its source, date and verification status.</p><div className="hero-meta"><span><ShieldCheck size={14}/> Civil-energy scope</span><span><CalendarClock size={14}/> Dated source records</span></div></div><div className="nuclear-visual"><div className="nuclear-orbit"/><div className="nuclear-orbit orbit-two"/><Atom size={76} strokeWidth={1}/><span>EARTH OBSERVATION</span></div></div><div className="section-subhead"><div><div className="eyebrow">EMBEDDED DATA TOOLS</div><h2>Earth imagery workspace</h2></div><span className="tag">IN-PAGE VIEWERS</span></div><div className="imagery-grid"><div className="panel imagery-panel"><div className="panel-header"><div><div className="eyebrow">NASA EARTHDATA</div><h3>Worldview</h3></div><span className="source-status">PUBLIC VIEWER</span></div><iframe title="NASA Worldview imagery" src="https://worldview.earthdata.nasa.gov/" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="fullscreen"/><p>NASA Earth-observation layers and historical dates. The viewer is embedded here; it may require its own controls to select dates and layers.</p></div><div className="panel imagery-panel"><div className="panel-header"><div><div className="eyebrow">COPERNICUS DATA SPACE</div><h3>Sentinel imagery browser</h3></div><span className="source-status">PUBLIC VIEWER</span></div><iframe title="Copernicus Browser" src="https://browser.dataspace.copernicus.eu/" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="fullscreen"/><p>Public Sentinel imagery browser. Some layers and download functions may require an account from the provider.</p></div></div><div className="section-subhead"><div><div className="eyebrow">REFERENCE DATABASES</div><h2>Project and policy sources</h2></div></div><div className="source-grid">{projectSources.map((source, i) => <SourceCard key={source.name} source={source} index={i} onOpen={openSource}/>)}</div><div className="notice-panel"><ShieldCheck size={18}/><p><strong>Research boundary.</strong> This desk covers publicly documented civilian energy and research projects, published policy and non-operational imagery. It does not provide weapons-site surveillance, facility vulnerabilities or operational targeting data.</p></div></>}
        {active === "observatories" && <><SectionHeading eyebrow="03 / PUBLIC VISUAL SOURCES" title="Public observatories" description="Publicly published city coverage and landmark views, embedded directly in the SectorX83 workspace. No outbound navigation required."/><div className="observatory-intro"><div><div className="eyebrow">VISUAL REFERENCE DESK</div><h2>Live public views. In-context viewing.</h2><p>Streams are supplied by their publishers. If a publisher disables embedding or a stream goes offline, the player will show its own availability state.</p></div><div className="observatory-meta"><span><i className="status-pulse"/> EMBEDDED PLAYERS</span><small>Publisher-controlled availability</small></div></div><div className="camera-grid">{cameraFeeds.map((camera) => <div className="camera-card" key={camera.id}><div className="camera-head"><div><span className="camera-kicker">{camera.kind}</span><h3>{camera.title}</h3><p>{camera.location}</p></div><span className="camera-status">PUBLIC FEED</span></div><div className="camera-frame"><iframe title={camera.title} src={camera.embed} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen/></div><div className="camera-foot"><span>{camera.source}</span><span>Embedded viewer</span></div><p className="camera-note">{camera.note}</p></div>)}</div><div className="notice-panel"><CircleDot size={18}/><p><strong>Location and access note.</strong> These are public city or landmark views. There is no public direct camera feed of the Pentagon or Kremlin interior/secure grounds, and this dashboard will not invent one. The Washington Monument view is a public National Mall panorama, not a Pentagon feed.</p></div></>}
        {active === "defence" && <><SectionHeading eyebrow="04 / SECURITY & INSTITUTIONS" title="Defence & policy" description="Official announcements, public defence policy, procurement disclosures, treaties and attributed research."/><div className="topic-grid">{policySources.map((source, i) => <SourceCard key={source.name} source={source} index={i} onOpen={openSource}/>)}</div><div className="panel feed-panel"><div className="panel-header"><div><div className="eyebrow">ATTRIBUTED PUBLIC REPORTING</div><h2>Latest indexed reports</h2></div><button className="secondary-button compact" onClick={() => void loadBriefings()}><RefreshCw size={14}/> Refresh</button></div>{articles.slice(0, 10).map((article) => <button className="article-row" key={article.id} onClick={() => openSource({ name: article.title, url: article.url, note: article.domain + " · " + (article.seen || "Date not supplied") })}><div><strong>{article.title}</strong><small>{article.domain} · {article.seen || "Date not supplied"}</small></div><ArrowUpRight size={15}/></button>)}</div></>}
        {active === "finance" && <><SectionHeading eyebrow="05 / INSTITUTIONS & CAPITAL" title="Power & finance" description="Evidence-led research into wealth concentration, corporate ownership, lobbying disclosures and institutional influence."/><div className="finance-banner"><Building2 size={28}/><div><strong>Institutional influence research</strong><p>Follow documented relationships through filings, registers, funding disclosures and public records. Separate evidence from inference.</p></div></div><div className="source-grid">{financeSources.map((source, i) => <SourceCard key={source.name} source={source} index={i} onOpen={openSource}/>)}</div><div className="notice-panel"><FileText size={18}/><p><strong>Research standard.</strong> Every claim should identify the underlying filing, date, jurisdiction and source. Family names or organisations are not evidence of secret control by themselves.</p></div></>}
        {active === "analyst" && <><SectionHeading eyebrow="06 / AI RESEARCH ASSISTANT" title="X83 Analyst" description="A source-conscious research assistant for comparing public claims, summarising policy and organising evidence." action={<span className="tag tag-red"><Sparkles size={13}/> GROQ / PHASE 2</span>}/><div className="analyst-layout"><div className="panel analyst-main"><div className="analyst-header"><div className="analyst-avatar"><Sparkles size={22}/></div><div><h2>Analyst workspace</h2><p>Separate verified facts, attributed claims and interpretation.</p></div><span className="status-pill pending">ENGINE STAGED</span></div><form className="analyst-form" onSubmit={askAnalyst}><label htmlFor="analyst-query">RESEARCH QUESTION</label><textarea id="analyst-query" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Compare public nuclear energy policy announcements and identify the original sources." rows={5}/><div className="form-bottom"><span>Do not submit sensitive personal or operational information.</span><button className="primary-button" disabled={analystBusy || !query.trim()}>{analystBusy ? "Analysing…" : "Run analysis"} <Sparkles size={14}/></button></div></form>{analystError && <div className="error-message">{analystError}</div>}{answer && <div className="answer-block"><div className="eyebrow">ANALYST RESPONSE</div><p>{answer}</p><small>AI-generated analysis. Verify material claims against original sources.</small></div>}<div className="prompt-chips"><button type="button" onClick={() => setQuery("Summarise recent public civil nuclear energy policy developments and identify original sources.")}>Civil nuclear policy</button><button type="button" onClick={() => setQuery("Compare recent official defence policy announcements and identify differences.")}>Defence policy comparison</button><button type="button" onClick={() => setQuery("Explain public lobbying disclosure systems and how to evaluate institutional influence claims.")}>Institutional influence</button></div></div><div className="panel analyst-side"><div className="eyebrow">ANALYSIS STANDARD</div><h3>Evidence before inference.</h3><ul><li>Source attribution</li><li>Publication dates</li><li>Fact / claim separation</li><li>Contradiction review</li><li>Uncertainty disclosure</li></ul><div className="analyst-side-foot"><ZapIcon/><span>Groq API key is configured server-side in Phase 2. Never expose it in the browser.</span></div></div></div></>}
        {active === "archive" && <><SectionHeading eyebrow="07 / KNOWLEDGE MANAGEMENT" title="Research library" description="A structured directory of primary sources and independent research institutions. Member-saved records arrive in Phase 2."/><div className="source-grid">{researchSources.map((source, i) => <SourceCard key={source.name} source={{ name: source.name, url: source.url, note: source.description }} index={i} onOpen={openSource}/>)}</div></>}
        <footer className="app-footer"><span>SECTORX83 <b>·</b> INDEPENDENT RESEARCH NETWORK</span><span>PHASE 1 FOUNDATION <b>·</b> {new Date().getFullYear()}</span></footer>
      </div>
    </section>
    {viewer && <div className="viewer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setViewer(null); }}><section className="source-viewer" role="dialog" aria-modal="true" aria-label={viewer.name}><div className="viewer-header"><div><div className="eyebrow">IN-APP SOURCE VIEWER</div><h2>{viewer.name}</h2><p>{viewer.note || viewer.url}</p></div><button className="icon-button" onClick={() => setViewer(null)} aria-label="Close source viewer"><X size={19}/></button></div><iframe title={viewer.name} src={viewer.url} referrerPolicy="strict-origin-when-cross-origin" loading="eager"/><div className="viewer-foot">The source is displayed inside SectorX83. Some publishers block embedded viewing; if that happens, the original page cannot be rendered here without permission.</div></section></div>}
  </main>;
}

function ZapIcon() { return <Sparkles size={16}/>; }
