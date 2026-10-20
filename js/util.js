/* JalDrishti · util.js — helpers, i18n, SVG charts */
'use strict';
const U = window.U = {};

/* ---------- seeded RNG (deterministic demo) ---------- */
U.rng = function (seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
U.pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];
U.rint = (rnd, a, b) => a + Math.floor(rnd() * (b - a + 1));
U.rfloat = (rnd, a, b) => a + rnd() * (b - a);
U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- formatting ---------- */
U.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
U.n = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
U.pad2 = v => String(v).padStart(2, '0');
U.hhmm = ms => { const d = new Date(ms); return U.pad2(d.getHours()) + ':' + U.pad2(d.getMinutes()); };
U.dmon = ms => { const d = new Date(ms); return U.pad2(d.getDate()) + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]; };
U.dmony = ms => U.dmon(ms) + ' ' + new Date(ms).getFullYear();
U.dt = ms => U.dmon(ms) + ', ' + U.hhmm(ms);
U.pct = (v, d = 0) => U.n(v, d) + '%';
U.dur = min => {
  min = Math.round(min);
  if (min < 0) return 'overdue';
  if (min < 60) return min + 'm';
  const h = Math.floor(min / 60), m = min % 60;
  if (h < 24) return h + 'h ' + (m ? m + 'm' : '');
  return Math.floor(h / 24) + 'd ' + (h % 24) + 'h';
};
U.ago = (ms, now) => {
  const min = Math.round((now - ms) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return min + ' min ago';
  const h = Math.floor(min / 60);
  if (h < 24) return h + 'h ' + (min % 60) + 'm ago';
  return Math.floor(h / 24) + 'd ago';
};
/* deterministic 12-hex "hash" for the tamper-evident log demo */
U.hash = str => {
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < str.length; i++) {
    h1 = Math.imul(h1 ^ str.charCodeAt(i), 16777619);
    h2 = Math.imul(h2 + str.charCodeAt(i) * (i + 7), 2654435761);
  }
  let out = '';
  for (let k = 0; k < 3; k++) { h1 = Math.imul(h1 ^ (h1 >>> 13), 2246822519); out += (h1 >>> 0).toString(16).padStart(8, '0').slice(0, 4); }
  return out.slice(0, 12);
};

/* ---------- i18n ---------- */
U.lang = 'en';
const I18N = U.i18n = {
  /* key: [english, hindi, marathi] */
  'nav.overview': ['Overview', 'अवलोकन', 'पाहणी'],
  'nav.twin': ['Village twin', 'गाँव डिजिटल ट्विन', 'गाव डिजिटल ट्विन'],
  'nav.risk': ['Contamination risk', 'दूषित होने का जोखिम', 'दूषित व्हण्याचा धोका'],
  'nav.telemetry': ['Node telemetry', 'सेंसर टेलीमेट्री', 'सेन्सर टेलिमेट्री'],
  'nav.alerts': ['Alerts', 'अलर्ट', 'इशारे'],
  'nav.kanban': ['Repairs', 'मरम्मत', 'दुरुस्त्या'],
  'nav.prediction': ['Failure prediction', 'खराबी की भविष्यवाणी', 'खराबी अंदाज'],
  'nav.tests': ['Water quality tests', 'जल गुणवत्ता परीक्षण', 'पाणी गुणवत्ता चाचण्या'],
  'nav.register': ['Household register', 'घर रजिस्टर', 'घर नोंदवही'],
  'nav.sync': ['Sync & audit', 'सिंक और ऑडिट', 'सिंक व ऑडिट'],
  'nav.settings': ['Settings', 'सेटिंग्स', 'सेटिंग्ज'],
  'nav.fieldTasks': ['Repair tasks', 'मरम्मत कार्य', 'दुरुस्ती कार्य'],
  'nav.fieldTests': ['Routed tests', 'निर्धारित परीक्षण', 'नियोजित चाचण्या'],
  'nav.citizenTap': ['Tap QR page', 'नल QR पेज', 'नळ QR पान'],
  'nav.citizenProof': ['Public proof', 'सार्वजनिक प्रमाण', 'सार्वजनिक पुरावा'],
  'nav.demo': ['Demo panel', 'डेमो पैनल', 'डेमो पॅनल'],
  'nav.terms': ['Terms of Use', 'उपयोग की शर्तें', 'वापराच्या अटी'],
  'nav.privacy': ['Privacy Policy', 'गोपनीयता नीति', 'गोपनीयता धोरण'],
  'nav.dataPolicy': ['Data & simulated data', 'डेटा और सिम्युलेटेड डेटा', 'डेटा आणि सिम्युलेटेड डेटा'],
  'nav.a11y': ['Accessibility', 'सुगम्यता', 'सुलभता'],
  'nav.grievance': ['Grievance redressal', 'शिकायत निवारण', 'तक्रार निवारण'],
  'grp.monitor': ['Monitor', 'निगरानी', 'निरीक्षण'],
  'grp.act': ['Act', 'कार्य', 'कृती'],
  'grp.prove': ['Prove', 'प्रमाणित करें', 'पुरावा'],
  't.state': ['State', 'राज्य', 'राज्य'],
  't.district': ['District', 'ज़िला', 'जिल्हा'],
  't.block': ['Block', 'खंड', 'तालुका'],
  't.gp': ['Gram Panchayat', 'ग्राम पंचायत', 'ग्रामपंचायत'],
  't.village': ['Village', 'गाँव', 'गाव'],
  't.households': ['Households', 'परिवार', 'घरे'],
  't.openTickets': ['Open tickets', 'खुले टिकट', 'खुल्या तिकिटे'],
  't.highRisk': ['High-risk taps', 'उच्च जोखिम वाले नल', 'उच्च धोक्याचे नळ'],
  't.medianRepair': ['Median repair time', 'औसत मरम्मत समय', 'सरासरी दुरुस्ती वेळ'],
  't.today': ['Today', 'आज', 'आज'],
  't.search': ['Search Sujal Gaon ID, household or ticket', 'सुजल गाँव ID, परिवार या टिकट में खोजें', 'सुजल गाव ID, घर किंवा तिकिट शोधा'],
  't.measured': ['Measured', 'मापित', 'मोजलेले'],
  't.estimated': ['Estimated', 'अनुमानित', 'अंदाजित'],
  't.risk': ['Risk', 'जोखिम', 'धोका'],
  't.zone': ['Zone', 'क्षेत्र', 'झोन'],
  't.status': ['Status', 'स्थिति', 'स्थिती'],
  't.exportPdf': ['Export PDF', 'PDF निर्यात', 'PDF निर्यात'],
  't.exportCsv': ['Export CSV', 'CSV निर्यात', 'CSV निर्यात'],
  't.noData': ['No data for this selection', 'इस चयन के लिए कोई डेटा नहीं', 'या निवडीसाठी डेटा नाही'],
  't.simulated': ['Simulated data', 'सिम्युलेटेड डेटा', 'सिम्युलेटेड डेटा'],
  't.verifyChain': ['Verify chain', 'श्रृंखला सत्यापित करें', 'साखळी पडताळा'],
  't.createTicket': ['Create ticket', 'टिकट बनाएँ', 'तिकिट तयार करा'],
  't.markResolved': ['Mark resolved', 'हल होने के रूप में चिह्नित करें', 'सोडवले म्हणून चिन्हांकित करा'],
  't.reportProblem': ['Report a problem', 'समस्या की रिपोर्ट करें', 'अडचणीचा तक्रार'],
  't.submit': ['Submit', 'जमा करें', 'सबमिट करा'],
  't.cancel': ['Cancel', 'रद्द करें', 'रद्द करा'],
  't.nextSupply': ['Next supply', 'अगली आपूर्ति', 'पुढील पुरवठा'],
  't.tasks': ['Tasks', 'कार्य', 'कार्य'],
  't.map': ['Map', 'नक्शा', 'नकाशा'],
  't.profile': ['Profile', 'प्रोफ़ाइल', 'प्रोफाइल'],
  't.earnings': ['Earnings', 'कमाई', 'कमाई'],
  't.language': ['Language', 'भाषा', 'भाषा'],
  't.searchAll': ['Search households, repairs, screens, policies', 'परिवार, मरम्मत, स्क्रीन, नीतियाँ खोजें', 'घरे, दुरुस्त्या, स्क्रीन, धोरणे शोधा'],
  't.legal': ['Legal & help', 'कानूनी सहायता', 'कायदेशीर मदत']
};
U.t = key => {
  const e = I18N[key];
  if (!e) return key;
  return e[U.lang === 'hi' ? 1 : U.lang === 'mr' ? 2 : 0];
};

/* ---------- toast ---------- */
U.toast = (title, sub, type = 'blue', ms = 5200) => {
  const icons = { blue: 'ph-info', green: 'ph-check-circle', amber: 'ph-warning', red: 'ph-x-circle' };
  const d = document.createElement('div');
  d.className = 'toast t-' + type;
  d.innerHTML = `<i class="ph ${icons[type]}"></i><div><div class="tt">${U.esc(title)}</div>${sub ? `<div class="ts">${sub}</div>` : ''}</div>`;
  document.getElementById('toasts').appendChild(d);
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 260); }, ms);
};

/* ---------- CSV / download ---------- */
U.csv = (filename, rows) => {
  const body = rows.map(r => r.map(c => {
    const s = String(c == null ? '' : c);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + body], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
};

/* ---------- SVG chart builders ---------- */
/* U.lineChart({series:[{pts:[],color,fill,dashed,width}], x:[], h, min, max, yFmt, hline:{y,label}, marks:[{i,label}], yTicks:3}) */
U.lineChart = o => {
  const w = 100, h = o.h || 150;
  const padL = 30, padR = 6, padT = 8, padB = o.xLabels === false ? 4 : 17;
  const all = o.series.flatMap(s => s.pts).filter(v => v != null);
  if (!all.length) return '<div class="empty-state"><i class="ph ph-chart-line-slash"></i><div class="es-t">No readings</div></div>';
  let min = o.min != null ? o.min : Math.min(...all);
  let max = o.max != null ? o.max : Math.max(...all);
  if (o.hline) { min = Math.min(min, o.hline.y); max = Math.max(max, o.hline.y); }
  const span = (max - min) || 1; min -= span * 0.08; max += span * 0.08;
  const n = Math.max(...o.series.map(s => s.pts.length));
  const X = i => padL + (i / (n - 1)) * (w - padL - padR);
  const Y = v => padT + (1 - (v - min) / (max - min)) * (h - padT - padB);
  let g = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="height:${h}px" role="img">`;
  /* gridlines + y labels */
  const ticks = o.yTicks || 3;
  for (let k = 0; k <= ticks; k++) {
    const v = min + (max - min) * k / ticks, y = Y(v);
    g += `<line class="cx-grid" x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}"/>`;
    g += `<text class="cx-lbl" x="${padL - 3}" y="${y + 3}" text-anchor="end">${o.yFmt ? o.yFmt(v) : Math.round(v)}</text>`;
  }
  /* x labels */
  if (o.x) {
    o.x.forEach((lb, i) => {
      if (!lb) return;
      const step = Math.ceil(o.x.length / 8);
      if (i % step !== 0 && i !== o.x.length - 1) return;
      g += `<text class="cx-lbl" x="${X(i)}" y="${h - 4}" text-anchor="middle">${lb}</text>`;
    });
  }
  if (o.hline) {
    const y = Y(o.hline.y);
    g += `<line class="cx-dash" x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}"/>`;
    if (o.hline.label) g += `<text class="cx-dash-lbl" x="${w - padR}" y="${y - 3}" text-anchor="end">${o.hline.label}</text>`;
  }
  o.series.forEach(s => {
    const pts = s.pts.map((v, i) => v == null ? null : `${X(i)},${Y(v)}`).filter(Boolean).join(' ');
    if (s.fill) {
      const area = `${padL},${Y(min)} ${pts} ${X(s.pts.length - 1)},${Y(min)}`;
      g += `<polygon points="${area}" fill="${s.fill}" opacity=".16"/>`;
    }
    g += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="${s.width || 1.6}" ${s.dashed ? 'stroke-dasharray="4 3"' : ''} stroke-linejoin="round" stroke-linecap="round"/>`;
  });
  (o.marks || []).forEach(m => {
    const x = X(m.i);
    g += `<line x1="${x}" y1="${padT}" x2="${x}" y2="${h - padB}" stroke="#D93025" stroke-width=".9" stroke-dasharray="2 2" opacity=".7"/>`;
    g += `<circle cx="${x}" cy="${padT + 5}" r="2.2" fill="#D93025"/>`;
    if (m.label) g += `<text class="cx-lbl" x="${x}" y="${padT - 1}" text-anchor="middle" fill="#D93025">${m.label}</text>`;
  });
  return g + '</svg>';
};

U.spark = (vals, w = 92, h = 26, color = '#0070C0') => {
  if (!vals || !vals.length) return '';
  const min = Math.min(...vals), max = Math.max(...vals), span = (max - min) || 1;
  const X = i => 1 + (i / (vals.length - 1)) * (w - 2);
  const Y = v => h - 3 - ((v - min) / span) * (h - 6);
  const pts = vals.map((v, i) => `${X(i)},${Y(v)}`).join(' ');
  const last = `${X(vals.length - 1)},${Y(vals[vals.length - 1])}`;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="${X(vals.length - 1)}" cy="${Y(vals[vals.length - 1])}" r="2.2" fill="${color}"/></svg>`;
};

U.gauge = (score, size = 46) => {
  const col = score >= 85 ? 'var(--green)' : score >= 70 ? 'var(--amber)' : 'var(--red)';
  const r = 17, c = 2 * Math.PI * r, off = c * (1 - score / 100);
  return `<svg width="${size}" height="${size}" viewBox="0 0 46 46" aria-label="score ${score}">
    <circle cx="23" cy="23" r="${r}" fill="none" stroke="#E7EBF2" stroke-width="5"/>
    <circle cx="23" cy="23" r="${r}" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 23 23)"/>
    <text x="23" y="26.5" text-anchor="middle" font-size="12.5" font-weight="700" fill="#1A2233" font-family="Inter,sans-serif">${score}</text></svg>`;
};

/* node status ring */
U.ring = (status, icon) => {
  const cls = status === 'online' ? 'r-online' : status === 'stale' ? 'r-stale' : 'r-offline';
  const c = 2 * Math.PI * 16;
  return `<div class="ring-wrap"><svg viewBox="0 0 38 38">
    <circle cx="19" cy="19" r="16" fill="none" stroke="#E7EBF2" stroke-width="3"/>
    <circle cx="19" cy="19" r="16" fill="none" stroke-width="3" stroke-linecap="round" class="${cls}"
      stroke-dasharray="${c * (status === 'online' ? 1 : status === 'stale' ? .45 : .16)} ${c}" transform="rotate(-90 19 19)"/>
    </svg><span class="ri"><i class="ph ${icon}"></i></span></div>`;
};

/* decorative SVG: test strip with colour patches (Jal Sakhi photos) */
U.stripSvg = (patches, w = 64, h = 48) => {
  const pw = (w - 14) / patches.length;
  let g = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice"><rect width="${w}" height="${h}" fill="#D8DDE6"/>
  <rect x="4" y="8" width="${w - 8}" height="${h - 16}" rx="2" fill="#F4F1E8" stroke="#B9B2A0"/>`;
  patches.forEach((c, i) => { g += `<rect x="${7 + i * pw}" y="12" width="${pw - 2}" height="${h - 24}" rx="1.5" fill="${c}"/>`; });
  return g + '</svg>';
};

/* decorative SVG: repair photo placeholder (pipe scene) */
U.photoSvg = (variant = 0) => {
  const palettes = [['#3B4A63', '#5D6E8C', '#8FA0BC'], ['#404A3C', '#5F6E52', '#91A083'], ['#463B3B', '#6E5353', '#AC8F8F']][variant % 3];
  return `<svg viewBox="0 0 64 48" preserveAspectRatio="xMidYMid slice">
    <rect width="64" height="48" fill="${palettes[0]}"/>
    <rect y="30" width="64" height="18" fill="${palettes[1]}"/>
    <rect x="6" y="24" width="52" height="7" rx="3" fill="${palettes[2]}"/>
    <circle cx="${18 + variant * 9}" cy="27.5" r="6" fill="${palettes[0]}" opacity=".85"/>
    <path d="M40 14l6 6-3 3-6-6z" fill="#D9E0EC" opacity=".8"/></svg>`;
};

/* demo QR-style matrix (deterministic, decorative — encodes the tap/public-proof URL in production) */
U.qrSvg = (text, size = 132) => {
  const n = 21, cell = size / n;
  let bits = '', h = U.hash(text);
  for (let i = 0; i < n * n; i++) { h = U.hash(h + i); bits += (parseInt(h.slice(0, 2), 16) + i * 7) % 3 === 0 ? '1' : '0'; }
  const finder = (r, c) => {
    const inBox = (R, C) => r >= R && r < R + 7 && c >= C && c < C + 7;
    for (const [R, C] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
      if (inBox(R, C)) {
        const dr = r - R, dc = c - C;
        const edge = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const core = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        return { on: edge || core, fixed: true };
      }
      if (r >= R - 1 && r <= R + 7 && c >= C - 1 && c <= C + 7) return { on: false, fixed: true };
    }
    return null;
  };
  let g = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="QR code (demo pattern)">`;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const f = finder(r, c);
    const on = f ? f.on : bits[r * n + c] === '1';
    if (on) g += `<rect x="${c * cell}" y="${r * cell}" width="${cell}" height="${cell}" fill="#1F3864"/>`;
  }
  return g + '</svg>';
};

/* severity / status helpers shared by every screen */
U.sevDot = sev => ({ critical: 'd-red', high: 'd-red', medium: 'd-amber', low: 'd-blue', info: 'd-grey' }[sev] || 'd-grey');
U.riskCls = r => r >= 70 ? 'red' : r >= 40 ? 'amber' : 'green';
U.riskBadge = r => `<span class="badge b-${U.riskCls(r)} num">${r}</span>`;
U.scoreBadge = s => `<span class="badge b-${s >= 85 ? 'green' : s >= 60 ? 'amber' : 'red'} num">${s}</span>`;
U.srcBadge = src => src === 'measured'
  ? `<span class="badge b-blue"><i class="ph ph-ruler"></i>${U.t('t.measured')}</span>`
  : `<span class="badge b-grey"><i class="ph ph-sparkle"></i>${U.t('t.estimated')}</span>`;
