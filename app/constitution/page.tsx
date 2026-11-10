import Link from "next/link";
import { ArrowLeft, Scale, ShieldCheck } from "lucide-react";

const articles = [
  ["01", "Purpose", "SectorX83 is an independent, voluntary community for research, discussion, civic understanding and shared learning. It has no authority over people outside the community."],
  ["02", "Equal standing", "Members are treated with equal dignity. Participation is open without discrimination based on background, belief, identity or personal circumstance."],
  ["03", "Freedom to disagree", "Members may question ideas, challenge claims, criticise decisions and hold different views. Disagreement is not disloyalty."],
  ["04", "Voluntary membership", "Membership is voluntary. Anyone may leave without threats, retaliation, pressure or loss of personal rights."],
  ["05", "No coercion", "Threats, harassment, intimidation, blackmail, forced loyalty tests and attempts to control members' private lives are prohibited."],
  ["06", "Evidence and honesty", "Research must distinguish verified facts, attributed claims, interpretation and uncertainty. Fabricated sources and knowingly false accusations are prohibited."],
  ["07", "Privacy and accountability", "Personal information must be handled carefully. Confidentiality must never be used to conceal abuse, credible threats or unlawful conduct."],
  ["08", "Responsible moderation", "Moderation decisions must be based on published rules, proportionate action and a review process. Moderators are accountable to the same standards."],
  ["09", "No member above the rules", "No role grants immunity from this constitution. Changes to community rules should be documented and communicated."],
  ["10", "Public responsibility", "The community does not organise violence, unlawful activity, targeted harassment or surveillance of private individuals. Its work remains peaceful and lawful."],
];

export default function ConstitutionPage() {
  return <main className="sx-constitution-page">
    <header className="sx-community-top"><Link href="/" className="sx-community-brand"><span className="sx-mark small"><span>SX</span><b>83</b></span><span>SECTORX83 <small>FOUNDING DOCUMENT</small></span></Link><Link className="sx-back-link" href="/community">COMMUNITY NETWORK →</Link></header>
    <section className="sx-constitution-shell">
      <div className="sx-kicker">FOUNDATION / GOVERNANCE</div><div className="sx-constitution-hero"><div><div className="sx-constitution-symbol"><Scale size={42}/></div><h1>Constitution of <span>SectorX83.</span></h1><p>A framework for a voluntary community built on independent thought, equal standing, accountability and freedom of conscience.</p></div><div className="sx-constitution-seal"><ShieldCheck size={34}/><span>NO MEMBER</span><strong>ABOVE THE RULES</strong></div></div>
      <div className="sx-constitution-list">{articles.map(([number,title,body])=><article key={number}><span>{number}</span><div><h2>{title}</h2><p>{body}</p></div></article>)}</div>
      <div className="sx-constitution-note">This is the community's operating framework. It does not replace applicable law or create authority over any person outside SectorX83.</div>
      <footer className="sx-community-footer"><span>SECTORX83 · CONSTITUTION</span><Link href="/join">JOIN THE NETWORK ↗</Link></footer>
    </section>
  </main>;
}
