import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';

const IconCamera = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>);
const IconUpload = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>);
const IconZap = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>);
const IconTarget = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>);
const IconPlay = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>);
const IconShare = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>);
const IconMusic = () => (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="15.5" r="2.5"/><path d="M8 17V5l13-2v12"/></svg>);
const IconSports = () => (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 000 20 14.5 14.5 0 000-20"/><path d="M2 12h20"/></svg>);
const IconHorse = () => (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3s-4 2-6 2-4-2-6-2-6 2-6 2"/><path d="M4 3v10c0 4 4 8 8 8s8-4 8-8V3"/><path d="M12 21v-4"/><path d="M8 17l-2 4M16 17l2 4"/></svg>);
const IconDrone = () => (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="10" width="8" height="6" rx="1"/><path d="M4 6a2 2 0 104 0 2 2 0 10-4 0M16 6a2 2 0 104 0 2 2 0 10-4 0"/><path d="M6 8v2h2M18 8v2h-2"/><path d="M10 16v2M14 16v2"/></svg>);

const FEATURES = [
  { icon: <IconTarget />, title: 'AI Object Tracking', desc: 'Google Gemini Vision AI precisely tracks any target in your video frame by frame — people, athletes, or animals.', color: '#8b5cf6' },
  { icon: <IconZap />, title: 'One-Click Follow Cam', desc: 'Automatically generate a follow-cam edit with a single click. Auto-crop, stabilize, and reframe — all handled by AI.', color: '#3b82f6' },
  { icon: <IconShare />, title: 'Export & Share Instantly', desc: 'Download your edited video or upload directly to YouTube Shorts in seconds.', color: '#06b6d4' },
];

const STEPS = [
  { num: '01', icon: <IconUpload />, title: 'Upload Video', desc: 'Paste a YouTube URL or upload a video file directly from your device.' },
  { num: '02', icon: <IconTarget />, title: 'Select Target', desc: 'Click on the subject you want to follow in the video frame — a person, player, or any moving object.' },
  { num: '03', icon: <IconCamera />, title: 'AI Follow Cam', desc: 'Gemini AI tracks the target frame-by-frame and generates a smooth, professional follow-cam edit.' },
  { num: '04', icon: <IconPlay />, title: 'Review & Share', desc: 'Compare the result with the original and export to YouTube Shorts or download.' },
];

const USE_CASES = [
  {
    icon: <IconMusic />,
    title: 'K-POP Fancam Generator',
    desc: 'Turn a full-stage K-POP performance into individual member fancams. Just click the member you want — AI handles the rest.',
    gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
    tag: 'Most Popular',
    preview: '🎤',
  },
  {
    icon: <IconSports />,
    title: 'Sports Follow Cam',
    desc: 'Track a specific player on the field — soccer, basketball, baseball, or any sport. Generate highlight reels focused on one athlete.',
    gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    tag: 'New',
    preview: '⚽',
  },
  {
    icon: <IconHorse />,
    title: 'Horse Racing Follow',
    desc: 'Lock onto a specific horse and jockey throughout the race. Perfect for race analysis, replays, and highlight clips.',
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    tag: 'Coming Soon',
    preview: '🏇',
  },
  {
    icon: <IconDrone />,
    title: 'Drone & Surveillance',
    desc: 'Automatically track moving objects in aerial or surveillance footage. Ideal for security review and patrol monitoring.',
    gradient: 'linear-gradient(135deg, #10b981, #3b82f6)',
    tag: 'Planned',
    preview: '📡',
  },
];

function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function RevealSection({ children, className = '', delay = 0, direction = 'up' }) {
  const [ref, visible] = useReveal(0.1);
  const transform = direction === 'up' ? 'translateY(50px)' : direction === 'left' ? 'translateX(-40px)' : 'translateX(40px)';
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translate(0)' : transform, transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s` }}>
      {children}
    </div>
  );
}

export default function Landing() {
  const particlesRef = useRef(null);
  const showcaseRef = useRef(null);
  const [activeCase, setActiveCase] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('.hero__badge', { opacity: 0, y: 30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.6 })
        .fromTo('.hero__title-line', { opacity: 0, y: 60, rotateX: 40 }, { opacity: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.15 }, '-=0.3')
        .fromTo('.hero__subtitle', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
        .fromTo('.hero__actions', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.2')
        .fromTo('.hero__visual', { opacity: 0, scale: 0.85, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 1 }, '-=0.5');
      gsap.utils.toArray('.orb').forEach((orb, i) => {
        gsap.to(orb, { y: 'random(-40, 40)', x: 'random(-30, 30)', rotation: 'random(-15, 15)', duration: 'random(4, 7)', repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.5 });
      });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const canvas = particlesRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const particles = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 60; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.5 + 0.5, dx: (Math.random() - 0.5) * 0.4, dy: (Math.random() - 0.5) * 0.4, opacity: Math.random() * 0.4 + 0.1 });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(139, 92, 246, ${p.opacity})`; ctx.fill(); p.x += p.dx; p.y += p.dy; if (p.x < 0 || p.x > canvas.width) p.dx *= -1; if (p.y < 0 || p.y > canvas.height) p.dy *= -1; });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCase(prev => (prev + 1) % USE_CASES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollToCase = (idx) => {
    setActiveCase(idx);
    if (showcaseRef.current) {
      const card = showcaseRef.current.children[idx];
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  };

  return (
    <div className="landing">
      <section className="hero">
        <canvas className="hero__particles" ref={particlesRef} />
        <div className="hero__bg-orbs"><div className="orb orb--1" /><div className="orb orb--2" /><div className="orb orb--3" /></div>
        <div className="hero__content">
          <div className="hero__badge"><span className="hero__badge-dot" />Powered by Google Gemini AI</div>
          <h1 className="hero__title">
            <span className="hero__title-line">Automate Video Editing</span>
            <span className="hero__title-line hero__title-line--accent">with <span className="gradient-text">AI Follow Cam</span></span>
          </h1>
          <p className="hero__subtitle">Upload any video, click a target, and let AI automatically<br />track, crop, and generate a professional follow-cam edit.</p>
          <div className="hero__actions">
            <Link to="/converter" className="btn btn-primary btn-lg">Get Started <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></Link>
            <a href="#use-cases" className="btn btn-secondary btn-lg">See Use Cases</a>
          </div>
        </div>
        <div className="hero__visual">
          <div className="hero__mockup">
            <div className="hero__mockup-header"><div className="hero__mockup-dots"><span /><span /><span /></div><span className="hero__mockup-title">FollowCam AI — Video Editor</span></div>
            <div className="hero__mockup-body">
              <div className="hero__mockup-left"><div className="hero__mockup-video-placeholder"><div className="hero__mockup-scan-line" /><div className="hero__mockup-target-box" /><span>Source Video</span></div></div>
              <div className="hero__mockup-arrow"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--accent-purple)'}}><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
              <div className="hero__mockup-right"><div className="hero__mockup-result-placeholder"><span>AI Follow Cam</span></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Use Cases Horizontal Showcase ── */}
      <section className="section" id="use-cases">
        <div className="section__container">
          <RevealSection>
            <div className="section__header">
              <span className="section__label gradient-text">Use Cases</span>
              <h2 className="section__title">One Engine, Endless Possibilities</h2>
              <p className="section__desc">AI-powered Follow Cam editing works across industries — from entertainment to sports to surveillance.</p>
            </div>
          </RevealSection>

          <RevealSection delay={0.15}>
            <div className="showcase-wrapper">
              <div className="showcase-scroll" ref={showcaseRef}>
                {USE_CASES.map((uc, i) => (
                  <div
                    key={i}
                    className={`showcase-card glass ${activeCase === i ? 'showcase-card--active' : ''}`}
                    onClick={() => scrollToCase(i)}
                  >
                    <div className="showcase-card__tag" style={{ background: uc.gradient }}>{uc.tag}</div>
                    <div className="showcase-card__preview" style={{ background: uc.gradient }}>
                      <span className="showcase-card__emoji">{uc.preview}</span>
                      <div className="showcase-card__icon">{uc.icon}</div>
                    </div>
                    <div className="showcase-card__body">
                      <h3>{uc.title}</h3>
                      <p>{uc.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="showcase-dots">
                {USE_CASES.map((_, i) => (
                  <button key={i} className={`showcase-dot ${activeCase === i ? 'showcase-dot--active' : ''}`} onClick={() => scrollToCase(i)} />
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      <section className="section" id="features">
        <div className="section__container">
          <RevealSection><div className="section__header"><span className="section__label gradient-text">Features</span><h2 className="section__title">Why FollowCam AI?</h2><p className="section__desc">Powered by Gemini Vision AI, anyone can create professional-grade follow-cam edits in minutes.</p></div></RevealSection>
          <div className="features-grid">{FEATURES.map((f, i) => (<RevealSection key={i} delay={i * 0.12}><div className="feature-card glass"><div className="feature-card__icon" style={{ color: f.color, borderColor: `${f.color}33`, background: `${f.color}11` }}>{f.icon}</div><h3 className="feature-card__title">{f.title}</h3><p className="feature-card__desc">{f.desc}</p></div></RevealSection>))}</div>
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="section__container">
          <RevealSection><div className="section__header"><span className="section__label gradient-text">How It Works</span><h2 className="section__title">4 Simple Steps to a Follow Cam</h2><p className="section__desc">No complex editing software required — just a few clicks and AI does the rest.</p></div></RevealSection>
          <div className="steps">{STEPS.map((s, i) => (<RevealSection key={i} delay={i * 0.1} direction="left"><div className="step-item"><div className="step-item__num">{s.num}</div><div className="step-item__content glass"><div className="step-item__icon">{s.icon}</div><h3>{s.title}</h3><p>{s.desc}</p></div></div></RevealSection>))}</div>
        </div>
      </section>

      <section className="section"><div className="section__container"><RevealSection><div className="cta"><div className="cta__bg" /><div className="cta__content"><h2>Ready to Automate Your Video Editing?</h2><p>All you need is a video URL or file. Start for free — no editing skills required.</p><Link to="/converter" className="btn btn-primary btn-lg">Start Editing <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></Link></div></div></RevealSection></div></section>

      <footer className="footer"><div className="footer__inner"><span className="footer__logo gradient-text">FollowCam AI</span><span className="footer__copy">Built with Google Gemini &middot; Hackathon 2026</span></div></footer>

      <style>{`
        .landing { overflow-x: hidden; }
        .hero { position: relative; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 120px 24px 80px; text-align: center; overflow: hidden; }
        .hero__particles { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
        .hero__bg-orbs { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
        .orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.35; }
        .orb--1 { width: 500px; height: 500px; background: radial-gradient(circle, var(--accent-purple), transparent 70%); top: -10%; left: -10%; }
        .orb--2 { width: 400px; height: 400px; background: radial-gradient(circle, var(--accent-blue), transparent 70%); top: 30%; right: -5%; }
        .orb--3 { width: 350px; height: 350px; background: radial-gradient(circle, var(--accent-cyan), transparent 70%); bottom: -5%; left: 30%; }
        .hero__content { position: relative; z-index: 1; max-width: 800px; }
        .hero__badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; border-radius: var(--radius-full); background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.25); font-size: 0.8rem; font-weight: 500; color: var(--accent-purple); margin-bottom: 28px; }
        .hero__badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-green); animation: pulse-glow 2s infinite; }
        .hero__title { font-family: var(--font-display); font-size: clamp(2.4rem, 6vw, 4.2rem); font-weight: 800; line-height: 1.15; letter-spacing: -0.02em; margin-bottom: 20px; perspective: 600px; }
        .hero__title-line { display: block; }
        .hero__title-line--accent { margin-top: 4px; }
        .hero__subtitle { font-size: 1.15rem; color: var(--text-secondary); line-height: 1.7; margin-bottom: 36px; }
        .hero__actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .hero__visual { position: relative; z-index: 1; margin-top: 60px; width: 100%; max-width: 720px; }
        .hero__mockup { background: rgba(10, 10, 20, 0.8); border: 1px solid var(--border-light); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-lg), var(--shadow-glow); }
        .hero__mockup-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--border-subtle); }
        .hero__mockup-dots { display: flex; gap: 6px; }
        .hero__mockup-dots span { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.12); }
        .hero__mockup-dots span:first-child { background: #ff5f57; }
        .hero__mockup-dots span:nth-child(2) { background: #ffbd2e; }
        .hero__mockup-dots span:nth-child(3) { background: #28c840; }
        .hero__mockup-title { font-size: 0.75rem; color: var(--text-muted); }
        .hero__mockup-body { display: flex; align-items: center; gap: 20px; padding: 32px 24px; justify-content: center; }
        .hero__mockup-left { flex: 2; }
        .hero__mockup-video-placeholder { position: relative; aspect-ratio: 16/9; background: linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.08)); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; overflow: hidden; color: var(--text-muted); font-size: 0.85rem; }
        .hero__mockup-scan-line { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--gradient-primary); animation: scanLine 3s linear infinite; }
        @keyframes scanLine { 0% { top: 0; opacity: 1; } 100% { top: 100%; opacity: 0.3; } }
        .hero__mockup-target-box { position: absolute; width: 30%; height: 60%; border: 2px solid var(--accent-cyan); border-radius: 4px; box-shadow: 0 0 12px rgba(6, 182, 212, 0.3); animation: float 4s ease-in-out infinite; }
        .hero__mockup-arrow { flex-shrink: 0; display: flex; align-items: center; }
        .hero__mockup-right { flex: 1; }
        .hero__mockup-result-placeholder { aspect-ratio: 9/16; max-height: 180px; background: linear-gradient(135deg, rgba(236,72,153,0.08), rgba(139,92,246,0.08)); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.85rem; }

        /* ── Showcase horizontal scroll ── */
        .showcase-wrapper { position: relative; }
        .showcase-scroll {
          display: flex;
          gap: 24px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          padding: 8px 4px 24px;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .showcase-scroll::-webkit-scrollbar { display: none; }
        .showcase-card {
          flex: 0 0 320px;
          scroll-snap-align: center;
          cursor: pointer;
          transition: all 0.4s var(--ease-out-expo);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .showcase-card:hover { transform: translateY(-8px); border-color: var(--border-accent); box-shadow: var(--shadow-glow); }
        .showcase-card--active { border-color: var(--accent-purple); box-shadow: 0 0 30px rgba(139, 92, 246, 0.25); transform: translateY(-4px); }
        .showcase-card__tag {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 2;
          padding: 4px 12px;
          border-radius: var(--radius-full);
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #fff;
        }
        .showcase-card__preview {
          position: relative;
          height: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .showcase-card__emoji {
          font-size: 3.5rem;
          position: relative;
          z-index: 1;
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
        }
        .showcase-card__icon {
          position: absolute;
          bottom: 12px;
          right: 12px;
          opacity: 0.25;
          color: #fff;
        }
        .showcase-card__body {
          padding: 24px;
          flex: 1;
        }
        .showcase-card__body h3 {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .showcase-card__body p {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.65;
        }
        .showcase-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
        }
        .showcase-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--border-light);
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
        }
        .showcase-dot--active {
          background: var(--accent-purple);
          box-shadow: 0 0 8px rgba(139, 92, 246, 0.5);
          transform: scale(1.2);
        }

        .section { padding: 100px 24px; position: relative; }
        .section__container { max-width: 1100px; margin: 0 auto; }
        .section__header { text-align: center; margin-bottom: 60px; }
        .section__label { font-family: var(--font-display); font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 12px; }
        .section__title { font-family: var(--font-display); font-size: clamp(1.8rem, 4vw, 2.6rem); font-weight: 800; letter-spacing: -0.02em; margin-bottom: 12px; }
        .section__desc { font-size: 1.05rem; color: var(--text-secondary); max-width: 600px; margin: 0 auto; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (max-width: 768px) { .features-grid { grid-template-columns: 1fr; } }
        .feature-card { padding: 36px 28px; transition: all 0.35s var(--ease-out-expo); }
        .feature-card:hover { transform: translateY(-6px); border-color: var(--border-accent); box-shadow: var(--shadow-glow); }
        .feature-card__icon { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); border: 1px solid; margin-bottom: 20px; }
        .feature-card__title { font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; margin-bottom: 8px; }
        .feature-card__desc { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.65; }
        .steps { display: flex; flex-direction: column; gap: 20px; max-width: 700px; margin: 0 auto; }
        .step-item { display: flex; align-items: flex-start; gap: 20px; }
        .step-item__num { font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; color: var(--accent-purple); opacity: 0.5; min-width: 40px; text-align: center; padding-top: 20px; }
        .step-item__content { flex: 1; padding: 24px; transition: all 0.3s ease; }
        .step-item__content:hover { border-color: var(--border-accent); box-shadow: var(--shadow-glow); }
        .step-item__icon { color: var(--accent-cyan); margin-bottom: 12px; }
        .step-item__content h3 { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; margin-bottom: 6px; }
        .step-item__content p { font-size: 0.9rem; color: var(--text-secondary); }
        .cta { position: relative; border-radius: var(--radius-xl); overflow: hidden; padding: 80px 40px; text-align: center; }
        .cta__bg { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1), rgba(6,182,212,0.08)); border: 1px solid var(--border-accent); border-radius: inherit; }
        .cta__content { position: relative; z-index: 1; }
        .cta__content h2 { font-family: var(--font-display); font-size: clamp(1.6rem, 3.5vw, 2.2rem); font-weight: 800; margin-bottom: 12px; }
        .cta__content p { color: var(--text-secondary); margin-bottom: 28px; font-size: 1.05rem; }
        .footer { padding: 40px 24px; border-top: 1px solid var(--border-subtle); }
        .footer__inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
        .footer__logo { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; }
        .footer__copy { font-size: 0.8rem; color: var(--text-muted); }
        @media (max-width: 768px) {
          .hero { padding: 100px 20px 60px; }
          .hero__title { font-size: 2rem; }
          .hero__mockup-body { flex-direction: column; }
          .hero__mockup-arrow { transform: rotate(90deg); }
          .section { padding: 60px 20px; }
          .footer__inner { flex-direction: column; gap: 12px; text-align: center; }
          .showcase-card { flex: 0 0 280px; }
        }
      `}</style>
    </div>
  );
}
