import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';

const IconCamera = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>);
const IconUpload = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>);
const IconZap = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>);
const IconTarget = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>);
const IconPlay = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>);
const IconShare = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>);
const IconTrophy = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 19.24 7 20v2h10v-2c0-.76-.85-1.25-2.03-1.79A1.07 1.07 0 0114 17v-2.34"/><path d="M18 2H6v7a6 6 0 1012 0V2z"/></svg>);
const IconScissors = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>);
const IconCpu = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>);

const FEATURES = [
  { icon: <IconTarget />, title: 'AI 멤버 추적', desc: 'Google Gemini Vision AI가 영상 속 특정 멤버를 프레임 단위로 정밀 추적합니다.', color: '#8b5cf6' },
  { icon: <IconZap />, title: '원클릭 직캠 생성', desc: '클릭 한 번으로 멤버별 세로형 직캠을 자동 생성합니다. 크롭, 안정화까지 자동 처리.', color: '#3b82f6' },
  { icon: <IconShare />, title: 'YouTube Shorts 등록', desc: '생성된 직캠을 바로 YouTube Shorts로 업로드할 수 있습니다.', color: '#06b6d4' },
];

const STEPS = [
  { num: '01', icon: <IconUpload />, title: '영상 업로드', desc: 'YouTube URL을 붙여넣거나 영상 파일을 직접 업로드하세요.' },
  { num: '02', icon: <IconTarget />, title: '멤버 선택', desc: '영상 프레임에서 추적할 멤버를 클릭으로 간편하게 지정합니다.' },
  { num: '03', icon: <IconCamera />, title: 'AI 직캠 생성', desc: 'Gemini AI가 멤버를 프레임별로 추적하여 고품질 직캠을 생성합니다.' },
  { num: '04', icon: <IconPlay />, title: '결과 확인 & 공유', desc: '원본 대비 직캠을 확인하고 YouTube Shorts로 바로 올릴 수 있습니다.' },
];

const FUTURE = [
  { icon: <IconTrophy />, title: '스포츠 하이라이트', desc: '축구, 농구 등 스포츠 경기 영상에서 자동으로 하이라이트를 생성합니다.', tag: 'Coming Soon' },
  { icon: <IconScissors />, title: '자동 컷편집 & 크롭', desc: '영상 종류에 관계없이 AI가 최적의 컷편집과 자동 크롭을 수행합니다.', tag: 'Planned' },
  { icon: <IconCpu />, title: '영상 편집 자동화', desc: '하나의 영상으로 컷편집, 크롭, 팬캠, 편집을 모두 자동화하는 시스템입니다.', tag: 'Vision' },
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

  return (
    <div className="landing">
      <section className="hero">
        <canvas className="hero__particles" ref={particlesRef} />
        <div className="hero__bg-orbs"><div className="orb orb--1" /><div className="orb orb--2" /><div className="orb orb--3" /></div>
        <div className="hero__content">
          <div className="hero__badge"><span className="hero__badge-dot" />Powered by Google Gemini AI</div>
          <h1 className="hero__title">
            <span className="hero__title-line">K-POP 무대 영상 하나로</span>
            <span className="hero__title-line hero__title-line--accent"><span className="gradient-text">AI 직캠</span>을 만듭니다</span>
          </h1>
          <p className="hero__subtitle">전체 무대 직캠에서 원하는 멤버를 클릭하면,<br />AI가 자동으로 추적하여 개인 직캠을 생성합니다.</p>
          <div className="hero__actions">
            <Link to="/converter" className="btn btn-primary btn-lg">직캠 만들러 가기 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></Link>
            <a href="#how-it-works" className="btn btn-secondary btn-lg">사용 방법 보기</a>
          </div>
        </div>
        <div className="hero__visual">
          <div className="hero__mockup">
            <div className="hero__mockup-header"><div className="hero__mockup-dots"><span /><span /><span /></div><span className="hero__mockup-title">FanCam AI Converter</span></div>
            <div className="hero__mockup-body">
              <div className="hero__mockup-left"><div className="hero__mockup-video-placeholder"><div className="hero__mockup-scan-line" /><div className="hero__mockup-target-box" /><span>원본 영상</span></div></div>
              <div className="hero__mockup-arrow"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--accent-purple)'}}><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
              <div className="hero__mockup-right"><div className="hero__mockup-result-placeholder"><span>AI 직캠</span></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="section__container">
          <RevealSection><div className="section__header"><span className="section__label gradient-text">Features</span><h2 className="section__title">왜 FanCam AI인가요?</h2><p className="section__desc">AI 기술로 누구나 쉽게 프로 수준의 직캠을 만들 수 있습니다.</p></div></RevealSection>
          <div className="features-grid">{FEATURES.map((f, i) => (<RevealSection key={i} delay={i * 0.12}><div className="feature-card glass"><div className="feature-card__icon" style={{ color: f.color, borderColor: `${f.color}33`, background: `${f.color}11` }}>{f.icon}</div><h3 className="feature-card__title">{f.title}</h3><p className="feature-card__desc">{f.desc}</p></div></RevealSection>))}</div>
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="section__container">
          <RevealSection><div className="section__header"><span className="section__label gradient-text">How It Works</span><h2 className="section__title">4단계로 완성되는 직캠</h2><p className="section__desc">복잡한 영상 편집 없이 몇 번의 클릭으로 직캠을 생성하세요.</p></div></RevealSection>
          <div className="steps">{STEPS.map((s, i) => (<RevealSection key={i} delay={i * 0.1} direction="left"><div className="step-item"><div className="step-item__num">{s.num}</div><div className="step-item__content glass"><div className="step-item__icon">{s.icon}</div><h3>{s.title}</h3><p>{s.desc}</p></div></div></RevealSection>))}</div>
        </div>
      </section>

      <section className="section" id="future">
        <div className="section__container">
          <RevealSection><div className="section__header"><span className="section__label gradient-text">Roadmap</span><h2 className="section__title">더 넓은 가능성</h2><p className="section__desc">직캠을 넘어, 모든 영상의 AI 자동 편집을 목표로 합니다.</p></div></RevealSection>
          <div className="future-grid">{FUTURE.map((f, i) => (<RevealSection key={i} delay={i * 0.12}><div className="future-card glass"><div className="future-card__tag">{f.tag}</div><div className="future-card__icon">{f.icon}</div><h3>{f.title}</h3><p>{f.desc}</p></div></RevealSection>))}</div>
        </div>
      </section>

      <section className="section"><div className="section__container"><RevealSection><div className="cta"><div className="cta__bg" /><div className="cta__content"><h2>지금 바로 AI 직캠을 만들어보세요</h2><p>K-POP 무대 영상 URL만 있으면 됩니다. 무료로 시작하세요.</p><Link to="/converter" className="btn btn-primary btn-lg">시작하기 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></Link></div></div></RevealSection></div></section>

      <footer className="footer"><div className="footer__inner"><span className="footer__logo gradient-text">FanCam AI</span><span className="footer__copy">Built with Google Gemini &middot; Hackathon 2026</span></div></footer>

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
        .future-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (max-width: 768px) { .future-grid { grid-template-columns: 1fr; } }
        .future-card { padding: 32px 24px; text-align: center; transition: all 0.35s var(--ease-out-expo); }
        .future-card:hover { transform: translateY(-4px); border-color: var(--border-accent); }
        .future-card__tag { display: inline-block; padding: 4px 12px; border-radius: var(--radius-full); font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(139, 92, 246, 0.12); color: var(--accent-purple); border: 1px solid rgba(139, 92, 246, 0.2); margin-bottom: 20px; }
        .future-card__icon { color: var(--accent-cyan); margin-bottom: 16px; }
        .future-card h3 { font-family: var(--font-display); font-weight: 700; margin-bottom: 8px; }
        .future-card p { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; }
        .cta { position: relative; border-radius: var(--radius-xl); overflow: hidden; padding: 80px 40px; text-align: center; }
        .cta__bg { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1), rgba(6,182,212,0.08)); border: 1px solid var(--border-accent); border-radius: inherit; }
        .cta__content { position: relative; z-index: 1; }
        .cta__content h2 { font-family: var(--font-display); font-size: clamp(1.6rem, 3.5vw, 2.2rem); font-weight: 800; margin-bottom: 12px; }
        .cta__content p { color: var(--text-secondary); margin-bottom: 28px; font-size: 1.05rem; }
        .footer { padding: 40px 24px; border-top: 1px solid var(--border-subtle); }
        .footer__inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
        .footer__logo { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; }
        .footer__copy { font-size: 0.8rem; color: var(--text-muted); }
        @media (max-width: 768px) { .hero { padding: 100px 20px 60px; } .hero__title { font-size: 2rem; } .hero__mockup-body { flex-direction: column; } .hero__mockup-arrow { transform: rotate(90deg); } .section { padding: 60px 20px; } .footer__inner { flex-direction: column; gap: 12px; text-align: center; } }
      `}</style>
    </div>
  );
}
