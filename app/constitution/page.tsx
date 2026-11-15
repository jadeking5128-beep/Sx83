import Link from "next/link";
import { Scale, ShieldCheck, ArrowUpRight, BookOpen, Landmark, Users, LockKeyhole, MessageSquareText } from "lucide-react";

const articles = [
  ["01", "Purpose", "SectorX83 is an independent, voluntary community for research, discussion, civic understanding and shared learning. It has no authority over people outside the community.", "FOUNDATION"],
  ["02", "Equal standing", "Members are treated with equal dignity. Participation is open without discrimination based on background, belief, identity or personal circumstance.", "MEMBERSHIP"],
  ["03", "Freedom to disagree", "Members may question ideas, challenge claims, criticise decisions and hold different views. Disagreement is not disloyalty.", "MEMBERSHIP"],
  ["04", "Voluntary membership", "Membership is voluntary. Anyone may leave without threats, retaliation, pressure or loss of personal rights.", "MEMBERSHIP"],
  ["05", "No coercion", "Threats, harassment, intimidation, blackmail, forced loyalty tests and attempts to control members' private lives are prohibited.", "CONDUCT"],
  ["06", "Evidence and honesty", "Research must distinguish verified facts, attributed claims, interpretation and uncertainty. Fabricated sources and knowingly false accusations are prohibited.", "CONDUCT"],
  ["07", "Privacy and accountability", "Personal information must be handled carefully. Confidentiality must never be used to conceal abuse, credible threats or unlawful conduct.", "GOVERNANCE"],
  ["08", "Responsible moderation", "Moderation decisions must be based on published rules, proportionate action and a review process. Moderators are accountable to the same standards.", "GOVERNANCE"],
  ["09", "No member above the rules", "No role grants immunity from this constitution. Changes to community rules should be documented and communicated.", "GOVERNANCE"],
  ["10", "Public responsibility", "The community does not organise violence, unlawful activity, targeted harassment or surveillance of private individuals. Its work remains peaceful and lawful.", "RESPONSIBILITY"],
] as const;

const groups = [
  { label: "FOUNDATION", icon: Landmark, detail: "Purpose and scope" },
  { label: "MEMBERSHIP", icon: Users, detail: "Rights and participation" },
  { label: "CONDUCT", icon: MessageSquareText, detail: "Standards of behaviour" },
  { label: "GOVERNANCE", icon: LockKeyhole, detail: "Oversight and accountability" },
  { label: "RESPONSIBILITY", icon: ShieldCheck, detail: "Lawful public conduct" },
];

export default function ConstitutionPage() {
  return <main className="sx-constitution-page sx-constitution-redesign">
    <header className="sx-community-top">
      <Link href="/" className="sx-community-brand"><span className="sx-mark small"><span>SX</span><b>83</b></span><span>SECTORX83 <small>INSTITUTIONAL NETWORK</small></span></Link>
      <nav className="sx-constitution-nav"><Link href="/bulletin">BULLETIN</Link><Link href="/community">COMMUNITY</Link><Link href="/join">MEMBER ACCESS</Link></nav>
      <span className="sx-constitution-docref">GOV / DOC-001</span>
    </header>

    <section className="sx-constitution-shell sx-constitution-layout">
      <div className="sx-constitution-overline"><span>FOUNDATION / GOVERNANCE</span><span>DOCUMENT 001 · CURRENT EDITION</span></div>
      <div className="sx-constitution-hero">
        <div className="sx-constitution-hero-copy">
          <div className="sx-constitution-symbol"><Scale size={32}/></div>
          <div className="sx-kicker">THE FOUNDING FRAMEWORK</div>
          <h1>Constitution of <span>SectorX83.</span></h1>
          <p>A framework for a voluntary community built on independent thought, equal standing, accountability and freedom of conscience.</p>
          <div className="sx-constitution-meta"><span><i/> TEN ARTICLES</span><span>VOLUNTARY MEMBERSHIP</span><span>PEACEFUL &amp; LAWFUL</span></div>
        </div>
        <div className="sx-constitution-seal"><div className="sx-seal-ring"><ShieldCheck size={31}/><span>SECTORX83</span><strong>NO MEMBER<br/>ABOVE THE RULES</strong><small>EST. IN PRINCIPLE</small></div></div>
      </div>

      <div className="sx-constitution-preamble">
        <div><span className="sx-kicker">PREAMBLE</span><h2>Principles before position.</h2></div>
        <p>This constitution establishes the standards that govern participation in SectorX83. It defines the community&apos;s purpose, protects member autonomy and sets expectations for responsible administration. Every member and office-holder is subject to these principles.</p>
      </div>

      <div className="sx-constitution-content">
        <aside className="sx-constitution-index">
          <div className="sx-kicker">DOCUMENT INDEX</div>
          <strong>Articles</strong>
          <nav>{articles.map(([number,title])=><a key={number} href={"#article-"+number}><span>{number}</span>{title}</a>)}</nav>
          <div className="sx-constitution-index-note"><BookOpen size={15}/><span>Read the complete framework. Each article applies equally to members and administrators.</span></div>
        </aside>
        <div className="sx-constitution-articles">
          {groups.map(group => {
            const Icon=group.icon;
            const entries=articles.filter(article=>article[3]===group.label);
            if (!entries.length) return null;
            return <section className="sx-constitution-group" key={group.label}>
              <div className="sx-constitution-group-head"><span><Icon size={15}/>{group.label}</span><small>{group.detail}</small></div>
              {entries.map(([number,title,body])=><article id={"article-"+number} key={number} className="sx-constitution-article">
                <span className="sx-article-number">{number}</span><div><h2>{title}</h2><p>{body}</p></div><a href={"#article-"+number} aria-label={"Link to Article "+number}><ArrowUpRight size={15}/></a>
              </article>)}
            </section>;
          })}
        </div>
      </div>

      <div className="sx-constitution-note"><ShieldCheck size={18}/><p><strong>Scope and application</strong><br/>This is the community&apos;s operating framework. It does not replace applicable law or create authority over any person outside SectorX83.</p></div>
      <footer className="sx-community-footer"><span>SECTORX83 · CONSTITUTION · GOV / DOC-001</span><span><Link href="/community">RETURN TO COMMUNITY ↗</Link></span></footer>
    </section>
  </main>;
}
