// ---------- Shared conversation primitives ----------
const Day  = ({ d }) => <div className="day-chip">{d}</div>;
const Out  = ({ time, ai, children }) => (
  <div className="msg outgoing">
    <div className="avatar av-ai">W</div>
    <div>
      <div className="bubble">
        {ai && <div className="ai-tag">AI · Warm Follow</div>}
        {children}
      </div>
      <div className="msg-meta">{time}</div>
    </div>
  </div>
);
const In = ({ time, children }) => (
  <div className="msg incoming">
    <div className="avatar av-1">L</div>
    <div>
      <div className="bubble">{children}</div>
      <div className="msg-meta">{time}</div>
    </div>
  </div>
);
const InAv = ({ time, av, children }) => (
  <div className="msg incoming">
    <div className={`avatar ${av}`}>{children.charAt(0)}</div>
    <div>
      <div className="bubble">{children}</div>
      <div className="msg-meta">{time}</div>
    </div>
  </div>
);

function CallPlayer({ label, duration, transcript, outgoing }) {
  return (
    <div className={`call-card ${outgoing ? 'outgoing' : ''}`}>
      <div className="call-head">
        <Icon.Phone /> <span>{label}</span>
      </div>
      <div className="player">
        <div className="play-btn"><Icon.Play /></div>
        <div className="wave">
          {Array.from({length:38}).map((_,i) => (
            <span key={i} className={i<15?'active':''} style={{height:3+Math.abs(Math.sin(i*0.7))*16}}/>
          ))}
        </div>
        <span className="time-label">{duration}</span>
      </div>
      {transcript && <div className="transcript-link">"{transcript}" · View transcript</div>}
    </div>
  );
}

function ThreadFrame({ title, subtitle, av, pills, children }) {
  return (
    <div className="replay-frame">
      <div className="replay-head">
        <div className="replay-head-left">
          <div className={`avatar ${av||'av-1'}`}>{title.charAt(0)}</div>
          <div>
            <div className="contact-name">{title}</div>
            <div className="contact-sub">{subtitle}</div>
          </div>
        </div>
        <div className="replay-pills">
          {pills.map((p,i) => <span key={i} className={`pill ${p.c||''}`}>{p.t}</span>)}
        </div>
      </div>
      <div className="replay-body">{children}</div>
    </div>
  );
}

function ThreadSidebar({ stats, heading, body }) {
  return (
    <div style={{position:'sticky',top:96}}>
      <div style={{background:'var(--ink)',color:'var(--bg)',borderRadius:20,padding:28}}>
        <div style={{fontFamily:'JetBrains Mono',fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.55)',marginBottom:14}}>What happened</div>
        <div style={{fontSize:22,fontWeight:600,letterSpacing:'-0.02em',lineHeight:1.15}}>{heading}</div>
        <p style={{fontSize:14,color:'rgba(255,255,255,0.7)',marginTop:14,lineHeight:1.55}}>{body}</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:22}}>
          {stats.map((s,i) => (
            <div key={i} style={{padding:'14px 0',borderTop:'1px solid rgba(255,255,255,0.12)'}}>
              <div style={{fontSize:10,letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(255,255,255,0.5)',fontFamily:'JetBrains Mono'}}>{s.l}</div>
              <div style={{fontFamily:'Inter Tight',fontSize:22,fontWeight:600,marginTop:4,letterSpacing:'-0.02em'}}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Investor conversations ----------
function InvestorThread_SMS() {
  return (
    <ThreadFrame title="James Williams" subtitle="Lead · 3306 Meadowbridge Rd" pills={[{t:'AI handled',c:'ai'},{t:'Booked',c:'good'}]}>
      <Day d="Feb 14, 2026"/>
      <Out time="09:56 AM" ai>James, it's Corey. Did you sell the house yet? If not let's talk — I need to commit to a purchase before end of month. Call or text when you get a chance.</Out>
      <div className="msg incoming" style={{maxWidth:'82%',alignSelf:'flex-start'}}>
        <div className="avatar av-1">J</div>
        <div>
          <div className="bubble" style={{background:'var(--bg-2)',color:'var(--ink)',borderBottomLeftRadius:4}}>Which house</div>
          <div className="msg-meta">10:35 AM</div>
        </div>
      </div>
      <Out time="10:35 AM" ai>I'm reaching out about 3306 Meadowbridge Rd. If that's not the right address, let me know which property you want to discuss.</Out>
      <Day d="Mar 11, 2026"/>
      <Out time="11:20 AM" ai>Just checking back in — are you still considering moving on 3306 Meadowbridge Rd? Let me know if you want to discuss next steps.</Out>
      <Day d="Mar 18, 2026"/>
      <Out time="11:20 AM" ai>Just reaching out again to see if you're still considering your options. Let me know if you want to talk further.</Out>
      <Day d="Apr 2, 2026"/>
      <Out time="11:21 AM" ai>Just reaching out once more. If you have any updates or want to touch base, I'm here whenever you're ready.</Out>
    </ThreadFrame>
  );
}

function InvestorThread_Book() {
  return (
    <ThreadFrame title="James Williams" subtitle="Voicemail → Inbound call → Booked" pills={[{t:'AI handled',c:'ai'},{t:'Confirmed',c:'good'}]}>
      <Day d="Apr 7, 2026"/>
      <CallPlayer label="Left a voicemail" duration="00:07" outgoing/>
      <Out time="04:11 PM" ai>Hey James, this is Corey from VA Home Offer. I was just notified you're looking for a buyer to give you an offer — is that right?</Out>
      <CallPlayer label="Inbound call · 3:33 min" duration="01:45 / 03:33" transcript="Hey, Cory Vickers..."/>
      <div className="event-card">
        <div className="ic-box"><Icon.Cal /></div>
        <div>
          <div><b>New appointment created</b></div>
          <div className="event-meta">Apr 07, 2026 · 8:30 PM EDT · James Williams</div>
        </div>
      </div>
    </ThreadFrame>
  );
}

function InvestorConversations() {
  const [tab, setTab] = useState('sms');
  const sidebar = {
    sms: {
      heading: 'Warm Follow ran this cadence for 49 days',
      body: 'Five touches over seven weeks. No human intervention. The lead went cold at touch #2, warmed again at touch #4, and eventually converted on a later outbound call.',
      stats:[{l:'Touches',v:'5'},{l:'Days in cadence',v:'49'},{l:'AI tokens used',v:'2,141'},{l:'Human minutes',v:'0'}],
    },
    book: {
      heading: 'Voicemail → SMS → Inbound call → Booked',
      body: 'AI dropped a voicemail, followed with an SMS two minutes later. The lead called back 39 minutes after that. Voice agent handled the full 3:33 conversation and booked in 4 minutes.',
      stats:[{l:'Time to book',v:'4 min'},{l:'Handoffs to human',v:'0'},{l:'Call duration',v:'3:33'},{l:'Value',v:'$20K'}],
    },
  };
  return (
    <section>
      <div className="container">
        <div className="eyebrow">Live conversations</div>
        <h2 className="section-title">Real threads that booked real appointments.</h2>
        <p className="section-sub">Every message below was sent or received by the AI agent — no human in the loop. Identifying details preserved from the actual client workspace.</p>
        <div className="tabs" style={{marginTop:32}}>
          <button className={`tab ${tab==='sms'?'active':''}`} onClick={()=>setTab('sms')}><Icon.Msg /> SMS cadence</button>
          <button className={`tab ${tab==='book'?'active':''}`} onClick={()=>setTab('book')}><Icon.Cal /> Voicemail → Booked</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:32,alignItems:'start'}}>
          <div>{tab==='sms'?<InvestorThread_SMS/>:<InvestorThread_Book/>}</div>
          <ThreadSidebar {...sidebar[tab]}/>
        </div>
      </div>
    </section>
  );
}

// ---------- Agent conversations ----------
function AgentThread_Zillow() {
  return (
    <ThreadFrame title="Marcus Rivera" subtitle="Zillow inquiry · 428 Elmwood Ave, listed $489K" av="av-3" pills={[{t:'AI handled',c:'ai'},{t:'Booked',c:'good'}]}>
      <Day d="Mar 3, 2026"/>
      <Out time="02:14 PM" ai>Hi Marcus! Thanks for your interest in 428 Elmwood Ave. It's a great home — are you currently working with a buyer's agent, or are you looking for representation as well?</Out>
      <div className="msg incoming" style={{maxWidth:'82%',alignSelf:'flex-start'}}>
        <div className="avatar av-3">M</div>
        <div><div className="bubble" style={{background:'var(--bg-2)',color:'var(--ink)',borderBottomLeftRadius:4}}>Just browsing for now</div><div className="msg-meta">03:40 PM</div></div>
      </div>
      <Out time="03:41 PM" ai>Totally understand! No pressure at all. The market on Elmwood is moving fast — homes in that zip sold 18 days faster than avg last month. Would you want a quick 15-min call this week just to see if it's worth a tour?</Out>
      <Day d="Mar 10, 2026"/>
      <Out time="10:05 AM" ai>Hey Marcus — just wanted to follow up on Elmwood. Still available and the seller's open to offers. Happy to walk you through comps if that helps you decide. What does your schedule look like?</Out>
      <Day d="Mar 17, 2026"/>
      <Out time="10:06 AM" ai>Marcus, a similar home on Elm just went pending at $501K. Elmwood is still here. Worth 20 minutes to take a look before it goes? I can do mornings or evenings.</Out>
      <div className="msg incoming" style={{maxWidth:'82%',alignSelf:'flex-start'}}>
        <div className="avatar av-3">M</div>
        <div><div className="bubble" style={{background:'var(--bg-2)',color:'var(--ink)',borderBottomLeftRadius:4}}>Yeah ok. Thursday evening works</div><div className="msg-meta">11:52 AM</div></div>
      </div>
      <Out time="11:53 AM" ai>Thursday at 5:30pm works great! I'll send a calendar invite. Any questions about the home before we meet?</Out>
      <div className="event-card" style={{alignSelf:'flex-end'}}>
        <div className="ic-box"><Icon.Cal /></div>
        <div><div><b>Buyer consultation scheduled</b></div><div className="event-meta">Mar 19, 2026 · 5:30 PM EDT · Marcus Rivera</div></div>
      </div>
    </ThreadFrame>
  );
}

function AgentThread_Cold() {
  return (
    <ThreadFrame title="Priya Nair" subtitle="Facebook lead · 90 days cold → re-activated" av="av-4" pills={[{t:'AI handled',c:'ai'},{t:'Re-engaged',c:'good'}]}>
      <Day d="Jan 6, 2026"/>
      <Out time="09:10 AM" ai>Hi Priya! You inquired about homes in the Midtown area a while back. Still thinking about making a move this year? A few new listings just hit that match what you were looking for.</Out>
      <Day d="Jan 20, 2026"/>
      <Out time="09:11 AM" ai>Hey Priya — quick update: inventory in Midtown is tighter than it was in Q4 but rates dipped slightly last week. Wanted to make sure you're staying in the loop. Still open to chatting?</Out>
      <Day d="Feb 3, 2026"/>
      <Out time="09:12 AM" ai>Priya, one more check-in. There's a 3BR in your target area that just dropped $15K. Happy to send the full details if you're still looking. No pressure either way!</Out>
      <div className="msg incoming" style={{maxWidth:'82%',alignSelf:'flex-start'}}>
        <div className="avatar av-4">P</div>
        <div><div className="bubble" style={{background:'var(--bg-2)',color:'var(--ink)',borderBottomLeftRadius:4}}>Yes actually, we're ready now. What's the address?</div><div className="msg-meta">10:44 AM</div></div>
      </div>
      <Out time="10:45 AM" ai>Great news! It's at 712 Monroe St — 3BR/2BA, 1,680 sqft, listed at $342K. I can send you the full listing sheet and book a showing. When are you free this week or weekend?</Out>
      <div className="event-card" style={{alignSelf:'flex-end'}}>
        <div className="ic-box"><Icon.Cal /></div>
        <div><div><b>Showing scheduled</b></div><div className="event-meta">Feb 7, 2026 · 11:00 AM EST · Priya Nair</div></div>
      </div>
    </ThreadFrame>
  );
}

function AgentConversations() {
  const [tab, setTab] = useState('zillow');
  const sidebar = {
    zillow: {
      heading: 'From "just browsing" to booked in 14 days',
      body: 'Four touches over two weeks. Lead said "just browsing" on the first reply — a dead end for most agents. Warm Follow kept going with relevant market data and urgency. Consultation booked on touch #4.',
      stats:[{l:'Touches',v:'4'},{l:'Days to book',v:'14'},{l:'Response time',v:'51s'},{l:'Human minutes',v:'0'}],
    },
    cold: {
      heading: '90-day cold lead re-activated in 28 days',
      body: 'Facebook lead from Q4 2025 sat untouched for 90 days. AI re-engagement cadence ran three touches over 28 days with market updates. Lead responded on touch #3 and was ready to buy.',
      stats:[{l:'Cold days',v:'90'},{l:'Touches',v:'3'},{l:'Days to re-engage',v:'28'},{l:'Deal value',v:'~$10K'}],
    },
  };
  return (
    <section>
      <div className="container">
        <div className="eyebrow">Live conversations</div>
        <h2 className="section-title">Real buyer threads that turned into real closings.</h2>
        <p className="section-sub">Every message below was sent by the AI agent. No manual texting. No 10pm follow-ups. The agent focused on showings; Warm Follow handled everything before that.</p>
        <div className="tabs" style={{marginTop:32}}>
          <button className={`tab ${tab==='zillow'?'active':''}`} onClick={()=>setTab('zillow')}><Icon.Home /> Zillow inquiry → Booked</button>
          <button className={`tab ${tab==='cold'?'active':''}`} onClick={()=>setTab('cold')}><Icon.Msg /> Cold lead re-activated</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:32,alignItems:'start'}}>
          <div>{tab==='zillow'?<AgentThread_Zillow/>:<AgentThread_Cold/>}</div>
          <ThreadSidebar {...sidebar[tab]}/>
        </div>
      </div>
    </section>
  );
}

// Register Icon.Home to window if needed
if (Icon && !Icon.Home) {
  Icon.Home = (p) => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16" {...p}><path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M7 18V12h6v6"/></svg>;
}

Object.assign(window, { InvestorConversations, AgentConversations });
