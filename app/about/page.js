export const metadata = {
  title: "About — The EPM Post",
  description: "About Ashok Para — Oracle EPM consultant specialising in EDM, DRM, Essbase, and Planning.",
};

export default function AboutPage() {
  return (
    <div className="container">
      <div className="about-header">
        <h1>About Me</h1>
      </div>

      <div className="about-intro">
        <p>
          I'm <strong>Ashok Para</strong>, a Lead Oracle EPM Consultant with extensive experience
          implementing and enhancing Oracle's EPM suite — primarily Enterprise Data Management (EDM),
          Data Relationship Management (DRM), Essbase, and Planning.
        </p>
        <p>
          I started this blog to share practical insights from real-world implementations — the things
          you learn after working across industries, dealing with complex data models, and solving
          problems that don't have a clean answer in the documentation.
        </p>
      </div>

      <div className="about-section">
        <h2>What I Do</h2>
        <p>
          My work sits at the intersection of master data governance and EPM systems. I help
          organisations design and build metadata solutions that connect their ERP, EPM, and HR
          systems — with a focus on governance workflows, data integrity, and automation.
        </p>
        <p>
          Whether it's migrating a legacy DRM application to Oracle EDM Cloud, building custom
          validations and property derivations, or designing hierarchy governance processes for
          FP&A teams — this is the kind of work I do every day.
        </p>
      </div>

      <div className="about-section">
        <h2>Areas of Expertise</h2>
        <div className="expertise-grid">
          <div className="expertise-card">
            <h3>Enterprise Data Management</h3>
            <p>Oracle EDM Cloud implementations, custom validations, property derivations, mappings, governance workflows, and ERP/EPM integrations.</p>
          </div>
          <div className="expertise-card">
            <h3>Data Relationship Management</h3>
            <p>Oracle DRM/DRG — hierarchy design, governance workflows, metadata change management, and DRM-to-EDM migrations.</p>
          </div>
          <div className="expertise-card">
            <h3>Essbase</h3>
            <p>BSO and ASO cube design, performance tuning, business rules, automation, and system administration.</p>
          </div>
          <div className="expertise-card">
            <h3>Hyperion Planning</h3>
            <p>Planning application builds, multi-currency implementations, webforms, SmartView, and metadata automation.</p>
          </div>
        </div>
      </div>

      <div className="about-section">
        <h2>Industries</h2>
        <div className="industry-list">
          {["Healthcare & Life Sciences", "Banking & Financial Services", "Energy & Oil & Gas", "Retail", "Telecom", "Insurance", "Media", "Manufacturing"].map((industry) => (
            <span key={industry} className="industry-tag">{industry}</span>
          ))}
        </div>
      </div>

      <div className="about-section">
        <h2>Selected Project Experience</h2>

        <div className="project-item">
          <h3>Retail — EDM Cloud Implementation</h3>
          <p>Designed and developed a strategic EDM solution for a major retail client. Built mappings for legacy GL to Fusion Cloud GL data transformation and implemented end-to-end EDM data integration processes across ERP, EPM, and HR systems.</p>
        </div>

        <div className="project-item">
          <h3>Financial Services — DRM to EDM Migration</h3>
          <p>Led the design and build of Oracle EDM as part of an ERP/EPM modernisation program. Migrated and enhanced existing DRM capabilities to EDM, implemented custom property derivations and business rules for minimal user input, and built governance workflow capabilities with master hierarchies and complex mappings.</p>
        </div>

        <div className="project-item">
          <h3>Energy — M&A Metadata Solution</h3>
          <p>Lead Hyperion DRM consultant on a major Oil & Gas M&A project. Designed a metadata solution spanning multiple GL systems, built governance workflows for FP&A metadata change requests, and managed data reconciliation between EPM and ERP systems.</p>
        </div>

        <div className="project-item">
          <h3>Insurance — COA Governance & Planning</h3>
          <p>Worked with FP&A to streamline Chart of Accounts maintenance and budgeting processes. Developed a metadata governance solution using Oracle DRM, implemented a Hyperion Planning cube for external reporting, and built end-to-end automation for metadata load and export.</p>
        </div>

        <div className="project-item">
          <h3>Telecom — Essbase ASO Reporting</h3>
          <p>Designed and built an Essbase ASO reporting solution for Consumer Mass Business. Optimised existing application performance, developed business rules for short-term forecasting, and automated LCM processes for system backups and cross-environment migrations.</p>
        </div>
      </div>

      <div className="about-section">
        <h2>Education</h2>
        <p>Bachelor of Engineering in Computer Science, India.</p>
      </div>

      <div className="about-contact">
        <p>Want to connect or discuss an EPM challenge? Find me on <a href="https://www.linkedin.com/in/ashokpara" target="_blank" rel="noopener noreferrer">LinkedIn</a>.</p>
      </div>
    </div>
  );
}
