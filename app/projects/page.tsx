import PortalShell from "@/components/portal-shell";
import styles from "./projects.module.css";

const updates = [
  { number: "01", title: "Project established", detail: "The Bunker Plan was introduced as a SectorX83 institutional development initiative and communicated to members through a formal circular.", date: "INITIAL COMMUNICATION" },
  { number: "02", title: "Executive review completed", detail: "The Executive reviewed the submitted project data and approved progression to further procedures. Supporting documentation is to be maintained as the project develops.", date: "REVIEW & APPROVAL" },
  { number: "03", title: "Project parameters recorded", detail: "The approved planning basis records a newly constructed underground complex and a provisional project budget ceiling of ₹30,00,000. The project remains in development; this record does not represent construction commencement or expenditure.", date: "APPROVED PARAMETERS" },
];

const workstreams = [
  { number: "01", title: "Command Station", detail: "The proposed central coordination area for project administration, oversight and internal command functions." },
  { number: "02", title: "Communications Post", detail: "A dedicated communications function for reliable internal coordination and information handling." },
  { number: "03", title: "Secure Storage", detail: "A controlled storage and inventory area, with the stated capacity target of up to 15 air guns. Any possession, storage or use remains subject to applicable law and safety requirements." },
  { number: "04", title: "Practice Area", detail: "A proposed 10-metre practice lane, subject to legal review, safe design, suitable supervision and all required approvals." },
  { number: "05", title: "Monitoring & Site Services", detail: "Localized surveillance and communications, supported by essential site services and emergency provisions." },
];

const stages = [
  ["01", "Feasibility & site assessment", "Site suitability, permissions, professional assessments and preliminary cost validation."],
  ["02", "Design & civil development", "Professional design and planning for the new underground construction, including structural, ventilation, drainage and utility requirements."],
  ["03", "Core systems", "Planning for power continuity, communications, monitoring, network access, water, sanitation and emergency systems."],
  ["04", "Controlled fit-out", "Documentation, inventory controls, secure storage arrangements and any approved specialist spaces."],
  ["05", "Inspection & commissioning", "Legal compliance review, safety inspection, documentation and formal authorization before any use."],
];

export default function ProjectsPage() {
  return <PortalShell eyebrow="MEMBER SERVICES / PROJECTS" title="Projects & Initiatives" description="A member-only register of SectorX83 projects, approved parameters, governance decisions and progress records.">
    <div className={styles.index}><span>PROJECT REGISTER</span><span>01 ACTIVE ENTRY</span></div>
    <article className={styles.project}>
      <div className={styles.projectTop}><span>PROJECT / 001</span><span className={styles.status}>IN DEVELOPMENT</span></div>
      <p className={styles.formalLabel}>FORMAL PROJECT DESIGNATION</p>
      <h2>Project Bastion</h2>
      <p className={styles.subtitle}>SectorX83 Underground Development Initiative</p>
      <p className={styles.summary}>Project Bastion is the formal designation for SectorX83’s proposed underground complex. It consolidates the project’s approved planning basis, intended functional areas, delivery workstreams and governance requirements. “Bunker Plan” remains the original working title in historical references.</p>
      <div className={styles.meta}>
        <div><small>PROJECT CLASS</small><strong>UNDERGROUND DEVELOPMENT</strong></div>
        <div><small>RECORD ACCESS</small><strong>MEMBERS ONLY</strong></div>
        <div><small>PROJECT STATUS</small><strong>IN DEVELOPMENT</strong></div>
        <div><small>APPROVED BUDGET BASIS</small><strong>₹30,00,000</strong></div>
        <div><small>CONSTRUCTION BASIS</small><strong>NEW UNDERGROUND BUILD</strong></div>
        <div><small>PROJECT AUTHORITY</small><strong>SECTORX83 EXECUTIVE</strong></div>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeading}><span>01 / PROJECT MANDATE</span><span>OVERVIEW</span></div>
        <p className={styles.bodyCopy}>The initiative concerns the planning and development of a purpose-built underground facility for SectorX83. Its proposed functions bring together coordination, communications, controlled storage, a designated practice area and essential site-support systems within one managed development.</p>
        <p className={styles.bodyCopy}>The approved planning basis specifies a large underground complex, new construction and a budget of ₹30 lakh. These are planning parameters, not evidence that a site has been acquired, construction has begun, or funds have been spent.</p>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}><span>02 / FUNCTIONAL PROGRAMME</span><span>PROPOSED AREAS</span></div>
        <div className={styles.workstreams}>{workstreams.map(item => <div className={styles.workstream} key={item.number}><span>{item.number}</span><div><h3>{item.title}</h3><p>{item.detail}</p></div></div>)}</div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}><span>03 / DELIVERY FRAMEWORK</span><span>PLANNING STAGES</span></div>
        <p className={styles.bodyCopy}>The following stages form the proposed delivery framework. They are sequencing guidance for assessment and governance; they do not imply that any stage has been completed or separately authorized.</p>
        <div className={styles.stages}>{stages.map(item => <div className={styles.stage} key={item[0]}><span>{item[0]}</span><div><h3>{item[1]}</h3><p>{item[2]}</p></div></div>)}</div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}><span>04 / GOVERNANCE & SAFEGUARDS</span><span>REQUIRED CONTROLS</span></div>
        <ul className={styles.controls}>
          <li>All site selection, design and construction must be assessed by appropriately qualified professionals and comply with applicable planning, building and safety laws.</li>
          <li>Any surveillance, communications or data systems must operate within applicable privacy and data-protection requirements.</li>
          <li>Any air-gun storage or practice activity is conditional on applicable licensing, possession, storage, supervision and use requirements. No operational weapon instructions are part of this project record.</li>
          <li>Emergency access, fire protection, ventilation, drainage, sanitation and safe occupancy must be addressed before commissioning.</li>
          <li>Budget changes, material scope changes and major milestones must be documented and submitted to the appropriate SectorX83 authority for review.</li>
          <li>No facility area is to be treated as operational until the required inspections, approvals and commissioning records are complete.</li>
        </ul>
      </section>

      <div className={styles.updatesTitle}>PROJECT RECORD <span>APPROVED UPDATES</span></div>
      <div className={styles.updates}>{updates.map(item => <section className={styles.update} key={item.number}>
        <span className={styles.number}>{item.number}</span>
        <div><div className={styles.updateMeta}>{item.date}</div><h3>{item.title}</h3><p>{item.detail}</p></div>
      </section>)}</div>
      <p className={styles.note}>Record status: planning and development. Items identified as proposed or conditional are not represented as final construction specifications or completed work. Further changes will be published only after formal review and approval. This register is for authorized members and does not replace statutory permissions, professional engineering documents or safety certifications.</p>
    </article>
  </PortalShell>;
}
