/* JalDrishti · data.js — mock data model (9 entities), simulated village + scenario engine.
   Demo village: Rampur Khurd · 400 households · zones A(150) B(140) C(110) · 1 borewell pump + 1 overhead tank.
   All values deterministic (seeded) so every demo looks the same. */
'use strict';
const DB = window.DB = {};

const OUTAGE_START = 6 + 10 / 60;           /* pump fault at 06:10 */
const SCHEDULE = '06:00–08:00';
const SCHEDULE_H = 2;

DB.settings = {
  thresholds: { kpa: 70, baselinePct: 85, recoveryMin: 45, confirmFamilies: 3 },
  sla: { high: 4, med: 8, low: 24 },
  languages: ['en', 'hi', 'mr'],
  retentionDays: 365,
  consent: { sms: true, ivr: true }
};

DB.sim = { active: {}, now: 0, timers: [] };
DB.isSim = key => !!DB.sim.active[key];

/* ============ boot-time state (used by reset) ============ */
DB.baseState = null;

/* ================= init ================= */
DB.init = function () {
  const rnd = U.rng(20261019);
  const d = new Date(); d.setHours(10, 15, 0, 0);
  DB.sim.now = d.getTime();
  DB.sim.active = { pumpFault: true };            /* spec demo state: live outage in Zone B */

  DB.village = {
    sujal_gaon_id: 'SG-MH-PUN-0417', name: 'Rampur Khurd', state: 'Maharashtra',
    district: 'Pune', block: 'Haveli', gp: 'Rampur', households: 400,
    zones: ['A', 'B', 'C'], schedule: SCHEDULE
  };

  DB.people = {
    njm: ['Suresh Pawar', 'Kadam Mauli', 'Ramesh Gaikwad'],
    sakhi: ['Meena Bhosale', 'Sunita Kale', 'Rekha Patil'],
    ae: 'Er. D. Kulkarni', panchayat: 'Shri Balaji Shinde',
    state: 'S. Deshpande (DDWS)'
  };

  DB.critical = [
    { name: 'Zilla Parishad School', zone: 'B', hx: 668, hy: 300, icon: 'ph-graduation-cap' },
    { name: 'Anganwadi centre', zone: 'A', hx: 726, hy: 138, icon: 'ph-baby' },
    { name: 'Health sub-centre', zone: 'C', hx: 214, hy: 176, icon: 'ph-first-aid-kit' }
  ];

  buildNodes(rnd);
  buildHouseholds(rnd);
  buildTickets(rnd);
  buildTests(rnd);
  buildAlerts();
  buildAudit();
  buildSync();
  buildPredictions(rnd);
  buildHistory(rnd);
  buildActionsLog();
  buildViewLog();

  DB.sim.active = { pumpFault: true };
  DB.recalc();
  DB.baseState = snapshot();
};

function snapshot() {
  return JSON.parse(JSON.stringify({
    tickets: DB.tickets.map(t => ({ id: t.id, status: t.status, assignee: t.assignee, proof: t.proof, slaDue: t.slaDue })),
    alerts: DB.alerts.map(a => a.id),
    actions: DB.actionsLog.length
  }));
}

/* ================= nodes (entity 2) ================= */
function buildNodes(rnd) {
  const N = DB.nodes = [];
  const push = o => N.push(Object.assign({ status: 'online', battery: 96, signal: 84, lastSeen: Date.now(), bufferDays: 0 }, o));
  push({ id: 'S1', type: 'pump', label: 'Borewell pump', hx: 110, hy: 540, mains: true });
  push({ id: 'S2', type: 'tank', label: 'Overhead tank', hx: 500, hy: 110 });
  push({ id: 'S3', type: 'pipe', label: 'Main line node', hx: 300, hy: 330, pipe: 'P-01', battery: 88, signal: 91 });
  push({ id: 'S4', type: 'pipe', label: 'Main line node', hx: 424, hy: 208, pipe: 'P-01', battery: 74, signal: 86, bufferDays: 1 });
  push({ id: 'S5', type: 'pipe', label: 'Riser node', hx: 176, hy: 432, pipe: 'P-01', battery: 92, signal: 79 });
  const zonesT = [['A', 8, [[640, 190], [760, 170], [870, 196], [912, 250], [846, 130], [700, 128], [600, 246], [790, 240]]],
  ['B', 6, [[604, 330], [720, 362], [840, 392], [884, 452], [770, 430], [648, 412]]],
  ['C', 6, [[382, 152], [272, 204], [162, 252], [128, 330], [220, 300], [320, 250]]]];
  zonesT.forEach(([z, cnt, pts]) => {
    for (let i = 0; i < cnt; i++) {
      const [hx, hy] = pts[i];
      push({ id: 'T' + (DB.nodes.length - 4), type: 'sentinel', label: 'Tail-end sentinel', zone: z, hx, hy, battery: U.rint(rnd, 38, 97), signal: U.rint(rnd, 52, 95), bufferDays: U.rint(rnd, 0, 3) });
    }
  });
  /* renumber sentinels T1..T20 */
  let ti = 1; N.filter(n => n.type === 'sentinel').forEach(n => { n.id = 'T' + ti++; });

  /* pipes for the map */
  DB.pipes = [
    { id: 'P-01', cls: 'main', pts: [[110, 540], [176, 432], [300, 330], [424, 208], [500, 110]] },
    { id: 'P-02', cls: 'dist', zone: 'A', pts: [[500, 110], [560, 168], [640, 190], [760, 170], [870, 196], [912, 250]] },
    { id: 'P-04', cls: 'dist', zone: 'B', pts: [[500, 110], [548, 214], [604, 330], [720, 362], [840, 392], [884, 452]] },
    { id: 'P-09', cls: 'dist', zone: 'C', pts: [[500, 110], [382, 152], [272, 204], [162, 252], [128, 330]] }
  ];
  DB.drain = [[240, 596], [520, 578], [790, 566], [960, 552]];
  DB.toilets = [[846, 224], [686, 214], [900, 300], [762, 398], [860, 430], [200, 286], [140, 290], [300, 236]]
    .map(([hx, hy], i) => ({ hx, hy, id: 'WT-' + (i + 1) }));

  /* live readings */
  DB.pump = { voltage: 231, current: 2.1, currentNormal: 6.8, deliveryKpa: 4, boreM: 18.4, runtime: 0.9, flow: 2.0, flowExpected: 12.4 };
  DB.tank = { level: 78, levelAm: 92, ph: 7.3, orp: 62, ec: 412, turb: 0.9, lastClean: '12 Sep' };

  /* 24h histories (144 × 10-min buckets, 0 = 24h ago) */
  const H = DB.hist = { pumpI: [], pumpV: [], pumpQ: [], tankL: [], orp: [], ph: [] };
  for (let i = 0; i < 144; i++) {
    const hour = ((10.25 - 24 + i / 6) % 24 + 24) % 24;
    const fault = DB.isSim('pumpFault') && hour >= OUTAGE_START;
    H.pumpI.push(+(fault ? 2.1 + Math.sin(i) * 0.12 : 6.7 + Math.sin(i * 0.4) * 0.25).toFixed(2));
    H.pumpV.push(Math.round(230 + Math.sin(i * 0.7) * 4 + (rnd() - .5) * 3));
    H.pumpQ.push(+(fault ? 2.0 : 12.2 + Math.sin(i * 0.3) * 0.6).toFixed(1));
    const lv = fault ? Math.max(41, 92 - (hour - OUTAGE_START) * 3.9) : 92 - 14 * Math.max(0, hour - 6) / 2 + 3 * Math.sin(i * 0.2);
    H.tankL.push(Math.round(DB.clampT(lv, 30, 98)));
    H.ph.push(+(7.35 + Math.sin(i * 0.5) * 0.08).toFixed(2));
    H.orp.push(Math.round(62 + Math.sin(i * 0.33) * 6));
  }
  H.labels = []; for (let i = 0; i < 144; i++) { const t = new Date(DB.sim.now - (143 - i) * 600000); H.labels.push(i % 12 === 0 || i === 143 ? U.pad2(t.getHours()) + ':' + U.pad2(t.getMinutes()) : null); }
  buildNodeSeries(rnd);
}
DB.clampT = (v, a, b) => Math.max(a, Math.min(b, v));

function buildNodeSeries(rnd) {
  /* per-node pressure series derived from nearest household normal pressure */
  DB.nodes.forEach(n => {
    if (n.type === 'pump' || n.type === 'tank') { n.series = null; return; }
    const base = nodeBasePressure(n);
    const pts = [];
    for (let i = 0; i < 144; i++) {
      const hour = ((10.25 - 24 + i / 6) % 24 + 24) % 24;
      let p = base + Math.sin(i * 0.6 + n.hx) * 3.4;
      if (n.zone === 'B' && DB.isSim('pumpFault') && hour >= OUTAGE_START) p = base - (base - bNow(n)) * Math.min(1, (hour - OUTAGE_START) / 4.1);
      pts.push(Math.max(0, +p.toFixed(1)));
    }
    n.series = pts;
    n.burstMarks = n.id === 'T9' ? [{ i: 96, label: 'burst' }] : [];
  });
}
function nodeBasePressure(n) { return DB.clampT(132 - dist(n.hx, n.hy, 500, 110) / 760 * 58, 62, 134); }
function bNow(n) { return Math.max(2, 96 - (dist(n.hx, n.hy, 500, 110) - 150) / 550 * 94); }
function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
DB.nodeBasePressure = nodeBasePressure;

DB.nodeLive = function (n) {
  const i = 143;
  if (n.type === 'pump') {
    const fault = DB.isSim('pumpFault');
    return {
      voltage: fault ? 231 : 230, current: fault ? 2.1 : 6.8, flow: fault ? 2.0 : 12.3,
      runtime: fault ? 0.9 : 4.2, bore: 18.4,
      diagnosis: fault ? 'Pump wear' : 'Running',
      diagCls: fault ? 'red' : 'green'
    };
  }
  if (n.type === 'tank') {
    const cont = DB.isSim('contamination');
    return {
      level: DB.isSim('pumpFault') ? 78 : 91, ph: cont ? 6.6 : 7.3, orp: cont ? 14 : 62,
      ec: cont ? 688 : 412, turb: cont ? 3.8 : 0.9, lastClean: '12 Sep',
      drift: cont ? 'Drift warning: ORP fell 48 mV in 3 h — probe check + field test advised' : null
    };
  }
  const p = n.series ? n.series[i] : 110;
  return { pressure: p, battery: n.battery, signal: n.signal, lastSeen: DB.sim.now - (n.status === 'stale' ? 95 : 2) * 60000, bufferDays: n.bufferDays };
};

/* ================= households (entity 4) ================= */
const HRanges = { A: [1, 150], B: [201, 340], C: [301, 410] };
const branch = {
  A: [[560, 168], [640, 190], [760, 170], [870, 196], [912, 250]],
  B: [[548, 214], [604, 330], [720, 362], [840, 392], [884, 452]],
  C: [[430, 138], [382, 152], [272, 204], [162, 252], [128, 330]]
};
const HIGH12 = ['C-302', 'C-305', 'C-311', 'C-314', 'C-318', 'C-322', 'C-327', 'C-331', 'C-336', 'A-058', 'A-097', 'A-133'];

function buildHouseholds(rnd) {
  const HH = DB.hh = [];
  ['A', 'B', 'C'].forEach(zone => {
    const pts = branch[zone];
    const [n0, n1] = HRanges[zone];
    for (let num = n0; num <= n1; num++) {
      const seg = Math.floor(rnd() * (pts.length - 1));
      const t = rnd();
      const [x1, y1] = pts[seg], [x2, y2] = pts[seg + 1];
      const jx = (rnd() - .5) * 116, jy = (rnd() - .5) * 116;
      const hx = U.clamp(x1 + (x2 - x1) * t + jx, 40, 962);
      const hy = U.clamp(y1 + (y2 - y1) * t + jy, 150, 560);
      const id = `HH-${zone}-${String(num).padStart(4, '0')}`;
      const dTank = dist(hx, hy, 500, 110);
      const normalP = U.clamp(132 - dTank / 760 * 58 + (rnd() - .5) * 7, 66, 134);
      const dDrain = dist(hx, hy, 420, 580);
      const isHigh = HIGH12.includes(zone + '-' + String(num).padStart(3, '0'));
      const distSensor = Math.min(...DB.nodes.filter(n => n.type !== 'pump').map(n => dist(hx, hy, n.hx, n.hy)));
      HH.push({
        id, num, zone, hx: Math.round(hx), hy: Math.round(hy),
        lat: +(18.5210 + (600 - hy) * 0.00013).toFixed(5),
        lng: +(73.8550 + hx * 0.00013).toFixed(5),
        members: U.rint(rnd, 3, 8),
        normalP: Math.round(normalP),
        dTank: Math.round(dTank),
        conf: U.rint(rnd, 82, 93),
        source: 'estimated',
        vl: U.rint(rnd, 18, 52),
        pipeAge: U.rint(rnd, 4, 17),
        spikes: U.rint(rnd, 0, 2),
        restarts: U.rint(rnd, 0, 1),
        isHigh,
        distSensor: Math.round(distSensor),
        calibDate: new Date(DB.sim.now - U.rint(rnd, 4, 28) * 864e5).getTime(),
        calibErr: U.rint(rnd, 4, 11),
        trend7: []
      });
    }
  });

  /* 25 taps measured directly: nearest household to each sentinel/pipe node */
  const measured = new Set();
  DB.nodes.filter(n => n.type === 'sentinel' || n.type === 'pipe').forEach(n => {
    let best = null, bd = 1e9;
    HH.forEach(h => { if (measured.has(h.id)) return; const d = dist(h.hx, h.hy, n.hx, n.hy); if (d < bd) { bd = d; best = h; } });
    if (best) { measured.add(best.id); best.source = 'measured'; best.sensorNode = n.id; best.conf = U.rint(rnd, 91, 97); }
  });
  DB.measuredCount = measured.size;

  /* tap ids: tap = zone + '-' + number (matches spec samples like "tap B-217") */
  HH.forEach(h => { h.tapId = h.zone + '-' + String(h.num).padStart(3, '0'); });

  /* 7-day trends */
  HH.forEach(h => { for (let i = 0; i < 7; i++) h.trend7.push(0); });

  /* spec sample rows — exact values from section 6 */
  const sample = {
    'HH-A-0012': { est_pressure_kpa: 118, est_lpcd: 62, supply_hours: 2.0, confidence_pct: 94, source: 'measured', risk_score: 12, daily_score: 96, members: 5 },
    'HH-B-0217': { est_pressure_kpa: 4, est_lpcd: 0, supply_hours: 0.0, confidence_pct: 88, source: 'estimated', risk_score: 81, daily_score: 22, members: 6 },
    'HH-B-0221': { est_pressure_kpa: 58, est_lpcd: 41, supply_hours: 1.2, confidence_pct: 83, source: 'estimated', risk_score: 67, daily_score: 54, members: 4 },
    'HH-C-0309': { est_pressure_kpa: 86, est_lpcd: 57, supply_hours: 1.8, confidence_pct: 90, source: 'estimated', risk_score: 24, daily_score: 88, members: 5 }
  };
  DB.samples = sample;
  DB.sampleHH = {};
  Object.keys(sample).forEach(id => { const h = HH.find(x => x.id === id); if (h) DB.sampleHH[id] = h; });

  /* last tests for a few taps */
  const testsTap = ['B-217', 'C-0309', 'A-012', 'C-0305', 'A-047', 'B-0260', 'C-0322', 'A-101', 'B-0311', 'C-0338'];
  HH.forEach(h => {
    if (testsTap.includes(h.tapId)) h.lastTest = { date: DB.sim.now - U.rint(rnd, 1, 6) * 864e5, result: h.tapId === 'B-217' ? 'Low residual chlorine (0.18 mg/L) — first-flush advisory issued' : 'Within advisory range', cls: h.tapId === 'B-217' ? 'amber' : 'green' };
  });
}

/* ================= live computation ================= */
DB.hhPressureAt = function (h, bucket) {
  const hour = ((10.25 - 24 + bucket / 6) % 24 + 24) % 24;
  const noise = Math.sin(bucket * 0.55 + h.num) * 2.6;
  let p = h.normalP + noise;
  if (h.zone === 'B' && DB.isSim('pumpFault') && hour >= OUTAGE_START) {
    const nowP = bNow(h);
    p = h.normalP - (h.normalP - nowP) * Math.min(1, Math.pow((hour - OUTAGE_START) / 4.1, 0.8)) + noise * 0.4;
  }
  if (h.zone === 'C' && DB.isSim('lowPressure') && h.hx < 340 && hour >= 9) {
    p = h.normalP - (h.normalP - 58) * Math.min(1, (hour - 9) / 1.2) + noise * 0.4;
  }
  return Math.max(0, p);
};

DB.recalc = function () {
  const barrierBase = DB.isSim('contamination') ? 31 : 74;   /* chlorine proxy from tank ORP */
  let highRisk = 0, functional = 0, estToday = 0;
  DB.hh.forEach(h => {
    const nowP = DB.hhPressureAt(h, 143);
    h.nowP = Math.round(nowP);
    /* supply hours so far today (buckets from 00:00 to now, p >= 45) */
    let hrs = 0, lowMin = 0;
    for (let b = 0; b < 144; b++) {
      const hour = ((10.25 - 24 + b / 6) % 24 + 24) % 24;
      if (hour < 10.25) { const p = DB.hhPressureAt(h, b); if (p >= 45) hrs += 10 / 60; if (p < DB.settings.thresholds.kpa) lowMin += 10; }
    }
    h.hours = Math.round(hrs * 10) / 10;
    h.lowMin = lowMin;
    h.spikesLive = h.spikes + (DB.isSim('contamination') && h.zone === 'A' ? 4 : 0);
    h.barrier = h.isHigh ? Math.min(barrierBase, 45) : barrierBase;
    h.hazard = U.clamp(Math.round(lowMin / 240 * 70 + h.spikesLive * 6 + h.restarts * 5), 0, 100);
    h.ingress = nowP < 10 ? 15 : 0;
    h.risk = U.clamp(Math.round(0.45 * h.hazard + 0.35 * h.vl + 0.20 * (100 - h.barrier) + h.ingress), 2, 98);
    if (h.isHigh) h.risk = U.clamp(Math.max(h.risk, 72 + (h.num % 13)), 70, 96);
    /* lpcd from current pressure */
    h.lpcd = Math.round(lpcdFromP(nowP, h));
    const q = Math.min(100, h.lpcd / 55 * 100);
    const outageCredit = (h.zone === 'B' && DB.isSim('pumpFault')) ? 45 : 0;
    const reg = Math.max(Math.min(100, h.hours / SCHEDULE_H * 100), outageCredit);
    h.score = U.clamp(Math.round(0.3 * q + 0.3 * reg + 0.4 * (100 - h.risk)), 0, 99);
    h.functional = h.lpcd >= 40 && h.hours >= 1.0;
    if (h.functional) functional++;
    if (h.source === 'estimated') estToday++;
    if (h.risk >= 70 && h.nowP > 10) highRisk++;
  });
  /* apply spec sample rows exactly (only while their scenario state matches the spec demo state) */
  if (DB.isSim('pumpFault') && !DB.isSim('lowPressure') && !DB.isSim('contamination')) {
    Object.entries(DB.samples).forEach(([id, s]) => {
      const h = DB.hh.find(x => x.id === id); if (!h) return;
      h.nowP = s.est_pressure_kpa; h.lpcd = s.est_lpcd; h.hours = s.supply_hours;
      h.conf = s.confidence_pct; h.source = s.source; h.risk = s.risk_score; h.score = s.daily_score;
      h.members = s.members; h.functional = s.daily_score >= 60;
    });
    functional = DB.hh.filter(h => h.functional).length;
    estToday = DB.hh.filter(h => h.source === 'estimated').length;
    highRisk = DB.hh.filter(h => h.risk >= 70 && h.nowP > 10).length;
  }
  /* 7-day trends seeded around today's score */
  const r2 = U.rng(777);
  DB.hh.forEach(h => { h.trend7 = []; for (let i = 0; i < 6; i++) h.trend7.push(U.clamp(h.score + U.rint(r2, -9, 7), 5, 99)); h.trend7.push(h.score); });

  DB.kpi = {
    functionalPct: Math.round(functional / 400 * 1000) / 10,
    functional,
    estimated: estToday,
    openTickets: DB.tickets.filter(t => !['closed'].includes(t.status)).length,
    overdue: DB.tickets.filter(t => t.status !== 'closed' && t.slaDue < DB.sim.now).length,
    highRisk,
    medianRepair: median(DB.tickets.filter(t => t.status === 'closed').map(t => t.repairMin))
  };
  DB.pamaan = Math.round(DB.hh.reduce((s, h) => s + h.score, 0) / 400);
  DB.integrity = DB.auditOk ? (DB.kpi.estimated / 400 > 0.45 ? 'amber' : 'green') : 'red';
  if (DB.auditPending) DB.integrity = 'amber';
  buildNodeSeries(U.rng(4242)); /* refresh node series for active scenarios */
};
function lpcdFromP(p, h) {
  if (p < 12) return 0;
  let v;
  if (p >= 110) v = 62; else if (p >= 95) v = 55; else if (p >= 80) v = 49;
  else if (p >= 65) v = 42; else if (p >= 50) v = 33; else if (p >= 30) v = 20; else v = 6;
  return U.clamp(v + ((h.num * 7) % 7) - 3, 0, 70);
}
function median(arr) { if (!arr.length) return 0; const a = [...arr].sort((x, y) => x - y); const m = Math.floor(a.length / 2); return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2); }

/* ================= tickets (entity 5) ================= */
function buildTickets(rnd) {
  const now = DB.sim.now, M = 60000;
  DB.tickets = [
    {
      id: 'TKT-1041', type: 'pump', typeName: 'Pump fault', zone: 'B',
      diagnosis: 'Pump wear: normal voltage, low current (2.1 A vs 6.8 A expected)',
      hhAffected: 140, critical: ['Zilla Parishad School', 'Anganwadi centre'],
      priority: 92, parts: { hh: 35, hours: 30, risk: 20, critical: 7 },
      status: 'escalated', created: now - (10.25 - 6.23) * 3600e3, slaDue: now - 42 * M,
      assignee: 'Suresh Pawar', truth: { score: 88, sensor: 95, complaint: 82, test: 70 },
      source: 'sensor', unread: true,
      proof: {
        photo: { state: 'amber', gpsKm: 1.2, afterOpen: true, reused: false, note: 'Photo flagged: 1.2 km from the fault point. Retake needed at the pump house.' },
        pressure: { state: 'red', minutes: 0 },
        families: { state: 'grey', confirmed: 0, total: 3 }
      }
    },
    {
      id: 'TKT-1042', type: 'pressure', typeName: 'Low pressure', zone: 'C',
      diagnosis: 'Tail-end pressure 58 kPa (< 70 kPa threshold) since 07:40 on pipe P-09',
      hhAffected: 38, critical: [], priority: 71, parts: { hh: 26, hours: 18, risk: 20, critical: 7 },
      status: 'awaiting', created: now - (10.25 - 7.7) * 3600e3, slaDue: now + 2.6 * 3600e3,
      assignee: 'Kadam Mauli', truth: { score: 76, sensor: 88, complaint: 64, test: 72 },
      source: 'sensor',
      proof: {
        photo: { state: 'green', gpsKm: 0.06, afterOpen: true, reused: false, variant: 1 },
        pressure: { state: 'amber', minutes: 31 },
        families: { state: 'amber', confirmed: 2, total: 3 }
      }
    },
    {
      id: 'TKT-1043', type: 'leak', typeName: 'Leak / burst', zone: 'A',
      diagnosis: 'Burst joint on distribution line P-02 near tap A-047 — ground wetting reported',
      hhAffected: 24, critical: [], priority: 64, parts: { hh: 20, hours: 22, risk: 15, critical: 7 },
      status: 'repair', created: now - (10.25 - 8.83) * 3600e3, slaDue: now + 3.4 * 3600e3,
      assignee: 'Ramesh Gaikwad', truth: { score: 81, sensor: 74, complaint: 88, test: 80 },
      source: 'citizen',
      proof: { photo: { state: 'grey', minutes: 0 }, pressure: { state: 'grey', minutes: 0 }, families: { state: 'grey', confirmed: 0, total: 3 } }
    },
    {
      id: 'TKT-1044', type: 'contam', typeName: 'Contamination risk', zone: 'B',
      diagnosis: 'Citizen report of cloudy water near tap B-217; risk index 81, low residual chlorine',
      hhAffected: 42, critical: [], priority: 58, parts: { hh: 22, hours: 12, risk: 19, critical: 5 },
      status: 'assigned', created: now - (10.25 - 8.2) * 3600e3, slaDue: now + 4.1 * 3600e3,
      assignee: null, truth: { score: 61, sensor: 70, complaint: 85, test: 40 },
      source: 'citizen',
      proof: { photo: { state: 'grey' }, pressure: { state: 'grey', minutes: 0 }, families: { state: 'grey', confirmed: 0, total: 3 } }
    },
    {
      id: 'TKT-1045', type: 'node', typeName: 'Node offline', zone: 'A',
      diagnosis: 'Sentinel T7 stopped reporting at 05:55 — possible battery or LoRa module failure',
      hhAffected: 0, critical: [], priority: 34, parts: { hh: 8, hours: 12, risk: 9, critical: 5 },
      status: 'new', created: now - (10.25 - 9.85) * 3600e3, slaDue: now + 14 * 3600e3,
      assignee: null, truth: { score: 92, sensor: 98, complaint: 0, test: 80 },
      source: 'sensor',
      proof: { photo: { state: 'grey' }, pressure: { state: 'grey', minutes: 0 }, families: { state: 'grey', confirmed: 0, total: 0 } }
    },
    {
      id: 'TKT-1046', type: 'quality', typeName: 'Water quality', zone: 'C',
      diagnosis: 'Voice complaint (Bhashini-transcribed): "पानी में गंध आ रही है" near tap C-0331',
      hhAffected: 18, critical: [], priority: 55, parts: { hh: 16, hours: 16, risk: 18, critical: 5 },
      status: 'new', created: now - (10.25 - 9.35) * 3600e3, slaDue: now + 6.5 * 3600e3,
      assignee: null, truth: { score: 57, sensor: 45, complaint: 90, test: 35 },
      source: 'citizen',
      proof: { photo: { state: 'grey' }, pressure: { state: 'grey', minutes: 0 }, families: { state: 'grey', confirmed: 0, total: 3 } }
    },
    /* closed history — feeds median repair time + reused-photo demo */
    closed('TKT-1037', 'pressure', 'Low pressure', 'A', 'Sediment blockage at meter assembly cleared', 19, 96, 2, 'Kadam Mauli', now - 2 * 864e5),
    closed('TKT-1038', 'leak', 'Leak / burst', 'C', 'Burst 63 mm pipe section replaced on P-09', 31, 142, 1, 'Ramesh Gaikwad', now - 864e5),
    closed('TKT-1039', 'pump', 'Pump fault', 'B', 'Impeller worn — replaced, motor re-greased', 140, 210, 3, 'Suresh Pawar', now - 3 * 864e5)
  ];
}
function closed(id, type, typeName, zone, diagnosis, hh, repairMin, fam, assignee, created) {
  return {
    id, type, typeName, zone, diagnosis, hhAffected: hh, critical: [], priority: 40, parts: { hh: 15, hours: 10, risk: 10, critical: 5 },
    status: 'closed', created, slaDue: created + 4 * 3600e3, closedAt: created + repairMin * 60000, repairMin,
    assignee, truth: { score: 85, sensor: 80, complaint: 78, test: 90 }, source: 'sensor',
    proof: {
      photo: { state: 'green', gpsKm: 0.04, afterOpen: true, reused: false, variant: 1 },
      pressure: { state: 'green', minutes: 45 }, families: { state: 'green', confirmed: fam, total: fam }
    }
  };
}

/* ================= tests (entity 6) ================= */
function buildTests(rnd) {
  const testers = DB.people.sakhi;
  const rows = [
    ['B-217', 1, 8.4, ['Free chlorine', 'pH', 'Turbidity'], { cl: 0.18, ph: 7.1, turb: 1.4 }, 93, true, 'uploaded', 'released', 'amber'],
    ['C-0309', 1, 7.9, ['Free chlorine', 'pH'], { cl: 0.42, ph: 7.4, turb: 0.8 }, 95, true, 'uploaded', 'released', 'green'],
    ['A-012', 0, 7.6, ['Free chlorine', 'pH', 'Turbidity'], { cl: 0.51, ph: 7.3, turb: 0.6 }, 96, true, 'uploaded', 'released', 'green'],
    ['C-0305', 2, 7.2, ['Free chlorine', 'Turbidity'], { cl: 0.22, ph: 7.2, turb: 1.9 }, 88, true, 'uploaded', 'payment-ready', 'amber'],
    ['A-047', 0, 7.0, ['Free chlorine', 'pH'], { cl: 0.47, ph: 7.4, turb: 0.7 }, 94, true, 'uploaded', 'released', 'green'],
    ['B-0260', 1, 16.8, ['Free chlorine', 'pH', 'Turbidity'], { cl: 0.39, ph: 7.2, turb: 0.9 }, 92, true, 'uploaded', 'released', 'green'],
    ['C-0322', 2, 16.2, ['Free chlorine', 'Turbidity'], { cl: 0.21, ph: 7.1, turb: 2.2 }, 86, true, 'pending', 'payment-ready', 'amber'],
    ['A-101', 0, 15.9, ['Free chlorine', 'pH'], { cl: 0.55, ph: 7.5, turb: 0.5 }, 97, true, 'uploaded', 'released', 'green'],
    ['B-0311', 1, 15.5, ['Free chlorine', 'pH'], { cl: 0.44, ph: 7.3, turb: 0.8 }, 93, true, 'uploaded', 'released', 'green'],
    ['C-0338', 2, 15.1, ['Free chlorine', 'Turbidity'], { cl: 0.30, ph: 7.2, turb: 1.1 }, 90, false, 'pending', 'payment-ready', 'amber'],
    ['A-076', 0, 6.6, ['Free chlorine', 'pH'], { cl: 0.49, ph: 7.4, turb: 0.6 }, 95, true, 'uploaded', 'released', 'green'],
    ['B-0290', 1, 6.3, ['Free chlorine', 'Turbidity'], { cl: 0.41, ph: 7.3, turb: 0.9 }, 91, true, 'uploaded', 'released', 'green']
  ];
  DB.tests = rows.map((r, i) => {
    const dayOffset = r[2] >= 15 ? 1 : r[2] >= 7 ? 2 : 0;
    const ts = new Date(DB.sim.now - dayOffset * 864e5); ts.setHours(Math.floor(r[2]), Math.round((r[2] % 1) * 60));
    const patches = ['#E8DCC0', '#9FD4E8', '#C8B7DE'];
    return {
      id: 'TST-' + (2201 + i), tapId: r[0], tester: testers[r[1]], ts: ts.getTime(), params: r[3],
      ai: r[4], confidence: r[5], verified: r[6], wqmis: r[7], payment: r[8], resultCls: r[9],
      strip: [patches[0], r[9] === 'green' ? '#3FA66A' : '#D8B23C', patches[2]],
      photoVariant: i % 3
    };
  });
  DB.testPayments = { released: DB.tests.filter(t => t.payment === 'released').length * 200, ready: DB.tests.filter(t => t.payment === 'payment-ready').length * 200, rate: 200 };
  /* Jal Sakhi today list: taps ranked by risk */
  const ranked = [...DB.hh].filter(h => h.nowP > 10).sort((a, b) => b.risk - a.risk).slice(0, 5);
  DB.sakhiToday = ranked.map((h, i) => ({
    tapId: h.tapId, risk: h.risk, score: h.score,
    note: i === 0 ? 'Test after supply restart' : h.risk >= 55 ? 'Tail-end — test for residual chlorine' : 'Routine monthly sample'
  }));
}

/* ================= alerts (entity 7) ================= */
function buildAlerts() {
  const now = DB.sim.now, M = 60000;
  DB.alerts = [
    {
      id: 'ALT-7701', type: 'pump_fault', typeName: 'Pump fault', sev: 'critical', zone: 'B', ts: now - (10.25 - 6.12) * 3600e3,
      hh: 140, root: 'Motor current 2.1 A vs 6.8 A expected — pump wear suspected at borewell pump S1',
      ticket: 'TKT-1041', unread: true,
      channels: [
        { kind: 'SMS', langs: ['hi', 'mr', 'en'] }, { kind: 'IVR', langs: ['hi', 'mr'] }
      ],
      msg: {
        en: 'JalDrishti: Water supply in Zone B, Rampur Khurd is interrupted since 06:10. Suspected pump fault. Ticket TKT-1041. Next update by 12:00. Give missed call 1800-123-4567 for status.',
        hi: 'जलदृष्टि: रामपुर खुर्ड, ज़ोन B में 06:10 से पानी की आपूर्ति बाधित है। संभावित कारण: पंप खराबी। टिकट TKT-1041। अगली जानकारी 12:00 बजे तक। स्थिति के लिए 1800-123-4567 पर मिस्ड कॉल करें।',
        mr: 'जलदृष्टी: रामपूर खुर्ड, झोन B मध्ये 06:10 पासून पाणी पुरवठा बंद आहे. शक्य कारण: पंप दोष. तिकीट TKT-1041. पुढील माहिती 12:00 पर्यंत. स्थितीसाठी 1800-123-4567 वर मिस्ड कॉल करा.'
      },
      ivr: {
        en: 'Hello, this is JalDrishti. Water supply to your area is interrupted due to a pump fault. A repair team has been assigned. You will receive an update by 12 o\'clock. Press 1 to repeat.',
        hi: 'नमस्ते, यह जलदृष्टि है। आपके क्षेत्र में पंप खराबी के कारण पानी की आपूर्ति बाधित है। मरम्मत दल नियुक्त किया गया है। 12 बजे तक अपडेट मिलेगा। दोहराने के लिए 1 दबाएँ।',
        mr: 'नमस्कार, ही जलदृष्टी आहे. पंप दोषामुळे तुमच्या भागात पाणी पुरवठा बंद आहे. दुरुस्ती टोली नेमून दिली आहे. 12 वाजेपर्यंत अपडेट मिळेल. पुन्हा ऐकण्यासाठी 1 दाबा.'
      }
    },
    alert('ALT-7702', 'supply_outage', 'Supply outage', 'critical', 'B', 6.3, 140, 'Borewell pump stopped during morning supply window — overhead tank draining', 'TKT-1041'),
    alert('ALT-7703', 'low_pressure', 'Low pressure', 'medium', 'C', 7.75, 38, 'Tail-end pressure 58 kPa below 70 kPa threshold on pipe P-09', 'TKT-1042'),
    alert('ALT-7704', 'contam', 'Contamination risk', 'high', 'B', 8.2, 42, 'Risk index 81 near tap B-217: low residual chlorine + low pressure minutes', 'TKT-1044'),
    alert('ALT-7705', 'citizen', 'Citizen complaint', 'medium', 'B', 8.35, 6, 'Voice note (Bhashini: Hindi → Marathi): "water is cloudy since morning" — tap B-217', 'TKT-1044'),
    alert('ALT-7706', 'leak', 'Leak / burst', 'high', 'A', 8.9, 24, 'Ground wetting + flow anomaly on P-02 near tap A-047 — burst suspected', 'TKT-1043'),
    alert('ALT-7707', 'probe_drift', 'Probe drift', 'medium', 'A', 9.1, 0, 'Sentinel T12 pH probe drift 0.4 units vs tank reference — field check advised', null),
    alert('ALT-7708', 'escalation', 'SLA missed', 'critical', 'B', 9.55, 140, 'Ticket TKT-1041 crossed SLA without closure — escalated to Assistant Engineer', 'TKT-1041'),
    alert('ALT-7709', 'test', 'Test verified', 'low', 'A', 7.6, 0, 'Jal Sakhi sample at tap A-012 verified · released via PFMS', null)
  ];
  DB.unread = () => DB.alerts.filter(a => a.unread).length;
}
function alert(id, type, typeName, sev, zone, hour, hh, root, ticket) {
  const ts = new Date(DB.sim.now); ts.setHours(Math.floor(hour), Math.round((hour % 1) * 60));
  return { id, type, typeName, sev, zone, ts: ts.getTime(), hh, root, ticket, unread: hour > 9, channels: [{ kind: 'SMS', langs: ['hi', 'mr'] }], msg: null, ivr: null };
}

/* ================= audit + sync (entities 8, 9) ================= */
function buildAudit() {
  const days = [];
  let prev = '000000000000';
  for (let i = 6; i >= 0; i--) {
    const d = new Date(DB.sim.now - i * 864e5);
    const count = 388 + ((d.getDate() * 13) % 47);
    const dailyHash = U.hash(d.toDateString() + '|' + count + '|' + prev);
    days.push({ date: d.getTime(), count, dailyHash, prev });
    prev = dailyHash;
  }
  DB.audit = days;
  DB.auditOk = true; DB.auditPending = false;
}
function buildSync() {
  DB.sync = [
    { system: 'IMIS', fullName: 'Integrated Management Information System', last: t(3, 30), sent: 1286, pending: 12, failed: 0, recon: 99.1, icon: 'ph-building' },
    { system: 'WQMIS', fullName: 'Water Quality Management Information System', last: t(8, 15), sent: 46, pending: 3, failed: 1, recon: 97.8, icon: 'ph-flask' },
    { system: 'Sujal Gaon', fullName: 'Sujal Gaon ID registry', last: t(2, 0), sent: 400, pending: 0, failed: 0, recon: 100, icon: 'ph-fingerprint' }
  ];
  function t(h, m) { const d = new Date(DB.sim.now); d.setHours(h, m); return d.getTime(); }
}

/* ================= predictions ================= */
function buildPredictions(rnd) {
  const ratio = [], flow = [], cur = [];
  for (let i = 0; i < 30; i++) {
    ratio.push(+(0.96 - i * 0.006 + (rnd() - .5) * 0.02).toFixed(3));
    flow.push(+(12.2 + (rnd() - .5) * 0.8).toFixed(1));
    cur.push(+(6.8 - i * 0.02 + (rnd() - .5) * 0.3).toFixed(1));
  }
  DB.predictions = {
    pump: { ratio, flow, cur, wearDrift: 18, daysToWarn: 12 },
    sections: [
      { id: 'P-04', zone: 'B', laid: 2011, lowEvents: 9, bursts: 2, risk: 78, hx: 660, hy: 348, note: 'Repeated low-pressure evenings; 14-year galvanised pipe near school branch' },
      { id: 'P-09', zone: 'C', laid: 2015, lowEvents: 6, bursts: 1, risk: 64, hx: 272, hy: 204, note: 'Tail-end complaints rising; upstream leakage suspected' },
      { id: 'P-02', zone: 'A', laid: 2019, lowEvents: 3, bursts: 0, risk: 41, hx: 760, hy: 170, note: 'Joint seepage reported once; monitor after monsoon' }
    ]
  };
}

/* ================= 30-day history ================= */
function buildHistory(rnd) {
  const arr = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(DB.sim.now - i * 864e5);
    const weekend = d.getDay() === 0;
    const score = U.clamp(87 - (weekend ? 3 : 0) + U.rint(rnd, -4, 3) - (i < 1 ? 3 : 0), 70, 95);
    arr.push({ date: d.getTime(), score, functional: U.clamp(score + U.rint(rnd, -3, 4), 70, 97) });
  }
  DB.history30 = arr;
}

function buildActionsLog() {
  const now = DB.sim.now;
  DB.actionsLog = [
    { ts: now - (10.25 - 6.5) * 3600e3, text: 'First-flush advisory sent to 38 homes (Zone B) — SMS + IVR in मराठी, हिन्दी' },
    { ts: now - (10.25 - 8.5) * 3600e3, text: 'Jal Sakhi routed to tap B-217 — strip test scheduled after supply restart' },
    { ts: now - (10.25 - 9.6) * 3600e3, text: 'Ticket TKT-1041 escalated to Assistant Engineer (SLA missed)' }
  ];
}
function buildViewLog() {
  const now = DB.sim.now;
  DB.viewLog = [
    { who: 'Assistant Engineer', what: 'HH-B-0217 · household panel', ts: now - 40 * 60000 },
    { who: 'Gram Panchayat', what: 'Village register (aggregate)', ts: now - 95 * 60000 },
    { who: 'State official', what: 'Block Haveli roll-up', ts: now - 3 * 3600e3 }
  ];
}

/* ================= scenario engine (Screen 16) ================= */
DB.scenarios = [
  {
    key: 'pumpFault', icon: 'ph-plug', title: 'Pump fault in Zone B',
    desc: 'Borewell pump S1 draws normal voltage but low current. Zone B loses supply as the tank drains. Creates the escalation chain.',
    sms: {
      en: 'JalDrishti: Supply in Zone B interrupted since 06:10 (pump fault). Ticket TKT-1041. Updates by 12:00.',
      hi: 'जलदृष्टि: ज़ोन B में 06:10 से पानी बाधित (पंप खराबी)। टिकट TKT-1041। 12:00 तक अपडेट।',
      mr: 'जलदृष्टी: झोन B मध्ये 06:10 पासून पुरवठा बंद (पंप दोष). तिकीट TKT-1041. 12:00 पर्यंत अपडेट.'
    },
    ivr: {
      en: 'Water supply to your area is interrupted due to a pump fault. Repair team assigned. Update by 12 o\'clock.',
      hi: 'पंप खराबी के कारण आपके क्षेत्र में पानी बाधित है। दल नियुक्त। 12 बजे तक अपडेट।',
      mr: 'पंप दोषामुळे तुमच्या भागात पाणी पुरवठा बंद आहे. टोली नेमून दिली. 12 वाजेपर्यंत अपडेट.'
    }
  },
  {
    key: 'lowPressure', icon: 'ph-gauge', title: 'Low-pressure event (Zone C tail)',
    desc: 'Tail-end pressure in Zone C drops to 58 kPa. Hazard minutes rise, contamination risk climbs on 38 homes.',
    sms: {
      en: 'JalDrishti: Low pressure at Zone C tail ends (58 kPa). Water may arrive late today. Store water in the morning window.',
      hi: 'जलदृष्टि: ज़ोन C के अंतिम छोर पर कम दबाव (58 kPa)। आज पानी देर से आ सकता है। सुबह की आपूर्ति में पानी सुरक्षित रखें।',
      mr: 'जलदृष्टी: झोन C च्या टोकाला कमी दाब (58 kPa). आज पाणी उशिरा येऊ शकते. सकाळच्या पुरवठ्यात पाणी जतन करा.'
    },
    ivr: {
      en: 'Low water pressure is being reported at tail ends. Supply may be delayed. Please store drinking water in the morning.',
      hi: 'अंतिम छोरों पर दबाव कम है। आपूर्ति विलंबित हो सकती है। सुबह पीने का पानी सुरक्षित रखें।',
      mr: 'टोकाला पाण्याचा दाब कमी आहे. पुरवठा उशिरा होऊ शकतो. सकाळी पिण्याचे पाणी जतन करा.'
    }
  },
  {
    key: 'contamination', icon: 'ph-drop-half', title: 'Contamination risk spike',
    desc: 'Tank ORP falls 48 mV and pH drifts — chlorine proxy collapses. Zone A risk heatmap lights up; first-flush advisories go out.',
    sms: {
      en: 'JalDrishti advisory: Water quality parameters shifted at overhead tank. Use first-flush running water for 2 minutes. Test team dispatched.',
      hi: 'जलदृष्टि सलाह: ओवरहेड टैंक के पाने के पैरामीटर बदले हैं। 2 मिनट तक नल चलाकर ही पानी उपयोग करें। जाँच दल भेजा जा रहा है।',
      mr: 'जलदृष्टी सल्ला: ओव्हरहेड टँकमधील पाण्याचे निर्देशक बदलले आहेत. 2 मिनिटे नळ सोडून दिल्यावरच वापरा. चाचणी टोली पाठवली आहे.'
    },
    ivr: {
      en: 'A water quality advisory is in effect. Run the tap for two minutes before use. A test team is on the way.',
      hi: 'जल गुणवत्ता की सलाह जारी है। उपयोग से पहले 2 मिनट नल चलाएँ। जाँच दल आ रहा है।',
      mr: 'पाणी गुणवत्तेचा सल्ला जारी आहे. वापरण्यापूर्वी नळ 2 मिनिटे सोडा. चाचणी टोली येत आहे.'
    }
  },
  {
    key: 'nodeOffline', icon: 'ph-wifi-slash', title: 'Node offline (sentinel T7)',
    desc: 'Sentinel T7 stops reporting. Its tail-end homes fall back to estimates with lower confidence until the node is revived.',
    sms: { en: 'Internal alert only — no citizen message is sent for node downtime.', hi: 'केवल आंतरिक अलर्ट — नोड बंद होने पर नागरिक संदेश नहीं भेजा जाता।', mr: 'केवल आंतरिक इशारा — नोड बंद असताना नागरिकांना संदेश पाठवला जात नाही.' },
    ivr: { en: '—', hi: '—', mr: '—' }
  },
  {
    key: 'reusedPhoto', icon: 'ph-images', title: 'Reused repair photo (lock test)',
    desc: 'A technician uploads a photo already used on TKT-1037. The proof lock must reject it and name the reason.',
    sms: { en: 'JalDrishti: Repair photo for TKT-1042 was rejected — image already used on TKT-1037. Please capture a fresh photo at the site.', hi: 'जलदृष्टि: TKT-1042 की मरम्मत फोटो अस्वीकृत — छवि पहले TKT-1037 में उपयोग हो चुकी है। कृपया साइट पर नई फोटो लें।', mr: 'जलदृष्टी: TKT-1042 चा दुरुस्ती फोटो नाकारला — प्रतिमा आधीच TKT-1037 मध्ये वापरली आहे. कृपया ठिकाणी नवीन फोटो काढा.' },
    ivr: { en: 'Your repair photo was rejected because the image was used before. Please capture a new photo at the repair site.', hi: 'आपकी मरम्मत फोटो अस्वीकृत हुई — छवि पहले उपयोग हो चुकी है। कृपया नई फोटो लें।', mr: 'तुमचा दुरुस्ती फोटो नाकारला गेला — प्रतिमा आधी वापरली आहे. कृपया नवीन फोटो काढा.' }
  },
  {
    key: 'confirmations', icon: 'ph-phone-call', title: 'Family confirmations arriving',
    desc: 'IVR confirmations from affected households stream in — the family proof check on the awaiting-proof ticket fills to green.',
    sms: { en: 'JalDrishti: Water supply restored at your tap. Reply 1 to confirm, 2 if the problem continues.', hi: 'जलदृष्टि: आपके नल पर पानी बहाल हुआ। पुष्टि हेतु 1 भेजें, समस्या बनी रहने पर 2 भेजें।', mr: 'जलदृष्टी: तुमच्या नळावर पाणी पुन्हा सुरू झाले आहे. खात्रीसाठी 1 पाठवा, अडचण असल्यास 2 पाठवा.' },
    ivr: { en: 'Water supply has been restored. Press 1 to confirm, or 2 if you still face a problem.', hi: 'पानी बहाल हो गया है। पुष्टि के लिए 1 दबाएँ, समस्या हो तो 2 दबाएँ।', mr: 'पाणी पुन्हा सुरू झाले आहे. खात्रीसाठी 1 दाबा, अडचण असल्यास 2 दाबा.' }
  }
];

DB.applyScenario = function (key, on) {
  DB.sim.active[key] = on;
  if (key === 'pumpFault' && on) {
    pushAlert({
      id: 'ALT-77' + U.rint(U.rng(Date.now() % 9999), 10, 99), type: 'pump_fault', typeName: 'Pump fault', sev: 'critical', zone: 'B',
      root: 'Motor current 2.1 A vs 6.8 A expected — pump wear suspected', ticket: 'TKT-1041', hh: 140
    });
  }
  if (key === 'lowPressure' && on) {
    pushAlert({ id: 'ALT-78' + U.rint(U.rng(Date.now() % 9999), 10, 99), type: 'low_pressure', typeName: 'Low pressure', sev: 'medium', zone: 'C', root: 'Tail-end pressure 58 kPa below 70 kPa threshold on pipe P-09', hh: 38 });
    DB.actionsLog.unshift({ ts: DB.sim.now, text: 'Pressure advisory queued for 38 Zone C homes — SMS in मराठी, हिन्दी' });
  }
  if (key === 'contamination' && on) {
    pushAlert({ id: 'ALT-79' + U.rint(U.rng(Date.now() % 9999), 10, 99), type: 'contam', typeName: 'Contamination risk', sev: 'high', zone: 'A', root: 'Tank ORP fell 48 mV in 3 h — chlorine proxy collapsed, risk index rising in Zone A', hh: 56 });
    DB.actionsLog.unshift({ ts: DB.sim.now, text: 'First-flush advisory sent to 56 Zone A homes — risk index crossed 70' });
  }
  if (key === 'nodeOffline' && on) {
    const t7 = DB.nodes.find(n => n.id === 'T7');
    if (t7) { t7.status = 'offline'; t7.lastSeen = DB.sim.now - 220 * 60000; }
    pushAlert({ id: 'ALT-7807', type: 'node_offline', typeName: 'Node offline', sev: 'medium', zone: 'A', root: 'Sentinel T7 stopped reporting at 05:55 — estimates only for its tail segment', hh: 0 });
  } else if (key === 'nodeOffline' && !on) {
    const t7 = DB.nodes.find(n => n.id === 'T7');
    if (t7) { t7.status = 'online'; t7.lastSeen = DB.sim.now; }
    DB.alerts = DB.alerts.filter(a => a.id !== 'ALT-7807');
  }
  if (key === 'reusedPhoto' && on) {
    const t = DB.tickets.find(x => x.id === 'TKT-1042');
    if (t) t.proof.photo = { state: 'red', gpsKm: 0.05, afterOpen: true, reused: true, rejectedOn: 'TKT-1037', note: 'Rejected by proof lock: image already used on TKT-1037 (2 days ago).' };
    U.toast('Proof lock rejected the photo', 'Image fingerprint already used on <b>TKT-1037</b>. Card stays in “Awaiting proof”.', 'red', 7000);
  } else if (key === 'reusedPhoto' && !on) {
    const t = DB.tickets.find(x => x.id === 'TKT-1042');
    if (t) t.proof.photo = { state: 'green', gpsKm: 0.06, afterOpen: true, reused: false, variant: 1 };
  }
  if (key === 'confirmations' && on) {
    const t = DB.tickets.find(x => x.id === 'TKT-1042');
    let step = t ? t.proof.families.confirmed : 2;
    const iv = setInterval(() => {
      if (!DB.isSim('confirmations') || !t) { clearInterval(iv); return; }
      if (step < t.proof.families.total) {
        step++; t.proof.families.confirmed = step;
        t.proof.families.state = step >= t.proof.families.total ? 'green' : 'amber';
        U.toast('Family confirmation received', `${step} of ${t.proof.families.total} affected families confirmed by IVR · ${t.id}`, 'green');
        if (App.current === 'kanban') App.render();
      } else clearInterval(iv);
    }, 2600);
  }
  if (key === 'pumpFault' && !on) {
    /* supply restored — pressure-recovery proof on TKT-1041 starts filling live */
    const t = DB.tickets.find(x => x.id === 'TKT-1041');
    if (t) {
      t.proof.pressure = { state: 'amber', minutes: 6 };
      U.toast('Supply restored in Zone B', 'Pump restarted. Pressure-recovery proof is now measuring on <b>TKT-1041</b> (45 min at ≥70 kPa required).', 'green', 7000);
      const iv = setInterval(() => {
        if (DB.isSim('pumpFault') || t.status === 'closed') { clearInterval(iv); return; }
        t.proof.pressure.minutes += 5;
        if (t.proof.pressure.minutes >= DB.settings.thresholds.recoveryMin) {
          t.proof.pressure.state = 'green'; clearInterval(iv);
          U.toast('Pressure recovery verified', `${DB.settings.thresholds.recoveryMin} minutes at or above ${DB.settings.thresholds.kpa} kPa — proof check green on <b>${t.id}</b>.`, 'green', 7000);
        }
        if (App.current === 'kanban') App.render();
      }, 4200);
    }
  }
  DB.recalc();
  DB.tickets.filter(t => t.type === 'pump' && t.status !== 'closed').forEach(t => {
    if (DB.isSim('pumpFault')) { t.hhAffected = 140; }
  });
  if (App.current) App.render();
};

function pushAlert(a) {
  const now = DB.sim.now;
  DB.alerts.unshift(Object.assign({ ts: now, unread: true, channels: [{ kind: 'SMS', langs: ['hi', 'mr'] }], msg: null, ivr: null }, a));
}

DB.resetSim = function () {
  DB.sim.active = { pumpFault: false };
  DB.tickets.forEach(t => {
    const base = DB.baseState.tickets.find(x => x.id === t.id);
    if (base) { t.status = base.status; t.assignee = base.assignee; t.slaDue = base.slaDue; t.proof = JSON.parse(JSON.stringify(base.proof)); }
  });
  DB.tickets.forEach(t => { if (t.id === 'TKT-1041') t.status = 'escalated'; });
  const t7 = DB.nodes.find(n => n.id === 'T7'); if (t7) { t7.status = 'online'; t7.lastSeen = DB.sim.now; }
  DB.sim.active = {};
  DB.recalc();
  U.toast('Simulator reset', 'Village returned to a normal supply day. All six tickets keep their state.', 'green');
  if (App.current) App.render();
};

/* ============ helpers used by screens ============ */
DB.ticketsFor = function (hh) {
  return DB.tickets.filter(t => t.status !== 'closed' && (
    (t.zone === hh.zone && ['pump', 'pressure'].includes(t.type) && t.hhAffected > 20) ||
    (t.type === 'contam' && Math.abs(hh.num % 40) < 12 && t.zone === hh.zone) ||
    (t.type === 'leak' && hh.tapId === 'A-047') ||
    (t.type === 'quality' && hh.tapId === 'C-0331')
  ));
};
DB.whyEstimate = function (h) {
  const near = DB.nodes.filter(n => n.type !== 'pump' && dist(h.hx, h.hy, n.hx, n.hy) < 260)
    .sort((a, b) => dist(h.hx, h.hy, a.hx, a.hy) - dist(h.hx, h.hy, b.hx, b.hy)).slice(0, 2);
  const sensors = near.length ? near.map(n => n.id + ' (' + Math.round(dist(h.hx, h.hy, n.hx, n.hy)) + ' m)').join(' and ') : 'the pipe-network twin';
  return `Estimated from ${sensors} · last 10-litre bucket calibration ${U.dmon(h.calibDate)} (±${h.calibErr}%)`;
};
DB.escalateCheck = function () {
  let changed = false;
  DB.tickets.forEach(t => {
    if (['closed', 'escalated'].includes(t.status) || t.slaDue >= DB.sim.now) return;
    t.status = 'escalated'; changed = true;
    pushAlert({
      id: 'ALT-8' + U.rint(Math.random, 100, 999), type: 'escalation', typeName: 'SLA missed', sev: 'critical', zone: t.zone,
      root: `Ticket ${t.id} crossed SLA without closure — escalated to Assistant Engineer`, ticket: t.id, hh: t.hhAffected
    });
    U.toast('SLA missed — ticket escalated', `<b>${t.id}</b> moved to Escalated. ${DB.people.ae} notified.`, 'red', 7000);
    changed = true;
  });
  return changed;
};
