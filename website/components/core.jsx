const { useState, useEffect, useRef } = React;

// ---------- Icons ----------
const Icon = {
  Sparkle: (p) => <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" {...p}><path d="M10 2l1.8 5.2L17 9l-5.2 1.8L10 16l-1.8-5.2L3 9l5.2-1.8L10 2z"/></svg>,
  Phone:   (p) => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16" {...p}><path d="M5 3h3l2 4-2 1a10 10 0 005 5l1-2 4 2v3a2 2 0 01-2 2A14 14 0 013 5a2 2 0 012-2z"/></svg>,
  Msg:     (p) => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16" {...p}><path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H8l-4 3v-3a2 2 0 01-1-2V5z"/></svg>,
  Cal:     (p) => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16" {...p}><rect x="3" y="5" width="14" height="12" rx="2"/><path d="M3 8h14M7 3v4M13 3v4"/></svg>,
  Play:    (p) => <svg viewBox="0 0 14 14" fill="currentColor" width="10" height="10" {...p}><path d="M3 2l9 5-9 5V2z"/></svg>,
  Voicemail:(p)=> <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14" {...p}><circle cx="5" cy="12" r="3"/><circle cx="15" cy="12" r="3"/><path d="M5 12h10"/></svg>,
  Bolt:    (p) => <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20" {...p}><path d="M11 2L3 12h5l-1 6 8-10h-5l1-6z"/></svg>,
  Arrow:   (p) => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14" {...p}><path d="M4 10h12m0 0l-5-5m5 5l-5 5"/></svg>,
  Check:   (p) => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" {...p}><path d="M4 10l4 4 8-8"/></svg>,
  Settings:(p) => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14" {...p}><circle cx="10" cy="10" r="3"/><path d="M10 2v3M10 15v3M18 10h-3M5 10H2M15.5 4.5l-2 2M6.5 13.5l-2 2M15.5 15.5l-2-2M6.5 6.5l-2-2"/></svg>,
  Home:    (p) => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16" {...p}><path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M7 18V12h6v6"/></svg>,
  Users:   (p) => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16" {...p}><circle cx="8" cy="7" r="3"/><path d="M2 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M13 5a3 3 0 110 4M18 17a6 6 0 00-5-5.9"/></svg>,
};

// ---------- Nav ----------
function Nav({ onNav }) {
  const links = ['Case Studies', 'How it works', 'Pricing'];
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <a href="#top" className="brand" onClick={e=>{e.preventDefault();onNav('top');}}>
          <div className="brand-mark">W</div>
          <span>Warm Follow</span>
        </a>
        <div className="nav-links">
          {links.map(l => (
            <button key={l} className="nav-link"
              onClick={() => onNav(l.toLowerCase().replace(/ /g,'-'))}>
              {l}
            </button>
          ))}
        </div>
        <div className="nav-right">
          <button className="btn btn-ghost" style={{fontSize:13.5}}>Sign in</button>
          <button className="btn btn-primary" onClick={() => onNav('demo')}>
            Book live demo <Icon.Arrow />
          </button>
        </div>
      </div>
    </nav>
  );
}

// ---------- Hero ----------
function Hero({ onNav }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2400);
    return () => clearInterval(id);
  }, []);

  const cards = [
    { style:{top:0,left:0,animationDelay:'0s'}, content: (
      <div>
        <div className="fc-badge ai">✦ AI · Warm Follow</div>
        <div className="fc-msg">Hey James — still looking to move on 3306 Meadowbridge Rd? Let me know when you want to talk.</div>
        <div style={{fontSize:11,color:'var(--muted)',marginTop:8,fontFamily:'JetBrains Mono'}}>47s after lead came in</div>
      </div>
    )},
    { style:{top:8,right:0,animationDelay:'.15s'}, content: (
      <div>
        <div className="fc-badge booked">✓ Booked</div>
        <div className="fc-stat">193</div>
        <div className="fc-stat-label">appointments this quarter</div>
      </div>
    )},
    { style:{bottom:60,left:20,animationDelay:'.3s'}, content: (
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div className="avatar av-ai" style={{width:36,height:36,fontSize:14}}>W</div>
        <div>
          <div style={{fontWeight:600,fontSize:13}}>Inbound call — answered by AI</div>
          <div style={{fontSize:11,color:'var(--muted)',fontFamily:'JetBrains Mono',marginTop:2}}>3:33 · Sentiment: Positive</div>
        </div>
      </div>
    )},
    { style:{bottom:0,right:16,animationDelay:'.45s'}, content: (
      <div>
        <div className="fc-badge ai">Live pipeline</div>
        <div style={{display:'flex',gap:16,marginTop:8}}>
          {['$4.1M','1,521','$100K+'].map((v,i)=>(
            <div key={i}>
              <div style={{fontFamily:'Inter Tight',fontSize:22,fontWeight:600,letterSpacing:'-0.03em'}}>{v}</div>
              <div style={{fontSize:10,color:'var(--muted)',fontFamily:'JetBrains Mono'}}>
                {['attention','opps','closed'][i]}
              </div>
            </div>
          ))}
        </div>
      </div>
    )},
  ];

  return (
    <section className="hero" id="top">
      <div className="container">
        <div className="hero-grid">
          <div>
            <div className="hero-badge">
              <span className="hero-badge-dot"/>
              Live system · Real results · Real estate
            </div>
            <h1 className="hero-title">
              Your leads deserve<br/>
              <em>a faster reply</em><br/>
              than you can give.
            </h1>
            <p className="hero-sub">
              Warm Follow is the AI agent that texts, calls, and follows up with every lead — inbound and outbound — until they book. Real estate investors and agents use it to generate six figures while their phones stay silent.
            </p>
            <div className="hero-cta">
              <button className="btn btn-accent btn-lg" onClick={() => onNav('demo')}>
                Book a live demo <Icon.Arrow />
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => onNav('case-studies')}>
                See the proof
              </button>
            </div>
            <div className="hero-proof">
              <span className="hero-proof-dot"/>
              <span>193+ appointments booked</span>
              <span style={{color:'var(--line-2)'}}>·</span>
              <span>$100K+ closed</span>
              <span style={{color:'var(--line-2)'}}>·</span>
              <span>47s avg response</span>
              <span style={{color:'var(--line-2)'}}>·</span>
              <span>Zero human follow-up</span>
            </div>
          </div>
          <div className="hero-visual">
            {cards.map((c,i) => (
              <div key={i} className="float-card" style={c.style}>{c.content}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Proof strip ----------
function ProofStrip() {
  const items = [
    { num: '193+', label: 'Appointments booked by AI' },
    { num: '$100K+', label: 'Wholesale assignments closed' },
    { num: '40/mo', label: 'Appointments per month' },
    { num: '47s', label: 'Average AI response time' },
    { num: '1,521', label: 'Active leads in pipeline' },
    { num: '91%', label: 'Positive sentiment on calls' },
    { num: '0 hrs', label: 'Human follow-up hours' },
    { num: '132', label: 'Days fully automated' },
  ];
  return (
    <div className="proof-strip">
      <div className="proof-strip-inner">
        {items.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div className="proof-divider"/>}
            <div className="proof-item">
              <div className="proof-num">{item.num}</div>
              <div className="proof-label">{item.label}</div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ---------- Case study selector ----------
function CaseStudySelector({ active, onChange }) {
  const tabs = [
    { id: 'investor', label: 'Real Estate Investor', meta: 'VA Home Offer · Dec 2025 – Apr 2026', icon: '🏠' },
    { id: 'agent',    label: 'Real Estate Agent',    meta: 'Apex Realty Group · Jan – Apr 2026',  icon: '🤝' },
  ];
  return (
    <div className="cs-selector" id="case-studies">
      <div className="cs-selector-inner">
        <div style={{fontSize:12,color:'var(--muted)',fontFamily:'JetBrains Mono',letterSpacing:'0.08em',textTransform:'uppercase',marginRight:24,flexShrink:0}}>Case studies</div>
        {tabs.map(t => (
          <button key={t.id} className={`cs-tab ${active===t.id?'active':''}`} onClick={() => onChange(t.id)}>
            <div className="cs-tab-icon">{t.icon}</div>
            <div>
              <div>{t.label}</div>
              <div className="cs-tab-meta">{t.meta}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Icon, Nav, Hero, ProofStrip, CaseStudySelector });
