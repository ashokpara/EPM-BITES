export const metadata = {
  title: "About — The EPM Post",
  description: "About Ashok Para — Oracle EPM consultant specialising in EDM, DRM, Essbase, and Planning.",
};

export default function AboutPage() {
  return (
    <div className="container">
      <div className="about-header">
        <h1>About Me</h1>
        <p className="about-tagline">
          Lead Oracle EPM Consultant — EDM, DRM, Essbase & Planning
        </p>
      </div>

      <div className="about-intro">
        <p>
          I'm <strong>Ashok Para</strong>. I implement Oracle EPM solutions for a living —
          primarily Enterprise Data Management, Data Relationship Management, and Essbase.
          I've worked across Healthcare, Financial Services, Energy, Retail, Telecom, and more.
        </p>
        <p>
          This blog is where I share what I learn in the field — practical takes on implementations,
          release features, and the problems that don't have easy answers in the docs.
        </p>
      </div>

      <div className="about-section">
        <h2>Expertise</h2>
        <div className="expertise-grid">
          <div className="expertise-card">
            <h3>Oracle EDM Cloud</h3>
            <p>Implementations, custom validations, property derivations, mappings, governance workflows, ERP/EPM integrations.</p>
          </div>
          <div className="expertise-card">
            <h3>Oracle DRM / DRG</h3>
            <p>Hierarchy design, governance workflows, metadata change management, DRM-to-EDM migrations.</p>
          </div>
          <div className="expertise-card">
            <h3>Essbase</h3>
            <p>BSO and ASO cube design, performance tuning, business rules, automation, system administration.</p>
          </div>
          <div className="expertise-card">
            <h3>Hyperion Planning</h3>
            <p>Multi-currency implementations, webforms, SmartView, metadata automation, end-to-end build.</p>
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
        <h2>Project Highlights</h2>
        <div className="project-item">
          <h3>Financial Services — DRM to EDM Migration</h3>
          <p>Led full migration of DRM capabilities to Oracle EDM Cloud as part of an ERP/EPM modernisation program. Built custom property derivations, business rules, master hierarchies, and governance workflows.</p>
        </div>
        <div className="project-item">
          <h3>Energy — M&A Metadata Solution</h3>
          <p>Lead DRM consultant on a major Oil & Gas M&A project. Designed a metadata solution spanning multiple GL systems with FP&A governance workflows and ERP/EPM reconciliation.</p>
        </div>
        <div className="project-item">
          <h3>Retail — EDM Cloud Implementation</h3>
          <p>Designed and built a strategic EDM solution with legacy GL to Fusion Cloud GL mappings and end-to-end data integration across ERP, EPM, and HR systems.</p>
        </div>
        <div className="project-item">
          <h3>Insurance — COA Governance & Planning</h3>
          <p>Built a DRM-based Chart of Accounts governance solution and a Hyperion Planning cube for external reporting, with full automation of metadata load and export processes.</p>
        </div>
      </div>

      <div className="about-contact">
        <p>Connect with me on <a href="https://www.linkedin.com/in/ashokpara" target="_blank" rel="noopener noreferrer">LinkedIn</a> or reach out if you want to discuss an EPM challenge.</p>
      </div>
    </div>
  );
}
