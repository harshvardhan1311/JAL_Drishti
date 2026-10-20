/* JalDrishti · screens-admin.js — Screens 4 (Telemetry), 5 (Alerts), 7 (Register), 8 (Prediction), 9 (Tests), 10 (Sync & audit) */
'use strict';

/* ============================================================
   SCREEN 4 · NODE TELEMETRY AND HEALTH
   ============================================================ */
const Telemetry = window.Telemetry = {};
App.reg('telemetry', {
  title: 'Node telemetry', i18n: 'nav.telemetry', group: 'Monitor', icon: 'ph-broadcast',
  render() {
    if (App.params.q && DB.nodes.some(n => n.id === App.params.q)) return Telemetry.detail(App.params.q);
    const n = DB.nodes;
    const counts = { online: n.filter(x => (x.type === 'sentinel' && DB.isSim('nodeOffline') && x.id === 'T7') ? false : x.status === 'online').length };
    return `
    <div class="page-head">
      <div><h1>Node telemetry & health</h1>
        <div class="sub">Every sensor in ${DB.village.name}: 1 pump, 1 tank, 3 pipeline nodes and 20 tail-end sentinels. Status ring: green online · amber stale · grey offline.</div></div>
      <div class="ph-actions">
        <span class="badge b-green"><i class="ph ph-wifi"></i>${counts.online} online</span>
        ${DB.isSim('nodeOffline') ? '<span class="badge b-grey"><i class="ph ph-wifi-slash"></i>1 offline (T7)</span>' : ''}
        <span class="badge b-amber"><i class="ph ph-warning"></i>1 drift watch (T12)</span>
      </div>
    </div>
    <div class="g3" style="grid-template-columns:repeat(auto-fill,minmax(238px,1fr))">
      ${n.map(node => {
      const st = (node.type === 'sentinel' && DB.isSim('nodeOffline') && node.id === 'T7') ? 'offline' : node.status;
      const live = DB.nodeLive(node);
      const main = node.type === 'pump' ? `${live.voltage} V · ${live.current} A` : node.type === 'tank' ? `${live.level}% level · ORP ${live.orp} mV` : st === 'offline' ? 'no report' : `${live.pressure} kPa`;
      return `<button class="card card-pad" style="text-align:left;display:flex;gap:12px;align-items:flex-start" onclick="Telemetry.open('${node.id}')">
          ${U.ring(st, { pump: 'ph-engine', tank: 'ph-cylinder', pipe: 'ph-flow-arrow', sentinel: 'ph-broadcast' }[node.type])}
          <div class="flex1">
            <div class="w600">${node.id} <span class="tiny muted" style="font-weight:400">· ${node.type}</span></div>
            <div class="num" style="font-size:16px;font-weight:700;margin:2px 0;color:${st === 'offline' ? 'var(--grey)' : 'var(--navy)'}">${main}</div>
            <div class="tiny muted">${node.type === 'pump' ? `<span class="badge b-${live.diagCls} tiny">${live.diagnosis}</span>` :
          node.type === 'tank' ? (live.drift ? '<span class="badge b-amber tiny">drift watch</span>' : 'probe stable') :
            `batt ${node.battery}% · LoRa ${node.signal}%`}</div>
          </div>
        </button>`;
    }).join('')}
    </div>`;
  },
  mount() { if (!App.params.q) { /* grid view */ } }
});
Telemetry.open = id => { App.params = { q: id }; App.render(); };
Telemetry.detail = function (id) {
  const n = DB.nodes.find(x => x.id === id);
  const st = (n.type === 'sentinel' && DB.isSim('nodeOffline') && n.id === 'T7') ? 'offline' : n.status;
  const live = DB.nodeLive(n);
  let body = '';
  if (n.type === 'pump') {
    body = `<div class="g2">
      <div class="card"><div class="card-head"><h3>Current vs estimated flow · 24 h</h3></div><div class="card-pad">
        ${U.lineChart({ series: [{ pts: DB.hist.pumpI, color: '#0070C0', fill: '#0070C0' }, { pts: DB.hist.pumpQ.map(q => q * 0.55), color: '#F7941D', dashed: true }], x: DB.hist.labels, h: 170, yTicks: 3 })}
        <div class="legend mt16"><span class="lg"><span class="sw" style="background:#0070C0"></span>motor current (A)</span><span class="lg"><span class="sw" style="background:#F7941D"></span>estimated flow (m³/h ÷ 2)</span></div>
      </div></div>
      <div class="card"><div class="card-head"><h3>Readings</h3></div><div class="card-pad">
        ${[['Voltage', live.voltage + ' V', ''], ['Current', live.current + ' A', live.current < 4 ? 'red' : 'green'], ['Expected current', DB.pump.currentNormal + ' A', ''], ['Delivery pressure', (live.flow > 8 ? 118 : 4) + ' kPa', live.flow > 8 ? 'green' : 'red'], ['Borewell level', live.bore + ' m', ''], ['Estimated flow', live.flow + ' m³/h', live.flow < 6 ? 'red' : 'green'], ['Runtime today', live.runtime + ' h', '']].map(([k, v, c]) => `<div class="kv"><span class="k">${k}</span><span class="v num" ${c ? `style="color:var(--${c})"` : ''}>${v}</span></div>`).join('')}
        <div class="mt16"><span class="badge b-${live.diagCls}"><i class="ph ph-stethoscope"></i>Diagnosis: ${live.diagnosis}</span></div>
        <div class="tiny muted mt16">Pump as a sensor: current and voltage reveal both flow and the cause of an outage — power cut, dry borewell or pump wear.</div>
        ${DB.isSim('pumpFault') ? `<button class="btn btn-primary mt16" onclick="App.go('kanban');setTimeout(()=>Kanban.openTicket('TKT-1041'),150)"><i class="ph ph-ticket"></i>Open ticket TKT-1041</button>` : ''}
      </div></div>
    </div>`;
  } else if (n.type === 'tank') {
    body = `<div class="g2">
      <div class="card"><div class="card-head"><h3>Tank level · 24 h</h3></div><div class="card-pad">
        ${U.lineChart({ series: [{ pts: DB.hist.tankL, color: '#0070C0', fill: '#0070C0' }], x: DB.hist.labels, h: 170, min: 0, max: 100, yFmt: v => Math.round(v) + '%' })}
        ${DB.isSim('pumpFault') ? '<div class="tiny mt16" style="color:var(--red)"><i class="ph ph-warning"></i> Draining since 06:10 — pump not refilling. Est. 9 h of reserve at current draw.</div>' : ''}
      </div></div>
      <div class="card"><div class="card-head"><h3>Water quality probes</h3></div><div class="card-pad">
        ${[['pH', live.ph, live.ph < 7 ? 'amber' : 'green'], ['ORP (chlorine proxy)', live.orp + ' mV', live.orp < 40 ? 'red' : 'green'], ['Conductivity', live.ec + ' µS/cm', live.ec > 600 ? 'amber' : 'green'], ['Turbidity', live.turb + ' NTU', live.turb > 2 ? 'red' : 'green'], ['Last cleaning', live.lastClean, '']].map(([k, v, c]) => `<div class="kv"><span class="k">${k}</span><span class="v num" ${c ? `style="color:var(--${c === 'green' ? 'green' : c === 'amber' ? 'amber' : 'red'})"` : ''}>${v}</span></div>`).join('')}
        ${live.drift ? `<div class="proof-item p-amber mt16"><div class="proof-icon"><i class="ph ph-warning"></i></div><div><div class="p-t">Drift warning</div><div class="p-d">${live.drift}</div></div></div>` : '<div class="tiny muted mt16">Probe stable against the tank reference sample.</div>'}
      </div></div>
    </div>`;
  } else {
    body = `<div class="g2">
      <div class="card"><div class="card-head"><h3>Pressure · last 24 h</h3><span class="h-sub">${n.id} · ${n.pipe || 'sentinel'}</span></div><div class="card-pad">
        ${st === 'offline' ? '<div class="empty-state" style="padding:34px"><i class="ph ph-wifi-slash"></i><div class="es-t">Node offline since 05:55</div><div class="es-d">Buffered readings will sync when the node revives. Households here fall back to twin estimates.</div></div>' :
        U.lineChart({ series: [{ pts: n.series, color: '#0070C0', fill: '#0070C0' }], x: DB.hist.labels, h: 170, hline: { y: DB.settings.thresholds.kpa, label: DB.settings.thresholds.kpa + ' kPa threshold' }, marks: n.burstMarks })}
      </div></div>
      <div class="card"><div class="card-head"><h3>Health</h3></div><div class="card-pad">
        ${[['Status', st], ['Battery', n.battery + '%'], ['LoRa signal', n.signal + '%'], ['Last seen', U.ago(live.lastSeen, DB.sim.now)], ['Offline storage used', n.bufferDays + ' of 7 days']].map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}
        <div class="tiny muted mt16">Sentinels sit at tail-end taps — the places where pressure problems show up first.</div>
      </div></div>
    </div>`;
  }
  return `<div class="page-head">
      <div><div class="crumb"><button onclick="Telemetry.open(null);App.params={}">‹ All nodes</button></div>
        <h1>${n.id} · ${n.label}</h1>
        <div class="sub">${DB.village.name} · ${n.zone ? 'Zone ' + n.zone : 'source'} · LoRaWAN node${n.pipe ? ' · pipe ' + n.pipe : ''} · status ${st}</div></div>
      <div class="ph-actions">${U.ring(st, { pump: 'ph-engine', tank: 'ph-cylinder', pipe: 'ph-flow-arrow', sentinel: 'ph-broadcast' }[n.type])}</div>
    </div>${body}`;
};

/* ============================================================
   SCREEN 5 · ALERTS CENTRE
   ============================================================ */
const Alerts = window.Alerts = {};
Alerts.icon = type => ({
  pump_fault: 'ph-engine', supply_outage: 'ph-drop-slash', low_pressure: 'ph-gauge', contam: 'ph-drop-half',
  leak: 'ph-flow-arrow', citizen: 'ph-user-circle', node_offline: 'ph-wifi-slash', probe_drift: 'ph-compass',
  escalation: 'ph-warning-octagon', test: 'ph-test-tube', power_cut: 'ph-plug', source_dry: 'ph-sun-dim'
}[type] || 'ph-bell');
App.reg('alerts', {
  title: 'Alerts', i18n: 'nav.alerts', group: 'Monitor', icon: 'ph-bell-ringing',
  render() {
    const f = App._af = App._af || { type: 'all', sev: 'all', zone: 'all', q: '' };
    const list = Alerts.list();
    const types = [...new Set(DB.alerts.map(a => a.type))];
    return `
    <div class="page-head">
      <div><h1>Alerts centre</h1>
        <div class="sub">One feed of everything that went wrong — sensor events, citizen complaints transcribed by Bhashini, and SLA escalations.</div></div>
      <div class="ph-actions"><button class="btn btn-secondary btn-sm" onclick="Alerts.markAll()"><i class="ph ph-checks"></i>Mark all read</button></div>
    </div>
    <div class="card mb16 card-pad" style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
      <select style="width:auto" onchange="App._af.type=this.value;App.render()" aria-label="Alert type">
        <option value="all">All types</option>${types.map(t => `<option value="${t}" ${f.type === t ? 'selected' : ''}>${DB.alerts.find(a => a.type === t).typeName}</option>`).join('')}</select>
      <select style="width:auto" onchange="App._af.sev=this.value;App.render()" aria-label="Severity">
        ${['all', 'critical', 'high', 'medium', 'low'].map(s => `<option value="${s}" ${f.sev === s ? 'selected' : ''}>${s === 'all' ? 'All severities' : s[0].toUpperCase() + s.slice(1)}</option>`).join('')}</select>
      <select style="width:auto" onchange="App._af.zone=this.value;App.render()" aria-label="Zone">
        ${['all', 'A', 'B', 'C'].map(z => `<option value="${z}" ${f.zone === z ? 'selected' : ''}>${z === 'all' ? 'All zones' : 'Zone ' + z}</option>`).join('')}</select>
      <span class="in-search" style="flex:1 1 200px;max-width:280px">
        <i class="ph ph-magnifying-glass"></i>
        <input type="search" value="${U.esc(f.q)}" placeholder="Search this feed — zone, ticket, keyword" aria-label="Search alerts" oninput="App._af.q=this.value;Alerts.refresh()">
      </span>
      <button class="btn btn-ghost btn-sm" id="af-clear" onclick="Alerts.clear()" ${f.q || f.type !== 'all' || f.sev !== 'all' || f.zone !== 'all' ? '' : 'disabled'}><i class="ph ph-arrow-counter-clockwise"></i>Clear</button>
      <span class="tiny muted" id="af-count" style="margin-left:auto">${list.length} of ${DB.alerts.length} alerts</span>
    </div>
    <div class="card" id="alerts-feed">${Alerts.feedHtml(list)}</div>`;
  }
});
Alerts.list = function () {
  const f = App._af = App._af || { type: 'all', sev: 'all', zone: 'all', q: '' };
  const q = (f.q || '').trim().toLowerCase();
  return DB.alerts.filter(a =>
    (f.type === 'all' || a.type === f.type) &&
    (f.sev === 'all' || a.sev === f.sev) &&
    (f.zone === 'all' || a.zone === f.zone) &&
    (!q || [a.id, a.typeName, a.type, a.root, a.ticket || '', a.sev, 'zone ' + a.zone].join(' ').toLowerCase().indexOf(q) >= 0));
};
Alerts.feedHtml = function (list) {
  list = list || Alerts.list();
  return list.length ? list.map(a => `
      <div class="feed-item ${a.unread ? 'unread' : ''}" onclick="Alerts.open('${a.id}')" tabindex="0" role="button">
        <div class="feed-ic fi-${a.sev === 'critical' ? 'red' : a.sev === 'high' ? 'amber' : a.sev === 'low' ? 'green' : 'blue'}"><i class="ph ${Alerts.icon(a.type)}"></i></div>
        <div class="flex1">
          <div class="fi-t">${a.typeName} <span class="badge b-${U.sevDot(a.sev).replace('d-', '')}">${a.sev}</span> <span class="tiny muted">Zone ${a.zone}</span></div>
          <div class="fi-d">${U.esc(a.root)}</div>
          <div class="fi-m">
            <span data-ago="${a.ts}">${U.ago(a.ts, DB.sim.now)}</span>
            ${a.hh ? `<span><i class="ph ph-house-line"></i> ${a.hh} homes</span>` : ''}
            ${a.ticket ? `<span class="mono">${a.ticket}</span>` : ''}
            ${a.channels ? a.channels.map(c => `<span><i class="ph ${c.kind === 'SMS' ? 'ph-chat-circle-text' : 'ph-phone-call'}"></i> ${c.kind} · ${c.langs.join(', ')}</span>`).join('') : ''}
          </div>
        </div>
        <i class="ph ph-caret-right" style="color:#B4BDCD;margin-top:12px"></i>
      </div>`).join('')
    : `<div class="empty-state"><i class="ph ph-magnifying-glass"></i>
        <div class="es-t">Nothing matches these filters</div>
        <div class="es-d">Clear the search text, type, severity or zone to see the full feed.</div>
        <button class="btn btn-secondary btn-sm" style="margin-top:14px" onclick="Alerts.clear()"><i class="ph ph-arrow-counter-clockwise"></i>Clear filters</button></div>`;
};
Alerts.refresh = function () {
  const f = App._af || {};
  const host = document.getElementById('alerts-feed');
  if (host) host.innerHTML = Alerts.feedHtml();
  const c = document.getElementById('af-count');
  if (c) c.textContent = Alerts.list().length + ' of ' + DB.alerts.length + ' alerts';
  const btn = document.getElementById('af-clear');
  if (btn) btn.disabled = !(f.q || f.type !== 'all' || f.sev !== 'all' || f.zone !== 'all');
};
Alerts.clear = function () {
  App._af = { type: 'all', sev: 'all', zone: 'all', q: '' };
  App.render();
  U.toast('Filters cleared', 'Showing all ' + DB.alerts.length + ' alerts.', 'blue');
};
Alerts.markAll = () => {
  const n = DB.alerts.filter(a => a.unread).length;
  DB.alerts.forEach(a => a.unread = false);
  U.toast('All alerts marked read', n ? `${n} alert${n === 1 ? '' : 's'} cleared — the bell count is now zero.` : 'Nothing was unread.', n ? 'green' : 'blue');
  App.render();
};
Alerts.open = function (id) {
  const a = DB.alerts.find(x => x.id === id); if (!a) return;
  a.unread = false;
  Alerts._open = id;
  const langNames = { en: 'English', hi: 'हिन्दी', mr: 'मराठी' };
  App.drawer({
    title: `${a.typeName}`,
    sub: `${a.id} · Zone ${a.zone} · ${U.dt(a.ts)} · ${a.sev} severity`,
    body: `
    <div class="dr-sect"><div class="small">${U.esc(a.root)}</div>
      <div class="kv mt16"><span class="k">Households affected</span><span class="v num">${a.hh || '—'}</span></div>
      <div class="kv"><span class="k">Village</span><span class="v">${DB.village.name} · ${DB.village.sujal_gaon_id}</span></div>
      ${a.ticket ? `<div class="kv"><span class="k">Linked ticket</span><span class="v"><button class="btn btn-ghost btn-sm" onclick="App.closeDrawer();App.go('kanban');setTimeout(()=>Kanban.openTicket('${a.ticket}'),200)">${a.ticket}</button></span></div>` : ''}
    </div>
    ${a.msg ? `<div class="dr-sect"><h4>Message sent to citizens</h4>
      <div class="seg-tabs" style="margin-bottom:12px">${['en', 'hi', 'mr'].map((l, i) => `<button class="${i === 1 ? 'active' : ''}" onclick="Alerts.langTab('${l}',this)">${langNames[l]}</button>`).join('')}</div>
      <div class="msg-preview" id="alert-msg">${U.esc(a.msg.hi)}</div>
      <div class="tiny muted mt16"><i class="ph ph-paper-plane-tilt"></i> SMS to 138 numbers · IVR to 96 registered phones · translated by Bhashini</div></div>` : ''}
    ${a.ivr ? `<div class="dr-sect"><h4>IVR script</h4><div class="msg-preview" style="background:#22304C">${U.esc(a.ivr.hi)}</div></div>` : ''}
    <div class="dr-sect"><h4>Channels</h4>
      ${(a.channels || [{ kind: 'SMS', langs: ['hi', 'mr'] }]).map(c => `<div class="kv"><span class="k"><i class="ph ${c.kind === 'SMS' ? 'ph-chat-circle-text' : 'ph-phone-call'}"></i> ${c.kind}</span><span class="v">${c.langs.join(' · ')} — delivered</span></div>`).join('')}
    </div>`
  });
  App.render();
};
Alerts.langTab = function (l, btn) {
  const a = DB.alerts.find(x => x.id === Alerts._open);
  if (btn && btn.parentElement) btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const box = document.getElementById('alert-msg');
  if (box && a && a.msg) box.textContent = a.msg[l] || a.msg.en || '';
};

/* ============================================================
   SCREEN 7 · HOUSEHOLD PRAMAAN REGISTER
   ============================================================ */
const Register = window.Register = {};
App.reg('register', {
  title: 'Household register', i18n: 'nav.register', group: 'Prove', icon: 'ph-notebook',
  render() {
    const f = App._rf = App._rf || { zone: 'all', q: '', n: 24 };
    let rows = DB.hh.filter(h => (f.zone === 'all' || h.zone === f.zone) && (!f.q || h.id.includes(f.q.toUpperCase()) || h.tapId.includes(f.q.toUpperCase())));
    const show = rows.slice(0, f.n);
    return `
    <div class="page-head">
      <div><h1>Household Pramaan register</h1>
        <div class="sub">Daily score for every household — quantity vs 55 L/person/day, regularity vs schedule, quality vs risk. Names are masked by default.</div></div>
      <div class="ph-actions">
        <button class="btn btn-secondary btn-sm" onclick="Register.export()"><i class="ph ph-file-csv"></i>${U.t('t.exportCsv')}</button>
      </div>
    </div>
    <div class="card card-pad mb16" style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
      ${U.gauge(DB.pamaan, 58)}
      <div>
        <div class="w700" style="font-size:15px">${DB.village.name} · ${DB.village.sujal_gaon_id}</div>
        <div class="row" style="gap:7px;margin-top:5px;flex-wrap:wrap">
          <span class="badge b-${DB.integrity === 'green' ? 'green' : DB.integrity === 'amber' ? 'amber' : 'red'}"><i class="ph ph-shield-check"></i>integrity ${DB.integrity}</span>
          <span class="badge b-blue"><i class="ph ph-ruler"></i>${DB.measuredCount} measured</span>
          <span class="badge b-grey"><i class="ph ph-sparkle"></i>${DB.kpi.estimated} estimated</span>
          <span class="badge b-grey">supply ${DB.village.schedule}</span>
        </div>
      </div>
      <div class="stat-inline" style="margin-left:auto">
        <div><div class="si-v num">${DB.kpi.functionalPct}%</div><div class="si-l">fully functional today</div></div>
        <div><div class="si-v num">${DB.hh.filter(h => h.risk >= 70 && h.nowP > 10).length}</div><div class="si-l">high-risk taps</div></div>
      </div>
    </div>
    <div class="card">
      <div class="card-head">
        <h3>Households</h3>
        <div class="h-right">
          <span class="in-search">
            <i class="ph ph-magnifying-glass"></i>
            <input type="search" placeholder="HH-A-0012 or tap A-012" value="${U.esc(f.q)}" oninput="App._rf.q=this.value;App._rf.n=24;Register.refresh()" aria-label="Search households">
          </span>
          <select style="width:auto;font-size:12px" onchange="App._rf.zone=this.value;App._rf.n=24;App.render()" aria-label="Zone">
            ${['all', 'A', 'B', 'C'].map(z => `<option value="${z}" ${f.zone === z ? 'selected' : ''}>${z === 'all' ? 'All zones' : 'Zone ' + z}</option>`).join('')}</select>
        </div>
      </div>
      <div class="tbl-wrap">
        <table class="tbl">
          <thead><tr><th>Household</th><th>Zone</th><th>Family</th><th>Quantity</th><th>Regularity</th><th>Quality</th><th>Daily score</th><th>7-day</th><th>Source</th></tr></thead>
          <tbody id="reg-rows">
            ${show.map(Register.row).join('')}
          </tbody>
        </table>
        ${!show.length ? `<div class="tbl-empty"><i class="ph ph-magnifying-glass"></i>No household matches "${U.esc(f.q)}"</div>` : ''}
      </div>
      ${rows.length > f.n ? `<div style="padding:14px;text-align:center;border-top:1px solid var(--line-2)">
        <button class="btn btn-secondary btn-sm" onclick="App._rf.n+=40;App.render()">Show more (${rows.length - f.n} remaining)</button></div>` : ''}
    </div>`;
  }
});
Register.row = h => `
  <tr onclick="Twin.openHH('${h.id}')" style="cursor:pointer" tabindex="0">
    <td class="t-id mono">${h.id}</td>
    <td>${h.zone}</td>
    <td class="muted tiny">${h.members} members · name masked</td>
    <td><div class="meter-row" style="gap:7px"><div class="bar-track" style="width:64px"><div class="bar-fill ${h.lpcd >= 55 ? 'bar-green' : h.lpcd >= 40 ? 'bar-amber' : 'bar-red'}" style="width:${Math.min(100, h.lpcd / 55 * 100)}%"></div></div><span class="num w600">${h.lpcd}</span><span class="tiny muted">L/p/d</span></div></td>
    <td><div class="meter-row" style="gap:7px"><div class="bar-track" style="width:52px"><div class="bar-fill ${h.hours >= 1.6 ? 'bar-green' : h.hours >= 1 ? 'bar-amber' : 'bar-red'}" style="width:${Math.min(100, h.hours / 2 * 100)}%"></div></div><span class="num">${h.hours.toFixed(1)}h</span></div></td>
    <td>${U.riskBadge(h.risk)}${h.lastTest ? ` <span class="tiny muted">${U.dmon(h.lastTest.date)}</span>` : ''}</td>
    <td>${U.scoreBadge(h.score)}</td>
    <td>${U.spark(h.trend7, 84, 24, h.score >= 85 ? '#1E9E4A' : h.score >= 60 ? '#F2A900' : '#D93025')}</td>
    <td>${U.srcBadge(h.source)}</td>
  </tr>`;
Register.refresh = function () {
  const f = App._rf;
  const rows = DB.hh.filter(h => (f.zone === 'all' || h.zone === f.zone) && (!f.q || h.id.includes(f.q.toUpperCase()) || h.tapId.includes(f.q.toUpperCase()))).slice(0, f.n);
  document.getElementById('reg-rows').innerHTML = rows.map(Register.row).join('') || `<tr><td colspan="9"><div class="tbl-empty"><i class="ph ph-magnifying-glass"></i>No match</div></td></tr>`;
};
Register.export = () => {
  const rows = [['imis_hh_id', 'zone', 'members', 'est_pressure_kpa', 'est_lpcd', 'supply_hours', 'confidence_pct', 'source', 'risk_score', 'daily_score']];
  DB.hh.forEach(h => rows.push([h.id, h.zone, h.members, h.nowP, h.lpcd, h.hours, h.conf, h.source, h.risk, h.score]));
  U.csv('jaldrishti_household_register.csv', rows);
  U.toast('CSV exported', '400 rows · phone numbers and names stay masked.', 'green');
};

/* ============================================================
   SCREEN 8 · FAILURE PREDICTION
   ============================================================ */
const Predict = window.Predict = {};
App.reg('prediction', {
  title: 'Failure prediction', i18n: 'nav.prediction', group: 'Act', icon: 'ph-crystal-ball',
  render() {
    const p = DB.predictions;
    return `
    <div class="page-head">
      <div><h1>Failure prediction</h1>
        <div class="sub">Warn before failure happens. Ranking repairs stays on the Kanban — every warning here can raise a ticket with one click.</div></div>
    </div>
    <div class="g2">
      <div class="card">
        <div class="card-head"><h3>Pump health</h3><span class="h-sub">current vs estimated flow, 30 days</span>
          <div class="h-right"><span class="badge b-red"><i class="ph ph-warning"></i>wear drift ${p.pump.wearDrift}%</span></div></div>
        <div class="card-pad">
          ${U.lineChart({ series: [{ pts: p.pump.cur, color: '#0070C0', fill: '#0070C0' }, { pts: p.pump.flow.map(f => f * 0.55), color: '#F7941D', dashed: true }], h: 170, x: p.pump.cur.map((_, i) => i % 6 === 0 ? (30 - i) + 'd' : null) })}
          <div class="legend mt16"><span class="lg"><span class="sw" style="background:#0070C0"></span>motor current (A)</span><span class="lg"><span class="sw" style="background:#F7941D"></span>estimated flow (scaled)</span></div>
          <div class="proof-item p-amber mt16">
            <div class="proof-icon"><i class="ph ph-engine"></i></div>
            <div class="flex1"><div class="p-t">Wear warning — current-to-flow ratio drifting</div>
              <div class="p-d">Ratio drifted ${p.pump.wearDrift}% over 30 days. At this rate the pump crosses the failure band in about ${p.pump.daysToWarn} days. Pattern matches the impeller wear seen on TKT-1039.</div></div>
          </div>
          <button class="btn btn-primary mt16" onclick="Predict.create('pump')"><i class="ph ph-ticket"></i>${U.t('t.createTicket')} · pump inspection</button>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Weak pipe sections</h3><span class="h-sub">repeated low-pressure or burst events</span></div>
        <div class="card-pad">
          <div style="background:#F2F6F1;border-radius:8px;overflow:hidden;margin-bottom:14px">
            <svg viewBox="60 90 900 420" style="width:100%;height:auto;display:block" role="img" aria-label="Weak sections mini map">
              ${DB.pipes.map(pp => `<polyline points="${pp.pts.map(q => q.join(',')).join(' ')}" fill="none" stroke="#B9C6D8" stroke-width="4" stroke-linecap="round"/>`).join('')}
              ${p.sections.map(s => `<g><circle cx="${s.hx}" cy="${s.hy}" r="${9 + s.risk / 9}" fill="#D93025" opacity="${0.15 + s.risk / 160}"/><circle cx="${s.hx}" cy="${s.hy}" r="6" fill="${s.risk >= 70 ? '#D93025' : s.risk >= 50 ? '#F2A900' : '#8A94A6'}"/>
                <text x="${s.hx + 12}" y="${s.hy + 4}" class="cx-lbl-b">${s.id} · ${s.risk}</text></g>`).join('')}
            </svg>
          </div>
          ${p.sections.map(s => `
            <div style="border:1px solid var(--line);border-radius:8px;padding:12px 14px;margin-bottom:10px">
              <div class="row"><span class="w700 mono">${s.id}</span><span class="badge b-grey">Zone ${s.zone}</span><span class="tiny muted">laid ${s.laid} · ${2026 - s.laid} yrs</span>
                <span style="margin-left:auto">${U.riskBadge(s.risk)}</span></div>
              <div class="tiny muted" style="margin:6px 0">${s.note}</div>
              <div class="row tiny" style="gap:14px;color:var(--ink-2)"><span><i class="ph ph-gauge"></i> ${s.lowEvents} low-pressure events</span><span><i class="ph ph-drop"></i> ${s.bursts} bursts</span>
                <button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="Predict.create('pipe','${s.id}')"><i class="ph ph-ticket"></i>${U.t('t.createTicket')}</button></div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
  }
});
Predict.create = function (kind, pid) {
  const id = 'TKT-' + (1047 + DB.tickets.filter(t => +t.id.slice(4) >= 1047).length);
  const s = pid ? DB.predictions.sections.find(x => x.id === pid) : null;
  const t = {
    id, type: kind === 'pump' ? 'pump' : 'pressure', typeName: kind === 'pump' ? 'Pump inspection' : 'Pipe section watch',
    zone: s ? s.zone : 'B',
    diagnosis: kind === 'pump' ? 'Predicted: pump wear — current-to-flow ratio drifted 18% in 30 days' : `Predicted weakness on ${pid}: ${s.lowEvents} low-pressure events, pipe laid ${s.laid}`,
    hhAffected: kind === 'pump' ? 400 : 30, critical: kind === 'pump' ? ['Zilla Parishad School'] : [],
    priority: kind === 'pump' ? 66 : 44, parts: { hh: kind === 'pump' ? 30 : 16, hours: 16, risk: 14, critical: kind === 'pump' ? 6 : 5 },
    status: 'new', created: DB.sim.now, slaDue: DB.sim.now + DB.settings.sla.med * 3600e3,
    assignee: null, truth: { score: 64, sensor: 84, complaint: 30, test: 55 }, source: 'sensor',
    proof: { photo: { state: 'grey' }, pressure: { state: 'grey', minutes: 0 }, families: { state: 'grey', confirmed: 0, total: 3 } }
  };
  DB.tickets.push(t);
  DB.recalc();
  U.toast('Ticket created', `<b>${id}</b> added to the Kanban (New) · SLA ${DB.settings.sla.med} h.`, 'green');
  App.render();
};

/* ============================================================
   SCREEN 9 · WATER QUALITY TESTS
   ============================================================ */
const Tests = window.Tests = {};
App.reg('tests', {
  title: 'Water quality tests', i18n: 'nav.tests', group: 'Act', icon: 'ph-test-tube',
  render() {
    const f = App._tf = App._tf || 'all';
    const list = DB.tests.filter(t => f === 'all' || (f === 'verified' && t.verified) || (f === 'wqmis' && t.wqmis !== 'uploaded') || (f === 'pay' && t.payment === 'payment-ready'));
    return `
    <div class="page-head">
      <div><h1>Water quality tests</h1>
        <div class="sub">Jal Sakhi strip tests with AI reading, verification, WQMIS upload and PFMS payment status. ${DB.village.name} · last 7 days.</div></div>
      <div class="ph-actions">
        <div class="seg-tabs">
          ${[['all', 'All'], ['verified', 'Verified'], ['wqmis', 'WQMIS pending'], ['pay', 'Payment-ready']].map(([k, l]) => `<button class="${f === k ? 'active' : ''}" onclick="App._tf='${k}';App.render()">${l}</button>`).join('')}
        </div>
      </div>
    </div>
    <div class="card">
      <div class="tbl-wrap">
        <table class="tbl">
          <thead><tr><th>Strip</th><th>Date</th><th>Tap</th><th>Jal Sakhi</th><th>Parameters</th><th>AI reading</th><th>Confidence</th><th>Verified</th><th>WQMIS</th><th>Payment</th></tr></thead>
          <tbody>
            ${list.map(t => `
            <tr onclick="Tests.open('${t.id}')" style="cursor:pointer" tabindex="0">
              <td><div class="photo-thumb">${U.stripSvg(t.strip)}<span class="gps"><i class="ph ph-map-pin" style="font-size:7px"></i>geo</span></div></td>
              <td class="tiny">${U.dmon(t.ts)} ${U.hhmm(t.ts)}</td>
              <td class="t-id mono">${t.tapId}</td>
              <td>${t.tester}</td>
              <td class="tiny muted">${t.params.join(', ')}</td>
              <td class="num tiny">${t.ai.cl} mg/L Cl · pH ${t.ai.ph} · ${t.ai.turb} NTU</td>
              <td><span class="badge b-${t.confidence >= 92 ? 'green' : 'amber'} num">${t.confidence}%</span></td>
              <td>${t.verified ? '<span class="badge b-green"><i class="ph ph-check"></i>verified</span>' : '<span class="badge b-amber"><i class="ph ph-hourglass"></i>pending</span>'}</td>
              <td>${t.wqmis === 'uploaded' ? '<span class="badge b-blue"><i class="ph ph-cloud-check"></i>uploaded</span>' : t.wqmis === 'pending' ? '<span class="badge b-grey"><i class="ph ph-cloud-arrow-up"></i>pending</span>' : '<span class="badge b-red"><i class="ph ph-cloud-x"></i>failed</span>'}</td>
              <td>${t.payment === 'released' ? '<span class="badge b-green"><i class="ph ph-currency-inr"></i>Released via PFMS</span>' : '<span class="badge b-orange"><i class="ph ph-currency-inr"></i>Payment-ready</span>'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
        ${!list.length ? `<div class="tbl-empty"><i class="ph ph-test-tube"></i>No tests in this filter</div>` : ''}
      </div>
    </div>
    <div class="tiny muted mt16">Never says "safe" or "unsafe": results are reported against BIS 10500 advisory ranges with the next test date. AI strip readings need human verification before WQMIS upload; payment releases only after verification.</div>`;
  }
});
Tests.open = function (id) {
  const t = DB.tests.find(x => x.id === id); if (!t) return;
  App.drawer({
    title: `Test ${t.id} · tap ${t.tapId}`,
    sub: `${U.dt(t.ts)} · ${t.tester} (Jal Sakhi)`,
    body: `
    <div class="dr-sect" style="display:flex;gap:16px;align-items:flex-start">
      <div class="photo-thumb" style="width:180px;height:135px;border-radius:8px">${U.stripSvg(t.strip, 180, 135)}<span class="gps" style="font-size:9px"><i class="ph ph-map-pin"></i>GPS + time stamp</span></div>
      <div class="flex1">
        <div class="kv"><span class="k">AI strip reading</span><span class="v num">${t.ai.cl} mg/L Cl · pH ${t.ai.ph} · ${t.ai.turb} NTU</span></div>
        <div class="kv"><span class="k">Confidence</span><span class="v"><span class="badge b-${t.confidence >= 92 ? 'green' : 'amber'} num">${t.confidence}%</span></span></div>
        <div class="kv"><span class="k">Verified by</span><span class="v">${t.verified ? 'Jal Sakhi + WQMIS rule check' : 'awaiting verification'}</span></div>
      </div>
    </div>
    <div class="dr-sect"><h4>Parameters tested</h4>
      ${t.params.map(p => `<div class="kv"><span class="k">${p}</span><span class="v num">${p === 'Free chlorine' ? t.ai.cl + ' mg/L' : p === 'pH' ? t.ai.ph : t.ai.turb + ' NTU'}</span></div>`).join('')}
      <div class="tiny muted mt16">Result interpretation: ${t.resultCls === 'green' ? 'within BIS 10500 advisory range — routine re-test on schedule.' : 'below residual chlorine advisory — first-flush advisory issued, re-test routed.'}</div>
    </div>
    <div class="dr-sect"><h4>Pipeline status</h4>
      <div class="kv"><span class="k">WQMIS upload</span><span class="v">${t.wqmis === 'uploaded' ? '<span class="badge b-green">uploaded</span>' : `<span class="badge b-${t.wqmis === 'failed' ? 'red' : 'grey'}">${t.wqmis}</span> <button class="btn btn-ghost btn-sm" onclick="Tests.retry('${t.id}')">Retry</button>`}</span></div>
      <div class="kv"><span class="k">Payment</span><span class="v">${t.payment === 'released' ? `<span class="badge b-green">Released via PFMS · ₹${DB.testPayments.rate}</span>` : `<span class="badge b-orange">Payment-ready · ₹${DB.testPayments.rate}</span>`}</span></div>
    </div>`
  });
};
Tests.retry = function (id) {
  const t = DB.tests.find(x => x.id === id);
  t.wqmis = 'uploaded';
  U.toast('WQMIS upload complete', `${id} synced · payment status: Payment-ready.`, 'green');
  App.render(); Tests.open(id);
};

/* ============================================================
   SCREEN 10 · GOV SYNC AND AUDIT LOG
   ============================================================ */
const Sync = window.Sync = {};
App.reg('sync', {
  title: 'Sync & audit', i18n: 'nav.sync', group: 'Prove', icon: 'ph-arrows-clockwise',
  render() {
    return `
    <div class="page-head">
      <div><h1>Government sync & audit log</h1>
        <div class="sub">What reached IMIS, WQMIS and the Sujal Gaon registry — and a tamper-evident log proving records were not altered.</div></div>
      <div class="ph-actions"><button class="btn btn-primary btn-sm" onclick="Sync.verify()"><i class="ph ph-shield-check"></i>${U.t('t.verifyChain')}</button></div>
    </div>
    <div class="g3 mb16">
      ${DB.sync.map(s => `
        <div class="card card-pad">
          <div class="row"><i class="ph ${s.icon}" style="font-size:20px;color:var(--navy)"></i><div><div class="w700">${s.system}</div><div class="tiny muted">${s.fullName}</div></div></div>
          <div class="stat-inline" style="margin-top:16px">
            <div><div class="si-v num">${U.n(s.sent)}</div><div class="si-l">records sent</div></div>
            <div><div class="si-v num" style="color:${s.pending ? 'var(--amber)' : 'inherit'}">${s.pending}</div><div class="si-l">pending</div></div>
            <div><div class="si-v num" style="color:${s.failed ? 'var(--red)' : 'inherit'}">${s.failed}</div><div class="si-l">failed</div></div>
          </div>
          <div class="meter-row" style="margin-top:12px"><span class="m-l">Reconciliation</span>
            <div class="bar-track flex1"><div class="bar-fill ${s.recon >= 99 ? 'bar-green' : 'bar-amber'}" style="width:${s.recon}%"></div></div>
            <span class="m-v num">${s.recon}%</span></div>
          <div class="row mt16" style="justify-content:space-between">
            <span class="tiny muted">Last sync <span data-ago="${s.last}">${U.ago(s.last, DB.sim.now)}</span></span>
            <button class="btn btn-secondary btn-sm" onclick="Sync.now('${s.system}')"><i class="ph ph-arrows-clockwise"></i>Sync now</button>
          </div>
        </div>`).join('')}
    </div>
    <div class="g21">
      <div class="card">
        <div class="card-head"><h3>Tamper-evident audit log</h3><span class="h-sub">one row per day · hash chains to previous day</span>
          <div class="h-right" id="chain-badge"></div></div>
        <div class="tbl-wrap">
          <table class="tbl">
            <thead><tr><th>Date</th><th>Records</th><th>Daily hash</th><th>Previous hash</th><th></th></tr></thead>
            <tbody>
              ${DB.audit.map(d => `
                <tr>
                  <td class="w600">${U.dmony(d.date)} ${d.date === DB.audit[6].date ? '<span class="badge b-blue tiny">today</span>' : ''}</td>
                  <td class="num">${U.n(d.count)}</td>
                  <td><span class="hash-cell">${d.dailyHash}</span></td>
                  <td><span class="hash-cell" style="opacity:.6">${d.prev}</span></td>
                  <td><span class="chain-link"><i class="ph ph-link"></i></span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="card-pad tiny muted" style="border-top:1px solid var(--line-2)">
          <i class="ph ph-info"></i> "Blockchain" is not used here — this is a plain hash-chained log: changing any past row breaks the next link and the verify check fails.
        </div>
      </div>
      <div class="card card-pad" style="text-align:center">
        <h3 style="margin-bottom:16px">Public proof · Panchayat notice board</h3>
        <div class="qr-box">
          ${U.qrSvg('https://jaldrishti.gov.in/proof/' + DB.village.sujal_gaon_id + '/' + App.date, 150)}
          <div class="tiny muted">Scan opens today's public proof page</div>
          <div class="hash-cell">${DB.audit[6].dailyHash}</div>
        </div>
        <button class="btn btn-secondary mt16" style="width:100%;justify-content:center" onclick="window.print()"><i class="ph ph-printer"></i>Print QR for notice board</button>
        <button class="btn btn-ghost mt16" style="width:100%;justify-content:center" onclick="App.go('citizenProof')"><i class="ph ph-seal-check"></i>Open public proof page</button>
      </div>
    </div>`;
  }
});
Sync.now = function (sys) {
  const s = DB.sync.find(x => x.system === sys);
  s.last = DB.sim.now; s.pending = 0; s.failed = 0; s.recon = 100; s.sent += U.rint(Math.random, 3, 20);
  U.toast(sys + ' synced', `${s.sent} records reconciled · 0 pending · chain updated.`, 'green');
  App.render();
};
Sync.verify = function () {
  const badge = document.getElementById('chain-badge');
  if (badge) badge.innerHTML = '<span class="badge b-grey"><i class="ph ph-circle-notch" style="animation:spin 1s linear infinite"></i>rehashing…</span>';
  setTimeout(() => {
    let prev = '000000000000', ok = true;
    DB.audit.forEach(d => {
      if (d.prev !== prev) ok = false;
      prev = d.dailyHash;
    });
    if (badge) badge.innerHTML = ok
      ? `<span class="badge b-green"><i class="ph ph-check-circle"></i>Chain verified · 7 days · 0 breaks</span>`
      : `<span class="badge b-red"><i class="ph ph-x-circle"></i>Chain broken</span>`;
    U.toast(ok ? 'Chain verified' : 'Chain broken', ok ? '7 days rehashed — every day links to the previous one. 0 breaks.' : 'A record was altered — investigate the flagged day.', ok ? 'green' : 'red', 6000);
  }, 1100);
};
