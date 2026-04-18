// ---------- Calls chart ----------
function CallsChart({ data, dates }) {
  const max = Math.max(...data);
  const w = 880, h = 200, p = 32;
  const sx = (i) => p + (i/(data.length-1))*(w-2*p);
  const sy = (v) => h - p - (v/max)*(h-2*p);
  const linePath = data.map((v,i) => `${i===0?'M':'L'}${sx(i)},${sy(v)}`).join(' ');
  const areaPath = `${linePath} L${sx(data.length-1)},${h-p} L${sx(0)},${h-p} Z`;
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:8}}>
        <div style={{fontWeight:600,fontSize:14}}>Calls completed</div>
        <div style={{fontFamily:'JetBrains Mono',fontSize:11,color:'var(--muted)'}}>per day</div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%',height:220}}>
        <defs>
          <linearGradient id="area-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.58 0.19 255)" stopOpacity="0.28"/>
            <stop offset="100%" stopColor="oklch(0.58 0.19 255)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[0,1,2,Math.ceil(max/2),max].map((y,i) => (
          <g key={i}>
            <line x1={p} y1={sy(y)} x2={w-p} y2={sy(y)} stroke="#E8E6DF" strokeWidth="1" strokeDasharray="2 3"/>
            <text x={p-8} y={sy(y)+4} fontSize="10" fill="#9A998F" textAnchor="end" fontFamily="JetBrains Mono">{y}</text>
          </g>
        ))}
        <path d={areaPath} fill="url(#area-grad)"/>
        <path d={linePath} fill="none" stroke="oklch(0.58 0.19 255)" strokeWidth="2"/>
        {data.map((v,i) => <circle key={i} cx={sx(i)} cy={sy(v)} r="2.5" fill="oklch(0.58 0.19 255)"/>)}
        {dates.map((d, idx) => {
          const i = Math.round((idx/(dates.length-1))*(data.length-1));
          return <text key={d} x={sx(i)} y={h-10} fontSize="10" fill="#9A998F" textAnchor="middle" fontFamily="JetBrains Mono">{d}</text>;
        })}
      </svg>
    </div>
  );
}

// ---------- Investor dashboard ----------
function InvestorDashboard() {
  const [mode, setMode] = useState('Inbound');
  const data = [2,2,2,2,4,4,3,2,1,1,3,5,6,4,2,3,2,5,2,4,3,2,3,4,1,3,1,2,2,2,5,5];
  const dates = ['Mar 19','Mar 23','Mar 27','Mar 31','Apr 4','Apr 8','Apr 12','Apr 16'];
  return (
    <section>
      <div className="container">
        <div className="eyebrow">Voice agent dashboard</div>
        <h2 className="section-title">79 inbound calls. 91% positive. Average 42 seconds.</h2>
        <p className="section-sub">Thirty-day slice of VA Home Offer's voice agent activity. The agent handles every inbound call that would otherwise go to voicemail — and triggers actions in the CRM automatically.</p>
        <div className="dash" style={{marginTop:40}}>
          <div className="dash-head">
            <div>
              <div className="dash-title">AI Agents · Dashboard & Logs</div>
              <div className="dash-sub">Mar 19 → Apr 18, 2026 · All agents</div>
            </div>
            <div className="dash-controls">
              <button className={`chip ${mode==='Inbound'?'active':''}`} onClick={()=>setMode('Inbound')}>Inbound</button>
              <button className={`chip ${mode==='Outbound'?'active':''}`} onClick={()=>setMode('Outbound')}>Outbound</button>
            </div>
          </div>
          <div className="dash-stats">
            <div className="dash-stat">
              <div className="label">Total calls</div>
              <div className="value">{mode==='Inbound'?'79':'142'}</div>
              <div className="sub">↑ {mode==='Inbound'?'12':'28'} vs. previous 30 days</div>
            </div>
            <div className="dash-stat">
              <div className="label">Actions triggered</div>
              <div className="value">{mode==='Inbound'?'9':'31'}</div>
              <div className="sub">Appts booked, leads updated, notes written</div>
            </div>
            <div className="dash-stat">
              <div className="label">Sentiment</div>
              <div className="value">{mode==='Inbound'?'91%':'88%'} <span style={{fontSize:14,color:'var(--good)'}}>positive</span></div>
              <div className="sub">Scored on every completed call</div>
            </div>
          </div>
          <div className="chart-wrap">
            <CallsChart data={data} dates={dates}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:14}}>
            <div className="dash-stat" style={{background:'var(--surface)'}}>
              <div className="label">Total duration</div>
              <div className="value">54 <span style={{fontSize:16,color:'var(--muted)',fontWeight:500}}>mins</span></div>
            </div>
            <div className="dash-stat" style={{background:'var(--surface)'}}>
              <div className="label">Average call duration</div>
              <div className="value">0.7 <span style={{fontSize:16,color:'var(--muted)',fontWeight:500}}>mins</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Agent dashboard ----------
function AgentDashboard() {
  const [mode, setMode] = useState('Inbound');
  const data = [1,2,3,1,2,3,2,4,3,2,1,2,5,4,3,2,3,4,2,3,2,1,3,4,5,3,2,4,3,2,4,5];
  const dates = ['Mar 20','Mar 24','Mar 28','Apr 1','Apr 5','Apr 9','Apr 13','Apr 15'];
  return (
    <section>
      <div className="container">
        <div className="eyebrow">Voice agent dashboard</div>
        <h2 className="section-title">94 inbound calls handled. 88% positive. Zero missed opportunities.</h2>
        <p className="section-sub">Thirty-day activity snapshot from Apex Realty Group's AI voice agent. Every inbound call from buyer inquiries, listing ads, and sign calls — handled automatically.</p>
        <div className="dash" style={{marginTop:40}}>
          <div className="dash-head">
            <div>
              <div className="dash-title">AI Agents · Dashboard & Logs</div>
              <div className="dash-sub">Mar 16 → Apr 15, 2026 · All agents</div>
            </div>
            <div className="dash-controls">
              <button className={`chip ${mode==='Inbound'?'active':''}`} onClick={()=>setMode('Inbound')}>Inbound</button>
              <button className={`chip ${mode==='Outbound'?'active':''}`} onClick={()=>setMode('Outbound')}>Outbound</button>
            </div>
          </div>
          <div className="dash-stats">
            <div className="dash-stat">
              <div className="label">Total calls</div>
              <div className="value">{mode==='Inbound'?'94':'186'}</div>
              <div className="sub">↑ {mode==='Inbound'?'21':'44'} vs. previous 30 days</div>
            </div>
            <div className="dash-stat">
              <div className="label">Showings scheduled</div>
              <div className="value">{mode==='Inbound'?'14':'38'}</div>
              <div className="sub">Consultations & showings booked</div>
            </div>
            <div className="dash-stat">
              <div className="label">Sentiment</div>
              <div className="value">{mode==='Inbound'?'88%':'85%'} <span style={{fontSize:14,color:'var(--good)'}}>positive</span></div>
              <div className="sub">Scored on every completed call</div>
            </div>
          </div>
          <div className="chart-wrap">
            <CallsChart data={data} dates={dates}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:14}}>
            <div className="dash-stat" style={{background:'var(--surface)'}}>
              <div className="label">Total duration</div>
              <div className="value">67 <span style={{fontSize:16,color:'var(--muted)',fontWeight:500}}>mins</span></div>
            </div>
            <div className="dash-stat" style={{background:'var(--surface)'}}>
              <div className="label">Avg call duration</div>
              <div className="value">0.71 <span style={{fontSize:16,color:'var(--muted)',fontWeight:500}}>mins</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Investor pipeline ----------
function InvestorPipeline() {
  const columns = [
    { name:'New lead', count:214, value:'$0', cards:[
      {n:'Dorian Long', tags:['Cold'],icons:[1,0,3,0]},
      {n:'Sherlene Martin', tags:['Cold'],icons:[1,0,2,0]},
      {n:'Jason Gusler', tags:['Texting'],icons:[1,0,2,0]},
    ]},
    { name:'Made contact', count:1110, value:'$0', highlight:true, cards:[
      {n:'Kenneth Drumright', tags:['Texting'],icons:[1,0,2,1]},
      {n:'Timothy Cherry', tags:['Cold Call'],icons:[1,0,3,0]},
      {n:'Karim Amrani', tags:['Texting'],icons:[1,0,1,0]},
    ]},
    { name:'Attention', count:216, value:'$4.14M', cards:[
      {n:'Charles Rowley', v:'$20,000', tags:['Texting'],icons:[1,1,2,0]},
      {n:'Thad Copeland', v:'$20,000', tags:['Texting'],icons:[1,1,2,0]},
      {n:'George Reeves', v:'$20,000', tags:['Texting'],icons:[1,1,2,0]},
    ]},
    { name:'Offer', count:170, value:'$3.40M', highlight:true, cards:[
      {n:'Xavier Noe', v:'$20,000', tags:['Cold Call'],icons:[1,1,2,1]},
      {n:'Robert Blanchard', v:'$20,000', tags:['Cold Call'],icons:[1,1,1,1]},
      {n:'David Wiebking', v:'$20,000', tags:['Booked Apr 20'],icons:[1,1,2,1], booked:true},
    ]},
    { name:'Under contract', count:21, value:'$420K', cards:[
      {n:'Haofeng Ji', v:'$20,000', tags:['Contract sent'],icons:[1,1,3,1]},
      {n:'Bruce Andrews', v:'$20,000', tags:['Signed'],icons:[1,1,2,1]},
    ]},
  ];
  return <PipelineView title="1,521 investor opportunities. One AI working them." sub="Every card represents a motivated seller the AI is texting, calling, or waiting on. Warm Follow advances them automatically and flags when a human should step in." columns={columns} oppLabel="1,521 opportunities"/>;
}

// ---------- Agent pipeline ----------
function AgentPipeline() {
  const columns = [
    { name:'New inquiry', count:342, value:'$0', cards:[
      {n:'Samantha Ortiz', tags:['Zillow'],icons:[1,0,2,0]},
      {n:'Kevin Marsh', tags:['Facebook'],icons:[1,0,1,0]},
      {n:'Linda Park', tags:['Realtor.com'],icons:[1,0,3,0]},
    ]},
    { name:'Responded', count:618, value:'$0', highlight:true, cards:[
      {n:'Marcus Rivera', tags:['Texting'],icons:[1,0,3,1]},
      {n:'Dana Ellis', tags:['Emailed'],icons:[1,0,2,0]},
      {n:'Tom Nguyen', tags:['Texting'],icons:[1,0,1,1]},
    ]},
    { name:'Warm', count:180, value:'~$1.8M', cards:[
      {n:'Priya Nair', v:'~$10K', tags:['Texting'],icons:[1,1,2,0]},
      {n:'Josh Kim', v:'~$10K', tags:['Texting'],icons:[1,1,3,0]},
      {n:'Carla Dean', v:'~$10K', tags:['Texting'],icons:[1,1,2,0]},
    ]},
    { name:'Consultation', count:74, value:'~$740K', highlight:true, cards:[
      {n:'Marcus Rivera', v:'~$10K', tags:['Booked Mar 19'],icons:[1,1,2,1], booked:true},
      {n:'Sandra Ho', v:'~$10K', tags:['Showing Sat'],icons:[1,1,2,1], booked:true},
      {n:'Ray Torres', v:'~$10K', tags:['Call Fri'],icons:[1,1,1,1]},
    ]},
    { name:'Under contract', count:26, value:'~$260K', cards:[
      {n:'Priya Nair', v:'~$10K', tags:['Offer accepted'],icons:[1,1,3,1]},
      {n:'Josh Kim', v:'~$10K', tags:['Closing May 3'],icons:[1,1,2,1]},
    ]},
  ];
  return <PipelineView title="1,240 buyer inquiries. One AI qualifying them." sub="Every card is a buyer lead the AI is actively following up. Warm Follow moves them through stages automatically — agent only steps in for showings and offers." columns={columns} oppLabel="1,240 leads"/>;
}

function PipelineView({ title, sub, columns, oppLabel }) {
  return (
    <section>
      <div className="container">
        <div className="eyebrow">Pipeline</div>
        <h2 className="section-title">{title}</h2>
        <p className="section-sub">{sub}</p>
        <div className="pipeline" style={{marginTop:40}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{fontWeight:600,fontSize:15}}>Lead pipeline</div>
              <div className="pill ai">{oppLabel}</div>
            </div>
          </div>
          <div className="pipe-cols">
            {columns.map((c,i) => (
              <div key={i} className="pipe-col" style={c.highlight?{boxShadow:'inset 0 0 0 1.5px var(--accent-2)'}:{}}>
                <div className="pipe-head">
                  <div>
                    <div className="pipe-name">{c.name}</div>
                    <div className="pipe-count">{c.count.toLocaleString()} opps</div>
                  </div>
                  <div className="pipe-value">{c.value}</div>
                </div>
                <div className="pipe-cards">
                  {c.cards.map((card,j) => (
                    <div key={j} className="lead-card">
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                        <div className="lead-name">{card.n}</div>
                        <div className="avatar av-ai" style={{width:22,height:22,fontSize:10}}>W</div>
                      </div>
                      <div className="lead-meta">
                        <span>{card.tags[0]}</span>
                        {card.v && <span className="lead-value">{card.v}</span>}
                      </div>
                      <div className="lead-icons">
                        <Icon.Phone style={{width:14,height:14,opacity:card.icons[0]?1:0.25,color:card.icons[0]?'var(--accent)':'inherit'}}/>
                        <Icon.Msg style={{width:14,height:14,opacity:card.icons[1]?1:0.25,color:card.icons[1]?'var(--accent)':'inherit'}}/>
                        <span style={{fontFamily:'JetBrains Mono',fontSize:10,background:'var(--accent)',color:'#fff',padding:'0 5px',borderRadius:4,opacity:card.icons[2]?1:0.3}}>{card.icons[2]||0}</span>
                        <Icon.Check style={{width:14,height:14,opacity:card.icons[3]?1:0.25,color:card.icons[3]?'var(--good)':'inherit'}}/>
                        {card.booked && <Icon.Cal style={{width:14,height:14,color:'var(--accent-ink)'}}/>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, {
  InvestorDashboard, AgentDashboard,
  InvestorPipeline, AgentPipeline,
});
