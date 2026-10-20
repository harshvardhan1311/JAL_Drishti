/* JalDrishti · shell.js — login, sidebar, topbar, router, drawer/modal, live sim clock */
'use strict';
const App = window.App = { current: null, params: {}, role: null, level: 'state', date: null, screens: {}, logoClicks: 0 };

App.roles = {
  state: { name: 'State / district official', chip: 'State official', short: 'S. Deshpande', desc: 'PHED, DDWS · worst areas first', icon: 'ph-buildings', home: 'overview', screens: ['overview', 'register', 'alerts', 'sync', 'settings'] },
  ae: { name: 'Assistant Engineer (block)', chip: 'Asst. Engineer', short: 'Er. D. Kulkarni', desc: 'Escalated repairs, twin, predictions', icon: 'ph-hard-hat', home: 'kanban', screens: ['overview', 'twin', 'risk', 'telemetry', 'alerts', 'kanban', 'prediction', 'tests', 'register', 'sync', 'settings'] },
  panchayat: { name: 'Gram Panchayat / VWSC', chip: 'Panchayat', short: 'B. Shinde', desc: 'Village status and public proof', icon: 'ph-users-three', home: 'overview', screens: ['overview', 'sync', 'citizenProof', 'settings'] },
  njm: { name: 'Nal Jal Mitra', chip: 'Nal Jal Mitra', short: 'S. Pawar', desc: 'Village technician · repair tasks', icon: 'ph-wrench', home: 'fieldTasks', screens: ['fieldTasks'] },
  sakhi: { name: 'Jal Sakhi (FTK tester)', chip: 'Jal Sakhi', short: 'M. Bhosale', desc: 'Routed tests and payments', icon: 'ph-test-tube', home: 'fieldTests', screens: ['fieldTests'] }
};

App.reg = (id, def) => { App.screens[id] = Object.assign({ id }, def); };
App.go = (id, params) => {
  const h = '#/' + id + (params && params.q ? '/' + params.q : '');
  if (location.hash === h) App.route();
  else location.hash = h;
};
App.route = function () {
  const parts = (location.hash || '').replace('#/', '').split('/');
  let id = parts[0] || (App.role ? App.roles[App.role].home : null);
  if (!id) return; /* bare '#/' — stay on login (boot) or let login restore home */
  if (!App.screens[id]) { App.notFound(id); return; }
  if (App.role && !App.can(id) && !App.isPublic(id) && id !== 'demo') id = App.roles[App.role].home;
  App.current = id;
  App.params = { q: parts[1] || null };
  App.render();
  window.scrollTo(0, 0);
};
App.notFound = function (id) {
  App.current = null;
  const back = App.role
    ? `<button class="btn btn-primary" onclick="App.go('${App.roles[App.role].home}')"><i class="ph ph-arrow-left"></i>Back to ${(() => { const s = App.screens[App.roles[App.role].home]; return s ? (U.t(s.i18n) || s.title) : 'home'; })()}</button>`
    : `<button class="btn btn-primary" onclick="App.backToSignIn()"><i class="ph ph-sign-in"></i>Back to sign-in</button>`;
  const card = `<div class="card card-pad nf-card">
    <div class="nf-code num">404</div>
    <h1>Page not found</h1>
    <div class="sub">No screen is registered at <span class="mono">#/${U.esc(id || '')}</span>${App.role ? '' : ' — the citizen pages and the legal documents open without a login; everything else needs a role'}. The link may be old or mistyped.</div>
    <div class="row mt16" style="gap:10px;flex-wrap:wrap">${back}
      <button class="btn btn-secondary" onclick="App.go('citizenProof')"><i class="ph ph-seal-check"></i>Public proof page</button>
      <button class="btn btn-secondary" onclick="App.go('terms')"><i class="ph ph-scroll"></i>Terms of Use</button></div>
  </div>`;
  document.title = 'Page not found · JalDrishti';
  if (App.role) {
    renderSidebar(); renderTopbar();
    const c = document.getElementById('content');
    c.innerHTML = card;
  } else {
    document.getElementById('root').innerHTML = `<div class="public-wrap">${card}</div>`;
  }
  window.scrollTo(0, 0);
};
App.backToSignIn = () => { location.hash = ''; location.reload(); };
App.can = id => App.role && App.roles[App.role].screens.includes(id);
/* public pages open without a login: the two citizen pages and the legal documents */
App.isPublic = id => !!(App.screens[id] && App.screens[id].public);

/* ============ sidebar: collapses on desktop, slides out on phones/tablets ============ */
App.isNarrow = () => window.matchMedia('(max-width:1080px)').matches;
App.toggleNav = () => {
  const sb = document.getElementById('sidebar');
  if (!sb) return;
  if (App.isNarrow()) {
    /* phone/tablet: sidebar is a 64px rail by default — slide the labelled panel over the content */
    const open = sb.classList.toggle('open');
    document.getElementById('sb-backdrop')?.classList.toggle('on', open);
    document.getElementById('nav-toggle')?.setAttribute('aria-expanded', String(open));
  } else {
    /* desktop: collapse the persistent sidebar to the icon rail (or restore it) */
    const collapsed = document.body.classList.toggle('nav-collapsed');
    document.getElementById('nav-toggle')?.setAttribute('aria-expanded', String(!collapsed));
  }
};
App.closeNav = () => {
  const sb = document.getElementById('sidebar');
  if (!sb || !sb.classList.contains('open')) return;
  sb.classList.remove('open');
  document.getElementById('sb-backdrop')?.classList.remove('on');
  document.getElementById('nav-toggle')?.setAttribute('aria-expanded', 'false');
};

/* ============ boot ============ */
App.start = function () {
  window.addEventListener('hashchange', App.route);
  /* a desktop collapse must not leak into the phone/tablet layout */
  window.addEventListener('resize', () => {
    if (App.isNarrow()) { document.body.classList.remove('nav-collapsed'); App.closeNav(); }
  });
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      if (App.role) App.go('demo');
      else U.toast('Demo panel needs a role', 'Sign in first — the hidden panel is for the state and AE roles.', 'amber');
    }
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    if (!typing && App.role && (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'))) {
      const q = document.getElementById('tb-q');
      if (q) { e.preventDefault(); q.focus(); q.select(); App.searchRender(); }
    }
    if (e.key === 'Escape') { App.closeNav(); App.closeTbMenus(); App.closeDrawer(); App.closeModal(); App.searchClose(); }
  });
  /* click anywhere outside a topbar dropdown / the search box closes it.
     The path is read with composedPath() because a click on a result re-renders the
     panel, which detaches the clicked node before the event reaches the document —
     closest() would then wrongly report the click as "outside". */
  document.addEventListener('click', e => {
    const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
    const inTb = path.some(n => n.nodeType === 1 && (n.classList.contains('tb-pop') || n.classList.contains('tb-btn')));
    const inSearch = path.some(n => n.nodeType === 1 && n.classList.contains('tb-search'));
    if (!inTb) App.closeTbMenus();
    if (!inSearch) App.searchClose();
  });
  App.date = new Date(DB.sim.now).toISOString().slice(0, 10);
  const h = (location.hash || '').replace('#/', '').split('/')[0];
  if (App.screens[h] && App.screens[h].public) { App.route(); return; } /* public pages open without login */
  if (h && !App.screens[h]) { App.notFound(h); return; } /* unknown route on first load */
  renderLogin();
};

function renderLogin() {
  document.getElementById('root').innerHTML = `
  <div class="login-wrap">
    <div class="login-left">
      <div class="login-brand">${dropSvg()} JalDrishti <span style="font-weight:500;color:#9FB0CC">जलदृष्टि</span></div>
      <div class="login-pitch">
        <h2>Every rural tap, checked every day.</h2>
        <p>JalDrishti measures pressure and pump signals at a few points in each village, estimates supply and contamination risk at every household, blocks repair closure without proof, and syncs daily results to IMIS and the Sujal Gaon ID.</p>
        <div class="login-stats">
          <div><div class="ls-v num">400</div><div class="ls-l">households tracked</div></div>
          <div><div class="ls-v num">25</div><div class="ls-l">sensors & sentinels</div></div>
          <div><div class="ls-v num">3</div><div class="ls-l">proof checks per repair</div></div>
        </div>
      </div>
      <div class="login-foot">
        <div class="legal-links">${(window.Docs ? Docs.order : []).map(k => `<button class="lnk" onclick="App.go('${k}')">${Docs.map[k].title}</button>`).join('<span class="sep">·</span>')}</div>
        <div style="margin-top:7px">SIH26255 · Ministry of Jal Shakti · Jal Jeevan Mission — demo build with simulated data · © ${new Date().getFullYear()} JalDrishti<br>
          Helpline <a href="tel:18001234567">1800-123-4567</a> · <a href="mailto:helpdesk@jaldrishti.gov.in">helpdesk@jaldrishti.gov.in</a></div>
      </div>
    </div>
    <div class="login-right">
      <div class="login-card">
        <h1>Sign in</h1>
        <div class="sub">Phone OTP or username — then pick the role you want to demo.</div>
        <div class="seg-tabs" style="margin-bottom:16px">
          <button class="active" id="lg-otp" onclick="App.loginMethod('otp')">Phone OTP</button>
          <button id="lg-user" onclick="App.loginMethod('user')">Username</button>
        </div>
        <div id="lg-field"></div>
        <div style="margin-top:20px">
          <label style="font-size:12px;font-weight:600;color:var(--ink-2)">Demo role</label>
          <div class="role-grid" id="role-grid">
            ${Object.entries(App.roles).map(([k, r]) => `
              <button class="role-opt" id="ro-${k}" onclick="App.pickRole('${k}')">
                <i class="ph ${r.icon}"></i>
                <div><div class="rn">${r.name}</div><div class="rd">${r.desc}</div></div>
              </button>`).join('')}
          </div>
        </div>
        <button class="btn btn-primary btn-lg" id="lg-go" style="width:100%;justify-content:center;margin-top:18px" disabled onclick="App.login()">
          Sign in <i class="ph ph-arrow-right"></i>
        </button>
        <div class="login-hint">
          <div class="row" style="align-items:flex-start;gap:8px"><i class="ph ph-shield-check" style="font-size:15px;color:var(--green);margin-top:1px"></i>
          <span>Phone numbers stay masked, consent for SMS/IVR is recorded, and every view of household data is logged.</span></div>
        </div>
        <div class="demo-shortcut">Citizen pages need no login — open the tap QR page from any role. Hidden demo panel: <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd></div>
        <div class="login-meta">
          <div class="legal-links">${(window.Docs ? Docs.order : []).map(k => `<button class="lnk" onclick="App.go('${k}')">${Docs.map[k].title}</button>`).join('<span class="sep">·</span>')}</div>
          <div class="login-meta-line">Helpline <a href="tel:18001234567">1800-123-4567</a> · <a href="mailto:helpdesk@jaldrishti.gov.in">helpdesk@jaldrishti.gov.in</a></div>
          <div class="login-meta-line">SIH26255 · Ministry of Jal Shakti · Jal Jeevan Mission — demo build with simulated data · © ${new Date().getFullYear()} JalDrishti</div>
        </div>
      </div>
    </div>
  </div>`;
  App.loginMethod('otp');
}
App.loginMethod = function (m) {
  document.getElementById('lg-otp').classList.toggle('active', m === 'otp');
  document.getElementById('lg-user').classList.toggle('active', m === 'user');
  document.getElementById('lg-field').innerHTML = m === 'otp'
    ? `<div class="field"><label>Mobile number</label>
        <div class="otp-row"><input type="tel" value="98••• ••210" aria-label="mobile number">
        <button class="btn btn-secondary" onclick="U.toast('OTP sent','Demo OTP: 4 8 2 9 1 6 — valid 5 minutes','blue')">Send OTP</button></div>
        <div class="help">Demo OTP will be filled automatically.</div></div>`
    : `<div class="field"><label>Username</label><input type="text" value="ae.haveli" aria-label="username"></div>`;
};
App.pickRole = k => {
  App._picked = k;
  Object.keys(App.roles).forEach(r => document.getElementById('ro-' + r).classList.toggle('sel', r === k));
  document.getElementById('lg-go').disabled = false;
};
App.login = function () {
  App.role = App._picked || 'ae';
  const r = App.roles[App.role];
  document.getElementById('root').innerHTML = shellHtml();
  document.body.dataset.role = App.role;
  location.hash = '#/' + r.home;
  if (!location.hash || location.hash === '#/') App.route(); else App.route();
  U.toast('Signed in as ' + r.name, App.role === 'njm' || App.role === 'sakhi' ? 'Field app view — mobile frame on the left.' : 'Home screen: ' + U.t('nav.' + (r.home === 'citizenProof' ? 'citizenProof' : r.home)) + '.', 'green', 2600);
};
App.logout = function () {
  App.role = null; App.current = null;
  document.getElementById('root').innerHTML = '';
  renderLogin();
};

/* ============ shell markup ============ */
function dropSvg() {
  return `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C16 3 6 14.5 6 21a10 10 0 0 0 20 0C26 14.5 16 3 16 3Z" fill="#fff" opacity=".92"/><path d="M16 10c0 0-5 6.4-5 10a5 5 0 0 0 10 0c0-3.6-5-10-5-10Z" fill="#0070C0"/></svg>`;
}
function shellHtml() {
  return `<aside class="sidebar" id="sidebar"></aside>
  <div class="sb-backdrop" id="sb-backdrop" onclick="App.closeNav()"></div>
  <div class="main">
    <header class="topbar" id="topbar"></header>
    <main class="content" id="content" tabindex="-1"></main>
  </div>`;
}

App.render = function () {
  const scr = App.screens[App.current];
  if (!scr) return;
  const label = U.t(scr.i18n) || scr.title;
  document.title = App.role ? label + ' · ' + DB.village.name + ' · JalDrishti' : label + ' · JalDrishti';
  if (!App.role) {
    /* public pages open with no login (spec: the tap QR page opens on scan; legal documents are public too) */
    if (!scr || !App.isPublic(App.current)) return;
    const c = document.getElementById('root');
    c.innerHTML = `<div class="public-wrap">${scr.render()}</div>`;
    if (scr.mount) scr.mount(c);
    return;
  }
  renderSidebar(); renderTopbar();
  const c = document.getElementById('content');
  c.innerHTML = `<div class="print-head"><b>JalDrishti</b> · ${DB.village.name} · ${U.dmony(DB.sim.now)} · simulated data</div>` + scr.render();
  if (scr.mount) scr.mount(c);
};

function renderSidebar() {
  const r = App.roles[App.role];
  const groups = {};
  r.screens.concat(App.current === 'demo' ? ['demo'] : []).forEach(id => {
    const s = App.screens[id]; if (!s) return;
    (groups[s.group] = groups[s.group] || []).push(s);
  });
  const groupOrder = ['Monitor', 'Act', 'Prove', 'Field', 'Settings'];
  const kbOpen = DB.tickets.filter(t => t.status !== 'closed').length;
  document.getElementById('sidebar').innerHTML = `
    <div class="sb-logo" id="sb-logo" title="JalDrishti">${dropSvg()}<span class="txt">JalDrishti</span><span class="tag">DEMO</span></div>
    <nav class="sb-nav" aria-label="Main">
      ${groupOrder.filter(g => groups[g]).map(g => `
        <div class="sb-group">${U.t('grp.' + g.toLowerCase()) || g}</div>
        ${groups[g].map(s => `
          <button class="sb-item ${App.current === s.id ? 'active' : ''}" onclick="App.closeNav();App.go('${s.id}')" ${App.current === s.id ? 'aria-current="page"' : ''} title="${U.t(s.i18n) || s.title}">
            <i class="ph ${s.icon}"></i><span class="lbl">${U.t(s.i18n) || s.title}</span>
            ${s.id === 'kanban' && kbOpen ? `<span class="sb-badge num">${kbOpen}</span>` : ''}
            ${s.id === 'alerts' && DB.unread() ? `<span class="sb-badge num">${DB.unread()}</span>` : ''}
          </button>`).join('')}`).join('')}
    </nav>
    <div class="sb-foot">
      <div class="row"><i class="ph ph-map-pin" style="font-size:13px"></i><span class="txt">${DB.village.name} · ${DB.village.sujal_gaon_id}</span></div>
      <div class="row txt"><span class="dot d-green"></span> 25 nodes · 400 households</div>
    </div>`;
  document.getElementById('sb-logo').onclick = () => {
    if (++App.logoClicks >= 3) { App.logoClicks = 0; App.go('demo'); }
    else App.go(App.roles[App.role].home);
    setTimeout(() => { App.logoClicks = 0; }, 1600);
  };
}

function renderTopbar() {
  const r = App.roles[App.role];
  const levels = ['state', 'district', 'block', 'gp', 'village'];
  const unread = DB.unread();
  document.getElementById('topbar').innerHTML = `
    <button class="nav-toggle" id="nav-toggle" onclick="App.toggleNav()" aria-label="Menu" aria-expanded="false"><i class="ph ph-list"></i></button>
    <div class="tb-wrap">
      <button class="tb-btn" id="tb-btn-level" onclick="App.tbMenu('level')" aria-haspopup="menu" aria-expanded="false" aria-label="Administrative level: ${U.t('t.' + App.level)}" title="Administrative level">
        <i class="ph ph-sitemap"></i><span>${U.t('t.' + App.level)}</span><i class="ph ph-caret-down caret"></i>
      </button>
      <div class="tb-pop" id="tb-pop-level" role="menu" hidden>
        ${levels.map(l => `<button class="menu-item ${App.level === l ? 'on' : ''}" role="menuitemradio" aria-checked="${App.level === l}" onclick="App.setLevel('${l}')">
          <i class="ph ${App.level === l ? 'ph-check-circle' : 'ph-circle'}"></i>${U.t('t.' + l)}</button>`).join('')}
      </div>
    </div>
    <div class="tb-search">
      <i class="ph ph-magnifying-glass"></i>
      <input type="search" id="tb-q" placeholder="${U.t('t.searchAll')}" aria-label="${U.t('t.searchAll')}"
        role="combobox" aria-expanded="false" aria-controls="tb-results" aria-autocomplete="list" autocomplete="off" spellcheck="false"
        oninput="App.searchInput(this)" onfocus="App.searchRender()" onkeydown="App.searchKey(event)">
      <kbd class="tb-kbd" title="Press / to search">/</kbd>
      <button class="tb-clear" id="tb-clear" onclick="App.searchClear(true)" aria-label="Clear search" hidden><i class="ph ph-x-circle"></i></button>
      <div class="tb-results" id="tb-results" role="listbox" aria-label="Search results" hidden></div>
    </div>
    <div class="tb-right">
      <span class="sim-tag" title="All readings on this build come from the simulator"><i class="ph ph-flask"></i><span class="sim-label">${U.t('t.simulated')}</span></span>
      <label class="tb-date no-print" title="Report date"><i class="ph ph-calendar-blank"></i>
        <input type="date" id="tb-date" value="${App.date}" onchange="App.setDate(this.value)" style="border:none;padding:0;background:none;font-size:12.5px;width:92px" aria-label="Report date">
      </label>
      <div class="tb-wrap tb-lang">
        <button class="tb-btn" id="tb-btn-lang" onclick="App.tbMenu('lang')" aria-haspopup="menu" aria-expanded="false" title="${U.t('t.language')}">
          <i class="ph ph-translate"></i><span>${{ en: 'EN', hi: 'हिं', mr: 'मरा' }[U.lang]}</span><i class="ph ph-caret-down caret"></i>
        </button>
        <div class="tb-pop right" id="tb-pop-lang" role="menu" hidden>
          ${[['en', 'English'], ['hi', 'हिंदी'], ['mr', 'मराठी']].map(([k, label]) => `
            <button class="menu-item ${U.lang === k ? 'on' : ''}" role="menuitemradio" aria-checked="${U.lang === k}" onclick="App.setLang('${k}')">
              <i class="ph ${U.lang === k ? 'ph-check-circle' : 'ph-circle'}"></i>${label}</button>`).join('')}
        </div>
      </div>
      <div class="tb-wrap tb-more">
        <button class="tb-btn" id="tb-btn-more" onclick="App.tbMenu('more')" aria-haspopup="menu" aria-expanded="false" aria-label="More options"><i class="ph ph-dots-three-vertical"></i></button>
        <div class="tb-pop right" id="tb-pop-more" role="menu" hidden>
          <div class="menu-head">${U.t('t.language')}</div>
          ${[['en', 'English'], ['hi', 'हिंदी'], ['mr', 'मराठी']].map(([k, label]) => `
            <button class="menu-item ${U.lang === k ? 'on' : ''}" role="menuitemradio" aria-checked="${U.lang === k}" onclick="App.setLang('${k}')">
              <i class="ph ${U.lang === k ? 'ph-check-circle' : 'ph-circle'}"></i>${label}</button>`).join('')}
          <div class="menu-sep"></div>
          <div class="menu-head">Report date</div>
          <div class="menu-pad"><input type="date" value="${App.date}" onchange="App.setDate(this.value);App.closeTbMenus()" aria-label="Report date"></div>
          <div class="menu-sep"></div>
          <button class="menu-item" onclick="App.closeTbMenus();App.go('alerts')"><i class="ph ph-bell"></i>${unread ? `${unread} ` : ''}${U.t('nav.alerts') || 'Alerts'}</button>
          <div class="menu-sep"></div>
          <div class="menu-note"><i class="ph ph-flask"></i>${U.t('t.simulated')}</div>
        </div>
      </div>
      <button class="bell" onclick="App.go('alerts')" aria-label="${unread} unread alerts"><i class="ph ph-bell"></i>${unread ? `<span class="cnt num">${unread}</span>` : ''}</button>
      <div class="tb-wrap">
        <button class="role-chip" onclick="App.roleMenu()" aria-haspopup="menu">
          <span class="av">${r.short.split(' ').map(w => w[0]).slice(0, 2).join('')}</span><span class="rc-name">${r.chip}</span>
          <i class="ph ph-caret-down" style="font-size:11px;color:var(--ink-3)"></i>
        </button>
        <div id="role-menu"></div>
      </div>
    </div>`;
}
App.roleMenu = function () {
  const host = document.getElementById('role-menu');
  if (host.innerHTML) { host.innerHTML = ''; return; }
  host.innerHTML = `<div class="menu" role="menu">
    <div class="menu-head">Signed in as ${App.roles[App.role].name}</div>
    <button class="menu-item" onclick="App.go('citizenTap')"><i class="ph ph-qr-code"></i> Preview citizen tap page</button>
    <button class="menu-item" onclick="App.go('citizenProof')"><i class="ph ph-seal-check"></i> Public proof page</button>
    ${App.role === 'state' || App.role === 'ae' ? `<button class="menu-item" onclick="App.go('demo')"><i class="ph ph-sliders"></i> Demo control panel <kbd style="margin-left:auto">Ctrl+Shift+D</kbd></button>` : ''}
    <div class="menu-sep"></div>
    <div class="menu-head">Switch role</div>
    ${Object.entries(App.roles).filter(([k]) => k !== App.role).map(([k, rr]) => `<button class="menu-item" onclick="App.switchRole('${k}')"><i class="ph ${rr.icon}"></i> ${rr.name}</button>`).join('')}
    <div class="menu-sep"></div>
    <div class="menu-head">${U.t('t.legal')}</div>
    ${(window.Docs ? Docs.order : []).map(k => `<button class="menu-item" onclick="App.go('${k}')"><i class="ph ${Docs.map[k].icon}"></i> ${Docs.map[k].title}</button>`).join('')}
    <div class="menu-note"><i class="ph ph-headset"></i><span>Helpline <a href="tel:18001234567">1800-123-4567</a> · <a href="mailto:helpdesk@jaldrishti.gov.in">helpdesk@jaldrishti.gov.in</a></span></div>
    <div class="menu-sep"></div>
    <button class="menu-item danger" onclick="App.logout()"><i class="ph ph-sign-out"></i> Sign out</button>
  </div>`;
  setTimeout(() => document.addEventListener('click', function h(e) {
    if (!e.target.closest('#role-menu') && !e.target.closest('.role-chip')) { host.innerHTML = ''; document.removeEventListener('click', h); }
  }), 0);
};
App.switchRole = k => {
  App.role = k; document.body.dataset.role = k;
  App.go(App.roles[k].home);
  App.render();
  U.toast('Role switched', App.roles[k].name + ' · ' + App.roles[k].desc, 'blue');
};
App.setLevel = l => { App.closeTbMenus(); App.level = l; App.go('overview'); };
App.setDate = v => { App.date = v; if (App.current) App.render(); };
App.setLang = l => { App.closeTbMenus(); U.lang = l; document.body.dataset.lang = l; if (App.role) App.render(); else renderLogin(); };

/* topbar dropdowns (level, language) — only one open at a time */
App.tbMenu = function (name) {
  const pop = document.getElementById('tb-pop-' + name);
  const btn = document.getElementById('tb-btn-' + name);
  if (!pop) return;
  const wasOpen = !pop.hidden;
  App.closeTbMenus();
  document.getElementById('role-menu').innerHTML = '';
  if (!wasOpen) { pop.hidden = false; btn?.setAttribute('aria-expanded', 'true'); }
};
App.closeTbMenus = function () {
  document.querySelectorAll('.tb-pop').forEach(p => { p.hidden = true; });
  document.querySelectorAll('.tb-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
};

/* ============ search: index, live results, keyboard ============ */
App.searchIndex = function () {
  const items = [], seen = new Set();
  const add = it => { if (!seen.has(it.key)) { seen.add(it.key); items.push(it); } };

  /* screens this role can open */
  Object.keys(App.screens).forEach(id => {
    const s = App.screens[id];
    if (!s || s.public || !App.can(id)) return;
    const label = U.t(s.i18n) || s.title;
    add({ key: 'sc:' + id, group: 'Screens', icon: s.icon, title: label, sub: 'Open screen', terms: [label, id], run: () => App.go(id) });
  });

  /* repairs — for roles that hold the kanban */
  if (App.can('kanban')) DB.tickets.forEach(t => add({
    key: 'tk:' + t.id, group: 'Repairs', icon: 'ph-kanban', title: t.id + ' · ' + t.typeName,
    sub: 'Zone ' + t.zone + ' · ' + t.status + ' · ' + t.diagnosis.slice(0, 54) + '…',
    terms: [t.id, t.typeName, t.type, t.diagnosis, 'zone ' + t.zone, t.assignee],
    run: () => { App.go('kanban'); setTimeout(() => Kanban.openTicket(t.id), 160); }
  }));

  /* households — for roles that hold the register or the twin */
  const hhScreen = App.can('twin') ? 'twin' : (App.can('register') ? 'register' : null);
  if (hhScreen) DB.hh.forEach(h => add({
    key: 'hh:' + h.id, group: 'Households', icon: 'ph-house-line', title: h.id + ' · tap ' + h.tapId,
    sub: 'Zone ' + h.zone + ' · ' + h.members + ' members · tap ' + h.tapId,
    terms: [h.id, h.tapId, 'tap ' + h.tapId, h.id.replace('HH-', ''), 'zone ' + h.zone],
    run: () => {
      if (hhScreen === 'twin') { App.go('twin'); setTimeout(() => Twin.openHH(h.id), 180); }
      else { App._rf = Object.assign({ zone: 'all', n: 40 }, App._rf, { q: h.id }); App.go('register'); }
    }
  }));

  /* the village itself */
  add({
    key: 'vil', group: 'Villages', icon: 'ph-map-pin', title: DB.village.name,
    sub: DB.village.sujal_gaon_id + ' · open at village level',
    terms: [DB.village.name, DB.village.sujal_gaon_id, 'sujal gaon'],
    run: () => { App.level = 'village'; App.go('overview'); }
  });

  /* the public documents */
  if (window.Docs) Docs.order.forEach(k => add({
    key: 'doc:' + k, group: 'Help & policies', icon: Docs.map[k].icon, title: Docs.map[k].title,
    sub: Docs.map[k].summary.slice(0, 68) + '…', terms: [Docs.map[k].title, k], run: () => App.go(k)
  }));

  return items;
};

App.hl = function (text, q) {
  const s = String(text), i = s.toLowerCase().indexOf(String(q).toLowerCase());
  if (i < 0) return U.esc(s);
  return U.esc(s.slice(0, i)) + '<mark>' + U.esc(s.slice(i, i + q.length)) + '</mark>' + U.esc(s.slice(i + q.length));
};

App.searchFind = function (q) {
  q = (q || '').trim().toLowerCase();
  if (!q) return [];
  const scored = [];
  App.searchIndex().forEach(it => {
    let best = 0;
    it.terms.forEach(term => {
      const s = String(term).toLowerCase(), i = s.indexOf(q);
      if (i < 0) return;
      let sc = 40 - Math.min(i, 20);
      if (s === q) sc += 60; else if (i === 0) sc += 28;
      if (sc > best) best = sc;
    });
    if (best) scored.push({ it, score: best });
  });
  scored.sort((a, b) => b.score - a.score || a.it.title.length - b.it.title.length);
  const groups = {}, order = [];
  scored.forEach(x => {
    const g = x.it.group;
    if (!groups[g]) { groups[g] = []; order.push(g); }
    if (groups[g].length < 5) groups[g].push(x.it);
  });
  const out = [];
  order.forEach(g => out.push.apply(out, groups[g]));
  return out.slice(0, 16);
};

App.searchRender = function () {
  const host = document.getElementById('tb-results'), input = document.getElementById('tb-q');
  if (!host || !input) return;
  const q = (App._sq || '').trim();
  const res = App._sRes = q ? App.searchFind(q) : [];
  App._sIdx = -1;
  if (!q) {
    host.innerHTML = `<div class="sr-hint">
      <div class="sr-hint-t"><i class="ph ph-lightbulb"></i>Search households, repairs, screens and policies</div>
      <div class="sr-chips">
        <button class="sr-chip" onclick="App.searchDemo('HH-B-0217')">HH-B-0217</button>
        <button class="sr-chip" onclick="App.searchDemo('B-217')">tap B-217</button>
        <button class="sr-chip" onclick="App.searchDemo('TKT-1041')">TKT-1041</button>
        <button class="sr-chip" onclick="App.searchDemo('${DB.village.sujal_gaon_id}')">${DB.village.sujal_gaon_id}</button>
        <button class="sr-chip" onclick="App.searchDemo('privacy')">privacy</button>
      </div>
      <div class="sr-legend"><span><kbd>/</kbd> or <kbd>Ctrl</kbd>+<kbd>K</kbd> to focus</span>
        <span><kbd>↑</kbd><kbd>↓</kbd> move · <kbd>Enter</kbd> open · <kbd>Esc</kbd> close</span></div>
    </div>`;
  } else if (!res.length) {
    host.innerHTML = `<div class="sr-hint">
      <div class="sr-hint-t"><i class="ph ph-magnifying-glass"></i>No match for "${U.esc(q)}"</div>
      <div class="sr-hint-d">Try a household <span class="mono">HH-B-0217</span>, a tap <span class="mono">B-217</span>, a repair <span class="mono">TKT-1041</span>, the Sujal Gaon ID, a screen name, or a policy.</div>
    </div>`;
  } else {
    let last = '';
    host.innerHTML = res.map((it, i) => {
      const head = it.group !== last ? (last = it.group, `<div class="sr-group">${it.group}</div>`) : '';
      return head + `<button class="sr-item" role="option" id="sr-o${i}" aria-selected="false" onclick="App.searchRun(${i})">
        <span class="sr-ic"><i class="ph ${it.icon}"></i></span>
        <span class="sr-tx"><span class="sr-t">${App.hl(it.title, q)}</span><span class="sr-s">${U.esc(it.sub)}</span></span>
        <i class="ph ph-arrow-elbow-down-left sr-go"></i></button>`;
    }).join('') + `<div class="sr-legend"><span>${res.length} result${res.length === 1 ? '' : 's'}</span>
      <span><kbd>↑</kbd><kbd>↓</kbd> move · <kbd>Enter</kbd> open</span></div>`;
  }
  host.hidden = false;
  input.setAttribute('aria-expanded', 'true');
  const clear = document.getElementById('tb-clear');
  if (clear) clear.hidden = !input.value;
};

App.searchMark = function () {
  document.querySelectorAll('.sr-item').forEach((el, i) => {
    const on = i === App._sIdx;
    el.classList.toggle('on', on);
    el.setAttribute('aria-selected', String(on));
    if (on) el.scrollIntoView({ block: 'nearest' });
  });
};
App.searchInput = function (el) { App._sq = el.value; App.searchRender(); };
App.searchKey = function (e) {
  const n = App._sRes ? App._sRes.length : 0;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    if (!n) return;
    e.preventDefault();
    const dir = e.key === 'ArrowDown' ? 1 : -1;
    App._sIdx = App._sIdx < 0 ? (dir === 1 ? 0 : n - 1) : Math.max(0, Math.min(n - 1, App._sIdx + dir));
    App.searchMark();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (n) App.searchRun(App._sIdx < 0 ? 0 : App._sIdx);
    else U.toast('No match', 'Nothing matches "' + U.esc((App._sq || '').trim()) + '". Try HH-B-0217, tap B-217, TKT-1041 or a screen name.', 'amber');
  } else if (e.key === 'Escape') {
    App.searchClose();
    e.target.blur();
  }
};
App.searchRun = function (i) {
  const it = App._sRes && App._sRes[i];
  App.searchClose();
  if (it) it.run();
};
App.searchClose = function () {
  const host = document.getElementById('tb-results'), input = document.getElementById('tb-q');
  if (host) { host.hidden = true; host.innerHTML = ''; }
  if (input) { input.setAttribute('aria-expanded', 'false'); input.value = ''; }
  App._sq = ''; App._sRes = null; App._sIdx = -1;
  const clear = document.getElementById('tb-clear');
  if (clear) clear.hidden = true;
};
App.searchClear = function (focus) {
  App.searchClose();
  const input = document.getElementById('tb-q');
  if (focus && input) {
    input.focus();
    App.searchRender(); /* focus alone fires onfocus, but be explicit: an empty box shows the suggestion panel */
  }
};
App.searchDemo = function (v) {
  const input = document.getElementById('tb-q');
  if (!input) return;
  input.value = v; App._sq = v;
  App.searchRender();
  input.focus();
};
/* kept for any caller that still hands a query straight to App.search */
App.search = function (q) {
  const res = App.searchFind(q);
  if (res.length) { App._sRes = res; App.searchRun(0); }
  else U.toast('No match', 'Try HH-B-0217, tap B-217, TKT-1041 or a screen name.', 'amber');
};

/* ============ drawer & modal ============ */
App.drawer = function (opt) {
  App.closeDrawer();
  const root = document.getElementById('drawer-root');
  root.innerHTML = `<div class="drawer-back" onclick="App.closeDrawer()"></div>
    <aside class="drawer" role="dialog" aria-modal="true" aria-label="${U.esc(opt.title)}">
      <div class="dr-head">
        <div><h2>${opt.title}</h2>${opt.sub ? `<div class="sub">${opt.sub}</div>` : ''}</div>
        <button class="dr-close" onclick="App.closeDrawer()" aria-label="Close"><i class="ph ph-x"></i></button>
      </div>
      <div class="dr-body" id="dr-body">${opt.body}</div>
    </aside>`;
  requestAnimationFrame(() => {
    root.querySelector('.drawer-back').classList.add('on');
    root.querySelector('.drawer').classList.add('on');
  });
  if (opt.mount) opt.mount(root.querySelector('.drawer'));
};
App.closeDrawer = function () {
  const root = document.getElementById('drawer-root');
  if (!root.innerHTML) return;
  root.querySelector('.drawer')?.classList.remove('on');
  root.querySelector('.drawer-back')?.classList.remove('on');
  setTimeout(() => { root.innerHTML = ''; }, 240);
};
App.modal = function (opt) {
  App.closeModal();
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-back" onclick="if(event.target===this)App.closeModal()">
    <div class="modal" role="dialog" aria-modal="true" aria-label="${U.esc(opt.title)}">
      <div class="m-head"><h2>${opt.title}</h2><button class="dr-close" style="margin-left:auto" onclick="App.closeModal()" aria-label="Close"><i class="ph ph-x"></i></button></div>
      <div class="m-body">${opt.body}</div>
      ${opt.foot ? `<div class="m-foot">${opt.foot}</div>` : ''}
    </div></div>`;
  requestAnimationFrame(() => root.querySelector('.modal-back').classList.add('on'));
  if (opt.mount) opt.mount(root);
};
App.closeModal = function () {
  const root = document.getElementById('modal-root');
  if (!root.innerHTML) return;
  root.querySelector('.modal-back')?.classList.remove('on');
  setTimeout(() => { root.innerHTML = ''; }, 200);
};

/* ============ sim clock — ticks 1 simulated minute per 3 real seconds ============ */
setInterval(() => {
  if (!App.role) return;
  DB.sim.now += 60000;
  const esc = DB.escalateCheck();
  document.querySelectorAll('[data-sla]').forEach(el => {
    const due = +el.dataset.sla;
    const late = due < DB.sim.now;
    el.className = 'sla ' + (late ? 'sla-late' : (due - DB.sim.now < 3600e3 ? 'sla-warn' : 'sla-ok'));
    el.innerHTML = `<i class="ph ${late ? 'ph-warning-octagon' : 'ph-clock'}"></i>${late ? 'overdue ' : ''}${U.dur(Math.abs(due - DB.sim.now) / 60000)}`;
  });
  document.querySelectorAll('[data-ago]').forEach(el => { el.textContent = U.ago(+el.dataset.ago, DB.sim.now); });
  if (esc && ['kanban', 'alerts'].includes(App.current)) App.render();
}, 3000);

/* small shared render helpers */
App.slaChip = due => {
  const late = due < DB.sim.now;
  return `<span class="sla ${late ? 'sla-late' : (due - DB.sim.now < 3600e3 ? 'sla-warn' : 'sla-ok')}" data-sla="${due}">
    <i class="ph ${late ? 'ph-warning-octagon' : 'ph-clock'}"></i>${late ? 'overdue ' : ''}${U.dur(Math.abs(due - DB.sim.now) / 60000)}</span>`;
};
App.truthBar = t => `<div class="truth" title="How strongly sensors, complaints and tests agree this fault is real">
  <i class="ph ph-target" style="font-size:11px"></i>truth ${t.score}
  <div class="bar-track"><div class="bar-fill ${t.score >= 75 ? 'bar-green' : t.score >= 50 ? 'bar-amber' : 'bar-red'}" style="width:${t.score}%"></div></div></div>`;
App.proofMini = p => {
  const items = [['photo', 'ph-camera', 'Photo'], ['pressure', 'ph-gauge', 'Pressure'], ['families', 'ph-users-three', 'Families']];
  return items.map(([k, ic, lb]) => {
    const st = (p[k] && p[k].state) || 'grey';
    return `<span class="badge b-${st === 'green' ? 'green' : st === 'amber' ? 'amber' : st === 'red' ? 'red' : 'grey'}" title="${lb} proof"><i class="ph ${ic}"></i>${{ green: '✓', amber: '…', red: '✕', grey: '·' }[st]}</span>`;
  }).join('');
};
