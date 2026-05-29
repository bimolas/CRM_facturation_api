/**
 * Seed script — creates realistic B2B demo data
 *
 * Run with:  node seed.js
 *
 * Creates:
 *   Company A — TechVision Maroc (buyer)       admin: admin@techvision.ma / Admin1234!
 *   Company B — Softech Solutions (vendor)     admin: admin@softech.ma   / Admin1234!
 *   Company C — LogiSupply SARL (vendor)       admin: admin@logisupply.ma / Admin1234!
 *
 *   3 RFPs posted by TechVision (published to marketplace)
 *   2 bids from Softech on RFP-1
 *   1 bid from LogiSupply on RFP-1
 *   1 bid from Softech on RFP-2
 */

const BASE = 'http://localhost:3001';

async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    console.error(`POST ${path} → ${res.status}`, json);
    return null;
  }
  return json;
}

async function get(path, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { headers });
  if (!res.ok) return null;
  return res.json();
}

async function main() {
  console.log('\n🌱  Seeding demo data...\n');

  // ── 1. Register companies ──────────────────────────────────────────────────

  console.log('Creating Company A — TechVision Maroc (buyer)...');
  const regA = await post('/auth/register', {
    company: {
      name: 'TechVision Maroc',
      ice: '001234567000012',
      rc: 'RC-CAS-123456',
      taxIdentifier: 'IF-45678901',
      email: 'contact@techvision.ma',
      physicalAddress: '42 Boulevard Zerktouni, Casablanca 20000, Maroc',
    },
    user: {
      email: 'admin@techvision.ma',
      password: 'Admin1234!',
      role: 'COMPANY_ADMIN',
    },
  });
  if (!regA) { console.error('Failed to register Company A'); process.exit(1); }
  const tokenA = regA.access_token;
  const companyAId = regA.company?.id;
  console.log(`  ✓ TechVision Maroc (id=${companyAId})`);

  console.log('Creating Company B — Softech Solutions (vendor)...');
  const regB = await post('/auth/register', {
    company: {
      name: 'Softech Solutions',
      ice: '002345678000023',
      rc: 'RC-CAS-234567',
      taxIdentifier: 'IF-56789012',
      email: 'contact@softech.ma',
      physicalAddress: '15 Rue Ibn Sina, Rabat 10000, Maroc',
    },
    user: {
      email: 'admin@softech.ma',
      password: 'Admin1234!',
      role: 'COMPANY_ADMIN',
    },
  });
  if (!regB) { console.error('Failed to register Company B'); process.exit(1); }
  const tokenB = regB.access_token;
  const companyBId = regB.company?.id;
  console.log(`  ✓ Softech Solutions (id=${companyBId})`);

  console.log('Creating Company C — LogiSupply SARL (vendor)...');
  const regC = await post('/auth/register', {
    company: {
      name: 'LogiSupply SARL',
      ice: '003456789000034',
      rc: 'RC-CAS-345678',
      taxIdentifier: 'IF-67890123',
      email: 'contact@logisupply.ma',
      physicalAddress: '8 Avenue Hassan II, Marrakech 40000, Maroc',
    },
    user: {
      email: 'admin@logisupply.ma',
      password: 'Admin1234!',
      role: 'COMPANY_ADMIN',
    },
  });
  if (!regC) { console.error('Failed to register Company C'); process.exit(1); }
  const tokenC = regC.access_token;
  const companyCId = regC.company?.id;
  console.log(`  ✓ LogiSupply SARL (id=${companyCId})`);

  // ── 2. Create RFPs (as TechVision — buyer) ─────────────────────────────────

  console.log('\nCreating RFPs as TechVision Maroc...');

  const rfp1 = await post('/workflows', {
    title: 'ERP Cloud Migration & Integration Services',
    description: 'TechVision Maroc is seeking a qualified IT services provider to migrate our on-premise ERP system to a cloud-based infrastructure (AWS or Azure). The project includes data migration, API integrations with our existing CRM, staff training, and 12 months of post-migration support.',
    technicalCategory: 'IT Services',
    budgetCeiling: 850000,
    submissionDeadline: '2026-07-15',
    expectedDeliveryDate: '2026-10-31',
    currency: 'MAD',
    workflowType: 'service',
    region: 'Casablanca, Maroc',
    requirements: [
      'Minimum 5 years experience in ERP cloud migrations',
      'AWS Advanced Tier Partner or Azure Gold Partner certification',
      'ISO 27001 certified for data security',
      'Dedicated project manager assigned throughout',
      'References from at least 3 similar projects in Morocco',
    ],
    constraints: [
      'Migration must be completed before Q4 2026',
      'Zero downtime during business hours (8h-18h)',
      'All data must remain hosted in Morocco or EU',
      'Budget strictly capped at MAD 850,000',
    ],
    conditions: '30% upfront upon contract signing, 40% at mid-project milestone, 30% upon final acceptance.',
    evaluationCriteria: 'Technical expertise 40%, Price 35%, Delivery timeline 15%, References 10%',
    contactEmail: 'procurement@techvision.ma',
  }, tokenA);

  const rfp2 = await post('/workflows', {
    title: 'Supply of 200 Ergonomic Workstations & Office Equipment',
    description: 'Procurement of 200 complete ergonomic workstation sets for our new Casablanca headquarters. Each set includes: height-adjustable desk, ergonomic chair, dual monitor arms, keyboard tray, and cable management system. Delivery, assembly, and placement on-site required.',
    technicalCategory: 'Office Equipment',
    budgetCeiling: 420000,
    submissionDeadline: '2026-06-30',
    expectedDeliveryDate: '2026-08-15',
    currency: 'MAD',
    workflowType: 'material',
    region: 'Casablanca, Maroc',
    requirements: [
      'ISO 9001 certified manufacturer or distributor',
      'Minimum 3 years supplying corporate office furniture in Morocco',
      'Must provide product samples before order confirmation',
      'Warranty minimum 2 years on all items',
    ],
    constraints: [
      'Full delivery in a single shipment — no partial deliveries',
      'Assembly must be completed within 5 business days of delivery',
      'Delivery to 5th floor — freight elevator available',
    ],
    conditions: 'Net 45 days upon delivery and quality inspection sign-off.',
    evaluationCriteria: 'Price 50%, Product quality 30%, Delivery speed 20%',
    contactEmail: 'procurement@techvision.ma',
  }, tokenA);

  const rfp3 = await post('/workflows', {
    title: 'Monthly IT Infrastructure Maintenance & Support Subscription',
    description: 'TechVision Maroc requires a managed IT support subscription covering: 24/7 network monitoring, monthly server maintenance, helpdesk support (Level 1 & 2), cybersecurity patch management, and quarterly infrastructure audits. Contract duration: 12 months renewable.',
    technicalCategory: 'IT Services',
    budgetCeiling: 180000,
    submissionDeadline: '2026-07-01',
    expectedDeliveryDate: '2026-08-01',
    currency: 'MAD',
    workflowType: 'subscription',
    region: 'Casablanca, Maroc',
    requirements: [
      'Certified IT support team (CompTIA, Cisco, or Microsoft)',
      'SLA: 99.5% uptime guarantee',
      'Response time: Critical issues < 2 hours, Standard < 8 hours',
      'Monthly reporting and KPI dashboard',
    ],
    constraints: [
      'On-site visits minimum twice per month',
      'All support staff must sign NDA',
      'Monthly fee must not exceed MAD 15,000',
    ],
    conditions: 'Monthly invoicing on the 1st of each month. Net 15 days payment.',
    evaluationCriteria: 'SLA terms 40%, Price 35%, Team certifications 25%',
    contactEmail: 'it@techvision.ma',
  }, tokenA);

  const rfp1Id = rfp1?.id;
  const rfp2Id = rfp2?.id;
  const rfp3Id = rfp3?.id;
  console.log(`  ✓ RFP 1: ERP Cloud Migration (id=${rfp1Id})`);
  console.log(`  ✓ RFP 2: Office Equipment (id=${rfp2Id})`);
  console.log(`  ✓ RFP 3: IT Subscription (id=${rfp3Id})`);

  // ── 3. Publish all RFPs ────────────────────────────────────────────────────

  console.log('\nPublishing RFPs to marketplace...');
  for (const [id, name] of [[rfp1Id, 'RFP 1'], [rfp2Id, 'RFP 2'], [rfp3Id, 'RFP 3']]) {
    if (!id) continue;
    const r = await post(`/workflows/${id}/publish`, {}, tokenA);
    console.log(`  ✓ Published ${name} → stateCode: ${r?.stateCode ?? 'unknown'}`);
  }

  // ── 4. Submit bids ─────────────────────────────────────────────────────────

  console.log('\nSubmitting bids as Softech Solutions...');

  // Softech bid on RFP 1 (ERP Migration)
  const bid1 = await post(`/workflows/${rfp1Id}/bids`, {
    referenceNumber: `SOFT-BID-${Date.now()}-1`,
    issueDate: new Date().toISOString(),
    validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    sellerCompanyId: companyBId,
    deliveryLeadTime: 120,
    downPaymentPercentage: 30,
    balanceDueDays: 30,
    vendorNotes: 'Softech Solutions has successfully delivered 7 ERP cloud migrations in Morocco over the past 4 years, including projects for OCP Group and Maroc Telecom subsidiaries. Our dedicated team of 12 certified engineers will be assigned full-time to this project. We offer a 12-month post-migration support SLA at no additional cost.',
    technicalProposalFileUrl: 'https://softech.ma/proposals/techvision-erp-2026.pdf',
    financialQuoteFileUrl: 'https://softech.ma/quotes/techvision-erp-financial-2026.pdf',
    items: [],
  }, tokenB);
  console.log(`  ✓ Softech bid on RFP 1 (id=${bid1?.bids?.slice(-1)[0]?.id ?? 'check'})`);

  // Softech bid on RFP 2 (Office Equipment)
  const bid2 = await post(`/workflows/${rfp2Id}/bids`, {
    referenceNumber: `SOFT-BID-${Date.now()}-2`,
    issueDate: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    sellerCompanyId: companyBId,
    deliveryLeadTime: 21,
    downPaymentPercentage: 20,
    balanceDueDays: 45,
    vendorNotes: 'We are an authorized distributor of Steelcase and Herman Miller in Morocco. All 200 workstation sets are in stock and ready for immediate delivery. Our assembly team can complete the full installation within 3 business days.',
    items: [],
  }, tokenB);
  console.log(`  ✓ Softech bid on RFP 2 (id=${bid2?.bids?.slice(-1)[0]?.id ?? 'check'})`);

  console.log('\nSubmitting bids as LogiSupply SARL...');

  // LogiSupply bid on RFP 1 (ERP Migration)
  const bid3 = await post(`/workflows/${rfp1Id}/bids`, {
    referenceNumber: `LOGI-BID-${Date.now()}-1`,
    issueDate: new Date().toISOString(),
    validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    sellerCompanyId: companyCId,
    deliveryLeadTime: 90,
    downPaymentPercentage: 25,
    balanceDueDays: 30,
    vendorNotes: 'LogiSupply SARL brings a unique combination of logistics expertise and IT infrastructure management. Our cloud team is AWS Advanced Tier certified and has completed 4 ERP migrations in the MENA region. We propose a phased migration approach to minimize business disruption, with a dedicated war room during the cutover weekend.',
    technicalProposalFileUrl: 'https://logisupply.ma/proposals/techvision-erp-2026.pdf',
    items: [],
  }, tokenC);
  console.log(`  ✓ LogiSupply bid on RFP 1 (id=${bid3?.bids?.slice(-1)[0]?.id ?? 'check'})`);

  // LogiSupply bid on RFP 2 (Office Equipment)
  const bid4 = await post(`/workflows/${rfp2Id}/bids`, {
    referenceNumber: `LOGI-BID-${Date.now()}-2`,
    issueDate: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    sellerCompanyId: companyCId,
    deliveryLeadTime: 14,
    downPaymentPercentage: 0,
    balanceDueDays: 30,
    vendorNotes: 'As a specialized office furniture logistics company, we offer the fastest delivery in Morocco. Our warehouse in Casablanca holds stock for immediate dispatch. Price includes delivery, assembly, and a 3-year warranty on all items.',
    items: [],
  }, tokenC);
  console.log(`  ✓ LogiSupply bid on RFP 2 (id=${bid4?.bids?.slice(-1)[0]?.id ?? 'check'})`);

  // LogiSupply bid on RFP 3 (IT Subscription)
  const bid5 = await post(`/workflows/${rfp3Id}/bids`, {
    referenceNumber: `LOGI-BID-${Date.now()}-3`,
    issueDate: new Date().toISOString(),
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    sellerCompanyId: companyCId,
    deliveryLeadTime: 7,
    downPaymentPercentage: 0,
    balanceDueDays: 15,
    vendorNotes: 'Our NOC (Network Operations Center) operates 24/7 from Casablanca. We guarantee 99.9% uptime SLA with financial penalties for breaches. Monthly fee: MAD 13,500 all-inclusive. Includes 2 on-site visits per month and a dedicated account manager.',
    items: [],
  }, tokenC);
  console.log(`  ✓ LogiSupply bid on RFP 3 (id=${bid5?.bids?.slice(-1)[0]?.id ?? 'check'})`);

  // ── 5. Add a negotiation message on RFP 1 ─────────────────────────────────

  // Get the actual bid IDs from the workflow
  const wf1 = await get(`/workflows/${rfp1Id}`, tokenA);
  const bids1 = wf1?.bids ?? [];
  const softechBid = bids1.find(b => b.biddingSeller?.id === companyBId);
  const logiBid    = bids1.find(b => b.biddingSeller?.id === companyCId);

  if (softechBid?.id) {
    console.log('\nAdding negotiation messages on RFP 1 / Softech bid...');
    // Buyer asks a question
    await post(`/workflows/${rfp1Id}/bids/${softechBid.id}/messages`,
      { content: 'Thank you for your proposal. Can you clarify the breakdown of the MAD 850,000 — specifically how much is allocated to the data migration phase vs. the post-migration support?' },
      tokenA
    );
    // Vendor responds
    await post(`/workflows/${rfp1Id}/bids/${softechBid.id}/messages`,
      { content: 'Of course. The breakdown is: Data migration & infrastructure setup MAD 520,000 (61%), API integrations MAD 180,000 (21%), Staff training MAD 80,000 (9%), and 12-month post-migration support MAD 70,000 (9%). We can adjust the support scope if needed to fit within budget.' },
      tokenB
    );
    // Buyer counter-proposes
    await post(`/workflows/${rfp1Id}/bids/${softechBid.id}/messages`,
      { content: 'Appreciated. We would like to reduce the training budget to MAD 50,000 and extend the post-migration support to 18 months at MAD 90,000. Can you revise your proposal accordingly?' },
      tokenA
    );
    console.log('  ✓ 3 negotiation messages added');
  }

  // ── Done ───────────────────────────────────────────────────────────────────

  console.log('\n✅  Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TEST ACCOUNTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  BUYER  (posted the RFPs):');
  console.log('    Company : TechVision Maroc');
  console.log('    Email   : admin@techvision.ma');
  console.log('    Password: Admin1234!');
  console.log('');
  console.log('  VENDOR 1 (submitted bids on RFP 1 & 2):');
  console.log('    Company : Softech Solutions');
  console.log('    Email   : admin@softech.ma');
  console.log('    Password: Admin1234!');
  console.log('');
  console.log('  VENDOR 2 (submitted bids on RFP 1, 2 & 3):');
  console.log('    Company : LogiSupply SARL');
  console.log('    Email   : admin@logisupply.ma');
  console.log('    Password: Admin1234!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n  WHAT TO TEST:');
  console.log('  1. Log in as admin@techvision.ma → My RFPs → see 3 published RFPs');
  console.log('     → click an RFP → see bids from Softech & LogiSupply');
  console.log('     → click "Review & Negotiate" → chat thread already has 3 messages');
  console.log('     → click "Accept Bid & Generate BC" → BC PDF downloads');
  console.log('  2. Log in as admin@softech.ma → My Bids → see bids on RFP 1 & 2');
  console.log('     → click a bid → BC tab shows "Pending Your Signature"');
  console.log('     → click "Sign & Accept" → contract established');
  console.log('  3. Marketplace tab → see all 3 published RFPs from TechVision');
  console.log('     → submit a new bid as Softech or LogiSupply\n');
}

main().catch(err => { console.error(err); process.exit(1); });
