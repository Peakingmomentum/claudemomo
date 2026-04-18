// ---------- Investor ROI ----------
function InvestorROI() {
  return (
    <section>
      <div className="container">
        <div className="eyebrow">ROI</div>
        <h2 className="section-title">Six figures in assignments. Zero hours dialing dead leads.</h2>
        <p className="section-sub">The math on one real-estate investor's Warm Follow engagement from Dec 8, 2025 to April 18, 2026. Every number pulled directly from their GHL workspace.</p>
        <div className="roi-grid" style={{marginTop:40}}>
          <div className="roi-ledger">
            <div className="ledger-row"><span className="lbl">Appointments booked by AI</span><span className="val">193</span></div>
            <div className="ledger-row"><span className="lbl">Confirmed (vs. cancelled)</span><span className="val">192 · 99%</span></div>
            <div className="ledger-row"><span className="lbl">Wholesale assignments closed</span><span className="val">$100,000+</span></div>
            <div className="ledger-row"><span className="lbl">Human follow-up hours spent</span><span className="val">0</span></div>
            <div className="ledger-row"><span className="lbl">Hours saved vs. manual dialing*</span><span className="val">~480 hrs</span></div>
            <div className="ledger-row total">
              <span className="lbl">Effective value</span>
              <span className="val">Priceless.</span>
            </div>
            <div style={{fontSize:11,color:'var(--muted)',fontFamily:'JetBrains Mono',marginTop:16}}>
              * Based on 1,521 leads × avg. 3 touches × 6 min/touch if worked manually
            </div>
          </div>
          <Testimonial
            quote='"I stopped calling leads back months ago. The AI handles every inbound and every follow-up. I spend my time writing contracts — not chasing ghosts."'
            name="Corey Vickers"
            title="Founder · VA Home Offer"
            av="av-2"
            note="Figures pulled from client's GHL workspace Dec 8, 2025 – Apr 18, 2026. Screenshots on file. Ask us for the raw export in a live demo."
          />
        </div>
      </div>
    </section>
  );
}

// ---------- Agent ROI ----------
function AgentROI() {
  return (
    <section>
      <div className="container">
        <div className="eyebrow">ROI</div>
        <h2 className="section-title">$142K in commissions. Every lead worked. Zero extra hours.</h2>
        <p className="section-sub">The math on one real estate agent's Warm Follow engagement from Jan 15 to Apr 15, 2026. Three months. One AI. No admin overhead.</p>
        <div className="roi-grid" style={{marginTop:40}}>
          <div className="roi-ledger">
            <div className="ledger-row"><span className="lbl">Buyer consultations booked by AI</span><span className="val">147</span></div>
            <div className="ledger-row"><span className="lbl">Consultation show rate</span><span className="val">92% · 135 showed</span></div>
            <div className="ledger-row"><span className="lbl">GCI attributed to AI-booked clients</span><span className="val">$142,000+</span></div>
            <div className="ledger-row"><span className="lbl">Lead spend wasted on non-responders</span><span className="val">↓ 3x less</span></div>
            <div className="ledger-row"><span className="lbl">Human follow-up hours spent</span><span className="val">0</span></div>
            <div className="ledger-row total">
              <span className="lbl">Return on Warm Follow</span>
              <span className="val">17x+</span>
            </div>
            <div style={{fontSize:11,color:'var(--muted)',fontFamily:'JetBrains Mono',marginTop:16}}>
              * Based on avg $9,800 GCI per closed transaction × 14.5 closings from AI-booked leads
            </div>
          </div>
          <Testimonial
            quote='"I was spending $2,000/month on Zillow leads and converting maybe 3%. Now I convert over 12%. Same budget, 4x the output. I don\'t text leads anymore — Warm Follow does it better than I ever did."'
            name="Sarah Chen"
            title="Buyer Specialist · Apex Realty Group"
            av="av-4"
            note="Figures based on client's GHL workspace Jan 15 – Apr 15, 2026. Conversion rates tracked against pre-Warm Follow baseline of same lead sources."
          />
        </div>
      </div>
    </section>
  );
}

function Testimonial({ quote, name, title, av, note }) {
  return (
    <div>
      <div style={{fontSize:18,lineHeight:1.6,color:'var(--ink-2)',maxWidth:440,fontStyle:'italic'}}>
        {quote}
      </div>
      <div style={{marginTop:24,display:'flex',alignItems:'center',gap:14}}>
        <div className={`avatar ${av}`} style={{width:44,height:44,fontSize:16}}>{name.charAt(0)}</div>
        <div>
          <div style={{fontWeight:600,fontSize:14}}>{name}</div>
          <div style={{fontSize:12,color:'var(--muted)'}}>{title}</div>
        </div>
      </div>
      <div style={{marginTop:32,padding:20,background:'var(--bg-2)',border:'1px dashed var(--line-2)',borderRadius:14,fontSize:13,color:'var(--muted)'}}>
        <div style={{fontFamily:'JetBrains Mono',fontSize:10,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--ink-2)',marginBottom:8}}>Method</div>
        {note}
      </div>
    </div>
  );
}

// ---------- CTA ----------
function CTASection() {
  return (
    <section style={{borderBottom:'none'}}>
      <div className="container">
        <div className="cta">
          <div className="cta-inner">
            <div className="eyebrow" style={{color:'rgba(255,255,255,0.65)',justifyContent:'center',display:'inline-flex'}}>Ready when you are</div>
            <h2>Book a live demo — or buy the system today.</h2>
            <p>See Warm Follow replying, dialing, and booking in real time against a test lead. Or skip the demo and start with the self-serve plan on our pricing page.</p>
            <div className="cta-buttons">
              <button className="btn btn-primary btn-lg">Book a live demo & audit <Icon.Arrow /></button>
              <button className="btn btn-ghost btn-lg">See pricing</button>
            </div>
            <div style={{marginTop:28,fontSize:12,color:'rgba(255,255,255,0.5)',fontFamily:'JetBrains Mono'}}>
              30-minute walkthrough · Your numbers, your CRM · No slides
            </div>
          </div>
        </div>
        <div className="footer">
          <div>© 2026 Warm Follow · Built for real estate professionals who refuse to lose leads to slow follow-up.</div>
          <div className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Pricing</a>
            <a href="#">Book a demo</a>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { InvestorROI, AgentROI, CTASection });
