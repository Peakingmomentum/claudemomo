// ---------- Main app ----------
function App() {
  const [caseStudy, setCaseStudy] = React.useState('investor');

  const scrollTo = (id) => {
    if (id === 'top') { window.scrollTo({top:0, behavior:'smooth'}); return; }
    if (id === 'demo') {
      document.getElementById('cta-section')?.scrollIntoView({behavior:'smooth', block:'center'});
      return;
    }
    const map = {
      'case-studies': 'case-studies',
      'how-it-works': 'how-it-works',
    };
    const el = document.getElementById(map[id] || id);
    if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
  };

  const isAgent = caseStudy === 'agent';

  return (
    <div className="app">
      <Nav onNav={scrollTo}/>
      <Hero onNav={scrollTo}/>
      <ProofStrip/>
      <CaseStudySelector active={caseStudy} onChange={setCaseStudy}/>

      {isAgent ? (
        <>
          <AgentStats/>
          <AgentProblem/>
          <HowItWorks/>
          <AgentConversations/>
          <AgentDashboard/>
          <AgentPipeline/>
          <AutomationSection caseStudy="agent"/>
          <AgentResults/>
          <AgentROI/>
        </>
      ) : (
        <>
          <InvestorStats/>
          <InvestorProblem/>
          <HowItWorks/>
          <InvestorConversations/>
          <InvestorDashboard/>
          <InvestorPipeline/>
          <AutomationSection caseStudy="investor"/>
          <InvestorResults/>
          <InvestorROI/>
        </>
      )}

      <div id="cta-section">
        <CTASection/>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
