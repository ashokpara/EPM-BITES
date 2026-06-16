import "./globals.css";

export const metadata = {
  title: "The EPM Post",
  description: "Insights, tips, and deep dives on Oracle EPM — DRM, EDM, Planning, Essbase, and more.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container">
            <a href="/" className="site-logo">
              The EPM Post <span>/ blog</span>
            </a>
            <nav className="site-nav">
              <a href="/about">About</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="container">
            © {new Date().getFullYear()} The EPM Post · Practical insights for EPM professionals.
          </div>
        </footer>
      </body>
    </html>
  );
}
