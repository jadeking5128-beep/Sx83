import PortalShell from "@/components/portal-shell";
import styles from "./projects.module.css";

const updates = [
  { number: "01", title: "Project established", detail: "The Bunker Plan was introduced as a SectorX83 institutional development initiative and communicated to members through a formal circular.", date: "INITIAL COMMUNICATION" },
  { number: "02", title: "Executive review completed", detail: "The Executive reviewed the submitted project data and approved progression to further procedures. Supporting documentation is to be maintained as the project develops.", date: "REVIEW & APPROVAL" },
];

export default function ProjectsPage() {
  return <PortalShell eyebrow="MEMBER SERVICES / PROJECTS" title="Projects & Initiatives" description="A member-only overview of SectorX83 projects, their current position and approved progress updates.">
    <div className={styles.index}><span>PROJECT REGISTER</span><span>01 ACTIVE ENTRY</span></div>
    <article className={styles.project}>
      <div className={styles.projectTop}><span>PROJECT / 001</span><span className={styles.status}>IN DEVELOPMENT</span></div>
      <h2>Bunker Plan</h2>
      <p className={styles.summary}>A SectorX83 institutional development initiative. This record brings together the project’s approved background, decisions and subsequent progress updates in one place.</p>
      <div className={styles.meta}>
        <div><small>PROJECT CLASS</small><strong>INSTITUTIONAL DEVELOPMENT</strong></div>
        <div><small>RECORD ACCESS</small><strong>MEMBERS ONLY</strong></div>
        <div><small>PROJECT STATUS</small><strong>IN DEVELOPMENT</strong></div>
      </div>
      <div className={styles.updatesTitle}>PROJECT RECORD <span>APPROVED UPDATES</span></div>
      <div className={styles.updates}>{updates.map(item => <section className={styles.update} key={item.number}>
        <span className={styles.number}>{item.number}</span>
        <div><div className={styles.updateMeta}>{item.date}</div><h3>{item.title}</h3><p>{item.detail}</p></div>
      </section>)}</div>
      <p className={styles.note}>Further updates will be published here when formally reviewed and approved. This page records project-level information and does not publish sensitive operational details.</p>
    </article>
  </PortalShell>;
}
