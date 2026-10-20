/* JalDrishti · screens-mobile.js — Screens 11 (Settings), 12 (Field tasks), 13 (Jal Sakhi), 14 (Tap QR), 15 (Public proof), 16 (Demo panel) */
'use strict';

/* shared: device frame */
function phone(inner, tabs, active, note) {
  return `<div class="phone-wrap">
    <div class="phone" role="group" aria-label="Mobile view">
      <div class="phone-in">
        <div class="ph-statusbar"><span>${U.hhmm(DB.sim.now)}</span><span>JalDrishti · ${DB.village.name.slice(0, 12)}</span><span>▮▮▮ 4G</span></div>
        <div class="ph-body">${inner}</div>
        ${tabs ? `<nav class="ph-tabbar">${tabs.map(([k, l, ic]) => `
          <button class="ph-tab ${active === k ? 'active' : ''}" onclick="${k === '__' ? '' : `PhoneTabs.go('${k}')`}"><i class="ph ${ic}"></i>${l}</button>`).join('')}</nav>` : ''}
      </div>
    </div>
    <div class="phone-note">${note || ''}</div>
  </div>`;
}
const PhoneTabs = window.PhoneTabs = { current: null, go(k) { PhoneTabs.current = k; App.render(); } };
function offlineBadge() { return `<span class="badge b-amber"><i class="ph ph-cloud-slash"></i>${PhoneState.unsynced} not synced</span>`; }
const PhoneState = window.PhoneState = { unsynced: 2, sakhiTab: 'today' };

/* ============================================================
   SCREEN 11 · LOGIN, ROLES AND SETTINGS
   ============================================================ */
App.reg('settings', {
  title: 'Settings', i18n: 'nav.settings', group: 'Settings', icon: 'ph-gear',
  render() {
    const th = DB.settings.thresholds;
    return `
    <div class="page-head"><div><h1>Roles, thresholds & privacy</h1>
      <div class="sub">Demo role picker lives on the login screen. Thresholds here drive the proof lock and SLAs live across every screen.</div></div></div>
    <div class="g2">
      <div class="card mb16">
        <div class="card-head"><h3>Roles & permissions</h3><span class="h-sub">each role sees only its own screens</span></div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>User</th><th>Main screens</th><th>Device</th></tr></thead>
          <tbody>
            ${[['State / district official (PHED, DDWS)', '1 Overview, 7 Register, 10 Sync & audit', 'Desktop', 'state'],
            ['Assistant Engineer (block)', '2 Twin, 5 Alerts, 6 Kanban, 8 Prediction', 'Desktop', 'ae'],
            ['Gram Panchayat / VWSC', '1 Overview (village), 15 Public proof', 'Desktop, tablet, TV', 'panchayat'],
            ['Nal Jal Mitra (village technician)', '12 Repair tasks', 'Mobile', 'njm'],
            ['Jal Sakhi (FTK tester)', '13 Routed tests', 'Mobile', 'sakhi'],
            ['Household', '14 Tap QR page, SMS / IVR', 'Phone / missed call', 'citizen']].map(([u, s, d, k]) => `
              <tr><td class="w600">${u}</td><td class="tiny">${s}</td><td class="tiny muted">${d}</td>
              <td>${k !== 'citizen' ? `<button class="btn btn-ghost btn-sm" onclick="App.switchRole('${k}')">Open as</button>` : `<button class="btn btn-ghost btn-sm" onclick="App.go('citizenTap')">Preview</button>`}</td></tr>`).join('')}
          </tbody></table></div>
      </div>
      <div>
        <div class="card mb16">
          <div class="card-head"><h3>Thresholds</h3><span class="h-sub">editable · applied live</span></div>
          <div class="card-pad col" style="gap:13px">
            <div class="field"><label>Low-pressure threshold (kPa)</label><input type="number" id="th-kpa" value="${th.kpa}"></div>
            <div class="field"><label>Baseline recovery level (% of sensor normal)</label><input type="number" id="th-base" value="${th.baselinePct}"></div>
            <div class="field"><label>Pressure-recovery window (minutes)</label><input type="number" id="th-rec" value="${th.recoveryMin}">
              <div class="help">Repair closure requires this many continuous minutes at or above threshold.</div></div>
            <div class="field"><label>Family confirmations required</label><input type="number" id="th-fam" value="${th.confirmFamilies}"></div>
            <button class="btn btn-primary" onclick="Settings.save()"><i class="ph ph-check"></i>Save thresholds</button>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Alert languages & retention</h3></div>
          <div class="card-pad">
            <div class="chip-row mb12">
              ${[['en', 'English'], ['hi', 'हिन्दी'], ['mr', 'मराठी']].map(([k, l]) => `<span class="chip on"><i class="ph ph-check"></i>${l}</span>`).join('')}
              <span class="chip" title="Add state language"><i class="ph ph-plus"></i>add</span>
            </div>
            <div class="tiny muted mb16">Bhashini transcribes voice complaints and translates IVR scripts into these languages.</div>
            <div class="kv"><span class="k">Data retention</span><span class="v">${DB.settings.retentionDays} days</span></div>
            <div class="kv"><span class="k">Phone numbers</span><span class="v"><span class="badge b-green"><i class="ph ph-eye-slash"></i>masked everywhere</span></span></div>
            <div class="kv"><span class="k">SMS consent</span><span class="v"><span class="badge b-green">recorded</span></span></div>
            <div class="kv"><span class="k">IVR consent</span><span class="v"><span class="badge b-green">recorded</span></span></div>
          </div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><h3>Privacy · who viewed household data</h3><span class="h-sub">every household panel open is logged</span></div>
      <div class="card-pad" style="padding-top:8px">
        ${DB.viewLog.slice(0, 8).map(v => `
          <div class="viewlog-row"><i class="ph ph-eye" style="color:var(--ink-3)"></i>
            <span class="w600" style="width:170px">${v.who}</span><span class="flex1 small">${v.what}</span>
            <span class="tiny muted" data-ago="${v.ts}">${U.ago(v.ts, DB.sim.now)}</span></div>`).join('')}
      </div>
    </div>`;
  }
});
const Settings = window.Settings = {};
Settings.save = () => {
  const v = id => +document.getElementById(id).value;
  const kpa = v('th-kpa'), base = v('th-base'), rec = v('th-rec'), fam = v('th-fam');
  const fail = msg => U.toast('Thresholds not saved', msg, 'red', 5000);
  if (!(kpa >= 20 && kpa <= 150)) return fail('Low-pressure threshold must be between 20 and 150 kPa.');
  if (!(base >= 50 && base <= 100)) return fail('Baseline recovery must be between 50% and 100% of sensor normal.');
  if (!(rec >= 5 && rec <= 180)) return fail('Pressure-recovery window must be between 5 and 180 minutes.');
  if (!(fam >= 1 && fam <= 5)) return fail('Family confirmations must be between 1 and 5.');
  DB.settings.thresholds.kpa = kpa;
  DB.settings.thresholds.baselinePct = base;
  DB.settings.thresholds.recoveryMin = rec;
  DB.settings.thresholds.confirmFamilies = fam;
  DB.recalc();
  U.toast('Thresholds saved', `Proof lock now requires ${DB.settings.thresholds.recoveryMin} min at ≥${DB.settings.thresholds.kpa} kPa · ${DB.settings.thresholds.confirmFamilies} family confirmations.`, 'green');
  App.render();
};

/* ============================================================
   SCREEN 12 · NAL JAL MITRA REPAIR TASKS (field app)
   ============================================================ */
App.reg('fieldTasks', {
  title: 'Repair tasks', i18n: 'nav.fieldTasks', group: 'Field', icon: 'ph-wrench',
  render() {
    const tab = PhoneTabs.current || 'tasks';
    const mine = DB.tickets.filter(t => t.status !== 'closed').sort((a, b) => b.priority - a.priority);
    const open = FieldState.open ? DB.tickets.find(t => t.id === FieldState.open) : null;
    let inner = '', tabs = [['tasks', U.t('t.tasks'), 'ph-squares-four'], ['map', U.t('t.map'), 'ph-map-trifold'], ['profile', U.t('t.profile'), 'ph-user-circle']];
    if (open) {
      const th = DB.settings.thresholds;
      const p = open.proof;
      inner = `
        <button class="btn btn-secondary btn-sm mb12" onclick="FieldState.open=null;App.render()"><i class="ph ph-arrow-left"></i>Tasks</button>
        <div class="row mb12" style="justify-content:space-between">
          <span class="w700">${open.id}</span>${App.slaChip(open.slaDue)}</div>
        <div class="m-card">
          <div class="mc-top"><span class="badge b-orange num">P ${open.priority}</span><span class="badge b-blue">${open.typeName}</span><span class="tiny muted">Zone ${open.zone}</span></div>
          <div class="small w600" style="margin-bottom:6px">AI diagnosis</div>
          <div class="small muted" style="line-height:1.5">${U.esc(open.diagnosis)}</div>
          <div class="kv mt10"><span class="k">Households affected</span><span class="v num">${open.hhAffected}</span></div>
          ${open.critical.length ? `<div class="kv"><span class="k">Critical sites</span><span class="v tiny">${open.critical.join(', ')}</span></div>` : ''}
        </div>
        <div class="m-card">
          <div class="mc-top"><i class="ph ph-navigation" style="color:var(--blue)"></i><span class="w600 small">Route to fault</span></div>
          <svg viewBox="60 80 900 480" style="width:100%;border-radius:8px;display:block" role="img" aria-label="Route map">
            ${DB.pipes.map(pp => `<polyline points="${pp.pts.map(q => q.join(',')).join(' ')}" fill="none" stroke="#C9D4E6" stroke-width="6" stroke-linecap="round"/>`).join('')}
            <circle cx="110" cy="540" r="12" fill="#1F3864"/><text x="110" y="568" text-anchor="middle" class="cx-lbl-b">you</text>
            <circle cx="${open.zone === 'B' ? 720 : open.zone === 'A' ? 760 : 272}" cy="${open.zone === 'B' ? 362 : open.zone === 'A' ? 170 : 204}" r="14" fill="#D93025" opacity=".2"/>
            <circle cx="${open.zone === 'B' ? 720 : open.zone === 'A' ? 760 : 272}" cy="${open.zone === 'B' ? 362 : open.zone === 'A' ? 170 : 204}" r="7" fill="#D93025"/>
            <text x="${open.zone === 'B' ? 720 : open.zone === 'A' ? 760 : 272}" y="${open.zone === 'B' ? 340 : open.zone === 'A' ? 148 : 182}" text-anchor="middle" class="cx-lbl-b">fault point</text>
          </svg>
          <div class="tiny muted mt10">2.1 km · about 8 min by cycle</div>
        </div>
        <div class="m-card">
          <div class="mc-top"><i class="ph ph-lock-key" style="color:var(--orange)"></i><span class="w600 small">Proof checks</span></div>
          <div class="row mb12" style="gap:7px">${App.proofMini(open.proof)}</div>
          <button class="btn ${p.photo.state === 'green' ? 'btn-secondary' : 'btn-primary'} mb12" style="width:100%;justify-content:center" onclick="Field.capture('${open.id}')">
            <i class="ph ph-camera"></i>${p.photo.state === 'green' ? 'Photo captured · GPS attached' : 'Capture repair photo'}</button>
          <button class="btn btn-primary" style="width:100%;justify-content:center" ${p.photo.state !== 'green' ? 'disabled' : ''} onclick="Field.requestClosure('${open.id}')">
            <i class="ph ph-paper-plane-tilt"></i>Request closure</button>
          <div class="tiny muted mt10">Requesting closure moves the ticket to <b>Awaiting proof</b> — pressure recovery and family confirmations keep filling in. ${th.recoveryMin} min at ≥${th.kpa} kPa required.</div>
        </div>`;
      tabs = null;
    } else if (tab === 'tasks') {
      inner = `
        <div class="row mb12" style="justify-content:space-between">
          <span class="w700" style="font-size:16px">${U.t('nav.fieldTasks')}</span>${offlineBadge()}</div>
        <div class="tiny muted mb12">Sorted by priority · ${mine.length} open in ${DB.village.name}</div>
        ${mine.map(t => `
          <button class="m-card" style="width:100%;text-align:left" onclick="FieldState.open='${t.id}';App.render()">
            <div class="mc-top"><span class="badge b-orange num">P ${t.priority}</span><span class="w700 small">${t.id}</span>
              <span style="margin-left:auto">${App.slaChip(t.slaDue)}</span></div>
            <div class="small" style="margin-bottom:6px">${t.typeName} · Zone ${t.zone}</div>
            <div class="tiny muted">${U.esc(t.diagnosis.split('—')[0])}</div>
            <div class="row tiny muted mt10" style="gap:10px"><span><i class="ph ph-house-line"></i> ${t.hhAffected} homes</span><span>${t.assignee ? t.assignee : 'unassigned'}</span>
              <span style="margin-left:auto">${App.proofMini(t.proof)}</span></div>
          </button>`).join('')}`;
    } else if (tab === 'map') {
      inner = `<div class="w700 mb12" style="font-size:16px">${U.t('t.map')}</div>
        <div class="m-card" style="padding:0;overflow:hidden">${Twin.mapSvg({ layers: { pipes: true, nodes: true, hh: true, heat: false, sanit: false }, bucket: 143 })}</div>
        <div class="tiny muted mt10">Red pins are open faults. Tap a dot on the admin twin for household detail.</div>`;
    } else {
      inner = `
        <div class="row mb16"><span class="av" style="width:52px;height:52px;border-radius:50%;background:var(--navy);color:#fff;display:grid;place-items:center;font-weight:700;font-size:18px">SP</span>
          <div><div class="w700">Suresh Pawar</div><div class="tiny muted">Nal Jal Mitra · ${DB.village.name}</div></div></div>
        <div class="m-card">
          <div class="kv"><span class="k">Repairs closed this month</span><span class="v num">14</span></div>
          <div class="kv"><span class="k">Median closure time</span><span class="v num">2 h 22 m</span></div>
          <div class="kv"><span class="k">Photos accepted first try</span><span class="v num">93%</span></div>
          <div class="kv"><span class="k">Sync</span><span class="v">${offlineBadge()}</span></div>
        </div>
        <button class="btn btn-secondary" style="width:100%;justify-content:center" onclick="App.logout()"><i class="ph ph-sign-out"></i>Switch role</button>`;
    }
    return `<div class="page-head"><div><h1>Nal Jal Mitra · repair tasks</h1>
      <div class="sub">Field app (mobile PWA, works offline). The desktop demo shows it in a device frame — on a phone it is the whole screen.</div></div></div>
      ${phone(inner, tabs, tab, `
        <h3>What the technician sees</h3>
        <ul>
          <li>Tasks sorted by <b>priority score</b> with live SLA countdown chips.</li>
          <li>Diagnosis comes pre-written by the pump-as-sensor model.</li>
          <li>Repair photos get <b>automatic GPS + time stamp</b> — the proof lock rejects anything reused or out of bounds.</li>
          <li>"Request closure" moves the ticket to Awaiting proof; the three checks keep filling in on the Kanban.</li>
          <li>Offline badge counts items not yet synced.</li>
        </ul>
        <p>Try: open <b>TKT-1041</b>, capture the photo, request closure — then watch the proof checks on Screen 6.</p>`)}`;
  }
});
const FieldState = window.FieldState = { open: null };
const Field = window.Field = {};
Field.capture = function (id) {
  const t = DB.tickets.find(x => x.id === id);
  if (t.proof.photo.reused) {
    U.toast('Photo rejected by proof lock', 'Image fingerprint already used on TKT-1037 — retake at the site.', 'red', 6000);
    return;
  }
  t.proof.photo = { state: 'green', gpsKm: 0.04, afterOpen: true, reused: false, variant: 1 };
  PhoneState.unsynced++;
  U.toast('Photo captured', 'GPS 40 m from fault · timestamp attached · queued for sync.', 'green');
  App.render();
};
Field.requestClosure = function (id) {
  const t = DB.tickets.find(x => x.id === id);
  t.status = 'awaiting';
  if (t.proof.pressure.minutes === 0) t.proof.pressure = { state: 'amber', minutes: 4 };
  U.toast('Closure requested', `${id} → Awaiting proof. Pressure recovery is measuring; call families for confirmation on the Kanban.`, 'blue', 6000);
  FieldState.open = null;
  PhoneState.unsynced++;
  App.render();
};

/* ============================================================
   SCREEN 13 · JAL SAKHI ROUTED TESTS (field app)
   ============================================================ */
App.reg('fieldTests', {
  title: 'Routed tests', i18n: 'nav.fieldTests', group: 'Field', icon: 'ph-test-tube',
  render() {
    const tab = PhoneTabs.current || 'today';
    const flow = SakhiState.step;
    let inner = '';
    if (flow === 'scan') {
      inner = `
        <button class="btn btn-secondary btn-sm mb12" onclick="SakhiState.step=null;App.render()"><i class="ph ph-x"></i>Cancel</button>
        <div class="w700 mb12">Scan tap QR</div>
        <div class="m-card" style="text-align:center;padding:26px">
          <div style="width:180px;height:180px;margin:0 auto;border:3px dashed var(--blue);border-radius:14px;display:grid;place-items:center;background:#0F1726">
            ${U.qrSvg('tap-' + SakhiState.tap, 130)}</div>
          <div class="tiny muted mt10">Point the camera at the plate on the tap</div>
          <button class="btn btn-primary mt16" style="width:100%;justify-content:center" onclick="SakhiState.step='camera';App.render()"><i class="ph ph-qr-camera"></i>Simulate scan</button>
        </div>`;
    } else if (flow === 'camera') {
      inner = `
        <div class="w700 mb12">Place the strip beside the colour patches</div>
        <div class="m-card" style="padding:0;overflow:hidden;background:#101828">
          <svg viewBox="0 0 320 240" style="width:100%;display:block" role="img" aria-label="Camera view with strip guide">
            <rect width="320" height="240" fill="#1B2436"/>
            <rect x="60" y="70" width="200" height="100" rx="8" fill="none" stroke="#F7941D" stroke-width="3" stroke-dasharray="10 7"/>
            <text x="160" y="58" text-anchor="middle" fill="#F7941D" font-size="12" font-family="Inter,sans-serif" font-weight="600">align strip here</text>
            <rect x="105" y="105" width="110" height="30" rx="4" fill="#F4F1E8"/>
            <rect x="112" y="110" width="22" height="20" rx="2" fill="#E8DCC0"/><rect x="140" y="110" width="22" height="20" rx="2" fill="#9FD4E8"/><rect x="168" y="110" width="22" height="20" rx="2" fill="#C8B7DE"/><rect x="196" y="110" width="12" height="20" rx="2" fill="#D8B23C"/>
            <rect x="20" y="196" width="80" height="26" rx="13" fill="#fff"/><text x="60" y="213" text-anchor="middle" font-size="11" font-family="Inter,sans-serif" font-weight="700" fill="#1A2233">GPS on</text>
          </svg>
        </div>
        <button class="btn btn-primary mt10" style="width:100%;justify-content:center" onclick="SakhiState.step='result';App.render()"><i class="ph ph-camera"></i>Capture strip</button>`;
    } else if (flow === 'result') {
      const risk = (DB.hh.find(h => h.tapId === SakhiState.tap) || {}).risk || 40;
      inner = `
        <div class="row mb12" style="justify-content:space-between"><span class="w700">Result · ${SakhiState.tap}</span><span class="badge b-blue">AI read</span></div>
        <div class="m-card" style="text-align:center">
          <div class="photo-thumb" style="width:100%;height:120px;margin-bottom:12px">${U.stripSvg(['#E8DCC0', '#D8B23C', '#C8B7DE'], 300, 120)}</div>
          <div class="kv"><span class="k">Free chlorine</span><span class="v num">0.24 mg/L <span class="badge b-amber tiny">below 0.5 advisory</span></span></div>
          <div class="kv"><span class="k">pH</span><span class="v num">7.2</span></div>
          <div class="kv"><span class="k">Turbidity</span><span class="v num">1.2 NTU</span></div>
          <div class="kv"><span class="k">AI confidence</span><span class="v"><span class="badge b-green num">91%</span></span></div>
        </div>
        <div class="row" style="gap:9px">
          <button class="btn btn-secondary flex1" style="justify-content:center" onclick="SakhiState.step='camera';App.render()"><i class="ph ph-arrow-clockwise"></i>Retake</button>
          <button class="btn btn-primary flex1" style="justify-content:center" onclick="SakhiState.submit()"><i class="ph ph-cloud-arrow-up"></i>Submit to WQMIS</button>
        </div>`;
    } else if (flow === 'done') {
      inner = `
        <div class="proof-item p-green mb16"><div class="proof-icon"><i class="ph ph-check-circle"></i></div>
          <div><div class="p-t">Verified · Payment-ready</div><div class="p-d">Submitted to WQMIS · ₹${DB.testPayments.rate} released on verification · tap ${SakhiState.tap}</div></div></div>
        <button class="btn btn-primary mb12" style="width:100%;justify-content:center" onclick="SakhiState.step=null;PhoneTabs.current='today';App.render()"><i class="ph ph-list-checks"></i>Back to today's list</button>`;
    } else if (tab === 'earnings') {
      inner = `
        <div class="w700 mb12" style="font-size:16px">${U.t('t.earnings')}</div>
        <div class="m-card">
          <div class="kv"><span class="k">Released via PFMS</span><span class="v num" style="color:var(--green)">₹${U.n(DB.testPayments.released)}</span></div>
          <div class="kv"><span class="k">Payment-ready</span><span class="v num" style="color:var(--orange)">₹${U.n(DB.testPayments.ready)}</span></div>
          <div class="kv"><span class="k">Rate per verified test</span><span class="v num">₹${DB.testPayments.rate}</span></div>
        </div>
        <div class="m-card">
          <div class="mc-top"><i class="ph ph-bucket" style="color:var(--blue)"></i><span class="w600 small">Monthly bucket-test task</span><span class="badge b-amber" style="margin-left:auto">due ${U.dmon(DB.sim.now + 9 * 864e5)}</span></div>
          <div class="tiny muted">10-litre bucket calibration at 5 estimated households — this keeps their litre-per-day estimates honest.</div>
        </div>
        ${DB.tests.slice(0, 5).map(t => `
          <div class="m-card"><div class="mc-top"><span class="small w700">${t.tapId}</span><span class="tiny muted">${U.dmon(t.ts)}</span>
            <span style="margin-left:auto">${t.payment === 'released' ? '<span class="badge b-green tiny">released</span>' : '<span class="badge b-orange tiny">ready</span>'}</span></div>
            <div class="tiny muted">₹${DB.testPayments.rate} · ${t.params.length} parameters · conf ${t.confidence}%</div></div>`).join('')}`;
    } else {
      inner = `
        <div class="row mb12" style="justify-content:space-between"><span class="w700" style="font-size:16px">Today's routed tests</span>${offlineBadge()}</div>
        <div class="tiny muted mb12">Ranked by risk — test the worst taps first</div>
        ${DB.sakhiToday.map((s, i) => `
          <button class="m-card" style="width:100%;text-align:left" onclick="SakhiState.start('${s.tapId}')">
            <div class="mc-top"><span class="w700 small">Tap ${s.tapId}</span>${U.riskBadge(s.risk)}<span style="margin-left:auto" class="tiny muted">#${i + 1}</span></div>
            <div class="tiny muted">${s.note}</div>
          </button>`).join('')}`;
    }
    return `<div class="page-head"><div><h1>Jal Sakhi · routed tests</h1>
      <div class="sub">Which taps to test today, QR confirmation, AI strip reading with confidence, WQMIS submission and payment status.</div></div></div>
      ${phone(inner, flow ? null : [['today', U.t('t.tasks'), 'ph-list-checks'], ['earnings', U.t('t.earnings'), 'ph-wallet']], tab, `
        <h3>What the tester sees</h3>
        <ul>
          <li>A <b>risk-ranked list</b>: "Tap B-217 · high risk · test after supply restart".</li>
          <li>Scan the tap QR to confirm the ID — no wrong-tap samples.</li>
          <li>Frame guide lines up the strip with the plate's colour patches.</li>
          <li>AI reads the strip with a confidence %; the tester can retake.</li>
          <li>"Submit to WQMIS" → banner <b>Verified · Payment-ready</b>; earnings tab tracks releases.</li>
        </ul>`)}`;
  }
});
const SakhiState = window.SakhiState = { step: null, tap: 'B-217' };
SakhiState.start = function (tap) { SakhiState.tap = tap; SakhiState.step = 'scan'; App.render(); };
SakhiState.submit = function () {
  SakhiState.step = 'done';
  PhoneState.unsynced++;
  DB.tests.unshift({
    id: 'TST-' + U.rint(Math.random, 2300, 2399), tapId: SakhiState.tap, tester: DB.people.sakhi[0], ts: DB.sim.now,
    params: ['Free chlorine', 'pH', 'Turbidity'], ai: { cl: 0.24, ph: 7.2, turb: 1.2 }, confidence: 91,
    verified: true, wqmis: 'uploaded', payment: 'payment-ready', resultCls: 'amber',
    strip: ['#E8DCC0', '#D8B23C', '#C8B7DE'], photoVariant: 0
  });
  DB.testPayments.ready += DB.testPayments.rate;
  U.toast('Submitted to WQMIS', `Tap ${SakhiState.tap} · Verified · Payment-ready · ₹${DB.testPayments.rate}`, 'green');
  App.render();
};

/* ============================================================
   SCREEN 14 · TAP QR PAGE (citizen, no login)
   ============================================================ */
App.reg('citizenTap', {
  title: 'Tap QR page', i18n: 'nav.citizenTap', group: 'Field', icon: 'ph-qr-code', public: true,
  render() {
    const tap = (App.params.q || 'B-217').replace('HH-', '');
    const h = DB.hh.find(x => x.tapId === tap) || DB.hh.find(x => x.id === 'HH-B-0217');
    const outage = h.zone === 'B' && DB.isSim('pumpFault');
    const report = CitizenState.sent;
    const inner = `
      <div class="row mb12" style="justify-content:space-between">
        <div><div class="w700" style="font-size:16px">Tap ${h.tapId}</div>
          <div class="tiny muted">${DB.village.name} · ${DB.village.sujal_gaon_id}</div></div>
        <div class="seg" style="font-size:10px">${['en', 'hi', 'mr'].map(l => `<button class="${U.lang === l ? 'active' : ''}" style="padding:3px 8px" onclick="App.setLang('${l}')">${{ en: 'EN', hi: 'हिं', mr: 'मरा' }[l]}</button>`).join('')}</div>
      </div>
      <div class="m-card" style="border-left:4px solid ${outage ? 'var(--red)' : 'var(--green)'}">
        <div class="mc-top"><i class="ph ${outage ? 'ph-drop-slash' : 'ph-drop'}" style="color:${outage ? 'var(--red)' : 'var(--green)'};font-size:20px"></i>
          <span class="w700">${outage ? (U.lang === 'en' ? 'Supply interrupted' : U.lang === 'hi' ? 'पानी बाधित' : 'पुरवठा बंद') : (U.lang === 'en' ? 'Water supplied today 6:00–8:00' : U.lang === 'hi' ? 'आज पानी 6:00–8:00' : 'आज पाणी 6:00–8:00')}</span></div>
        <div class="small muted" style="line-height:1.6">
          ${outage
        ? (U.lang === 'en' ? 'Since 06:10, pump fault. Repair team assigned — ticket TKT-1041. Next update by 12:00.' : U.lang === 'hi' ? '06:10 से पंप खराबी के कारण आपूर्ति बाधित। दल नियुक्त — टिकट TKT-1041। अगली जानकारी 12:00 तक।' : '06:10 पासून पंप दोषामुळे पुरवठा बंद. टोली नेमून दिली — तिकीट TKT-1041. पुढील माहिती 12:00 पर्यंत.')
        : (U.lang === 'en' ? `Next supply tomorrow 6:00. ${h.risk < 40 ? 'No risk signals today' : 'Some risk signals today — run the tap 2 minutes before use'} · next test due ${U.dmon(DB.sim.now + 2 * 864e5)}.` : U.lang === 'hi' ? `अगली आपूर्ति कल 6:00। ${h.risk < 40 ? 'आज कोई जोखिम संकेत नहीं' : 'आज कुछ जोखिम संकेत — उपयोग से पहले 2 मिनट नल चलाएँ'} · अगली जाँच ${U.dmon(DB.sim.now + 2 * 864e5)}।` : U.lang === 'mr' ? `पुढील पुरवठा उद्या 6:00. ${h.risk < 40 ? 'आज धोक्याचे संकेत नाहीत' : 'आज काही धोक्याचे संकेत आहेत — वापरण्यापूर्वी 2 मिनिटे नळ सोडा'} · पुढील चाचणी ${U.dmon(DB.sim.now + 2 * 864e5)}.` : '')}
        </div>
      </div>
      ${report ? `<div class="proof-item p-green"><div class="proof-icon"><i class="ph ph-check"></i></div>
        <div><div class="p-t">${U.lang === 'en' ? 'Report received' : 'तक्रार दर्ज'}</div>
        <div class="p-d">Ticket <b>${report}</b> — track it below. Updates will come by SMS/IVR.</div></div></div>` : ''}
      <div class="m-card">
        <div class="mc-top"><i class="ph ph-warning-circle" style="color:var(--orange)"></i><span class="w600 small">${U.t('t.reportProblem')}</span></div>
        <div class="chip-row mb12">
          ${[['nowater', U.lang === 'en' ? 'No water' : U.lang === 'hi' ? 'पानी नहीं' : 'पाणी नाही', 'ph-drop-slash'],
          ['low', U.lang === 'en' ? 'Low pressure' : U.lang === 'hi' ? 'कम दबाव' : 'कमी दाब', 'ph-gauge'],
          ['dirty', U.lang === 'en' ? 'Dirty water' : U.lang === 'hi' ? 'गंदा पानी' : 'घाण पाणी', 'ph-drop-half'],
          ['leak', U.lang === 'en' ? 'Leak' : U.lang === 'hi' ? 'रिसाव' : 'गळती', 'ph-flow-arrow'],
          ['other', U.lang === 'en' ? 'Other' : 'अन्य', 'ph-dots-three']].map(([k, l, ic]) =>
        `<button class="chip ${CitizenState.kind === k ? 'on' : ''}" onclick="CitizenState.kind='${k}';App.render()"><i class="ph ${ic}"></i>${l}</button>`).join('')}
        </div>
        <div class="row tiny muted mb12" style="gap:14px">
          <span><i class="ph ph-camera"></i> ${CitizenState.photo ? 'photo attached' : 'add photo'}</span>
          <span><i class="ph ph-microphone"></i> ${CitizenState.voice ? 'voice note attached · Bhashini transcribing' : 'add voice note'}</span>
          <span><i class="ph ph-map-pin" style="color:var(--green)"></i> GPS ${h.lat}, ${h.lng}</span>
        </div>
        <div class="row" style="gap:8px">
          <button class="btn btn-secondary btn-sm flex1" style="justify-content:center" onclick="CitizenState.photo=true;App.render()"><i class="ph ph-camera"></i>Photo</button>
          <button class="btn btn-secondary btn-sm flex1" style="justify-content:center" onclick="CitizenState.voice=true;App.render()"><i class="ph ph-microphone"></i>Voice</button>
        </div>
        <button class="btn btn-primary mt10" style="width:100%;justify-content:center" ${CitizenState.kind ? '' : 'disabled'} onclick="CitizenState.submit('${h.tapId}')">
          <i class="ph ph-paper-plane-tilt"></i>${U.t('t.submit')}</button>
      </div>
      <div class="m-card" style="text-align:center">
        <div class="tiny muted">${U.lang === 'en' ? 'Basic phone? Give a missed call' : 'साधा फ़ोन? मिस्ड कॉल करें'}</div>
        <a class="w700" href="tel:18001234567" style="font-size:19px">1800-123-4567</a>
        <div class="tiny muted">${U.lang === 'en' ? 'Get today\'s supply status by SMS' : 'SMS में आज की स्थिति पाएँ'}</div>
      </div>
      <button class="btn btn-ghost" style="width:100%;justify-content:center" onclick="App.go('citizenProof')"><i class="ph ph-seal-check"></i>${U.t('nav.citizenProof')}</button>`;
    return `<div class="page-head"><div><h1>Citizen · tap QR page</h1>
      <div class="sub">Opens on scan — no login. Tap ${h.tapId} is the default; any tap ID can be previewed with <span class="mono">#/citizenTap/A-012</span>.</div></div></div>
      ${phone(inner, null, null, `
        <h3>The tap, not the app</h3>
        <ul>
          <li>Header: tap ID, village, Sujal Gaon ID, language picker (EN / हिंदी / मराठी).</li>
          <li>Today's status card: supply window, next supply, and the wording-safe line <b>"No risk signals today · next test due [date]".</b></li>
          <li>Problem chips, photo, voice note (transcribed by Bhashini), automatic GPS.</li>
          <li>Submitting returns a <b>ticket number</b> that the family can track.</li>
          <li>Missed-call number printed for basic phones.</li>
        </ul>`)}
      <div class="public-foot">${Docs.links()}</div>`;
  }
});
const CitizenState = window.CitizenState = { kind: null, photo: false, voice: false, sent: null };
CitizenState.submit = function (tap) {
  const id = 'TKT-' + U.rint(Math.random, 1050, 1099);
  CitizenState.sent = id;
  PhoneState.unsynced++;
  U.toast('Report received', `Ticket ${id} raised from tap ${tap} · you will get SMS updates.`, 'green');
  App.render();
};

/* ============================================================
   SCREEN 15 · PUBLIC VILLAGE PROOF PAGE
   ============================================================ */
App.reg('citizenProof', {
  title: 'Public proof', i18n: 'nav.citizenProof', group: 'Field', icon: 'ph-seal-check', public: true,
  render() {
    const big = ProofState.big;
    const s = DB.history30.map(x => x.score);
    const week = DB.tickets.filter(t => t.created > DB.sim.now - 7 * 864e5);
    return `
    <div class="page-head no-print"><div><h1>Public village proof</h1>
      <div class="sub">For the Panchayat notice board and the TV in the Panchayat hall — no login, large type mode available.</div></div>
      <div class="ph-actions">
        <button class="btn ${big ? 'btn-primary' : 'btn-secondary'}" onclick="ProofState.big=!ProofState.big;App.render()"><i class="ph ph-text-aa"></i>Large-type mode</button>
        <button class="btn btn-secondary" onclick="window.print()"><i class="ph ph-printer"></i>Print</button>
      </div></div>
    <div class="card card-pad" style="${big ? 'font-size:1.25em' : ''}">
      <div style="display:flex;gap:34px;align-items:center;flex-wrap:wrap">
        ${U.gauge(DB.pamaan, big ? 116 : 86)}
        <div>
          <div class="tiny muted w600" style="text-transform:uppercase;letter-spacing:.8px">Today's Pramaan Score · ${DB.village.name}</div>
          <div style="font-size:${big ? '2.6em' : '1.9em'};font-weight:700;letter-spacing:-1px;line-height:1.15">${DB.kpi.functionalPct}% <span style="font-size:.45em;font-weight:500;color:var(--ink-3)">households fully functional</span></div>
          <div class="row mt10" style="gap:9px;flex-wrap:wrap">
            <span class="badge b-${DB.integrity === 'green' ? 'green' : 'amber'}" style="font-size:${big ? '1em' : '.8em'}"><i class="ph ph-shield-check"></i>Sujal Gaon integrity: ${DB.integrity}</span>
            <span class="badge b-grey" style="font-size:${big ? '1em' : '.8em'}">supply ${DB.village.schedule}</span>
          </div>
        </div>
        <div class="stat-inline" style="margin-left:auto">
          <div><div class="si-v num">${week.filter(t => t.status !== 'closed' || t.closedAt > DB.sim.now - 7 * 864e5).length}</div><div class="si-l">tickets this week</div></div>
          <div><div class="si-v num" style="color:var(--green)">${DB.tickets.filter(t => t.status === 'closed').length}</div><div class="si-l">closed with proof</div></div>
        </div>
      </div>
      <div class="g2 mt16">
        <div>
          <div class="tiny muted w600 mb12" style="text-transform:uppercase;letter-spacing:.8px">30-day trend</div>
          <div class="card card-pad" style="padding:10px 12px">${U.lineChart({ series: [{ pts: s, color: '#1F3864', fill: '#1F3864' }], h: 120, min: 50, max: 100, x: DB.history30.map((x, i) => i % 5 === 0 || i === 29 ? U.dmon(x.date) : null), yTicks: 2 })}</div>
        </div>
        <div style="display:flex;gap:22px;align-items:center;justify-content:center;flex-wrap:wrap">
          <div class="qr-box">${U.qrSvg('proof-' + DB.village.sujal_gaon_id, 128)}
            <div class="tiny muted">today's audit QR</div></div>
          <div>
            <div class="tiny muted w600 mb12" style="text-transform:uppercase;letter-spacing:.8px">Tamper-evident log</div>
            <div class="kv"><span class="k">Records today</span><span class="v num">${U.n(DB.audit[6].count)}</span></div>
            <div class="kv"><span class="k">Daily hash</span><span class="v"><span class="hash-cell">${DB.audit[6].dailyHash}</span></span></div>
            <div class="kv"><span class="k">Chain</span><span class="v"><span class="badge b-green"><i class="ph ph-link"></i>links verified</span></span></div>
          </div>
        </div>
      </div>
      <div class="tiny muted mt16" style="${big ? 'font-size:.75em' : ''}">Water quality: no test has returned a red result in the last 7 days. "No risk signals today · next test due ${U.dmon(DB.sim.now + 2 * 864e5)}." This page never declares water safe — it shows signals, tests and dates.</div>
      <div class="row mt16" style="gap:8px;flex-wrap:wrap;font-size:12px"><i class="ph ph-headset" style="color:var(--ink-3)"></i>
        <span class="muted">Questions about today's supply?</span>
        <a href="tel:18001234567" style="padding:4px 2px">1800-123-4567</a><span class="muted">·</span>
        <a href="mailto:helpdesk@jaldrishti.gov.in" style="padding:4px 2px">helpdesk@jaldrishti.gov.in</a></div>
    </div>
    <div class="public-foot">${Docs.links()}</div>`;
  }
});
const ProofState = window.ProofState = { big: false };

/* ============================================================
   SCREEN 16 · DEMO CONTROL PANEL (hidden)
   ============================================================ */
App.reg('demo', {
  title: 'Demo panel', i18n: 'nav.demo', group: 'Settings', icon: 'ph-sliders',
  render() {
    const sel = DemoState.sel || DB.scenarios[0].key;
    const sc = DB.scenarios.find(s => s.key === sel);
    return `
    <div class="page-head">
      <div><h1><i class="ph ph-flask" style="color:var(--orange)"></i> Demo control panel <span class="badge b-grey" style="vertical-align:middle">hidden · Ctrl+Shift+D</span></h1>
        <div class="sub">Writes mock readings into the same data layer real sensors will use — so the dashboard never changes when hardware connects. Every screen shows a "Simulated data" tag while the simulator is the source.</div></div>
      <div class="ph-actions"><button class="btn btn-danger" onclick="DB.resetSim()"><i class="ph ph-arrow-counter-clockwise"></i>Reset village to normal</button></div>
    </div>
    <div class="g21">
      <div class="g2">
        ${DB.scenarios.map(s => `
          <button class="scen-card ${DB.isSim(s.key) ? 'on' : ''}" onclick="Demo.toggle('${s.key}')">
            <div class="sc-t"><i class="ph ${s.icon}" style="font-size:18px;color:${DB.isSim(s.key) ? 'var(--orange)' : 'var(--ink-3)'}"></i>${s.title}
              <label class="switch" style="margin-left:auto" onclick="event.stopPropagation();Demo.toggle('${s.key}')"><input type="checkbox" ${DB.isSim(s.key) ? 'checked' : ''} readonly><span class="sl"></span></label></div>
            <div class="sc-d">${s.desc}</div>
            <div>${DB.isSim(s.key) ? '<span class="badge b-orange"><i class="ph ph-broadcast"></i>active</span>' : '<span class="badge b-grey">off</span>'}</div>
          </button>`).join('')}
      </div>
      <div>
        <div class="card mb16">
          <div class="card-head"><h3>Message preview</h3><span class="h-sub">${sc.title}</span></div>
          <div class="card-pad">
            <div class="tiny muted w600 mb12" style="text-transform:uppercase;letter-spacing:.7px"><i class="ph ph-chat-circle-text"></i> SMS</div>
            <div class="msg-preview">${U.esc(DemoState.lang === 'en' ? sc.sms.en : DemoState.lang === 'hi' ? sc.sms.hi : sc.sms.mr)}</div>
            <div class="tiny muted w600" style="margin:12px 0 12px;text-transform:uppercase;letter-spacing:.7px"><i class="ph ph-phone-call"></i> IVR script</div>
            <div class="msg-preview" style="background:#22304C">${U.esc(DemoState.lang === 'en' ? sc.ivr.en : DemoState.lang === 'hi' ? sc.ivr.hi : sc.ivr.mr)}</div>
            <div class="seg-tabs mt16">
              ${[['en', 'English'], ['hi', 'हिन्दी'], ['mr', 'मराठी']].map(([k, l]) => `<button class="${DemoState.lang === k ? 'active' : ''}" onclick="DemoState.lang='${k}';App.render()">${l}</button>`).join('')}
            </div>
          </div>
        </div>
        <div class="card card-pad">
          <div class="w600 small mb12">Active now</div>
          <div class="chip-row">${Object.entries(DB.sim.active).filter(([, v]) => v).map(([k]) => {
        const s = DB.scenarios.find(x => x.key === k);
        return s ? `<span class="chip on"><i class="ph ${s.icon}"></i>${s.title}</span>` : '';
      }).join('') || '<span class="tiny muted">Nothing — the village is on a normal supply day.</span>'}</div>
          <div class="tiny muted mt16">Try the lock: enable <b>Reused repair photo</b>, then drag TKT-1042 to Closed on the Kanban — it must bounce back naming the reused image.</div>
        </div>
      </div>
    </div>`;
  }
});
const Demo = window.Demo = {};
const DemoState = window.DemoState = { lang: 'hi', sel: null };
Demo.toggle = function (key) {
  const on = !DB.isSim(key);
  DemoState.sel = key;
  DB.applyScenario(key, on);
  const sc = DB.scenarios.find(s => s.key === key);
  U.toast(
    (sc ? sc.title : key) + (on ? ' — ON' : ' — OFF'),
    on ? 'Simulator now writes this condition into the live data layer.' : 'Village readings back to normal.',
    on ? 'amber' : 'blue', 3200);
};

/* ============================================================
   APP BOOT
   The single boot lives in js/app.js, which loads last so that
   every screen (including the public documents in js/legal.js)
   is registered before the first render. Booting here as well
   ran App.start() twice and rendered citizen pages before
   js/legal.js had run — do not add a second call here.
   ============================================================ */
