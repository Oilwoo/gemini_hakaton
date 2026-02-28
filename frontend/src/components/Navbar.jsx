import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isLanding = location.pathname === '/';

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo">
          <div className="navbar__logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="4" width="20" height="16" rx="3" stroke="url(#navGrad)" strokeWidth="1.8"/>
              <circle cx="12" cy="12" r="3" stroke="url(#navGrad)" strokeWidth="1.8"/>
              <circle cx="12" cy="12" r="1" fill="url(#navGrad)"/>
              <defs>
                <linearGradient id="navGrad" x1="2" y1="4" x2="22" y2="20">
                  <stop stopColor="#8b5cf6"/>
                  <stop offset="1" stopColor="#06b6d4"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="navbar__logo-text">
            FollowCam<span className="gradient-text">AI</span>
          </span>
        </Link>

        <div className="navbar__links">
          {isLanding && (
            <>
              <a href="#use-cases" className="navbar__link">Use Cases</a>
              <a href="#features" className="navbar__link">Features</a>
              <a href="#how-it-works" className="navbar__link">How It Works</a>
            </>
          )}
          <Link
            to="/converter"
            className="btn btn-primary"
            style={{ padding: '10px 24px', fontSize: '0.875rem' }}
          >
            Start Editing
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 16px 24px;
          transition: all 0.4s var(--ease-out-expo);
        }
        .navbar--scrolled {
          padding: 8px 24px;
        }
        .navbar__inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          border-radius: var(--radius-full);
          background: rgba(6, 6, 15, 0.6);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid var(--border-subtle);
          transition: all 0.4s var(--ease-out-expo);
        }
        .navbar--scrolled .navbar__inner {
          background: rgba(6, 6, 15, 0.85);
          box-shadow: var(--shadow-md);
          border-color: var(--border-light);
        }
        .navbar__logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.15rem;
        }
        .navbar__logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
        }
        .navbar__links {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .navbar__link {
          padding: 8px 16px;
          font-size: 0.875rem;
          color: var(--text-secondary);
          transition: color 0.25s ease;
          font-weight: 500;
        }
        .navbar__link:hover {
          color: var(--text-primary);
        }
        @media (max-width: 768px) {
          .navbar__link { display: none; }
          .navbar__inner { padding: 10px 16px; }
        }
      `}</style>
    </nav>
  );
}
