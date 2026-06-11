// ─── Role Configuration ───────────────────────────────────────────────────────
// All role-specific data: pipeline stages, calculators, AI prompts, coaching.

export type UserRole =
  | 'wholesaler'
  | 'realtor'
  | 'storage_investor'
  | 'commercial_re'
  | 'industrial';

// ─── Pipeline Stages ─────────────────────────────────────────────────────────

export const ROLE_STAGES: Record<UserRole, string[]> = {
  wholesaler:       ['Lead', 'Analyzed', 'Under Contract', 'Assigned', 'Closed', 'Dead'],
  realtor:          ['Prospect', 'Showing', 'Offer', 'Under Contract', 'Closed', 'Dead'],
  storage_investor: ['Identified', 'Analyzed', 'LOI', 'Due Diligence', 'Closed', 'Dead'],
  commercial_re:    ['Identified', 'Underwriting', 'LOI', 'Due Diligence', 'Closed', 'Dead'],
  industrial:       ['Identified', 'Underwriting', 'LOI', 'Due Diligence', 'Closed', 'Dead'],
};

export const DEFAULT_STAGES = ['New Lead', 'Contacted', 'Nurturing', 'Negotiating', 'Under Contract', 'Closed', 'Dead'];

export function getStages(role?: UserRole | null): string[] {
  if (!role || !ROLE_STAGES[role]) return DEFAULT_STAGES;
  return ROLE_STAGES[role];
}

// ─── Role Display Names ───────────────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  wholesaler:       'Wholesaler',
  realtor:          'Realtor / Agent',
  storage_investor: 'Storage Unit Investor',
  commercial_re:    'Commercial Real Estate',
  industrial:       'Industrial Real Estate',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  wholesaler:       'Find distressed properties, put them under contract, and assign to buyers.',
  realtor:          'Represent buyers and sellers. Earn commission on closed transactions.',
  storage_investor: 'Acquire, operate, and scale self-storage facilities.',
  commercial_re:    'Office, retail, and mixed-use commercial property acquisitions.',
  industrial:       'Warehouses, distribution centers, flex space, and industrial parks.',
};

export const ROLE_ICONS: Record<UserRole, string> = {
  wholesaler:       '🏠',
  realtor:          '🤝',
  storage_investor: '🏭',
  commercial_re:    '🏢',
  industrial:       '⚙️',
};

// ─── Calculators ──────────────────────────────────────────────────────────────

export type Calculator = {
  id: string;
  label: string;
  description: string;
  fields: CalcField[];
  formula: (vals: Record<string, number>) => CalcResult[];
};

export type CalcField = {
  id: string;
  label: string;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  default?: number;
};

export type CalcResult = {
  label: string;
  value: number;
  format: 'dollar' | 'percent' | 'number';
  highlight?: boolean;
};

export const CALCULATORS: Record<UserRole, Calculator[]> = {
  wholesaler: [
    {
      id: 'arv',
      label: 'ARV Calculator',
      description: 'After Repair Value — what the property is worth fully fixed up.',
      fields: [
        { id: 'comp1', label: 'Comp 1', prefix: '$', placeholder: '180000' },
        { id: 'comp2', label: 'Comp 2', prefix: '$', placeholder: '195000' },
        { id: 'comp3', label: 'Comp 3', prefix: '$', placeholder: '185000' },
      ],
      formula: (v) => {
        const comps = [v.comp1, v.comp2, v.comp3].filter(Boolean);
        const arv = comps.length ? comps.reduce((a, b) => a + b, 0) / comps.length : 0;
        return [{ label: 'Estimated ARV', value: arv, format: 'dollar', highlight: true }];
      },
    },
    {
      id: 'mao',
      label: 'MAO Calculator',
      description: 'Maximum Allowable Offer — the most you should pay.',
      fields: [
        { id: 'arv',        label: 'ARV',          prefix: '$', placeholder: '185000' },
        { id: 'repairs',    label: 'Repair Costs',  prefix: '$', placeholder: '35000' },
        { id: 'assignFee',  label: 'Assignment Fee', prefix: '$', placeholder: '10000', default: 10000 },
        { id: 'holdCosts',  label: 'Hold / Closing', prefix: '$', placeholder: '5000', default: 5000 },
        { id: 'profitPct',  label: 'Buyer Profit %', suffix: '%', placeholder: '70', default: 70 },
      ],
      formula: (v) => {
        const mao = (v.arv * (v.profitPct / 100)) - v.repairs - v.assignFee - v.holdCosts;
        return [
          { label: 'MAO', value: Math.max(0, mao), format: 'dollar', highlight: true },
          { label: 'Buyer Net After Repairs', value: v.arv * (v.profitPct / 100) - v.repairs, format: 'dollar' },
        ];
      },
    },
    {
      id: 'assignmentFee',
      label: 'Assignment Fee Estimator',
      description: 'How much you\'ll make assigning the contract.',
      fields: [
        { id: 'contractPrice', label: 'Contract Price',  prefix: '$', placeholder: '95000' },
        { id: 'buyerPrice',    label: 'Buyer\'s Price',   prefix: '$', placeholder: '108000' },
      ],
      formula: (v) => {
        const fee = v.buyerPrice - v.contractPrice;
        return [
          { label: 'Assignment Fee', value: fee, format: 'dollar', highlight: true },
          { label: 'ROI on Deal', value: v.contractPrice > 0 ? (fee / v.contractPrice) * 100 : 0, format: 'percent' },
        ];
      },
    },
  ],

  realtor: [
    {
      id: 'commission',
      label: 'Commission Split',
      description: 'How much you take home from a closed deal.',
      fields: [
        { id: 'salePrice',    label: 'Sale Price',       prefix: '$', placeholder: '500000' },
        { id: 'commPct',      label: 'Commission %',      suffix: '%', placeholder: '3', default: 3 },
        { id: 'splitPct',     label: 'Your Split %',      suffix: '%', placeholder: '70', default: 70 },
        { id: 'eAndO',        label: 'E&O / Fees',        prefix: '$', placeholder: '300', default: 300 },
      ],
      formula: (v) => {
        const grossComm = v.salePrice * (v.commPct / 100);
        const yourCut   = grossComm * (v.splitPct / 100);
        const net       = yourCut - v.eAndO;
        return [
          { label: 'Gross Commission', value: grossComm, format: 'dollar' },
          { label: 'Your Gross Cut',   value: yourCut,   format: 'dollar' },
          { label: 'Net After Fees',   value: net,       format: 'dollar', highlight: true },
        ];
      },
    },
    {
      id: 'sellerNet',
      label: 'Seller Net Sheet',
      description: 'What the seller walks away with after all costs.',
      fields: [
        { id: 'salePrice',     label: 'Sale Price',       prefix: '$', placeholder: '500000' },
        { id: 'mortgageBalance', label: 'Mortgage Balance', prefix: '$', placeholder: '320000' },
        { id: 'commPct',       label: 'Commission %',      suffix: '%', placeholder: '6', default: 6 },
        { id: 'closingCosts',  label: 'Closing Costs',     prefix: '$', placeholder: '5000', default: 5000 },
        { id: 'repairs',       label: 'Agreed Repairs',    prefix: '$', placeholder: '0' },
      ],
      formula: (v) => {
        const commission = v.salePrice * (v.commPct / 100);
        const sellerNet  = v.salePrice - v.mortgageBalance - commission - v.closingCosts - v.repairs;
        return [
          { label: 'Commission',  value: commission, format: 'dollar' },
          { label: 'Seller Net',  value: sellerNet,  format: 'dollar', highlight: true },
        ];
      },
    },
    {
      id: 'buyerNet',
      label: 'Buyer Net Sheet',
      description: 'Total cash needed to close.',
      fields: [
        { id: 'purchasePrice', label: 'Purchase Price',  prefix: '$', placeholder: '400000' },
        { id: 'downPct',       label: 'Down Payment %',  suffix: '%', placeholder: '20', default: 20 },
        { id: 'interestRate',  label: 'Interest Rate %', suffix: '%', placeholder: '6.75' },
        { id: 'loanTermYrs',   label: 'Loan Term (yrs)', suffix: 'yr', placeholder: '30', default: 30 },
        { id: 'closingPct',    label: 'Closing Costs %', suffix: '%', placeholder: '2.5', default: 2.5 },
      ],
      formula: (v) => {
        const down     = v.purchasePrice * (v.downPct / 100);
        const loan     = v.purchasePrice - down;
        const r        = v.interestRate / 100 / 12;
        const n        = v.loanTermYrs * 12;
        const pmt      = r > 0 ? loan * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : loan / n;
        const closing  = v.purchasePrice * (v.closingPct / 100);
        return [
          { label: 'Down Payment',      value: down,    format: 'dollar' },
          { label: 'Monthly Payment',   value: pmt,     format: 'dollar', highlight: true },
          { label: 'Closing Costs Est.', value: closing, format: 'dollar' },
          { label: 'Total Cash to Close', value: down + closing, format: 'dollar', highlight: true },
        ];
      },
    },
  ],

  storage_investor: [
    {
      id: 'occupancy',
      label: 'Occupancy Rate Calculator',
      description: 'Current occupancy and revenue at various fill rates.',
      fields: [
        { id: 'totalUnits',    label: 'Total Units',           placeholder: '200' },
        { id: 'occupiedUnits', label: 'Occupied Units',        placeholder: '162' },
        { id: 'avgRent',       label: 'Avg Rent / Unit',       prefix: '$', placeholder: '85' },
      ],
      formula: (v) => {
        const occupancy = v.totalUnits > 0 ? (v.occupiedUnits / v.totalUnits) * 100 : 0;
        const monthlyRev = v.occupiedUnits * v.avgRent;
        const potentialRev = v.totalUnits * v.avgRent;
        return [
          { label: 'Occupancy Rate',     value: occupancy,    format: 'percent', highlight: true },
          { label: 'Monthly Revenue',    value: monthlyRev,   format: 'dollar' },
          { label: 'Revenue at 100%',    value: potentialRev, format: 'dollar' },
          { label: 'Annual Revenue',     value: monthlyRev * 12, format: 'dollar' },
        ];
      },
    },
    {
      id: 'unitMixRevenue',
      label: 'Unit Mix Revenue',
      description: 'Blended revenue from multiple unit sizes.',
      fields: [
        { id: 'smallUnits',  label: '5×5 / 5×10 Units',  placeholder: '50' },
        { id: 'smallRent',   label: 'Rent / Small Unit',  prefix: '$', placeholder: '55' },
        { id: 'medUnits',    label: '10×10 Units',        placeholder: '80' },
        { id: 'medRent',     label: 'Rent / Medium Unit', prefix: '$', placeholder: '95' },
        { id: 'largeUnits',  label: '10×20+ Units',       placeholder: '40' },
        { id: 'largeRent',   label: 'Rent / Large Unit',  prefix: '$', placeholder: '145' },
      ],
      formula: (v) => {
        const monthly = (v.smallUnits * v.smallRent) + (v.medUnits * v.medRent) + (v.largeUnits * v.largeRent);
        return [
          { label: 'Monthly Potential Revenue', value: monthly,        format: 'dollar', highlight: true },
          { label: 'Annual Potential Revenue',  value: monthly * 12,   format: 'dollar' },
          { label: 'Total Units',               value: v.smallUnits + v.medUnits + v.largeUnits, format: 'number' },
        ];
      },
    },
    {
      id: 'storageCapRate',
      label: 'Cap Rate & NOI',
      description: 'Capitalization rate for a storage facility.',
      fields: [
        { id: 'grossRevenue',  label: 'Annual Gross Revenue',   prefix: '$', placeholder: '180000' },
        { id: 'vacancyPct',    label: 'Vacancy Rate %',         suffix: '%', placeholder: '10', default: 10 },
        { id: 'opexPct',       label: 'Operating Expenses %',   suffix: '%', placeholder: '35', default: 35 },
        { id: 'purchasePrice', label: 'Purchase / Asking Price', prefix: '$', placeholder: '1200000' },
      ],
      formula: (v) => {
        const effectiveRevenue = v.grossRevenue * (1 - v.vacancyPct / 100);
        const noi = effectiveRevenue * (1 - v.opexPct / 100);
        const capRate = v.purchasePrice > 0 ? (noi / v.purchasePrice) * 100 : 0;
        return [
          { label: 'Effective Gross Revenue', value: effectiveRevenue, format: 'dollar' },
          { label: 'NOI',      value: noi,     format: 'dollar', highlight: true },
          { label: 'Cap Rate', value: capRate,  format: 'percent', highlight: true },
        ];
      },
    },
  ],

  commercial_re: [
    {
      id: 'capRateNOI',
      label: 'Cap Rate & NOI',
      description: 'Core underwriting: net operating income and cap rate.',
      fields: [
        { id: 'grossRevenue',  label: 'Annual Gross Revenue',   prefix: '$', placeholder: '500000' },
        { id: 'vacancyPct',    label: 'Vacancy Rate %',         suffix: '%', placeholder: '8', default: 8 },
        { id: 'opexPct',       label: 'Operating Expenses %',   suffix: '%', placeholder: '40', default: 40 },
        { id: 'purchasePrice', label: 'Purchase Price',          prefix: '$', placeholder: '4000000' },
      ],
      formula: (v) => {
        const egr     = v.grossRevenue * (1 - v.vacancyPct / 100);
        const noi     = egr * (1 - v.opexPct / 100);
        const capRate = v.purchasePrice > 0 ? (noi / v.purchasePrice) * 100 : 0;
        return [
          { label: 'EGR',      value: egr,     format: 'dollar' },
          { label: 'NOI',      value: noi,     format: 'dollar', highlight: true },
          { label: 'Cap Rate', value: capRate,  format: 'percent', highlight: true },
        ];
      },
    },
    {
      id: 'dscr',
      label: 'Debt Coverage Ratio',
      description: 'Does NOI cover the debt service? Lenders want 1.25+.',
      fields: [
        { id: 'noi',          label: 'Annual NOI',       prefix: '$', placeholder: '200000' },
        { id: 'loanAmount',   label: 'Loan Amount',      prefix: '$', placeholder: '2500000' },
        { id: 'interestRate', label: 'Interest Rate %',  suffix: '%', placeholder: '6.5' },
        { id: 'loanTermYrs',  label: 'Amortization (yrs)', suffix: 'yr', placeholder: '25', default: 25 },
      ],
      formula: (v) => {
        const r   = v.interestRate / 100 / 12;
        const n   = v.loanTermYrs * 12;
        const pmt = r > 0 ? v.loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : v.loanAmount / n;
        const annualDebtService = pmt * 12;
        const dscr = annualDebtService > 0 ? v.noi / annualDebtService : 0;
        return [
          { label: 'Annual Debt Service', value: annualDebtService, format: 'dollar' },
          { label: 'DSCR', value: dscr, format: 'number', highlight: true },
          { label: 'Monthly Payment',     value: pmt,               format: 'dollar' },
        ];
      },
    },
    {
      id: 'cashOnCash',
      label: 'Cash-on-Cash Return',
      description: 'Annual cash flow divided by total cash invested.',
      fields: [
        { id: 'noi',           label: 'Annual NOI',          prefix: '$', placeholder: '200000' },
        { id: 'annualDebt',    label: 'Annual Debt Service', prefix: '$', placeholder: '140000' },
        { id: 'downPayment',   label: 'Down Payment',        prefix: '$', placeholder: '800000' },
        { id: 'closingCosts',  label: 'Closing + Capex',     prefix: '$', placeholder: '50000' },
      ],
      formula: (v) => {
        const cashFlow  = v.noi - v.annualDebt;
        const invested  = v.downPayment + v.closingCosts;
        const coc       = invested > 0 ? (cashFlow / invested) * 100 : 0;
        return [
          { label: 'Annual Cash Flow',   value: cashFlow, format: 'dollar', highlight: true },
          { label: 'Cash-on-Cash Return', value: coc,      format: 'percent', highlight: true },
          { label: 'Total Cash Invested', value: invested,  format: 'dollar' },
        ];
      },
    },
  ],

  industrial: [
    {
      id: 'warehouseSF',
      label: 'Warehouse SF Pricing',
      description: 'Total lease value based on square footage and rate.',
      fields: [
        { id: 'sqft',       label: 'Square Footage',   suffix: ' SF', placeholder: '50000' },
        { id: 'leaseRate',  label: 'Annual Lease Rate', prefix: '$', suffix: '/SF', placeholder: '8.5' },
        { id: 'tenantImprovements', label: 'TI Allowance', prefix: '$', suffix: '/SF', placeholder: '15' },
        { id: 'freeRentMos', label: 'Free Rent (mos)',  suffix: ' mos', placeholder: '3' },
      ],
      formula: (v) => {
        const annualRent  = v.sqft * v.leaseRate;
        const totalTI     = v.sqft * v.tenantImprovements;
        const freeRentVal = (annualRent / 12) * v.freeRentMos;
        const netEffective = annualRent - (totalTI + freeRentVal) / 10; // amortized over 10 yr
        return [
          { label: 'Annual Base Rent',         value: annualRent,   format: 'dollar', highlight: true },
          { label: 'Total TI',                 value: totalTI,      format: 'dollar' },
          { label: 'Free Rent Value',           value: freeRentVal,  format: 'dollar' },
          { label: 'Net Effective Rent (ann.)', value: netEffective, format: 'dollar', highlight: true },
        ];
      },
    },
    {
      id: 'leaseRate',
      label: 'Lease Rate Analysis',
      description: 'Compare triple-net vs gross lease economics.',
      fields: [
        { id: 'sqft',         label: 'Square Footage',          suffix: ' SF', placeholder: '40000' },
        { id: 'nnnRate',      label: 'NNN Rate ($/SF/yr)',       prefix: '$', placeholder: '7.5' },
        { id: 'taxes',        label: 'Annual Taxes',            prefix: '$', placeholder: '25000' },
        { id: 'insurance',    label: 'Annual Insurance',        prefix: '$', placeholder: '12000' },
        { id: 'camSFyr',      label: 'CAM ($/SF/yr)',           prefix: '$', placeholder: '1.2' },
      ],
      formula: (v) => {
        const baseRent      = v.sqft * v.nnnRate;
        const camTotal      = v.sqft * v.camSFyr;
        const grossEquiv    = baseRent + v.taxes + v.insurance + camTotal;
        const grossEqSF     = v.sqft > 0 ? grossEquiv / v.sqft : 0;
        return [
          { label: 'NNN Base Rent',          value: baseRent,   format: 'dollar' },
          { label: 'Gross Equiv. Total',     value: grossEquiv, format: 'dollar', highlight: true },
          { label: 'Gross Equiv. $/SF/yr',   value: grossEqSF,  format: 'number' },
        ];
      },
    },
    {
      id: 'industrialCapRate',
      label: 'Industrial Cap Rate',
      description: 'NOI and cap rate for industrial / warehouse assets.',
      fields: [
        { id: 'sqft',          label: 'Rentable SF',          suffix: ' SF', placeholder: '80000' },
        { id: 'leaseRate',     label: 'Lease Rate ($/SF/yr)',  prefix: '$', placeholder: '9' },
        { id: 'vacancyPct',    label: 'Vacancy %',            suffix: '%', placeholder: '5', default: 5 },
        { id: 'opexSF',        label: 'OpEx ($/SF/yr)',       prefix: '$', placeholder: '1.5' },
        { id: 'purchasePrice', label: 'Purchase Price',        prefix: '$', placeholder: '6500000' },
      ],
      formula: (v) => {
        const grossRev = v.sqft * v.leaseRate;
        const egr      = grossRev * (1 - v.vacancyPct / 100);
        const opex     = v.sqft * v.opexSF;
        const noi      = egr - opex;
        const capRate  = v.purchasePrice > 0 ? (noi / v.purchasePrice) * 100 : 0;
        return [
          { label: 'EGR',      value: egr,     format: 'dollar' },
          { label: 'NOI',      value: noi,     format: 'dollar', highlight: true },
          { label: 'Cap Rate', value: capRate,  format: 'percent', highlight: true },
        ];
      },
    },
  ],
};

// ─── Coaching Prompts (role-specific) ─────────────────────────────────────────

export type PromptCategory = {
  label: string;
  icon: string;
  color: string;
  prompts: string[];
};

export const ROLE_PROMPT_CATEGORIES: Record<UserRole, PromptCategory[]> = {
  wholesaler: [
    {
      label: 'Lead Generation',
      icon: 'target',
      color: '#4a90d9',
      prompts: [
        'Give me a door knocking script for an absentee owner neighborhood',
        'Design a direct mail sequence for probate leads — what should the copy say?',
        'Walk me through a driving-for-dollars system I can run in 2 hours a week',
        'Give me a cold calling opener that doesn\'t sound scripted',
        'What\'s the fastest way to build a buyer\'s list from scratch?',
      ],
    },
    {
      label: 'Offer & MAO Scripts',
      icon: 'dollar',
      color: '#10b981',
      prompts: [
        'Help me walk a seller through my MAO without them walking away',
        'Give me a negotiation script for lowering an asking price by 20% without losing the deal',
        'How do I explain "as-is" to a seller who thinks their house is worth full retail?',
        'What do I say when a seller counters my offer? Give me the full script',
        'How do I handle a seller who says "I need more time to think about it"?',
      ],
    },
    {
      label: 'Assigning Deals',
      icon: 'pipeline',
      color: '#f59e0b',
      prompts: [
        'How do I market an assignment deal to my buyer\'s list?',
        'Write a wholesale deal summary email for a buyer who has never bought from me',
        'What is a reasonable assignment fee for a $120k wholesale deal?',
        'How do I double-close instead of assign — and when should I?',
        'Walk me through building a buyer\'s list for a rural market',
      ],
    },
    {
      label: 'Strategy & Scale',
      icon: 'chart-bar',
      color: '#0f4c81',
      prompts: [
        'I want to scale from 1-2 deals a month to 5+. What do I need to build?',
        'What KPIs should I track weekly to know if my pipeline is healthy?',
        'When does it make sense to hire a VA vs. a full-time acquisitions person?',
        'How do I build a consistent deal flow without paid ads?',
        'Give me a 90-day plan for a new wholesaler with a $5k marketing budget',
      ],
    },
  ],

  realtor: [
    {
      label: 'Listing & Buyer Outreach',
      icon: 'target',
      color: '#4a90d9',
      prompts: [
        'Write a listing description for a 4-bed suburban home that makes people excited to schedule a showing',
        'Give me a cold outreach email to FSBO sellers in my market',
        'Write a buyer outreach sequence for leads who inquired 90+ days ago',
        'What\'s the best way to farm a neighborhood and become the go-to agent?',
        'Write a "just listed" social post that actually generates DMs',
      ],
    },
    {
      label: 'Negotiations',
      icon: 'phone',
      color: '#10b981',
      prompts: [
        'My buyer is $15k apart from the seller — give me a counter strategy',
        'How do I negotiate repairs without blowing up the deal after inspections?',
        'Give me a script to help a seller understand why they need to reduce price in a slow market',
        'How do I handle multiple-offer situations as a buyer\'s agent?',
        'What should I say when a seller rejects my buyer\'s offer?',
      ],
    },
    {
      label: 'Client Experience',
      icon: 'bulb',
      color: '#f59e0b',
      prompts: [
        'Write a pre-listing walkthrough script that sets expectations and builds trust',
        'How do I explain the selling process to a first-time seller without overwhelming them?',
        'Write a buyer consultation script that qualifies and excites the client',
        'How do I turn one transaction into three referrals?',
        'What should I send clients in the 30 days after closing?',
      ],
    },
    {
      label: 'Business Growth',
      icon: 'chart-bar',
      color: '#0f4c81',
      prompts: [
        'I want to go from 10 to 25 closings a year. What do I need to change?',
        'Should I join a team, stay solo, or start my own team? Walk me through the decision',
        'What KPIs should a solo agent track weekly?',
        'How do I build a referral-driven business without constantly asking for referrals?',
        'Give me a daily schedule for a producing agent doing 15-20 deals a year',
      ],
    },
  ],

  storage_investor: [
    {
      label: 'Finding Deals',
      icon: 'target',
      color: '#4a90d9',
      prompts: [
        'How do I find off-market self-storage facilities in secondary markets?',
        'What makes a self-storage market attractive for acquisition?',
        'Write a letter of intent (LOI) for a self-storage deal',
        'How do I approach a mom-and-pop storage owner about selling?',
        'What cap rate should I be targeting in today\'s self-storage market?',
      ],
    },
    {
      label: 'Underwriting',
      icon: 'dollar',
      color: '#10b981',
      prompts: [
        'Walk me through underwriting a 200-unit self-storage facility step by step',
        'What expense ratio should I use for stabilized vs. value-add storage?',
        'How do I model revenue upside from unit rate increases and occupancy improvements?',
        'What are the most common mistakes investors make when underwriting storage?',
        'How do I value a facility with a mix of climate-controlled and drive-up units?',
      ],
    },
    {
      label: 'Operations & Value-Add',
      icon: 'bulb',
      color: '#f59e0b',
      prompts: [
        'What are the best ways to add value to an underperforming storage facility?',
        'How do I implement dynamic pricing to boost revenue?',
        'What technology upgrades make the biggest impact on storage operations?',
        'How do I reduce delinquencies and increase collections?',
        'Should I self-manage or hire a third-party management company?',
      ],
    },
    {
      label: 'Market Analysis',
      icon: 'chart-bar',
      color: '#0f4c81',
      prompts: [
        'How do I analyze the demand for self-storage in a market I\'m targeting?',
        'What supply/demand metrics should I track when evaluating a storage market?',
        'Give me a storage market analysis framework I can use on any deal',
        'How saturated is the self-storage market nationally vs. locally?',
        'What secondary and tertiary markets have the best storage fundamentals right now?',
      ],
    },
  ],

  commercial_re: [
    {
      label: 'Deal Sourcing',
      icon: 'target',
      color: '#4a90d9',
      prompts: [
        'How do I build a deal flow for off-market commercial opportunities?',
        'Write a prospecting letter to building owners in my target submarket',
        'What brokers should I be building relationships with for commercial deals?',
        'How do I analyze a commercial market for acquisition opportunities?',
        'What signals tell me a commercial submarket is about to appreciate?',
      ],
    },
    {
      label: 'Underwriting',
      icon: 'dollar',
      color: '#10b981',
      prompts: [
        'Walk me through underwriting a 10,000 SF retail strip center step by step',
        'What cap rate spread should I target vs. the 10-year Treasury?',
        'How do I model a value-add commercial deal with a mix of occupied and vacant space?',
        'What assumptions should I stress-test in every commercial deal?',
        'How do I calculate going-in vs. stabilized cap rate?',
      ],
    },
    {
      label: 'Financing & Structuring',
      icon: 'pipeline',
      color: '#f59e0b',
      prompts: [
        'What are the most common commercial loan structures I should know?',
        'How do I structure a JV for a commercial deal — what are the key terms?',
        'When does a bridge loan make sense vs. permanent financing?',
        'How do I negotiate with a commercial lender to get better terms?',
        'Explain DSCR requirements and how they affect how much I can borrow',
      ],
    },
    {
      label: 'Commercial Deal Analysis',
      icon: 'chart-bar',
      color: '#0f4c81',
      prompts: [
        'Give me a framework for evaluating a commercial deal in under 30 minutes',
        'What are the biggest red flags when reviewing a commercial offering memorandum?',
        'How do I think about tenant credit quality when evaluating an NNN deal?',
        'What\'s the difference between gross, modified gross, and NNN leases?',
        'How do I analyze a commercial deal with below-market leases and near-term rollovers?',
      ],
    },
  ],

  industrial: [
    {
      label: 'Finding Industrial Deals',
      icon: 'target',
      color: '#4a90d9',
      prompts: [
        'What makes an industrial market attractive for acquisitions right now?',
        'How do I find off-market industrial properties and flex space?',
        'Write a prospecting outreach for industrial building owners',
        'What submarkets have the best industrial fundamentals nationally?',
        'How do I evaluate a distribution center location vs. a last-mile facility?',
      ],
    },
    {
      label: 'Industrial Underwriting',
      icon: 'dollar',
      color: '#10b981',
      prompts: [
        'Walk me through underwriting a 100,000 SF warehouse deal step by step',
        'What cap rates are industrial assets trading at in major metros vs. secondary markets?',
        'How do I model a sale-leaseback for an industrial user?',
        'What\'s the difference between NNN and gross leases for industrial?',
        'How do I factor in clear height, dock doors, and power into my underwriting?',
      ],
    },
    {
      label: 'Leasing Strategy',
      icon: 'bulb',
      color: '#f59e0b',
      prompts: [
        'How do I structure a long-term lease with an industrial tenant?',
        'What lease concessions are market standard in today\'s industrial market?',
        'How do I negotiate TI allowances and free rent periods?',
        'What industrial tenant types are most creditworthy and why?',
        'Give me a framework for re-leasing industrial space when a tenant vacates',
      ],
    },
    {
      label: 'Industrial Market Analysis',
      icon: 'chart-bar',
      color: '#0f4c81',
      prompts: [
        'What supply/demand metrics should I track for industrial real estate?',
        'How has e-commerce changed industrial demand and what does that mean for me?',
        'Give me a framework for analyzing a new industrial market',
        'What are the biggest risks in industrial real estate right now?',
        'How do I think about industrial vs. flex space — when is each the better buy?',
      ],
    },
  ],
};

// Default coaching prompts (if no role is set)
export const DEFAULT_PROMPT_CATEGORIES: PromptCategory[] = [
  {
    label: 'Lead Generation',
    icon: 'target',
    color: '#4a90d9',
    prompts: [
      'Give me a door knocking script for an absentee owner neighborhood',
      'Design a direct mail sequence for probate leads — what should the copy say?',
      'How do I structure Facebook ads targeting distressed homeowners?',
      'Walk me through a driving-for-dollars system I can run in 2 hours a week',
      'Give me a cold calling opener that doesn\'t sound scripted',
    ],
  },
  {
    label: 'Follow-Up Scripts',
    icon: 'phone',
    color: '#10b981',
    prompts: [
      'Write a 5-touch SMS sequence for a seller who said "call me in 3 months"',
      'Give me a voicemail script that actually gets callbacks',
      'Write a 3-email drip for a warm lead who went quiet after our first call',
      'How do I follow up after a seller says "I\'m not ready yet" without being annoying?',
      'Write a breakup message for a lead I\'ve followed up with 8+ times',
    ],
  },
  {
    label: 'Offers & Contracts',
    icon: 'dollar',
    color: '#f59e0b',
    prompts: [
      'Help me structure a subject-to offer',
      'Give me a negotiation script for lowering an asking price by 20%',
      'What red flags should I look for when reviewing a purchase agreement?',
      'How do I explain seller financing to a homeowner?',
      'Walk me through comping a deal in a rural market',
    ],
  },
  {
    label: 'Strategy & Growth',
    icon: 'chart-bar',
    color: '#0f4c81',
    prompts: [
      'I want to scale from 1-2 deals a month to 5+. What do I need to change?',
      'What KPIs should I track weekly to know if my pipeline is healthy?',
      'I have 30+ active leads. Walk me through how to prioritize them this week.',
      'When does it make sense to hire a VA vs. a full-time acquisitions person?',
      'Give me a 90-day growth plan for my business',
    ],
  },
];

export function getPromptCategories(role?: UserRole | null): PromptCategory[] {
  if (!role || !ROLE_PROMPT_CATEGORIES[role]) return DEFAULT_PROMPT_CATEGORIES;
  return ROLE_PROMPT_CATEGORIES[role];
}

export function getCalculators(role?: UserRole | null): Calculator[] {
  if (!role || !CALCULATORS[role]) return CALCULATORS.wholesaler; // sensible default
  return CALCULATORS[role];
}

// ─── AI Context Snippets (appended to Claude system prompt) ───────────────────

export const ROLE_AI_CONTEXT: Record<UserRole, string> = {
  wholesaler: `USER ROLE: Wholesaler
Their business model: Find motivated sellers, put properties under contract at a discount, then assign or double-close to a cash buyer for a fee. They do NOT buy and hold. Pipeline stages are: Lead → Analyzed → Under Contract → Assigned → Closed.
Key metrics they care about: MAO (Maximum Allowable Offer), ARV (After Repair Value), assignment fee, buyer's list size, deal spread.
Common tools: Batch Leads, PropStream, REIsift, DealMachine, REI BlackBook, cold calling, direct mail.
AI should help with: pricing offers, finding buyers, scripting seller conversations, deal analysis.`,

  realtor: `USER ROLE: Realtor / Real Estate Agent
Their business model: Represent buyers and/or sellers in transactions and earn commission. They work in MLS-listed properties. Pipeline stages are: Prospect → Showing → Offer → Under Contract → Closed.
Key metrics they care about: GCI (Gross Commission Income), conversion rate, days on market, list-to-sale ratio, buyer closing rate.
Common tools: MLS, ShowingTime, DocuSign, Dotloop, Follow Up Boss, kvCORE.
AI should help with: listing descriptions, buyer outreach scripts, negotiation strategies, market analysis, sphere of influence marketing.`,

  storage_investor: `USER ROLE: Self-Storage Investor
Their business model: Acquire, operate, and/or develop self-storage facilities. May be value-add turnaround or stabilized income plays. Pipeline stages are: Identified → Analyzed → LOI → Due Diligence → Closed.
Key metrics they care about: occupancy rate, unit mix, NOI, cap rate, DSCR, revenue per SF.
Common tools: SpareFoot, Storedge, Easy Storage Solutions, Yardi Breeze.
AI should help with: market analysis, underwriting assumptions, LOI drafting, operations optimization, revenue management.`,

  commercial_re: `USER ROLE: Commercial Real Estate Investor
Their business model: Acquire, reposition, and/or operate commercial assets (office, retail, mixed-use). Pipeline stages are: Identified → Underwriting → LOI → Due Diligence → Closed.
Key metrics they care about: NOI, cap rate, DSCR (1.25+ minimum), cash-on-cash return, IRR, going-in vs. stabilized value.
Common tools: CoStar, LoopNet, CREXI, Argus, Excel models.
AI should help with: deal analysis, underwriting assumptions, lease abstracting, tenant credit analysis, JV structuring, broker outreach.`,

  industrial: `USER ROLE: Industrial Real Estate Investor
Their business model: Acquire and operate industrial assets — warehouses, distribution centers, flex space, industrial parks. Pipeline stages are: Identified → Underwriting → LOI → Due Diligence → Closed.
Key metrics they care about: NOI, cap rate, clear height, dock doors, power capacity, NNN vs. gross lease spread, DSCR.
Common tools: CoStar, CREXI, LoopNet, Argus.
AI should help with: industrial market analysis, lease rate analysis (NNN vs. gross), underwriting, TI/free-rent negotiations, tenant quality assessment.`,
};

export function getRoleAIContext(role?: UserRole | null): string {
  if (!role || !ROLE_AI_CONTEXT[role]) return '';
  return ROLE_AI_CONTEXT[role];
}
