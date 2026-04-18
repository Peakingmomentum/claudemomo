// ---------- Stats bento for investor ----------
function InvestorStats() {
  return (
    <section style={{paddingTop:48,paddingBottom:48}}>
      <div className="container">
        <div className="bento">
          <div className="tile dark col-3">
            <div className="tile-label">Appointments booked</div>
            <div className="tile-value">193</div>
            <div className="tile-foot">Dec 8, 2025 → Apr 18, 2026</div>
          </div>
          <div className="tile col-3">
            <div className="tile-label">Closed revenue</div>
            <div className="tile-value">$100<span className="unit">K+</span></div>
            <div className="tile-foot">Wholesale assignment sales</div>
          </div>
          <div className="tile accent-tile col-3">
            <div className="tile-label">Monthly pace</div>
            <div className="tile-value">40<span className="unit">/mo</span></div>
            <div className="tile-foot">Appointments per month</div>
          </div>
          <div className="tile col-3">
            <div className="tile-label">Sentiment</div>
            <div className="tile-value">91<span className="unit">%</span></div>
            <div className="tile-foot">Positive on scored calls</div>
          </div>
          <div className="tile col-4">
            <div className="tile-label">Human follow-up hours</div>
            <div className="tile-value">0<span className="unit"> hrs</span></div>
            <div className="tile-foot">100% handled by AI text + voice</div>
          </div>
          <div className="tile col-4">
            <div className="tile-label">Active opportunities</div>
            <div className="tile-value">1,521</div>
            <div className="tile-foot">Leads worked simultaneously</div>
          </div>
          <div className="tile col-4">
            <div className="tile-label">Avg AI response</div>
            <div className="tile-value">47<span className="unit">s</span></div>
            <div className="tile-foot">From inbound to first reply</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Stats bento for agent ----------
function AgentStats() {
  return (
    <section style={{paddingTop:48,paddingBottom:48}}>
      <div className="container">
        <div className="bento">
          <div className="tile dark col-3">
            <div className="tile-label">Consultations booked</div>
            <div className="tile-value">147</div>
            <div className="tile-foot">Jan 15, 2026 → Apr 15, 2026</div>
          </div>
          <div className="tile col-3">
            <div className="tile-label">GCI attributed</div>
            <div className="tile-value">$142<span className="unit">K+</span></div>
            <div className="tile-foot">Commissions from AI-booked clients</div>
          </div>
          <div className="tile accent-tile col-3">
            <div className="tile-label">Show rate</div>
            <div className="tile-value">92<span className="unit">%</span></div>
            <div className="tile-foot">vs. 67% industry avg</div>
          </div>
          <div className="tile col-3">
            <div className="tile-label">Leads in pipeline</div>
            <div className="tile-value">1,240</div>
            <div className="tile-foot">Zillow, Realtor.com, Facebook</div>
          </div>
          <div className="tile col-4">
            <div className="tile-label">Lead spend saved</div>
            <div className="tile-value">3<span className="unit">x</span></div>
            <div className="tile-foot">More consults from same ad budget</div>
          </div>
          <div className="tile col-4">
            <div className="tile-label">Avg AI response</div>
            <div className="tile-value">51<span className="unit">s</span></div>
            <div className="tile-foot">vs. 2+ hour industry average</div>
          </div>
          <div className="tile col-4">
            <div className="tile-label">Human follow-up hours</div>
            <div className="tile-value">0<span className="unit"> hrs</span></div>
            <div className="tile-foot">Agent focuses on closings only</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- How it works (shared) ----------
function HowItWorks() {
  return (
    <section id="how-it-works">
      <div className="container">
        <div className="eyebrow">How it works</div>
        <h2 className="section-title">One agent. Four channels. Running 24/7.</h2>
        <p className="section-sub">Warm Follow listens on every channel your leads use, responds instantly in your voice, and hands off only when there's a confirmed appointment waiting for you.</p>
        <div className="how-grid" style={{marginTop:40}}>
          <div className="how-card">
            <div className="how-num">01</div>
            <div className="how-icon" style={{color:'var(--accent-ink)'}}><Icon.Msg /></div>
            <h3 className="how-title">Inbound text & reply</h3>
            <p className="how-body">When a lead texts back — at any hour — the AI reads the thread, references the property or listing, and responds in your tone. No canned lines. No delays.</p>
            <div className="how-foot">Median response · 47 seconds <Icon.Arrow /></div>
          </div>
          <div className="how-card">
            <div className="how-num">02</div>
            <div className="how-icon" style={{color:'var(--good)'}}><Icon.Phone /></div>
            <h3 className="how-title">Inbound voice agent</h3>
            <p className="how-body">A live voice AI picks up calls your team misses, qualifies the lead, and books the appointment directly into your calendar. Full transcript attached. Sentiment scored.</p>
            <div className="how-foot">79 calls handled · 91% positive <Icon.Arrow /></div>
          </div>
          <div className="how-card">
            <div className="how-num">03</div>
            <div className="how-icon" style={{color:'var(--accent-ink)'}}><Icon.Bolt /></div>
            <h3 className="how-title">Outbound cadences</h3>
            <p className="how-body">Multi-week SMS + voice sequences nudge cold and aged leads back into conversation. Branches on reply, time-of-day, and intent — runs for months without you touching it.</p>
            <div className="how-foot">Up to 11 touches · zero manual work <Icon.Arrow /></div>
          </div>
          <div className="how-card">
            <div className="how-num">04</div>
            <div className="how-icon" style={{color:'var(--accent-ink)'}}><Icon.Voicemail /></div>
            <h3 className="how-title">Voicemail + SMS drops</h3>
            <p className="how-body">Leaves a short, human-sounding voicemail and follows up by text the same minute. Catches sellers and buyers who ignore calls but always read texts.</p>
            <div className="how-foot">Paired drop + immediate SMS <Icon.Arrow /></div>
          </div>
          <div className="how-card">
            <div className="how-num">05</div>
            <div className="how-icon" style={{color:'var(--accent-ink)'}}><Icon.Cal /></div>
            <h3 className="how-title">Calendar booking</h3>
            <p className="how-body">Once intent is confirmed, AI books the slot, sends reminders, and writes the record into your pipeline — no copy-paste, no dropped handoffs, no missed appointments.</p>
            <div className="how-foot">193+ appointments booked to date <Icon.Arrow /></div>
          </div>
          <div className="how-card">
            <div className="how-num">06</div>
            <div className="how-icon" style={{color:'var(--muted)'}}><Icon.Settings /></div>
            <h3 className="how-title">Built on your CRM</h3>
            <p className="how-body">Drops into GHL and fires through your numbers, your brand, your cadences. Your team keeps the records; AI does all the reaching out. Ready in under a week.</p>
            <div className="how-foot">GHL-native · live in 7 days <Icon.Arrow /></div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Problem section — investor ----------
function InvestorProblem() {
  return (
    <section>
      <div className="container">
        <div className="eyebrow">The problem</div>
        <h2 className="section-title">Real estate investors lose deals in the follow-up — not the pitch.</h2>
        <p className="section-sub">Most cash-buyer leads go cold because no one reaches back fast enough — or at all. Tire-kickers eat your hours. Hot sellers slip to whoever calls them first. Manual follow-up doesn't scale past one person.</p>
        <div className="problem-grid">
          <div className="problem-card before">
            <div className="problem-label">Before Warm Follow</div>
            <div className="problem-h">Phone tag with ghosts</div>
            <ul className="problem-list">
              <li>Leads sit for hours while you're in a contract or on another call</li>
              <li>You chase tire-kickers who never had real intent</li>
              <li>Long follow-up sequences die after touch #2 or #3</li>
              <li>Voicemails go to inboxes that never get checked</li>
              <li>Speed-to-lead measured in hours, not seconds</li>
            </ul>
          </div>
          <div className="problem-card after">
            <div className="problem-label">After Warm Follow</div>
            <div className="problem-h">Every lead, worked forever.</div>
            <ul className="problem-list">
              <li>AI responds to inbound texts, calls, and voicemails in under a minute</li>
              <li>Outbound cadences run for months without a human touching them</li>
              <li>Only booked, qualified appointments land on your calendar</li>
              <li>Voice agent handles live inbound calls — transcribed and scored</li>
              <li>You spend time writing contracts, not dialing back dead leads</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Problem section — agent ----------
function AgentProblem() {
  return (
    <section>
      <div className="container">
        <div className="eyebrow">The problem</div>
        <h2 className="section-title">You're paying $40+ per lead and most of them ghost you after one text.</h2>
        <p className="section-sub">Online buyer leads (Zillow, Realtor.com, Facebook) have a brutal truth: 90% won't respond to the first message. The agents who win aren't the best closers — they're the most persistent. Warm Follow makes you the most persistent agent in your market, automatically.</p>
        <div className="problem-grid">
          <div className="problem-card before">
            <div className="problem-label">Before Warm Follow</div>
            <div className="problem-h">Paid leads wasted</div>
            <ul className="problem-list">
              <li>Zillow/Realtor.com leads get one text and go cold forever</li>
              <li>You're manually following up at 10pm after showings</li>
              <li>Hot buyers book with whoever replied first — not you</li>
              <li>No-shows kill your schedule and your momentum</li>
              <li>Leads from 3 months ago sit untouched in your CRM</li>
            </ul>
          </div>
          <div className="problem-card after">
            <div className="problem-label">After Warm Follow</div>
            <div className="problem-h">Every lead gets 11 chances.</div>
            <ul className="problem-list">
              <li>AI responds to every inbound inquiry in under 60 seconds</li>
              <li>Multi-week drip sequences re-engage aged and cold leads</li>
              <li>Only consultation-ready buyers land on your calendar</li>
              <li>Voice agent handles calls you miss — books the showing</li>
              <li>You show homes; AI handles everything before that</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, {
  InvestorStats, AgentStats,
  HowItWorks,
  InvestorProblem, AgentProblem,
});
