/* JalDrishti · screens-core.js — Screens 6 (Kanban), 2 (Village twin), 3 (Risk), 1 (Overview) */
'use strict';

/* ============================================================
   SCREEN 6 · REPAIR KANBAN WITH PROOF LOCK  (build first — the distinctive screen)
   ============================================================ */
const Kanban = window.Kanban = {};
const COLS = [
  { key: 'new', label: 'New', icon: 'ph-note' },
  { key: 'assigned', label: 'Assigned', icon: 'ph-user-plus' },
  { key: 'repair', label: 'In repair', icon: 'ph-wrench' },
  { key: 'awaiting', label: 'Awaiting proof', icon: 'ph-hourglass' },
  { key: 'closed', label: 'Closed', icon: 'ph-check-circle' }
];

function kanbanCard(t) {
  const crit = t.critical && t.critical.length;
  return `<article class="kb-card" draggable="true" data-tid="${t.id}" tabindex="0" role="button" aria-label="Ticket ${t.id}">
    <div class="kc-top">
      <span class="badge b-orange num"><i class="ph ph-fire"></i>P ${t.priority}</span>
      <span class="kc-id">${t.id}</span>
      ${t.source === 'citizen' ? '<span class="badge b-grey" title="Reported by a citizen"><i class="ph ph-user-circle"></i>citizen</span>' : t.source === 'test' ? '<span class="badge b-grey"><i class="ph ph-test-tube"></i>test</span>' : '<span class="badge b-grey" title="Raised by a sensor"><i class="ph ph-cpu"></i>sensor</span>'}
      <span style="margin-left:auto">${t.status !== 'closed' ? App.slaChip(t.slaDue) : ''}</span>
    </div>
    <div class="kc-diag">${t.typeName} · ${U.esc(t.diagnosis.split('—')[0])}</div>
    <div class="kc-meta">
      <span><i class="ph ph-map-pin"></i>${DB.village.name} · Zone ${t.zone}</span>
      <span><i class="ph ph-house-line"></i>${t.hhAffected} homes</span>
      ${crit ? `<span title="${t.critical.join(', ')}"><i class="ph ph-star"></i>${t.critical.length} critical site${t.critical.length > 1 ? 's' : ''}</span>` : ''}
    </div>
    <div class="kc-foot">
      <span class="kc-assignee">${t.assignee ? `<span class="av">${t.assignee.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>${t.assignee}` : '<span class="badge b-grey">unassigned</span>'}</span>
      <span style="margin-left:auto">${App.proofMini(t.proof)}</span>
    </div>
    <div style="margin-top:8px">${App.truthBar(t.truth)}</div>
  </article>`;
}

App.reg('kanban', {
  title: 'Repair Kanban', i18n: 'nav.kanban', group: 'Act', icon: 'ph-kanban',
  render() {
    const open = DB.tickets.filter(t => t.status !== 'closed');
    return `
    <div class="page-head">
      <div>
        <h1>Repair Kanban <span class="badge b-orange" style="vertical-align:middle;margin-left:6px"><i class="ph ph-lock-key"></i>proof lock on</span></h1>
        <div class="sub">A repair closes only with all three proofs green: verified photo, ${DB.settings.thresholds.recoveryMin} min pressure recovery at ≥${DB.settings.thresholds.kpa} kPa, and ${DB.settings.thresholds.confirmFamilies} family confirmations. Drag a card to <b>Closed</b> early and it bounces back.</div>
      </div>
      <div class="ph-actions">
        <button class="btn btn-secondary btn-sm" onclick="Kanban.legend()"><i class="ph ph-question"></i>How the lock works</button>
      </div>
    </div>
    <div class="kb-wrap">
      ${COLS.map(c => {
      const items = DB.tickets.filter(t => t.status === c.key);
      return `<section class="kb-col" data-col="${c.key}" aria-label="${c.label}">
          <div class="kb-head"><i class="ph ${c.icon}"></i>${c.label}<span class="cnt num">${items.length}</span></div>
          <div class="kb-items">${items.map(kanbanCard).join('') || '<div class="tiny muted" style="text-align:center;padding:18px 6px">Drop a card here</div>'}</div>
        </section>`;
    }).join('')}
      <section class="kb-col esc" data-col="escalated" aria-label="Escalated">
        <div class="kb-head"><i class="ph ph-warning-octagon"></i>Escalated<span class="cnt num">${DB.tickets.filter(t => t.status === 'escalated').length}</span></div>
        <div class="tiny" style="color:var(--red);padding:0 4px 8px">Missed SLA — ${DB.people.ae} notified</div>
        <div class="kb-items">${DB.tickets.filter(t => t.status === 'escalated').map(kanbanCard).join('') || '<div class="tiny muted" style="text-align:center;padding:18px 6px">Nothing escalated</div>'}</div>
      </section>
    </div>
    <div class="tiny muted mt16">${open.length} open · ${DB.tickets.filter(t => t.status === 'closed').length} closed today's log · every move is written to the tamper-evident audit log</div>`;
  },
  mount(root) {
    root.querySelectorAll('.kb-card').forEach(card => {
      card.addEventListener('dragstart', e => { App._drag = card.dataset.tid; card.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
      card.addEventListener('dragend', () => { card.classList.remove('dragging'); App._drag = null; });
      card.addEventListener('click', e => { if (!e.target.closest('.kc-menu')) Kanban.openTicket(card.dataset.tid); });
      card.addEventListener('keydown', e => { if (e.key === 'Enter') Kanban.openTicket(card.dataset.tid); });
    });
    root.querySelectorAll('.kb-col').forEach(col => {
      col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('dragover'); });
      col.addEventListener('dragleave', () => col.classList.remove('dragover'));
      col.addEventListener('drop', e => {
        e.preventDefault(); col.classList.remove('dragover');
        if (App._drag) Kanban.tryMove(App._drag, col.dataset.col);
      });
    });
  }
});

Kanban.tryMove = function (id, col) {
  const t = DB.tickets.find(x => x.id === id); if (!t || t.status === col) return;
  if (col === 'closed') {
    const missing = Kanban.missing(t);
    if (missing.length) {
      App.render();
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-tid="${id}"]`);
        if (el) { el.classList.add('bounce'); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      });
      U.toast('Closure blocked — proof missing', `<b>${t.id}</b> cannot close yet: ${missing.join('; ')}.`, 'red', 7000);
      return;
    }
    Kanban.close(t);
    return;
  }
  t.status = col;
  if (col === 'repair' && !t.assignee) t.assignee = DB.people.njm[0];
  DB.audit[DB.audit.length - 1].count++;
  U.toast('Ticket moved', `<b>${t.id}</b> → ${COLS.concat([{ key: 'escalated', label: 'Escalated' }]).find(c => c.key === col).label}`, 'blue', 3000);
  App.render();
};
Kanban.missing = t => {
  const m = [], th = DB.settings.thresholds;
  if (t.proof.photo.state !== 'green') m.push(t.proof.photo.state === 'red' ? 'repair photo rejected (' + (t.proof.photo.note || 'not accepted') + ')' : 'repair photo not verified');
  if (t.proof.pressure.state !== 'green') m.push(`pressure recovery ${t.proof.pressure.minutes}/${th.recoveryMin} min at ≥${th.kpa} kPa`);
  if (t.proof.families.total && t.proof.families.state !== 'green') m.push(`family confirmations ${t.proof.families.confirmed} of ${t.proof.families.total}`);
  return m;
};
Kanban.close = function (t) {
  t.status = 'closed'; t.closedAt = DB.sim.now; t.repairMin = Math.max(1, Math.round((DB.sim.now - t.created) / 60000));
  DB.audit[DB.audit.length - 1].count++;
  U.toast('Repair closed with proof', `<b>${t.id}</b> closed after 3/3 proofs · repair time ${U.dur(t.repairMin)} · written to audit log`, 'green', 6000);
  DB.recalc();
  App.render();
};
Kanban.legend = () => App.modal({
  title: 'How the proof lock works',
  body: `<div class="col" style="gap:16px">
    <p class="small">"No proof, no closure." Three independent checks must be <b>green</b> before <i>Mark resolved</i> enables — and any early drag to Closed bounces back with the missing proof named.</p>
    <div class="proof-item p-green"><div class="proof-icon"><i class="ph ph-camera"></i></div><div><div class="p-t">Repair photo</div><div class="p-d">GPS within 200 m of the fault, timestamped after the ticket opened, and not a reused image (fingerprint checked against closed tickets).</div></div></div>
    <div class="proof-item p-green"><div class="proof-icon"><i class="ph ph-gauge"></i></div><div><div class="p-t">Pressure recovery</div><div class="p-d">${DB.settings.thresholds.recoveryMin} continuous minutes at ≥${DB.settings.thresholds.kpa} kPa (or ≥${DB.settings.thresholds.baselinePct}% of that sensor's normal level) measured by the nearest sentinel.</div></div></div>
    <div class="proof-item p-green"><div class="proof-icon"><i class="ph ph-users-three"></i></div><div><div class="p-t">Family confirmation</div><div class="p-d">IVR calls to randomly chosen affected households — shown as "2 of 3 confirmed".</div></div></div>
    <p class="tiny muted">A missed SLA moves the card to <b>Escalated</b> and notifies the Assistant Engineer. Every closure writes to the tamper-evident audit log.</p>
  </div>`,
  foot: `<button class="btn btn-primary" onclick="App.closeModal()">Got it</button>`
});

Kanban.openTicket = function (id) {
  const t = DB.tickets.find(x => x.id === id); if (!t) return;
  const th = DB.settings.thresholds;
  const pr = t.proof.pressure;
  const pressPct = Math.min(100, Math.round(pr.minutes / th.recoveryMin * 100));
  App.drawer({
    title: `${t.id} · ${t.typeName}`,
    sub: `Zone ${t.zone} · ${DB.village.name} · opened ${U.dt(t.created)} · ${t.source} source`,
    body: `
    <div class="dr-sect">
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <span class="badge b-${t.status === 'escalated' ? 'red' : t.status === 'closed' ? 'green' : t.status === 'awaiting' ? 'amber' : 'blue'}">${{ new: 'New', assigned: 'Assigned', repair: 'In repair', awaiting: 'Awaiting proof', closed: 'Closed', escalated: 'Escalated' }[t.status]}</span>
        ${t.status !== 'closed' ? App.slaChip(t.slaDue) : `<span class="badge b-green"><i class="ph ph-check-circle"></i>closed ${t.repairMin} min repair</span>`}
        ${App.proofMini(t.proof)}
      </div>
      <div style="margin-top:12px" class="small">${U.esc(t.diagnosis)}</div>
    </div>
    <div class="dr-sect">
      <h4>Priority breakdown · ${t.priority}/100</h4>
      ${[['Households affected', t.parts.hh, 35], ['Hours without water', t.parts.hours, 30], ['Contamination risk', t.parts.risk, 25], ['Critical sites', t.parts.critical, 15]].map(([l, v, mx]) => `
        <div class="pb-row"><span class="pb-l">${l}</span>
        <div class="bar-track flex1"><div class="bar-fill ${v / mx > .8 ? 'bar-red' : v / mx > .5 ? 'bar-orange' : 'bar-blue'}" style="width:${v / mx * 100}%"></div></div>
        <span class="pb-v num">+${v}</span></div>`).join('')}
      <div class="tiny muted">${t.hhAffected} homes · ${t.critical.length ? t.critical.join(', ') : 'no critical sites in radius'} · ${DB.village.name}</div>
    </div>
    <div class="dr-sect">
      <h4>Truth score · ${t.truth.score}/100</h4>
      ${[['Sensors', t.truth.sensor], ['Citizen complaints', t.truth.complaint], ['Lab / strip tests', t.truth.test]].map(([l, v]) => `
        <div class="meter-row" style="margin-bottom:8px"><span class="m-l">${l}</span>
        <div class="bar-track flex1"><div class="bar-fill ${v >= 75 ? 'bar-green' : v >= 50 ? 'bar-amber' : 'bar-grey'}" style="width:${v}%"></div></div>
        <span class="m-v num">${v || '—'}</span></div>`).join('')}
      <div class="tiny muted">How strongly sensors, complaints and tests agree the fault is real.</div>
    </div>
    <div class="dr-sect">
      <h4>Proof checks · ${[t.proof.photo.state, t.proof.pressure.state, t.proof.families.state].filter(s => s === 'green').length}/3 green</h4>
      <div class="proof-item p-${t.proof.photo.state === 'grey' ? '' : t.proof.photo.state}">
        <div class="proof-icon"><i class="ph ph-camera"></i></div>
        <div class="flex1">
          <div class="p-t">Repair photo</div>
          <div class="p-d">${t.proof.photo.state === 'green' ? `GPS ${t.proof.photo.gpsKm} km from fault · captured after ticket opened · image unique` : t.proof.photo.note || 'Awaiting capture at the site — GPS and time stamp are attached automatically.'}</div>
        </div>
        <div class="p-right">${t.proof.photo.state === 'green' ? '<span class="badge b-green"><i class="ph ph-check"></i>verified</span>' : `<button class="btn btn-ghost btn-sm" onclick="Kanban.proofPhoto('${t.id}')"><i class="ph ph-camera"></i>${t.proof.photo.state === 'red' ? 'Retake' : 'Capture'}</button>`}</div>
      </div>
      <div class="proof-item p-${pr.state === 'grey' ? '' : pr.state}">
        <div class="proof-icon"><i class="ph ph-gauge"></i></div>
        <div class="flex1">
          <div class="p-t">Pressure recovery</div>
          <div class="p-d">${pr.minutes} of ${th.recoveryMin} min at ≥${th.kpa} kPa (or ≥${th.baselinePct}% of sensor normal)</div>
          <div class="bar-track" style="margin-top:6px"><div class="bar-fill ${pr.state === 'green' ? 'bar-green' : 'bar-amber'}" style="width:${pressPct}%"></div></div>
        </div>
        <div class="p-right">${pr.state === 'green' ? '<span class="badge b-green"><i class="ph ph-check"></i>verified</span>' : '<span class="badge b-amber"><i class="ph ph-hourglass"></i>measuring</span>'}</div>
      </div>
      <div class="proof-item p-${t.proof.families.state === 'grey' ? '' : t.proof.families.state}">
        <div class="proof-icon"><i class="ph ph-users-three"></i></div>
        <div class="flex1">
          <div class="p-t">Family confirmation</div>
          <div class="p-d">${t.proof.families.total ? `${t.proof.families.confirmed} of ${t.proof.families.total} confirmed by IVR (randomly chosen affected households)` : 'Not required for this ticket type.'}</div>
        </div>
        <div class="p-right">${t.proof.families.state === 'green' ? '<span class="badge b-green"><i class="ph ph-check"></i>verified</span>' : t.proof.families.total ? `<button class="btn btn-ghost btn-sm" onclick="Kanban.proofFamilies('${t.id}')"><i class="ph ph-phone-call"></i>Call</button>` : ''}</div>
      </div>
    </div>
    <div class="dr-sect">
      <h4>Actions</h4>
      <div class="row" style="gap:9px;flex-wrap:wrap">
        ${t.status !== 'closed' ? `<button class="btn btn-primary" id="dr-resolve" ${Kanban.missing(t).length ? 'disabled' : ''} onclick="Kanban.resolve('${t.id}')">
          <i class="ph ph-check-circle"></i>${U.t('t.markResolved')}</button>` : ''}
        ${!t.assignee && t.status !== 'closed' ? `<button class="btn btn-secondary" onclick="Kanban.assign('${t.id}')"><i class="ph ph-user-plus"></i>Assign Nal Jal Mitra</button>` : ''}
        ${t.ticketLink ? '' : ''}
      </div>
      ${Kanban.missing(t).length ? `<div class="tiny" style="color:var(--red);margin-top:9px"><i class="ph ph-lock-key"></i> Blocked by: ${Kanban.missing(t).map(U.esc).join(' · ')}</div>` : ''}
    </div>`
  });
};
Kanban.proofPhoto = function (id) {
  const t = DB.tickets.find(x => x.id === id);
  t.proof.photo = { state: 'green', gpsKm: 0.04, afterOpen: true, reused: false, variant: 1 };
  U.toast('Photo verified', `${id}: GPS 40 m from fault, timestamp after ticket opened, fingerprint unique.`, 'green');
  App.render(); Kanban.openTicket(id);
};
Kanban.proofFamilies = function (id) {
  const t = DB.tickets.find(x => x.id === id);
  let c = t.proof.families.confirmed;
  const iv = setInterval(() => {
    if (c >= t.proof.families.total) {
      clearInterval(iv);
      t.proof.families.state = 'green';
      U.toast('All families confirmed', `${id}: ${t.proof.families.total} of ${t.proof.families.total} households confirmed by IVR.`, 'green');
      App.render(); Kanban.openTicket(id);
      return;
    }
    c++; t.proof.families.confirmed = c;
    t.proof.families.state = c >= t.proof.families.total ? 'green' : 'amber';
    U.toast('IVR confirmation', `${id}: ${c} of ${t.proof.families.total} families confirmed.`, 'blue', 2600);
    App.render(); Kanban.openTicket(id);
  }, 1500);
};
Kanban.resolve = function (id) {
  const t = DB.tickets.find(x => x.id === id);
  if (Kanban.missing(t).length) { U.toast('Cannot close', 'All three proofs must be green.', 'red'); return; }
  Kanban.close(t); App.closeDrawer();
};
Kanban.assign = function (id) {
  const t = DB.tickets.find(x => x.id === id);
  t.assignee = DB.people.njm[Math.floor(Math.random() * DB.people.njm.length)];
  if (t.status === 'new') t.status = 'assigned';
  U.toast('Assigned', `${id} → ${t.assignee} (Nal Jal Mitra) · task pushed to the field app.`, 'green');
  App.render(); Kanban.openTicket(id);
};

/* ============================================================
   SCREEN 2 · VILLAGE DIGITAL TWIN
   ============================================================ */
const Twin = window.Twin = {};
App.twinLayers = { pipes: true, nodes: true, hh: true, heat: false, sanit: true };
App.timeBucket = 143;

function dotColor(p) { return p >= 70 ? '#1E9E4A' : p >= 45 ? '#F2A900' : p >= 10 ? '#E86A2B' : '#D93025'; }
function dotColorScore(s) { return s >= 85 ? '#1E9E4A' : s >= 70 ? '#7FBF4F' : s >= 45 ? '#F2A900' : '#D93025'; }

Twin.mapSvg = function (opts = {}) {
  const L = opts.layers || App.twinLayers;
  const bucket = opts.bucket != null ? opts.bucket : App.timeBucket;
  const mode = opts.mode || 'twin';
  const sel = opts.sel;
  let g = `<svg class="vmap" viewBox="0 0 1000 620" role="img" aria-label="Village map of ${DB.village.name}">`;
  g += `<defs>
    <radialGradient id="heatR"><stop offset="0%" stop-color="#D93025" stop-opacity=".55"/><stop offset="100%" stop-color="#D93025" stop-opacity="0"/></radialGradient>
    <radialGradient id="heatA"><stop offset="0%" stop-color="#F2A900" stop-opacity=".5"/><stop offset="100%" stop-color="#F2A900" stop-opacity="0"/></radialGradient>
    <pattern id="fields" width="46" height="46" patternTransform="rotate(14)" patternUnits="userSpaceOnUse">
      <rect width="46" height="46" fill="#EFF4EC"/><path d="M0 46L46 0" stroke="#E3EBDE" stroke-width="1"/></pattern>
  </defs>
  <rect width="1000" height="620" fill="url(#fields)"/>`;
  /* heat blobs */
  if (L.heat || mode === 'risk') {
    DB.hh.forEach(h => {
      if (h.risk < 48) return;
      g += `<circle class="heat" cx="${h.hx}" cy="${h.hy}" r="${mode === 'risk' ? 34 : 26}" fill="url(#${h.risk >= 70 ? 'heatR' : 'heatA'})"/>`;
    });
  }
  /* drain + toilets */
  if (L.sanit) {
    g += `<polyline points="${DB.drain.map(p => p.join(',')).join(' ')}" fill="none" stroke="#8FB8D8" stroke-width="7" stroke-linecap="round" stroke-dasharray="1 11" opacity=".9"/>
      <text x="950" y="540" class="cx-lbl" text-anchor="end" fill="#5E86A8">drain</text>`;
    DB.toilets.forEach(w => {
      g += `<g opacity=".85"><circle cx="${w.hx}" cy="${w.hy}" r="7" fill="#fff" stroke="#8A94A6"/><path d="M${w.hx - 3} ${w.hy + 2}v-3a3 3 0 0 1 6 0v3" fill="none" stroke="#5D6880" stroke-width="1.4"/></g>`;
    });
  }
  /* pipes */
  if (L.pipes) {
    DB.pipes.forEach(p => {
      const broken = p.zone === 'B' && DB.isSim('pumpFault');
      const low = p.zone === 'C' && DB.isSim('lowPressure');
      const col = broken ? '#D93025' : low ? '#F2A900' : p.cls === 'main' ? '#5B7DB1' : '#86A3C9';
      g += `<polyline points="${p.pts.map(q => q.join(',')).join(' ')}" fill="none" stroke="#fff" stroke-width="${p.cls === 'main' ? 9 : 7}" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="${p.pts.map(q => q.join(',')).join(' ')}" fill="none" stroke="${col}" stroke-width="${p.cls === 'main' ? 5 : 3.6}" stroke-linecap="round" stroke-linejoin="round" ${broken ? 'stroke-dasharray="10 7"' : ''}/>
        <text x="${p.pts[Math.floor(p.pts.length / 2)][0]}" y="${p.pts[Math.floor(p.pts.length / 2)][1] - 8}" class="cx-lbl-b" text-anchor="middle">${p.id}</text>`;
    });
  }
  /* critical sites */
  DB.critical.forEach(c => {
    g += `<g transform="translate(${c.hx - 9},${c.hy - 9})"><rect width="18" height="18" rx="4" fill="#1F3864"/>
      <text x="9" y="13" text-anchor="middle" font-size="11" fill="#fff">${{ 'ph-graduation-cap': '🎓', 'ph-baby': '👶', 'ph-first-aid-kit': '✚' }[c.icon] || '•'}</text></g>`;
  });
  /* households */
  if (L.hh) {
    DB.hh.forEach(h => {
      const p = DB.hhPressureAt(h, bucket);
      const col = mode === 'risk' ? (h.risk >= 70 ? '#D93025' : h.risk >= 40 ? '#F2A900' : '#9FB0C4') : dotColor(p);
      const r = sel === h.id ? 6.5 : mode === 'risk' ? 2.6 : 3.4;
      g += `<circle class="hh-dot" data-hh="${h.id}" cx="${h.hx}" cy="${h.hy}" r="${r}" fill="${col}" ${sel === h.id ? 'stroke="#1A2233" stroke-width="2"' : 'stroke="#fff" stroke-width=".8"'}/>`;
    });
    if (mode === 'risk') {
      [...DB.hh].filter(h => h.risk >= 70).sort((a, b) => b.risk - a.risk).slice(0, 6).forEach(h => {
        g += `<g pointer-events="none"><circle cx="${h.hx}" cy="${h.hy}" r="9" fill="none" stroke="#D93025" stroke-width="1.6"/>
          <rect x="${h.hx + 10}" y="${h.hy - 9}" width="46" height="15" rx="4" fill="#fff" stroke="#E2C0BC"/>
          <text x="${h.hx + 14}" y="${h.hy + 2}" class="cx-lbl-b" fill="#A32017">${h.tapId} ${h.risk}</text></g>`;
      });
    }
  }
  /* nodes */
  if (L.nodes) {
    DB.nodes.forEach(n => {
      const st = (n.type === 'sentinel' && DB.isSim('nodeOffline') && n.id === 'T7') ? 'offline' : n.status;
      const ring = st === 'online' ? '#1E9E4A' : st === 'stale' ? '#F2A900' : '#8A94A6';
      const ic = { pump: '⚙', tank: '▲', pipe: '●', sentinel: '◆' }[n.type];
      g += `<g class="node-g" data-node="${n.id}" transform="translate(${n.hx},${n.hy})">
        <circle r="13" fill="#fff" stroke="${ring}" stroke-width="3"/>
        <text y="4.5" text-anchor="middle" font-size="11" fill="#1F3864">${ic}</text>
        <text y="-18" text-anchor="middle" class="cx-lbl-b">${n.id}</text></g>`;
    });
  }
  /* source markers */
  g += `<text x="110" y="578" text-anchor="middle" class="cx-lbl-b">borewell</text><text x="500" y="82" text-anchor="middle" class="cx-lbl-b">overhead tank</text>`;
  return g + '</svg>';
};

Twin.bind = function (shell, opts = {}) {
  shell.querySelectorAll('.hh-dot').forEach(el => {
    el.addEventListener('click', () => Twin.openHH(el.dataset.hh));
  });
  shell.querySelectorAll('.node-g').forEach(el => {
    el.addEventListener('click', () => Twin.openNode(el.dataset.node));
  });
  const slider = shell.querySelector('#twin-slider');
  if (slider) {
    slider.addEventListener('input', () => {
      App.timeBucket = +slider.value;
      const t = new Date(DB.sim.now - (143 - App.timeBucket) * 600000);
      shell.querySelector('#twin-time').textContent = U.pad2(t.getHours()) + ':' + U.pad2(t.getMinutes());
      const holder = shell.querySelector('#twin-map');
      holder.innerHTML = Twin.mapSvg({});
      Twin.bind(holder);
    });
  }
  const play = shell.querySelector('#twin-play');
  if (play) play.addEventListener('click', () => {
    if (App._play) { clearInterval(App._play); App._play = null; play.innerHTML = '<i class="ph ph-play"></i>'; return; }
    play.innerHTML = '<i class="ph ph-pause"></i>';
    if (App.timeBucket >= 143) App.timeBucket = 0;
    App._play = setInterval(() => {
      if (App.timeBucket >= 143) { clearInterval(App._play); App._play = null; play.innerHTML = '<i class="ph ph-play"></i>'; return; }
      slider.value = ++App.timeBucket;
      slider.dispatchEvent(new Event('input'));
    }, 120);
  });
};

App.reg('twin', {
  title: 'Village digital twin', i18n: 'nav.twin', group: 'Monitor', icon: 'ph-map-trifold',
  render() {
    const t = new Date(DB.sim.now - (143 - App.timeBucket) * 600000);
    const flag = DB.integrity;
    return `
    <div class="page-head">
      <div>
        <div class="crumb">${['state', 'district', 'block', 'gp'].map(l => `<button onclick="App.setLevel('${l}')">${U.t('t.' + l)}</button><i class="ph ph-chevron-right"></i>`).join('')}<span style="color:var(--ink);font-weight:600">${DB.village.name}</span></div>
        <h1>${DB.village.name} digital twin <span class="badge b-grey" style="vertical-align:middle">${DB.village.sujal_gaon_id}</span></h1>
        <div class="sub">${DB.village.households} households · zones A/B/C · 1 borewell pump · 1 overhead tank · ${DB.measuredCount} taps measured, rest estimated with bucket calibration.</div>
      </div>
      <div class="ph-actions">
        <div class="card card-pad row" style="padding:10px 16px;gap:12px">
          ${U.gauge(DB.pamaan, 44)}
          <div><div class="tiny muted">Pramaan Score today</div>
          <span class="badge b-${flag === 'green' ? 'green' : flag === 'amber' ? 'amber' : 'red'}"><i class="ph ph-shield-check"></i>integrity ${flag}</span></div>
        </div>
        <button class="btn btn-secondary" onclick="App.go('register')"><i class="ph ph-table"></i>Register</button>
      </div>
    </div>
    <div class="card" style="overflow:hidden">
      <div class="map-shell" id="twin-map-shell">
        <div class="map-layers" role="group" aria-label="Map layers">
          <div class="ml-t">Layers</div>
          ${[['pipes', 'Pipe network', 'ph-flow-arrow'], ['nodes', 'Nodes', 'ph-broadcast'], ['hh', 'Households', 'ph-house-line'], ['heat', 'Risk heatmap', 'ph-fire'], ['sanit', 'Toilets & drains', 'ph-toilet']].map(([k, l, ic]) => `
            <label><input type="checkbox" ${App.twinLayers[k] ? 'checked' : ''} onchange="Twin.layer('${k}',this.checked)"><i class="ph ${ic}" style="font-size:13px;color:var(--ink-3)"></i>${l}</label>`).join('')}
        </div>
        <div class="map-legend">
          <b>${App.timeBucket === 143 ? 'Now' : 'Replay'}</b> · pressure at tap
          <div class="row" style="margin-top:5px"><span class="dot d-green"></span>≥ ${DB.settings.thresholds.kpa} kPa ok</div>
          <div class="row"><span class="dot d-amber"></span>45–69 kPa weak</div>
          <div class="row"><span class="dot d-red"></span>&lt; 45 kPa dry</div>
        </div>
        <div id="twin-map">${Twin.mapSvg({})}</div>
        <div class="timebar">
          <button class="btn btn-secondary btn-sm" id="twin-play" aria-label="Play replay"><i class="ph ph-play"></i></button>
          <span class="tb-t num" id="twin-time">${U.pad2(t.getHours())}:${U.pad2(t.getMinutes())}</span>
          <input type="range" id="twin-slider" min="0" max="143" value="${App.timeBucket}" aria-label="Time slider, last 24 hours">
          <span class="tiny muted" style="white-space:nowrap">24 h ago → now</span>
        </div>
      </div>
    </div>
    <div class="tiny muted mt16">Click any household dot for its estimate, confidence and "why this estimate" line. Click a node for live readings. The time slider replays the last 24 hours — watch Zone B drain as the pump fault progresses.</div>`;
  },
  mount(root) {
    Twin.bind(root.querySelector('#twin-map-shell'));
    if (App.params.q && App.params.q.startsWith('HH-')) Twin.openHH(App.params.q);
  }
});
Twin.layer = (k, v) => { App.twinLayers[k] = v; App.render(); };

Twin.openHH = function (id) {
  const h = DB.hh.find(x => x.id === id); if (!h) return;
  const th = DB.settings.thresholds;
  DB.viewLog.unshift({ who: App.roles[App.role].name, what: h.id + ' · household panel', ts: DB.sim.now });
  const tickets = DB.ticketsFor(h);
  const test = h.lastTest;
  App.drawer({
    title: `${h.id}`,
    sub: `${DB.village.name} · Zone ${h.zone} · Sujal Gaon ${DB.village.sujal_gaon_id} · family of ${h.members}`,
    body: `
    <div class="dr-sect">
      <div class="row" style="gap:8px;flex-wrap:wrap">
        ${h.source === 'measured' ? `<span class="badge b-blue"><i class="ph ph-ruler"></i>Measured by ${h.sensorNode}</span>` : `<span class="badge b-grey"><i class="ph ph-sparkle"></i>Estimated · ${h.conf}% confidence</span>`}
        ${U.riskBadge(h.risk)} ${U.scoreBadge(h.score)} <span class="tiny muted">Pramaan today</span>
      </div>
    </div>
    <div class="dr-sect">
      <h4>Today vs norms</h4>
      <div class="meter-row" style="margin-bottom:8px"><span class="m-l">Pressure</span>
        <div class="bar-track flex1"><div class="bar-fill ${h.nowP >= th.kpa ? 'bar-green' : 'bar-red'}" style="width:${Math.min(100, h.nowP / 130 * 100)}%"></div></div>
        <span class="m-v num">${h.nowP}<small style="font-weight:400"> kPa</small></span></div>
      <div class="meter-row" style="margin-bottom:8px"><span class="m-l">Quantity</span>
        <div class="bar-track flex1"><div class="bar-fill ${h.lpcd >= 55 ? 'bar-green' : h.lpcd >= 40 ? 'bar-amber' : 'bar-red'}" style="width:${Math.min(100, h.lpcd / 55 * 100)}%"></div></div>
        <span class="m-v num">${h.lpcd}<small style="font-weight:400"> L/p/d</small></span></div>
      <div class="tiny muted">Norm: ≥55 litres per person per day (FHTC)</div>
      <div class="meter-row" style="margin-top:12px;margin-bottom:4px"><span class="m-l">Regularity</span>
        <div class="bar-track flex1"><div class="bar-fill ${h.hours >= 1.6 ? 'bar-green' : h.hours >= 1 ? 'bar-amber' : 'bar-red'}" style="width:${Math.min(100, h.hours / 2 * 100)}%"></div></div>
        <span class="m-v num">${h.hours.toFixed(1)}<small style="font-weight:400"> h</small></span></div>
      <div class="tiny muted">Scheduled supply ${DB.village.schedule}</div>
    </div>
    <div class="dr-sect">
      <h4>Risk index ${h.risk}/100</h4>
      ${riskMeters(h)}
      <div class="tiny muted" style="margin-top:6px">Risk estimates where dirty water may enter. It is not a safety certificate — see the test register.</div>
    </div>
    <div class="dr-sect">
      <h4>7-day Pramaan trend</h4>
      <div class="card card-pad" style="padding:10px 12px">${U.lineChart({ series: [{ pts: h.trend7, color: '#1F3864', fill: '#1F3864' }], h: 66, min: 0, max: 100, x: ['6d', '5d', '4d', '3d', '2d', '1d', 'today'], yTicks: 2 })}</div>
    </div>
    <div class="dr-sect">
      <h4>Evidence</h4>
      <div class="kv"><span class="k">Last water test</span><span class="v">${test ? `${U.dmon(test.date)} · <span class="badge b-${test.cls}">${test.result.split('(')[0]}</span>` : 'No test in last 7 days'}</span></div>
      <div class="kv"><span class="k">Next test due</span><span class="v">${U.dmon(DB.sim.now + (test ? 7 : 2) * 864e5)}</span></div>
      <div class="kv"><span class="k">Open tickets</span><span class="v">${tickets.length ? tickets.map(t => `<button class="btn btn-ghost btn-sm" onclick="App.closeDrawer();App.go('kanban');setTimeout(()=>Kanban.openTicket('${t.id}'),200)">${t.id}</button>`).join(' ') : 'none'}</span></div>
      <div class="kv"><span class="k">IMIS household ID</span><span class="v mono">${h.id}</span></div>
      <div class="kv"><span class="k">Coordinates</span><span class="v mono">${h.lat}, ${h.lng}</span></div>
    </div>
    <div class="dr-sect">
      <h4>Why this estimate</h4>
      <div class="small" style="background:var(--grey-tint);border-radius:8px;padding:11px 13px">${U.esc(DB.whyEstimate(h))}</div>
    </div>`
  });
};
function riskMeters(h) {
  return [['Hazard', h.hazard, `${h.lowMin} min below ${DB.settings.thresholds.kpa} kPa · ${h.spikesLive} spikes · ${h.restarts} restarts`],
  ['Vulnerability', h.vl, `${h.isHigh ? '8' : U.clamp(Math.round((580 - Math.min(h.hx, 1000 - h.hx)) / 10), 12, 90)} m to drain · pipe ${h.pipeAge} yrs`],
  ['Barrier (chlorine proxy)', h.barrier, `tank ORP ${DB.isSim('contamination') ? 14 : 62} mV · pH ${DB.isSim('contamination') ? 6.6 : 7.3}`]]
    .map(([l, v, d]) => `<div style="margin-bottom:8px">
      <div class="meter-row"><span class="m-l">${l}</span>
      <div class="bar-track flex1"><div class="bar-fill ${v >= 70 ? 'bar-red' : v >= 40 ? 'bar-amber' : 'bar-green'}" style="width:${v}%"></div></div>
      <span class="m-v num">${v}</span></div>
      <div class="tiny muted" style="margin-left:114px">${d}</div></div>`).join('');
}
Twin.openNode = function (nid) {
  const n = DB.nodes.find(x => x.id === nid); if (!n) return;
  const live = DB.nodeLive(n);
  const st = (n.type === 'sentinel' && DB.isSim('nodeOffline') && n.id === 'T7') ? 'offline' : n.status;
  let rows = '';
  if (n.type === 'pump') {
    rows = `<div class="kv"><span class="k">Voltage</span><span class="v num">${live.voltage} V</span></div>
      <div class="kv"><span class="k">Current</span><span class="v num" style="color:${live.current < 4 ? 'var(--red)' : 'inherit'}">${live.current} A <span class="tiny muted">(expected ${DB.pump.currentNormal} A)</span></span></div>
      <div class="kv"><span class="k">Delivery pressure</span><span class="v num">${live.flow > 8 ? 118 : 4} kPa</span></div>
      <div class="kv"><span class="k">Borewell level</span><span class="v num">${live.bore} m</span></div>
      <div class="kv"><span class="k">Estimated flow</span><span class="v num">${live.flow} m³/h <span class="tiny muted">(expected ${DB.pump.flowExpected})</span></span></div>
      <div class="kv"><span class="k">Runtime today</span><span class="v num">${live.runtime} h</span></div>
      <div class="kv"><span class="k">Diagnosis</span><span class="v"><span class="badge b-${live.diagCls}"><i class="ph ph-stethoscope"></i>${live.diagnosis}</span></span></div>`;
  } else if (n.type === 'tank') {
    rows = `<div class="kv"><span class="k">Level</span><span class="v num">${live.level}% ${DB.isSim('pumpFault') ? '<span class="badge b-amber tiny">draining</span>' : ''}</span></div>
      <div class="kv"><span class="k">pH</span><span class="v num">${live.ph}</span></div>
      <div class="kv"><span class="k">ORP (chlorine proxy)</span><span class="v num">${live.orp} mV</span></div>
      <div class="kv"><span class="k">Conductivity</span><span class="v num">${live.ec} µS/cm</span></div>
      <div class="kv"><span class="k">Turbidity</span><span class="v num">${live.turb} NTU</span></div>
      <div class="kv"><span class="k">Last cleaning</span><span class="v">${live.lastClean}</span></div>
      ${live.drift ? `<div class="proof-item p-amber" style="margin-top:12px"><div class="proof-icon"><i class="ph ph-warning"></i></div><div><div class="p-t">Drift warning</div><div class="p-d">${live.drift}</div></div></div>` : ''}`;
  } else {
    rows = `<div class="kv"><span class="k">Pressure now</span><span class="v num">${st === 'offline' ? '—' : live.pressure + ' kPa'}</span></div>
      <div class="kv"><span class="k">Battery</span><span class="v num">${n.battery}%</span></div>
      <div class="kv"><span class="k">LoRa signal</span><span class="v num">${n.signal}%</span></div>
      <div class="kv"><span class="k">Last seen</span><span class="v">${U.ago(live.lastSeen, DB.sim.now)}</span></div>
      <div class="kv"><span class="k">Offline storage used</span><span class="v num">${n.bufferDays} days</span></div>
      ${n.burstMarks.length ? `<div class="kv"><span class="k">Events</span><span class="v"><span class="badge b-red"><i class="ph ph-drop"></i>burst ${U.dmon(DB.sim.now - 864e5)}</span></span></div>` : ''}`;
  }
  App.drawer({
    title: `Node ${n.id} · ${n.label}`,
    sub: `Zone ${n.zone || 'source'} · ${DB.village.name} · status ${st}`,
    body: `<div class="dr-sect"><div class="row">${U.ring(st, { pump: 'ph-engine', tank: 'ph-cylinder', pipe: 'ph-flow-arrow', sentinel: 'ph-broadcast' }[n.type])}
      <div><div class="w600">${n.label}</div><div class="tiny muted">LoRaWAN node · reporting every 10 min</div></div></div></div>
      <div class="dr-sect"><h4>Live readings</h4>${rows}</div>
      ${n.type !== 'pump' && n.type !== 'tank' && n.series ? `<div class="dr-sect"><h4>Pressure · last 24 h</h4>
        <div class="card card-pad" style="padding:10px 12px">${U.lineChart({ series: [{ pts: n.series, color: '#0070C0', fill: '#0070C0' }], x: DB.hist.labels, h: 110, hline: { y: DB.settings.thresholds.kpa, label: DB.settings.thresholds.kpa + ' kPa' }, marks: n.burstMarks })}</div></div>` : ''}
      <div class="dr-sect"><button class="btn btn-primary" onclick="App.closeDrawer();App.params={q:'${n.id}'};App.go('telemetry')"><i class="ph ph-chart-line-up"></i>Open full telemetry</button></div>`
  });
};

/* ============================================================
   SCREEN 3 · CONTAMINATION RISK
   ============================================================ */
const Risk = window.Risk = {};
App.reg('risk', {
  title: 'Contamination risk', i18n: 'nav.risk', group: 'Monitor', icon: 'ph-drop-half',
  render() {
    const taps = [...DB.hh].filter(h => h.risk >= 40).sort((a, b) => b.risk - a.risk).slice(0, 14);
    return `
    <div class="page-head">
      <div>
        <h1>Contamination risk</h1>
        <div class="sub">Low pressure lets dirty water seep in. This index combines hazard minutes, vulnerability of the pipe stretch, and the chlorine proxy from the tank. <b>Risk and test results are shown separately — this screen never labels water safe or unsafe.</b></div>
      </div>
      <div class="ph-actions">
        <span class="badge b-orange"><i class="ph ph-flask"></i>tank ORP ${DB.isSim('contamination') ? '14 mV — spike' : '62 mV — normal'}</span>
      </div>
    </div>
    <div class="g21">
      <div class="card" style="overflow:hidden">
        <div class="card-head"><h3>Risk heatmap · ${DB.village.name}</h3><span class="h-sub">taps ≥ 70 labelled</span>
          <div class="h-right tiny muted">${DB.hh.filter(h => h.risk >= 70 && h.nowP > 10).length} high-risk taps in flow · ${DB.hh.filter(h => h.nowP <= 10).length} dry (outage)</div></div>
        <div class="map-shell">${Twin.mapSvg({ mode: 'risk', layers: { pipes: true, nodes: true, hh: true, heat: true, sanit: true }, bucket: 143 })}</div>
      </div>
      <div>
        <div class="card mb16">
          <div class="card-head"><h3>Highest-risk taps</h3><span class="h-sub">ranked 0–100</span></div>
          <div style="max-height:520px;overflow-y:auto">
            ${taps.length ? taps.map(h => `
              <div class="feed-item" onclick="Risk.openTap('${h.id}')" tabindex="0" role="button">
                <div class="feed-ic ${h.risk >= 70 ? 'fi-red' : 'fi-amber'}"><i class="ph ph-drop"></i></div>
                <div class="flex1">
                  <div class="fi-t">Tap ${h.tapId} ${U.riskBadge(h.risk)}</div>
                  <div class="fi-d tiny">${h.hazard >= 60 ? `${h.lowMin} min below ${DB.settings.thresholds.kpa} kPa` : 'intermittent low pressure'} · ${h.isHigh ? '8 m to drain' : 'pipe ' + h.pipeAge + ' yrs'} · barrier ${h.barrier}</div>
                </div>
              </div>`).join('') : `<div class="empty-state"><i class="ph ph-shield-check"></i><div class="es-t">No elevated risk signals today</div><div class="es-d">All flowing taps are below the 40 threshold. Next scheduled tests continue as planned.</div></div>`}
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Actions log</h3><span class="h-sub">what was done about it</span></div>
          <div class="card-pad" style="padding-top:8px">
            ${DB.actionsLog.slice(0, 7).map(a => `
              <div class="viewlog-row"><span class="tiny muted num" style="width:44px;flex:none">${U.hhmm(a.ts)}</span><span class="small">${U.esc(a.text)}</span></div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
  }
});
Risk.openTap = function (id) {
  const h = DB.hh.find(x => x.id === id); if (!h) return;
  App.drawer({
    title: `Tap ${h.tapId} · risk ${h.risk}`,
    sub: `Household ${h.id} · Zone ${h.zone} · ${h.source === 'measured' ? 'measured by ' + h.sensorNode : 'estimated · ' + h.conf + '% confidence'}`,
    body: `<div class="dr-sect"><h4>Risk breakdown · ${h.risk}/100</h4>${riskMeters(h)}</div>
      <div class="dr-sect"><h4>Recent test</h4>
        ${h.lastTest ? `<div class="kv"><span class="k">${U.dmon(h.lastTest.date)}</span><span class="v"><span class="badge b-${h.lastTest.cls}">${U.esc(h.lastTest.result)}</span></span></div>` : '<div class="small muted">No test in the last 7 days — routed to the next Jal Sakhi visit.</div>'}
        <div class="tiny muted" style="margin-top:6px">Next test due ${U.dmon(DB.sim.now + 2 * 864e5)}.</div></div>
      <div class="dr-sect"><h4>What has been done</h4>
        <div class="small">${h.risk >= 70 ? 'First-flush advisory sent to this cluster · Jal Sakhi routed for a strip test · sentinel pressure watch every 10 min.' : 'Included in the weekly watch list. No advisory needed today.'}</div></div>
      <div class="dr-sect row" style="gap:9px">
        <button class="btn btn-primary" onclick="App.closeDrawer();Twin.openHH('${h.id}')"><i class="ph ph-house-line"></i>Household panel</button>
        <button class="btn btn-secondary" onclick="App.closeDrawer();App.go('tests')"><i class="ph ph-test-tube"></i>Tests</button>
      </div>`
  });
};

/* ============================================================
   SCREEN 1 · MULTI-LEVEL OVERVIEW
   ============================================================ */
const Overview = window.Overview = {};
let GEO = null;
function buildGeo() {
  if (GEO) return GEO;
  const rnd = U.rng(5150);
  const mk = (name, children) => ({ name, children });
  const blocksOf = {
    Pune: ['Haveli', 'Baramati', 'Daund'], Nashik: ['Sinnar', 'Dindori'], Nagpur: ['Hingna', 'Kamptee'],
    Kolhapur: ['Radhanagri', 'Gadhinglaj'], Satara: ['Mahabaleshwar', 'Wai']
  };
  const gpOf = { Haveli: ['Rampur', 'Kondhur'], Baramati: ['Jambhali', 'Sasoli'], Daund: ['Vambori', 'Nira'], Sinnar: ['Ozar', 'Adgaon'], Dindori: ['Dindori', 'Pimpalgaon'], Hingna: ['Kamptee Rd', 'Kotri'], Kamptee: ['Bhiwapur', 'Mendha'], Radhanagri: ['Nandershi', 'Girgaon'], Gadhinglaj: ['Sangliwadi', 'Kokana'], Mahabaleshwar: ['Panchgani', 'Wai'], Wai: ['Bhimthadi', 'Koyna'] };
  const villOf = {
    Rampur: ['Rampur Khurd', 'Nimgaon', 'Kherwadi', 'Salun'], Kondhur: ['Kondhur', 'Bhoini', 'Shirpun'],
    Jambhali: ['Jambhali', 'Koregaon'], Sasoli: ['Sasoli', 'Loni'], Vambori: ['Vambori', 'Rahuri'], Nira: ['Nira', 'Bhigwan'],
    Ozar: ['Ozar', 'Erandgaon'], Adgaon: ['Adgaon', 'Dindori Kalan'], Dindori: ['Dindori', 'Amboli'], Pimpalgaon: ['Pimpalgaon', 'Sonewadi'],
    'Kamptee Rd': ['Kamptee Rd', 'Hingna'], Kotri: ['Kotri', 'Mundri'], Bhiwapur: ['Bhiwapur', 'Mendha'], Mendha: ['Mendha', 'Kalameshwar'],
    Nandershi: ['Nandershi', 'Kale'], Girgaon: ['Girgaon', 'Nanave'], Sangliwadi: ['Sangliwadi', 'Ardal'], Kokana: ['Kokana', 'Kumbharli'],
    Panchgani: ['Panchgani', 'Dhom'], Wai: ['Wai', 'Bhimthadi'], Koyna: ['Koyna', 'Karanja']
  };
  GEO = mk('Maharashtra', Object.keys(blocksOf).map(d => mk(d, blocksOf[d].map(b => mk(b, (gpOf[b] || [b + ' GP']).map(gp => mk(gp, (villOf[gp] || [gp, gp + ' Khurd', gp + ' Budrukh']).map(v => {
    const ours = v === 'Rampur Khurd' && gp === 'Rampur';
    return { name: v, ours, households: ours ? 400 : U.rint(rnd, 180, 540), fp: ours ? 0 : U.rint(rnd, 62, 97) };
  }))))))));
  return GEO;
}
function geoLeaves(node = buildGeo(), out = []) { node.children ? node.children.forEach(c => geoLeaves(c, out)) : out.push(node); return out; }
function levelNode(l) {
  const g = buildGeo();
  if (l === 'state') return g;
  if (l === 'district') return g.children.find(c => c.name === DB.village.district);
  if (l === 'block') return { name: DB.village.block, children: g.children.find(c => c.name === DB.village.district).children };
  if (l === 'gp') return { name: DB.village.gp, children: g.children.find(c => c.name === DB.village.district).children.find(c => c.name === DB.village.block).children };
  return null;
}
function leafFp(v) { return v.ours ? DB.kpi.functionalPct : v.fp; }

App.reg('overview', {
  title: 'Overview', i18n: 'nav.overview', group: 'Monitor', icon: 'ph-squares-four',
  render() {
    const k = DB.kpi;
    const isToday = App.date === new Date(DB.sim.now).toISOString().slice(0, 10);
    const hist = DB.history30.find(h => new Date(h.date).toISOString().slice(0, 10) === App.date);
    const fp = isToday ? k.functionalPct : hist ? hist.functional : null;
    const worst = geoLeaves().filter(v => !v.ours).sort((a, b) => leafFp(a) - leafFp(b)).slice(0, 6);
    const lvl = App.level;
    const node = levelNode(lvl) || buildGeo();
    const children = node.children || [];
    const alerts = DB.alerts.slice(0, 6);
    const zoneF = App._filters = App._filters || { zone: 'all', fault: 'all' };
    return `
    <div class="page-head">
      <div>
        <div class="crumb">${['state', 'district', 'block', 'gp'].map((l, i) => `<button onclick="App.setLevel('${l}')" class="${lvl === l ? 'w700' : ''}" style="${lvl === l ? 'color:var(--ink)' : ''}">${U.t('t.' + l)}</button><i class="ph ph-chevron-right"></i>`).join('')}<span style="color:var(--ink);font-weight:600">${lvl === 'village' ? DB.village.name : node.name}</span></div>
        <h1>${U.t('nav.overview')} · ${U.t('t.' + (lvl === 'gp' ? 'gp' : lvl))} level</h1>
        <div class="sub">Tap functionality under the Jal Jeevan Mission — a connection counts as FHTC only with ≥55 L/person/day, on schedule, BIS 10500 quality.</div>
      </div>
      <div class="ph-actions no-print">
        <select onchange="App._filters.zone=this.value;App.render()" aria-label="Zone filter" style="width:auto">
          ${['all', 'A', 'B', 'C'].map(z => `<option value="${z}" ${zoneF.zone === z ? 'selected' : ''}>${z === 'all' ? 'All zones' : 'Zone ' + z}</option>`).join('')}
        </select>
        <select onchange="App._filters.fault=this.value;App.render()" aria-label="Fault type filter" style="width:auto">
          ${[['all', 'All fault types'], ['pump', 'Pump'], ['pressure', 'Pressure'], ['quality', 'Quality'], ['leak', 'Leak']].map(([v, l]) => `<option value="${v}" ${zoneF.fault === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
        <button class="btn btn-secondary btn-sm" onclick="Overview.exportCsv()"><i class="ph ph-file-csv"></i>${U.t('t.exportCsv')}</button>
        <button class="btn btn-secondary btn-sm" onclick="window.print()"><i class="ph ph-file-pdf"></i>${U.t('t.exportPdf')}</button>
        <button class="btn btn-secondary btn-sm" onclick="Overview.gramSabha()"><i class="ph ph-scroll"></i>Gram Sabha summary</button>
      </div>
    </div>
    <div class="kpi-row">
      <div class="kpi ${fp >= 90 ? 'k-good' : fp >= 75 ? 'k-warn' : 'k-alert'}">
        <div class="k-l"><i class="ph ph-house-line"></i>Fully functional today</div>
        <div class="k-v num">${isToday ? fp : fp != null ? fp : '—'}<small>%</small></div>
        <div class="k-d">${isToday ? `${k.functional} of 400 households · ≥55 L/p/d` : (hist ? 'from 30-day history' : 'no record for this date')}</div>
      </div>
      <div class="kpi">
        <div class="k-l"><i class="ph ph-sparkle"></i>Households estimated today</div>
        <div class="k-v num">${isToday ? k.estimated : '—'}</div>
        <div class="k-d">${isToday ? `${DB.measuredCount} measured directly · bucket-calibrated` : 'live count only for today'}</div>
      </div>
      <div class="kpi ${k.overdue ? 'k-alert' : ''}">
        <div class="k-l"><i class="ph ph-ticket"></i>Open tickets</div>
        <div class="k-v num">${isToday ? k.openTickets : '—'}</div>
        <div class="k-d">${isToday && k.overdue ? `<span class="badge b-red"><i class="ph ph-warning-octagon"></i>${k.overdue} overdue SLA</span>` : 'within SLA'}</div>
      </div>
      <div class="kpi k-warn">
        <div class="k-l"><i class="ph ph-drop"></i>High-risk taps</div>
        <div class="k-v num">${isToday ? k.highRisk : '—'}</div>
        <div class="k-d">risk ≥ 70 · excluding taps in reported outage</div>
      </div>
      <div class="kpi k-good">
        <div class="k-l"><i class="ph ph-wrench"></i>Median repair time</div>
        <div class="k-v num">${U.dur(k.medianRepair)}</div>
        <div class="k-d">${DB.tickets.filter(t => t.status === 'closed').length} repairs closed with proof</div>
      </div>
    </div>
    <div class="g21">
      <div class="card" style="overflow:hidden">
        <div class="card-head">
          <h3>${lvl === 'village' ? DB.village.name : 'Areas in ' + node.name}</h3>
          <span class="h-sub">coloured by functional % — green 90+ · amber 75–90 · red below 75</span>
          <div class="h-right tiny muted">click a area to drill down</div>
        </div>
        <div style="padding:18px 20px">
          ${lvl === 'village'
        ? `<div class="empty-state" style="padding:26px"><i class="ph ph-map-trifold"></i><div class="es-t">${DB.village.name} is open in the digital twin</div>
             <div class="es-d">House pipes, sensors and all 400 homes on one map.</div>
             <button class="btn btn-primary" style="margin-top:16px" onclick="App.go('twin')"><i class="ph ph-map-trifold"></i>Open village twin</button></div>`
        : Overview.tileMap(children, lvl)}
        </div>
      </div>
      <div>
        <div class="card mb16">
          <div class="card-head"><h3>Worst areas first</h3><span class="h-sub">all villages</span></div>
          <div>
            ${worst.map(v => `
              <div class="feed-item" onclick="Overview.drillToVillage('${v.name}')" tabindex="0" role="button">
                <div class="feed-ic ${leafFp(v) < 75 ? 'fi-red' : 'fi-amber'}"><i class="ph ph-map-pin"></i></div>
                <div class="flex1">
                  <div class="fi-t">${v.name} <span class="badge b-${leafFp(v) < 75 ? 'red' : 'amber'} num">${leafFp(v)}%</span></div>
                  <div class="fi-d tiny">${U.n(v.households)} households · click to open village</div>
                </div>
              </div>`).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Live alerts</h3>
            <div class="h-right"><button class="btn btn-ghost btn-sm" onclick="App.go('alerts')">View all</button></div></div>
          <div>
            ${alerts.map(a => `
              <div class="feed-item ${a.unread ? 'unread' : ''}" onclick="App.go('alerts')" tabindex="0" role="button">
                <div class="feed-ic fi-${a.sev === 'critical' ? 'red' : a.sev === 'high' ? 'amber' : a.sev === 'low' ? 'green' : 'blue'}"><i class="ph ${Alerts.icon(a.type)}"></i></div>
                <div class="flex1">
                  <div class="fi-t">${a.typeName} <span class="tiny muted">· Zone ${a.zone}</span></div>
                  <div class="fi-m"><span data-ago="${a.ts}">${U.ago(a.ts, DB.sim.now)}</span>${a.hh ? `<span>${a.hh} homes</span>` : ''}${a.ticket ? `<span class="mono">${a.ticket}</span>` : ''}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
  }
});
Overview.tileMap = function (children, lvl) {
  const n = children.length;
  const cols = Math.min(n, 4), rows = Math.ceil(n / cols);
  const W = 1000, H = 340 + rows * 8;
  const tw = (W - 40) / cols - 14, th = (H - 30) / Math.max(rows, 1) - 14;
  let g = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img" aria-label="Choropleth tiles">`;
  children.forEach((c, i) => {
    const cx = 20 + (i % cols) * (tw + 14), cy = 15 + Math.floor(i / cols) * (th + 14);
    const leaves = geoLeaves(c);
    const fpv = Math.round(leaves.reduce((s, v) => s + leafFp(v), 0) / leaves.length);
    const col = fpv >= 90 ? '#1E9E4A' : fpv >= 75 ? '#F2A900' : '#D93025';
    const isOurs = c.ours || (c.children && JSON.stringify(c).includes('Rampur Khurd'));
    g += `<g class="node-g" onclick="Overview.drill('${lvl}','${c.name}')" style="cursor:pointer">
      <rect x="${cx}" y="${cy}" width="${tw}" height="${th}" rx="10" fill="${col}" opacity=".14" stroke="${col}" stroke-width="2"/>
      <rect x="${cx}" y="${cy}" width="6" height="${th}" rx="3" fill="${col}"/>
      <text x="${cx + 18}" y="${cy + 30}" font-size="17" font-weight="700" fill="#1A2233" font-family="Inter,sans-serif">${c.name}</text>
      <text x="${cx + 18}" y="${cy + 54}" font-size="26" font-weight="700" fill="${col}" font-family="Inter,sans-serif">${fpv}%</text>
      <text x="${cx + 18}" y="${cy + 74}" font-size="11" fill="#7A849E" font-family="Inter,sans-serif">${leaves.length} villages · ${U.n(leaves.reduce((s, v) => s + v.households, 0))} households${isOurs ? ' · you are here' : ''}</text>
    </g>`;
  });
  return g + '</svg>';
};
Overview.drill = function (lvl, name) {
  const order = ['state', 'district', 'block', 'gp', 'village'];
  const next = order[order.indexOf(lvl) + 1];
  if (next === 'village') {
    if (name === DB.village.name) { App.level = 'village'; App.go('twin'); }
    else U.toast(name, 'Only Rampur Khurd is modelled in this demo build — other villages show roll-up numbers.', 'amber');
    return;
  }
  App.level = next;
  App.render();
  U.toast('Drilled to ' + name, U.t('t.' + next) + ' level · click a tile to continue', 'blue', 2600);
};
Overview.drillToVillage = name => {
  if (name === DB.village.name) { App.level = 'village'; App.go('twin'); }
  else U.toast(name, 'Roll-up only in this demo — open Rampur Khurd for the full twin.', 'amber');
};
Overview.exportCsv = () => {
  const rows = [['imis_hh_id', 'zone', 'members', 'est_pressure_kpa', 'est_lpcd', 'supply_hours', 'confidence_pct', 'source', 'risk_score', 'daily_score']];
  DB.hh.forEach(h => rows.push([h.id, h.zone, h.members, h.nowP, h.lpcd, h.hours, h.conf, h.source, h.risk, h.score]));
  U.csv(`jaldrishti_${DB.village.name.replace(/ /g, '_')}_${App.date}.csv`, rows);
  U.toast('CSV exported', '400 household rows with today\'s estimates and scores.', 'green');
};
Overview.gramSabha = () => App.modal({
  title: 'Gram Sabha summary · one page',
  body: `
    <div class="print-head" style="display:block"><b>JalDrishti · Gram Sabha summary</b></div>
    <h3 style="letter-spacing:-.2px">${DB.village.name} · ${DB.village.sujal_gaon_id}</h3>
    <div class="tiny muted mb16">${DB.village.block} block, ${DB.village.district} district · ${U.dmony(DB.sim.now)} · simulated data</div>
    <div class="stat-inline mb16">
      <div><div class="si-v num">${DB.kpi.functionalPct}%</div><div class="si-l">households fully functional</div></div>
      <div><div class="si-v num">${DB.pamaan}</div><div class="si-l">Pramaan Score (integrity ${DB.integrity})</div></div>
      <div><div class="si-v num">${DB.kpi.openTickets}</div><div class="si-l">open repair tickets</div></div>
      <div><div class="si-v num">${DB.kpi.highRisk}</div><div class="si-l">high-risk taps</div></div>
    </div>
    <div class="small" style="line-height:1.6">
      <p><b>Supply today:</b> scheduled 06:00–08:00. ${DB.isSim('pumpFault') ? 'A pump fault since 06:10 interrupted Zone B supply; the repair ticket TKT-1041 is escalated and the block office informed.' : 'Supply ran on schedule across all zones.'}</p>
      <p style="margin-top:8px"><b>Water quality:</b> no test has returned a red result in the last 7 days. Tap B-217 showed low residual chlorine — a first-flush advisory was issued and a re-test is due ${U.dmon(DB.sim.now + 2 * 864e5)}.</p>
      <p style="margin-top:8px"><b>Proof & records:</b> ${DB.audit.reduce((s, d) => s + d.count, 0)} records this week are in a tamper-evident log; today's hash <span class="hash-cell">${DB.audit[6].dailyHash}</span>. Public QR is displayed on the Panchayat notice board.</p>
    </div>`,
  foot: `<button class="btn btn-secondary" onclick="App.closeModal()">Close</button><button class="btn btn-primary" onclick="window.print()"><i class="ph ph-printer"></i>Print / Save PDF</button>`
});
