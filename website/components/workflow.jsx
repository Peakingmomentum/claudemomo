// ---------- Workflow node primitives ----------
function WFNode({ kind, label, sub, branch }) {
  const mark = { sms:'S', wait:'⏱', cond:'?', action:'⚡', end:'·', call:'☎' }[kind] || '•';
  return (
    <div className={`wf-node ${kind} ${branch?'branch':''}`}>
      <div className="nk">{mark}</div>
      <div>
        <div className="wf-node-label">{label}</div>
        {sub && <div className="wf-node-sub">{sub}</div>}
      </div>
    </div>
  );
}
const WFConn = () => <div className="wf-connector"/>;

// ---------- Automation section ----------
function AutomationSection({ caseStudy }) {
  const isAgent = caseStudy === 'agent';
  return (
    <section>
      <div className="container">
        <div className="eyebrow">Automation</div>
        <h2 className="section-title">The follow-up campaign that works while you sleep.</h2>
        <p className="section-sub">
          {isAgent
            ? 'A branching cadence built inside GHL. It runs AI-generated SMS, waits, watches for replies, branches into voice or scheduling, and either books a consultation or recycles the lead for the next month.'
            : 'A branching cadence built inside GHL. It runs AI-generated SMS, waits, watches for replies, branches into voice or internal notifications, and either books or recycles every lead in your pipeline.'}
        </p>
        <div className="workflow" style={{marginTop:40}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,color:'rgba(255,255,255,0.6)'}}>
            <div style={{fontFamily:'JetBrains Mono',fontSize:11,letterSpacing:'0.08em',textTransform:'uppercase'}}>
              {isAgent ? 'Buyer Re-Engagement · v3 · enrolled 892' : 'Re-Activation Campaign · v4 · enrolled 1,108'}
            </div>
            <div style={{display:'flex',gap:8}}>
              <span className="pill" style={{background:'rgba(255,255,255,0.06)',color:'#fff',border:'1px solid rgba(255,255,255,0.1)'}}>Live</span>
              <span className="pill" style={{background:'rgba(255,255,255,0.06)',color:'#fff',border:'1px solid rgba(255,255,255,0.1)'}}>14 steps</span>
            </div>
          </div>
          <div className="wf-spine" style={{maxWidth:720,margin:'0 auto'}}>
            <WFNode kind="wait" label={isAgent ? 'Trigger: no response in 7 days' : 'Trigger: cold lead'} sub={isAgent ? 'Buyer inquiry gone quiet' : 'No response in 14 days'}/>
            <WFConn/>
            <WFNode kind="sms" label="SMS 1 · AI-generated" sub={isAgent ? 'Relevant market update + hook' : 'Property-specific hook'}/>
            <WFConn/>
            <WFNode kind="wait" label="Wait 48h"/>
            <WFConn/>
            <div className="wf-grid">
              <WFNode kind="cond" label="Contact replied?" branch/>
              <WFNode kind="cond" label="Timed out 48h" branch/>
            </div>
            <WFConn/>
            <div className="wf-grid">
              <WFNode kind="action" label="Notify agent" sub="Push notification"/>
              <WFNode kind="sms" label="SMS 2 · follow-up" sub="New angle, shorter"/>
            </div>
            <WFConn/>
            <div className="wf-grid">
              <WFNode kind="action" label={isAgent ? 'Tag · Warm buyer' : 'Tag · Hot lead'}/>
              <WFNode kind="wait" label="Wait 72h"/>
            </div>
            <WFConn/>
            <div className="wf-grid">
              <WFNode kind="cond" label="Contact replied?" branch/>
              <WFNode kind="cond" label="Timed out 72h" branch/>
            </div>
            <WFConn/>
            <div className="wf-grid">
              <WFNode kind="call" label="AI voice call" sub={isAgent ? 'Qualify & book consultation' : 'Qualify & book appointment'}/>
              <WFNode kind="sms" label="SMS 3 · final"/>
            </div>
            <WFConn/>
            <div className="wf-grid">
              <WFNode kind="action" label={isAgent ? 'Book consultation' : 'Book appointment'} sub="→ calendar"/>
              <WFNode kind="end" label="Recycle to drip"/>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Investor results table ----------
function InvestorResults() {
  const rows = [
    {n:1,   name:'Xavier Noe',       av:1, t:'Apr 17, 2026 · 12:30 PM (EDT)'},
    {n:2,   name:'Robert Blanchard', av:2, t:'Apr 17, 2026 · 12:00 PM (EDT)'},
    {n:3,   name:'Doria Roane',      av:3, t:'Apr 17, 2026 · 02:00 PM (EDT)'},
    {n:4,   name:'MR/Ben',           av:1, t:'Apr 17, 2026 · 01:30 PM (EDT)'},
    {n:5,   name:'Haofeng Ji',       av:4, t:'Apr 16, 2026 · 03:00 PM (EDT)'},
    {n:6,   name:'Jesse Griffin',    av:5, t:'Apr 15, 2026 · 06:00 PM (EDT)'},
    {n:7,   name:'David Wiebking',   av:2, t:'Apr 20, 2026 · 12:00 PM (EDT)'},
    {n:8,   name:'Lori Callwood',    av:4, t:'Apr 14, 2026 · 06:00 PM (EDT)'},
    {n:9,   name:'Jason Bonney',     av:1, t:'Apr 13, 2026 · 12:00 PM (EDT)'},
    {n:188, name:'Willie Pittman',   av:2, t:'Dec 08, 2025 · 02:00 PM (EST)'},
    {n:189, name:'David Sosa',       av:3, t:'Dec 08, 2025 · 12:00 PM (EST)'},
    {n:190, name:'Michael Barragan', av:1, t:'Dec 08, 2025 · 03:00 PM (EST)'},
  ];
  return (
    <section>
      <div className="container">
        <div className="eyebrow">Results</div>
        <h2 className="section-title">Every appointment booked, in order.</h2>
        <p className="section-sub">Paginated view from the live calendar. 193 total confirmed appointments from Dec 8, 2025 to today. Each one arrived via AI text or AI voice agent — zero human outreach.</p>
        <ResultsTable rows={rows} total="193 total results"/>
      </div>
    </section>
  );
}

// ---------- Agent results table ----------
function AgentResults() {
  const rows = [
    {n:1,   name:'Marcus Rivera',    av:3, t:'Apr 15, 2026 · 05:30 PM (EDT)'},
    {n:2,   name:'Sandra Ho',        av:4, t:'Apr 13, 2026 · 10:00 AM (EDT)'},
    {n:3,   name:'Ray Torres',       av:2, t:'Apr 12, 2026 · 04:00 PM (EDT)'},
    {n:4,   name:'Priya Nair',       av:1, t:'Apr 10, 2026 · 11:00 AM (EDT)'},
    {n:5,   name:'Josh Kim',         av:5, t:'Apr 09, 2026 · 02:00 PM (EDT)'},
    {n:6,   name:'Carla Dean',       av:3, t:'Apr 08, 2026 · 06:00 PM (EDT)'},
    {n:7,   name:'Samantha Ortiz',   av:2, t:'Apr 07, 2026 · 03:00 PM (EDT)'},
    {n:8,   name:'Kevin Marsh',      av:1, t:'Apr 06, 2026 · 10:30 AM (EDT)'},
    {n:140, name:'Dana Ellis',       av:4, t:'Jan 16, 2026 · 11:00 AM (EST)'},
    {n:141, name:'Tom Nguyen',       av:5, t:'Jan 15, 2026 · 03:00 PM (EST)'},
    {n:142, name:'Linda Park',       av:3, t:'Jan 15, 2026 · 01:30 PM (EST)'},
  ];
  return (
    <section>
      <div className="container">
        <div className="eyebrow">Results</div>
        <h2 className="section-title">147 buyer consultations. All booked by AI.</h2>
        <p className="section-sub">Paginated view from the live calendar. 147 total confirmed consultations from Jan 15 to Apr 15, 2026. Every one arrived via AI text or AI voice agent — agent only showed up to the meeting.</p>
        <ResultsTable rows={rows} total="147 total results"/>
      </div>
    </section>
  );
}

function ResultsTable({ rows, total }) {
  return (
    <div className="table-wrap" style={{marginTop:40}}>
      <div className="table-head">
        <span>#</span>
        <span>Name</span>
        <span className="col-contact">Contact</span>
        <span>Status</span>
        <span>Appointment time</span>
      </div>
      {rows.map(r => (
        <div className="table-row" key={r.n}>
          <span className="num">{r.n}</span>
          <span className="name">
            <Icon.Cal style={{color:'var(--muted)',width:14,height:14}}/>
            {r.name}
          </span>
          <span className="contact">
            <span className={`av-xs av-${r.av}`}>{r.name.charAt(0)}</span>
            {r.name}
          </span>
          <span><span className="status-pill confirmed">Confirmed</span></span>
          <span className="time-col">{r.t}</span>
        </div>
      ))}
      <div className="table-foot">
        <span>Showing sample · {total}</span>
        <span>Page 1 · 2 · 3 · … · 15</span>
      </div>
    </div>
  );
}

Object.assign(window, {
  AutomationSection,
  InvestorResults, AgentResults,
});
