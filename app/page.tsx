import Link from "next/link";
import styles from "./home.module.css";

const sections = [
  { number:"01", title:"Official Bulletin", description:"Executive circulars, issued notices, institutional decisions and the monthly agenda.", href:"/bulletin", action:"READ OFFICIAL NOTICES" },
  { number:"02", title:"Membership Registry", description:"The current member directory, institutional roles and membership records.", href:"/members", action:"VIEW THE REGISTER" },
  { number:"03", title:"Institutional Archives", description:"A central catalogue for constitutions, approved documents, policies and references.", href:"/archives", action:"OPEN THE ARCHIVES" },
  { number:"04", title:"Community Network", description:"Member discussions, direct communication and the existing community workspace.", href:"/community", action:"ENTER THE NETWORK" },
  { number:"05", title:"Constitution", description:"The principles, rights, responsibilities and governance framework of SectorX83.", href:"/constitution", action:"REVIEW THE CONSTITUTION" },
  { number:"06", title:"Executive Office", description:"Administrative overview and authorized institutional publishing controls.", href:"/administration", action:"EXECUTIVE ACCESS" },
];

export default function Home() {
  return <main className={styles.page}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand}><span className={styles.seal}>SX<small>83</small></span><span>SECTORX83<small>INSTITUTIONAL NETWORK</small></span></Link>
      <nav className={styles.nav}><Link href="/bulletin">BULLETIN</Link><Link href="/members">REGISTRY</Link><Link href="/archives">ARCHIVES</Link><Link href="/constitution">CONSTITUTION</Link></nav>
      <Link href="/join" className={styles.signin}>MEMBER SIGN-IN <span>↗</span></Link>
    </header>
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <div className={styles.kicker}><i/> INSTITUTIONAL PORTAL <span>EST. MMXXVI</span></div>
        <h1>Order in thought.<br/><em>Purpose in action.</em></h1>
        <p className={styles.intro}>The central institutional platform of SectorX83. Access official communications, membership records, governance documents and the member network.</p>
        <div className={styles.actions}><Link href="/bulletin" className={styles.primary}>VIEW OFFICIAL BULLETIN <span>↗</span></Link><Link href="/community" className={styles.secondary}>ENTER COMMUNITY</Link></div>
      </div>
      <div className={styles.heroAside}>
        <div className={styles.orbit}><div className={styles.orbitInner}>SX<span>83</span></div></div>
        <div className={styles.sideLabel}>SECTOR X83 <b>INSTITUTIONAL DIVISION</b></div>
        <div className={styles.sideFoot}><span>VOLUNTARY MEMBERSHIP</span><span>ACCOUNTABLE GOVERNANCE</span></div>
      </div>
    </section>
    <section className={styles.notice}>
      <div className={styles.noticeMark}>NOTICE / 01</div>
      <div><small>EXECUTIVE COMMUNICATIONS</small><h2>December 2026 Executive Agenda</h2><p>The December review will assess organizational progress, official records, member participation, institutional development and priorities for January 2027.</p></div>
      <Link href="/bulletin">READ CIRCULAR <span>↗</span></Link>
    </section>
    <section className={styles.section}>
      <div className={styles.sectionHead}><div><div className={styles.kicker}>DIRECTORY / 00</div><h2>Institutional divisions</h2><p>Core services and official points of access.</p></div><span className={styles.sectionCount}>06 / DIVISIONS</span></div>
      <div className={styles.grid}>{sections.map(item=><Link href={item.href} key={item.number} className={styles.card}><div className={styles.cardTop}><span>{item.number} / DIVISION</span><span>↗</span></div><h3>{item.title}</h3><p>{item.description}</p><div className={styles.cardAction}>{item.action} <span>→</span></div></Link>)}</div>
    </section>
    <section className={styles.bottom}>
      <div><div className={styles.kicker}>INSTITUTIONAL DEVELOPMENT</div><h2>A framework built on documented work.</h2><p>SectorX83 initiatives proceed through review, documented proposals, accountable decisions and compliance with applicable law.</p></div>
      <Link href="/constitution" className={styles.secondary}>GOVERNANCE FRAMEWORK ↗</Link>
    </section>
    <footer className={styles.footer}><span>SECTORX83 <b>·</b> INSTITUTIONAL NETWORK</span><span>VOLUNTARY · ACCOUNTABLE · LAWFUL</span><Link href="/join">MEMBER ACCESS ↗</Link></footer>
  </main>;
}