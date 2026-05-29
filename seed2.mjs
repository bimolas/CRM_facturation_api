import http from 'http';

const BASE_HOST = 'localhost';
const BASE_PORT = 3001;

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);

    const req = http.request(
      { hostname: BASE_HOST, port: BASE_PORT, path, method, headers },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
          catch { resolve({ status: res.statusCode, body: raw }); }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function post(path, body, token) {
  const r = await request('POST', path, body, token);
  if (r.status >= 400) {
    console.error('  ERROR', r.status, path, JSON.stringify(r.body).slice(0, 200));
    return null;
  }
  return r.body;
}

async function get(path, token) {
  const r = await request('GET', path, null, token);
  if (r.status >= 400) return null;
  return r.body;
}

async function main() {
  console.log('\n Seeding demo data...\n');

  // ── Register 3 companies ──────────────────────────────────────────────────

  const regA = await post('/auth/register', {
    company: {
      name: 'TechVision Maroc',
      ice: '001234567000012',
      rc: 'RC-CAS-123456',
      taxIdentifier: 'IF-45678901',
      email: 'contact@techvision.ma',
      physicalAddress: '42 Boulevard Zerktouni, Casablanca 20000, Maroc',
    },
    user: { email: 'admin@techvision.ma', password: 'Admin1234x', role: 'COMPANY_ADMIN' },
  });
  if (!regA) { console.error('Failed Company A'); process.exit(1); }
  const tokenA = regA.access_token;
  const companyAId = regA.company?.id;
  console.log('Company A: TechVision Maroc id=' + companyAId);

  const regB = await post('/auth/register', {
    company: {
      name: 'Softech Solutions',
      ice: '002345678000023',
      rc: 'RC-CAS-234567',
      taxIdentifier: 'IF-56789012',
      email: 'contact@softech.ma',
      physicalAddress: '15 Rue Ibn Sina, Rabat 10000, Maroc',
    },
    user: { email: 'admin@softech.ma', password: 'Admin1234x', role: 'COMPANY_ADMIN' },
  });
  if (!regB) { console.error('Failed Company B'); process.exit(1); }
  const tokenB = regB.access_token;
  const companyBId = regB.company?.id;
  console.log('Company B: Softech Solutions id=' + companyBId);

  const regC = await post('/auth/register', {
    company: {
      name: 'LogiSupply SARL',
      ice: '003456789000034',
      rc: 'RC-CAS-345678',
      taxIdentifier: 'IF-67890123',
      email: 'contact@logisupply.ma',
      physicalAddress: '8 Avenue Hassan II, Marrakech 40000, Maroc',
    },
    user: { email: 'admin@logisupply.ma', password: 'Admin1234x', role: 'COMPANY_ADMIN' },
  });
  if (!regC) { console.error('Failed Company C'); process.exit(1); }
  const tokenC = regC.access_token;
  const companyCId = regC.company?.id;
  console.log('Company C: LogiSupply SARL id=' + companyCId);

  // ── Create 3 RFPs as TechVision ───────────────────────────────────────────

  const rfp1 = await post('/workflows', {
    title: 'ERP Cloud Migration & Integration Services',
    description: 'TechVision Maroc seeks a qualified IT provider to migrate our on-premise ERP to cloud (AWS or Azure). Includes data migration, API integrations with our CRM, staff training, and 12 months post-migration support.',
    technicalCategory: 'IT Services',
    budgetCeiling: 850000,
    submissionDeadline: '2026-07-15',
    expectedDeliveryDate: '2026-10-31',
    currency: 'MAD',
    workflowType: 'service',
    region: 'Casablanca, Maroc',
    requirements: ['5+ years ERP cloud migration experience', 'AWS Advanced Tier or Azure Gold Partner', 'ISO 27001 certified', 'Dedicated project manager'],
    constraints: ['Migration complete before Q4 2026', 'Zero downtime during business hours', 'Data hosted in Morocco or EU'],
    conditions: '30% upfront, 40% at mid-project milestone, 30% on final acceptance.',
    evaluationCriteria: 'Technical expertise 40%, Price 35%, Timeline 15%, References 10%',
    contactEmail: 'procurement@techvision.ma',
  }, tokenA);

  const rfp2 = await post('/workflows', {
    title: 'Supply of 200 Ergonomic Workstations',
    description: 'Procurement of 200 complete ergonomic workstation sets for our new Casablanca HQ. Each set: height-adjustable desk, ergonomic chair, dual monitor arms, keyboard tray, cable management. Delivery and assembly required.',
    technicalCategory: 'Office Equipment',
    budgetCeiling: 420000,
    submissionDeadline: '2026-06-30',
    expectedDeliveryDate: '2026-08-15',
    currency: 'MAD',
    workflowType: 'material',
    region: 'Casablanca, Maroc',
    requirements: ['ISO 9001 certified', '3+ years corporate furniture supply in Morocco', 'Product samples before order', '2-year warranty minimum'],
    constraints: ['Single shipment only', 'Assembly within 5 business days', 'Delivery to 5th floor'],
    conditions: 'Net 45 days upon delivery and quality inspection.',
    evaluationCriteria: 'Price 50%, Quality 30%, Delivery speed 20%',
    contactEmail: 'procurement@techvision.ma',
  }, tokenA);

  const rfp3 = await post('/workflows', {
    title: 'Monthly IT Infrastructure Maintenance Subscription',
    description: 'Managed IT support subscription: 24/7 network monitoring, monthly server maintenance, helpdesk L1/L2, cybersecurity patch management, quarterly audits. 12-month renewable contract.',
    technicalCategory: 'IT Services',
    budgetCeiling: 180000,
    submissionDeadline: '2026-07-01',
    expectedDeliveryDate: '2026-08-01',
    currency: 'MAD',
    workflowType: 'subscription',
    region: 'Casablanca, Maroc',
    requirements: ['Certified IT team (CompTIA/Cisco/Microsoft)', '99.5% uptime SLA', 'Critical response < 2h', 'Monthly KPI dashboard'],
    constraints: ['On-site visits min 2x/month', 'All staff sign NDA', 'Monthly fee max MAD 15,000'],
    conditions: 'Monthly invoicing on 1st of month. Net 15 days.',
    evaluationCriteria: 'SLA terms 40%, Price 35%, Certifications 25%',
    contactEmail: 'it@techvision.ma',
  }, tokenA);

  const rfp1Id = rfp1?.id;
  const rfp2Id = rfp2?.id;
  const rfp3Id = rfp3?.id;
  console.log('RFP 1: ERP Cloud Migration id=' + rfp1Id);
  console.log('RFP 2: Office Equipment id=' + rfp2Id);
  console.log('RFP 3: IT Subscription id=' + rfp3Id);

  // ── Publish all RFPs ──────────────────────────────────────────────────────

  for (const [id, name] of [[rfp1Id, 'RFP1'], [rfp2Id, 'RFP2'], [rfp3Id, 'RFP3']]) {
    if (!id) continue;
    const r = await post('/workflows/' + id + '/publish', {}, tokenA);
    console.log('Published ' + name + ' -> ' + r?.stateCode);
  }

  // ── Submit bids as Softech ────────────────────────────────────────────────

  await post('/workflows/' + rfp1Id + '/bids', {
    referenceNumber: 'SOFT-2026-001',
    issueDate: new Date().toISOString(),
    validUntil: new Date(Date.now() + 45 * 86400000).toISOString(),
    sellerCompanyId: companyBId,
    deliveryLeadTime: 120,
    downPaymentPercentage: 30,
    balanceDueDays: 30,
    vendorNotes: 'Softech Solutions has delivered 7 ERP cloud migrations in Morocco including OCP Group subsidiaries. Our 12 certified engineers will be assigned full-time. We offer 12-month post-migration SLA at no extra cost.',
    items: [],
  }, tokenB);
  console.log('Softech bid on RFP1');

  await post('/workflows/' + rfp2Id + '/bids', {
    referenceNumber: 'SOFT-2026-002',
    issueDate: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
    sellerCompanyId: companyBId,
    deliveryLeadTime: 21,
    downPaymentPercentage: 20,
    balanceDueDays: 45,
    vendorNotes: 'Authorized Steelcase and Herman Miller distributor in Morocco. All 200 sets in stock. Assembly team completes installation in 3 business days.',
    items: [],
  }, tokenB);
  console.log('Softech bid on RFP2');

  // ── Submit bids as LogiSupply ─────────────────────────────────────────────

  await post('/workflows/' + rfp1Id + '/bids', {
    referenceNumber: 'LOGI-2026-001',
    issueDate: new Date().toISOString(),
    validUntil: new Date(Date.now() + 45 * 86400000).toISOString(),
    sellerCompanyId: companyCId,
    deliveryLeadTime: 90,
    downPaymentPercentage: 25,
    balanceDueDays: 30,
    vendorNotes: 'AWS Advanced Tier certified. 4 ERP migrations in MENA region. Phased migration approach to minimize disruption. Dedicated war room during cutover weekend.',
    items: [],
  }, tokenC);
  console.log('LogiSupply bid on RFP1');

  await post('/workflows/' + rfp2Id + '/bids', {
    referenceNumber: 'LOGI-2026-002',
    issueDate: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
    sellerCompanyId: companyCId,
    deliveryLeadTime: 14,
    downPaymentPercentage: 0,
    balanceDueDays: 30,
    vendorNotes: 'Casablanca warehouse with immediate stock. Fastest delivery in Morocco. Price includes delivery, assembly, and 3-year warranty.',
    items: [],
  }, tokenC);
  console.log('LogiSupply bid on RFP2');

  await post('/workflows/' + rfp3Id + '/bids', {
    referenceNumber: 'LOGI-2026-003',
    issueDate: new Date().toISOString(),
    validUntil: new Date(Date.now() + 60 * 86400000).toISOString(),
    sellerCompanyId: companyCId,
    deliveryLeadTime: 7,
    downPaymentPercentage: 0,
    balanceDueDays: 15,
    vendorNotes: 'NOC operates 24/7 from Casablanca. 99.9% uptime SLA with financial penalties. Monthly fee MAD 13,500 all-inclusive. 2 on-site visits/month + dedicated account manager.',
    items: [],
  }, tokenC);
  console.log('LogiSupply bid on RFP3');

  // ── Add negotiation messages on RFP1 / Softech bid ────────────────────────

  const wf1 = await get('/workflows/' + rfp1Id, tokenA);
  const bids1 = wf1?.bids ?? [];
  const softechBid = bids1.find(b => b.biddingSeller?.id === companyBId);

  if (softechBid?.id) {
    await post('/workflows/' + rfp1Id + '/bids/' + softechBid.id + '/messages',
      { content: 'Thank you for your proposal. Can you clarify the cost breakdown — specifically how much is allocated to data migration vs post-migration support?' },
      tokenA
    );
    await post('/workflows/' + rfp1Id + '/bids/' + softechBid.id + '/messages',
      { content: 'Of course. Breakdown: Data migration MAD 520,000 (61%), API integrations MAD 180,000 (21%), Training MAD 80,000 (9%), 12-month support MAD 70,000 (9%). We can adjust scope if needed.' },
      tokenB
    );
    await post('/workflows/' + rfp1Id + '/bids/' + softechBid.id + '/messages',
      { content: 'Appreciated. We would like to reduce training to MAD 50,000 and extend support to 18 months at MAD 90,000. Can you revise your proposal?' },
      tokenA
    );
    console.log('Added 3 negotiation messages on RFP1/Softech bid');
  }

  console.log('\n=== SEED COMPLETE ===\n');
  console.log('BUYER  - TechVision Maroc');
  console.log('  Email   : admin@techvision.ma');
  console.log('  Password: Admin1234x');
  console.log('');
  console.log('VENDOR 1 - Softech Solutions');
  console.log('  Email   : admin@softech.ma');
  console.log('  Password: Admin1234x');
  console.log('');
  console.log('VENDOR 2 - LogiSupply SARL');
  console.log('  Email   : admin@logisupply.ma');
  console.log('  Password: Admin1234x');
}

main().catch(e => { console.error(e); process.exit(1); });
