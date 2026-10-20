/* ============================================================
   JalDrishti · legal.js — public information pages
   Terms, privacy, data/simulated-data disclaimer, accessibility,
   grievance redressal. All render without a login (like the two
   citizen pages) and are also reachable from the role menu.
   Wording rules apply here too: never "safe to drink",
   Measured / Estimated · n% confidence, "tamper-evident log",
   official names (Nal Jal Mitra, Jal Sakhi, Sujal Gaon ID, IMIS, WQMIS).
   ============================================================ */
'use strict';

const Docs = window.Docs = {
  updated: '1 October 2026',
  version: 'v1.2',
  order: ['terms', 'privacy', 'dataPolicy', 'a11y', 'grievance'],
  map: {}
};

Docs.add = function (id, def) { def.id = id; Docs.map[id] = def; };

Docs.add('terms', {
  title: 'Terms of Use', i18n: 'nav.terms', icon: 'ph-scroll',
  summary: 'What this build is, who may use it, and the limits of what the dashboard claims.',
  sections: [
    {
      h: 'What JalDrishti is',
      p: [
        'JalDrishti is a monitoring dashboard for rural functional household tap connections (FHTCs). It is built for the SIH26255 problem statement on continuous water-supply monitoring, and in this build it is presented as operated by the Public Health Engineering Department (PHED) together with the District Water and Sanitation Mission (DDWS).',
        'This published build runs entirely on <b>simulated data</b> — no live sensor, no real household and no real mobile number is connected to it. Every screen carries the "Simulated data" tag, and the village, household and settlement names in it are illustrative. Nothing on this build describes a real family.'
      ]
    },
    {
      h: 'What the dashboard claims — and what it does not',
      p: [
        'JalDrishti reports <b>signals</b>: pressure and flow at instrumented points, pump run-hours, field test kit results, and complaints reported by citizens. A household without an instrument is an <b>estimate</b>, and every estimated figure is badged <b>Estimated · n% confidence</b>. Figures taken from an instrument are badged <b>Measured</b>.',
        'JalDrishti <b>never declares water safe to drink</b>. A low risk score means no risk signal has been recorded for that household — it is not a quality clearance, and it is not a health advisory. Confirmation of drinking-water quality is a laboratory job recorded in WQMIS; a laboratory result, not a dashboard figure, is what settles a quality question.'
      ],
      note: 'The public proof page reports a village-level signal and a tamper-evident log. It is not a safety certificate and must not be shown as one.'
    },
    {
      h: 'Roles and permitted use',
      p: ['Access is role-based, and each role sees only the screens its work needs:'],
      list: [
        '<b>State / district official (PHED, DDWS)</b> — village and household views, alerts, government sync, settings.',
        '<b>Assistant Engineer (block)</b> — repairs, digital twin, risk, telemetry, predictions, tests, register.',
        '<b>Gram Panchayat / VWSC</b> — village status and the public proof page.',
        '<b>Nal Jal Mitra</b> — the village technician\'s repair task list.',
        '<b>Jal Sakhi</b> — field test kit routes, results and payments.'
      ],
      note: 'Credentials are personal. Do not share an OTP, and do not create accounts for people who have not been mapped to a village role.'
    },
    {
      h: 'A repair cannot be closed without proof',
      p: [
        'A repair ticket closes only when all three proofs are present: a <b>verified photo</b> taken after the ticket was opened and inside the village, <b>pressure recovery</b> to at least 70 kPa held for the configured window, and the required number of <b>family confirmations</b>.',
        'Dragging a card to <b>Closed</b> without that proof does not force the move — the card returns to its lane and names the missing proof. A ticket that misses its SLA moves to the <b>Escalated</b> lane and the Assistant Engineer is notified. Every move is written to a <b>tamper-evident log</b>.'
      ]
    },
    {
      h: 'Availability of this build',
      p: [
        'This build exists to demonstrate the workflow. It is offered as-is, with no uptime or accuracy guarantee, and its simulator clock and scenario switches can change figures without notice. Data may be reset between demonstrations.'
      ]
    },
    {
      h: 'Acceptable use',
      list: [
        'Do not scrape the dashboard, or export household data in bulk outside the sanctioned IMIS sync.',
        'Do not attempt to re-identify a masked household, or to match a household to a person.',
        'Do not enter real personal data — phone numbers, names or addresses — into this simulated build.',
        'Screenshots of the public proof page and the citizen tap page are fine; they contain no household names or phone numbers.'
      ]
    },
    {
      h: 'Changes, law and contact',
      p: [
        'These terms may change as the pilot moves from simulation to live sensors; the "last updated" date at the top of this page always reflects the current version, and the English version is authoritative.',
        'This build is offered under the laws of India. Questions about these terms can be sent to the helpdesk below.'
      ]
    }
  ]
});

Docs.add('privacy', {
  title: 'Privacy Policy', i18n: 'nav.privacy', icon: 'ph-shield-check',
  summary: 'What data this system handles, who can see it, how long it is kept, and what is never published.',
  sections: [
    {
      h: 'What the system handles',
      list: [
        '<b>Supply signals</b> — pressure, flow and pump run current from nodes in the village, with timestamps.',
        '<b>Proof photos</b> — a photo taken by a Nal Jal Mitra while closing a repair, with GPS position, device time and the ticket it belongs to.',
        '<b>Household records</b> — a household ID, zone, family size, connection date and daily signal history. Names are held separately from the ID and are masked in every screen.',
        '<b>Contact numbers</b> — a mobile number where a family has consented to supply updates by SMS or IVR. Numbers are shown masked, for example 98••• ••210.',
        '<b>Complaints</b> — the problem a family picks on the tap QR page, an optional photo, and an optional voice note transcribed by Bhashini.',
        '<b>Field test results</b> — FTK readings recorded by a Jal Sakhi, with the route and payment that carried them.',
        '<b>Access records</b> — who opened a household record and when. Every view of household-level data is logged.'
      ]
    },
    {
      h: 'Why we hold it',
      p: [
        'Each item above exists for one purpose: keeping rural taps working and reporting the result upward. Sensor and test data feed the daily village status and the Sujal Gaon ID; photos and confirmations exist only to prove a repair; complaint text exists only to route a repair; mobile numbers exist only to send supply and ticket updates.',
        'Personal data is handled on the basis of the consent recorded at the time of collection, and in line with the Digital Personal Data Protection Act, 2023: purpose limitation, data minimisation, and no secondary use. Consent for SMS or IVR is recorded on the family\'s record and can be withdrawn.'
      ]
    },
    {
      h: 'What is never published',
      list: [
        'The public proof page shows village-level aggregates, the tamper-evident log hash and ticket counts — never a household name, a phone number, or which family complained.',
        'The citizen tap page shows only that tap: the supply window, the next test date and a wording-safe risk line.',
        'Household names are masked everywhere in the dashboard. Phone numbers are shown masked. Lists of high-risk households are visible only to the roles whose work needs them.'
      ]
    },
    {
      h: 'Who can see what',
      list: [
        '<b>State / district official</b> — village and household views across the district, alerts, sync status. Household views are logged.',
        '<b>Assistant Engineer (block)</b> — the repairs, telemetry, tests and household register for the block.',
        '<b>Gram Panchayat / VWSC</b> — village status and the public proof page; no household-level personal data.',
        '<b>Nal Jal Mitra</b> — only the repair tasks assigned in that village.',
        '<b>Jal Sakhi</b> — only the test routes assigned to her.',
        '<b>Citizens</b> — the tap QR page and the public proof page, with no login.'
      ]
    },
    {
      h: 'How long it is kept',
      list: [
        'Supply signals — 24 months of hourly history, then aggregated.',
        'Proof photos — for the life of the ticket plus 24 months, then deleted.',
        'Complaint text and voice transcription — 24 months.',
        'Consent records and access logs — for the life of the consent, and audit logs for 5 years.',
        'Field test results — kept as part of the village\'s quality history, without personal identifiers.'
      ],
      note: 'Deletion at the end of a retention period is automatic. Records that a live grievance still needs are held until the grievance closes.'
    },
    {
      h: 'How it is protected',
      p: [
        'Data moves encrypted in transit, and access is decided by role at the server, not in this screen. A view of household-level data writes an entry to the access log; the repair, sync and audit trails are stored so that a later edit is detectable — the tamper-evident log used on the public proof page. Bulk export is limited to the scheduled IMIS and WQMIS sync.'
      ]
    },
    {
      h: 'Your choices',
      list: [
        'Ask what is held against your household, or ask for a correction.',
        'Withdraw SMS or IVR consent, or change the number used for updates.',
        'Raise a privacy grievance with the grievance officer named in the grievance page.'
      ]
    }
  ]
});

Docs.add('dataPolicy', {
  title: 'Data & simulated data', i18n: 'nav.dataPolicy', icon: 'ph-flask',
  summary: 'Where these numbers come from, what "Measured" and "Estimated" mean, and how far the risk score can be trusted.',
  sections: [
    {
      h: 'This build is a simulator',
      p: [
        'Everything on screen is generated by a seeded simulator: 400 households, 25 nodes, a fixed supply schedule and a clock that runs one simulated minute every three real seconds. The demo control panel (Ctrl+Shift+D, for the state and AE roles) can switch scenarios such as a pump fault, a dirty-water complaint or a sensor failure.',
        'Numbers therefore look realistic and behave consistently, but they describe nothing in the real world. Do not quote them.'
      ]
    },
    {
      h: '"Measured" and "Estimated · n% confidence"',
      p: [
        '<b>Measured</b> means an instrument reported the value: a node on the pipe, a pump current sensor, or a field test kit. <b>Estimated · n% confidence</b> means the value was inferred for a household that has no instrument, by combining the nearest instrumented points, the pump schedule and the household\'s own history. The percentage is how much of that figure rests on measurement rather than inference.',
        'A high confidence estimate is still an estimate. If a household matters — a complaint, a test or a repair — the system prefers a measurement, and the dashboard always shows how many households were measured and how many estimated.'
      ]
    },
    {
      h: 'Where a deployed system gets its data',
      list: [
        'Pressure and flow nodes at the source, the overhead tank and selected points on the distribution line.',
        'Pump run-hour and current sensors at the pump house, which reveal supply windows and dry running.',
        'Household field test kit results recorded by a Jal Sakhi on a routed visit.',
        'Complaints from the tap QR page, transcribed in Hindi, Marathi or English by Bhashini.',
        'Laboratory results from the district laboratory, recorded in WQMIS.',
        'Nightly sync of daily results into IMIS, keyed to the village\'s Sujal Gaon ID.'
      ]
    },
    {
      h: 'How to read the risk score',
      p: [
        'The risk score is a <b>probability signal</b> between 0 and 100: how likely this household is to have a supply or contamination problem worth acting on today. It ranks households for action — it is not a diagnosis, not a health advisory, and not a laboratory result.',
        'JalDrishti never publishes the words "safe to drink". The strongest statement a screen makes is "no risk signals today", always with the date of the next test beside it.'
      ]
    },
    {
      h: 'Known limits',
      list: [
        'Pressure is not quality. Good pressure says the water arrived, not that it is fit to consume.',
        'Estimates at un-instrumented households are weakest at the end of the line, which is exactly where problems often appear.',
        'Sensors drift and fail. A node reporting a frozen value is treated as a fault, and its readings are marked as an estimate until it is serviced.',
        'Villages with intermittent connectivity are queued: field entries may reach the dashboard hours after they were recorded, and the entry is stamped with the time it was actually taken.'
      ]
    },
    {
      h: 'Reporting a figure that looks wrong',
      p: [
        'If a reading contradicts what a family or a Nal Jal Mitra can see, raise it through the grievance route. Include the village, the household or tap ID, the date and time, and a photo if possible.'
      ]
    }
  ]
});

Docs.add('a11y', {
  title: 'Accessibility', i18n: 'nav.a11y', icon: 'ph-universal-access',
  summary: 'How this dashboard is meant to work with a keyboard, a screen reader, large type and a small screen — and where it still falls short.',
  sections: [
    {
      h: 'Our commitment',
      p: [
        'JalDrishti is public infrastructure software: it is expected to work for a Sarpanch on a large-type screen in the Panchayat hall, for a Nal Jal Mitra on a mid-range Android phone in the field, and for a citizen scanning a QR code from a notice board. We aim at WCAG 2.2 level AA, at the GIGW 3.0 guidelines for Indian government websites, and at the duties set out in the Rights of Persons with Disabilities Act, 2015.'
      ]
    },
    {
      h: 'What this build implements',
      list: [
        'Every action is reachable by keyboard: navigation, repair lanes, drawers and dialogs, with a visible focus ring.',
        'Landmarks and labels — header, navigation, main and dialog roles — with an accessible name on every icon-only control.',
        'Colour is never the only signal: severity, proof state and integrity are always written out as well.',
        'A contrast-checked palette, and type that stays readable at 200% zoom.',
        'Language switch for English, हिंदी and मराठी, with Devanagari set in Noto Sans Devanagari.',
        'A large-type mode on the public proof page, designed for a hall screen and for printing.',
        'Touch targets of at least 44px on small screens, and layouts that reflow to a single column instead of scrolling sideways.'
      ]
    },
    {
      h: 'Known limitations',
      list: [
        'Repair lanes use drag and drop. In browsers that do not fire drag events on touch screens, cards can be opened and moved from the ticket drawer instead — the same moves, by button.',
        'Charts are drawn as SVG and described in the text beside them; the numbers in that text are the accessible version of the chart.',
        'The animated background is decorative, is hidden from assistive technology, and stops when the operating system asks for reduced motion.',
        'Printing produces a plain sheet: the sidebar, topbar and controls are removed, and the report date and village are printed in a header line.'
      ]
    },
    {
      h: 'Feedback',
      p: [
        'If a screen blocks you, that is a defect, not a preference. Report it on the helpline or by email, and say which screen, which browser and which assistive technology you were using. Accessibility reports are treated as bugs with the same priority as a broken repair ticket.'
      ]
    },
    {
      h: 'Assessment',
      p: [
        'This statement is based on a self-assessment of the build described on the data page, last reviewed on 1 October 2026, and is due for review when the pilot moves from simulated to live sensor data.'
      ]
    }
  ]
});

Docs.add('grievance', {
  title: 'Grievance redressal', i18n: 'nav.grievance', icon: 'ph-headset',
  summary: 'How to raise a supply, repair, data or privacy problem — and how long each step takes.',
  sections: [
    {
      h: 'What you can raise',
      list: [
        'Supply not arriving in the scheduled window, or arriving at low pressure.',
        'A quality concern — colour, smell or taste of the water at your tap.',
        'A repair that was marked closed but was not actually done.',
        'A household detail that is wrong: family size, zone, connection or test history.',
        'A privacy request — what is held about your household, a correction, or withdrawal of SMS/IVR consent.'
      ],
      note: 'A quality concern is routed to a field test and, if the kit result is inconclusive, to the district laboratory through WQMIS. JalDrishti will not tell you the water is safe to drink — only a laboratory result settles that.'
    },
    {
      h: 'How to raise it',
      list: [
        'Scan the QR code printed at the tap and use the citizen page — no login, and a photo, a voice note or a problem chip are all you need.',
        'Call the helpline, <a href="tel:18001234567">1800-123-4567</a>, from any phone, including a basic one. SMS and IVR are supported in हिंदी and मराठी.',
        'Email <a href="mailto:helpdesk@jaldrishti.gov.in">helpdesk@jaldrishti.gov.in</a>.',
        'Tell the Nal Jal Mitra of your village, or raise it in the Gram Panchayat / VWSC meeting.'
      ]
    },
    {
      h: 'What to include',
      list: [
        'Your village and the Sujal Gaon ID printed on the tap QR page.',
        'The household or tap ID, for example HH-B-0217 or tap B-217.',
        'The date and time you noticed the problem.',
        'A photo, if you can take one — it is attached to the ticket and appears as evidence.'
      ]
    },
    {
      h: 'Timelines and tracking',
      list: [
        'Acknowledgement with a ticket number (for example TKT-1041): within 3 working days.',
        'Supply or repair problem resolved: within 15 days.',
        'Field test scheduled for a quality concern: within 7 days of acknowledgement.',
        'If the deadline passes, the ticket moves to the <b>Escalated</b> lane on the block dashboard and the Assistant Engineer is notified automatically; the escalation itself is a logged event.'
      ],
      note: 'Keep the ticket number. Every change to a ticket is written to the tamper-evident log, and the public proof page shows the same log hash for the village.'
    },
    {
      h: 'Escalation ladder',
      list: [
        'Nal Jal Mitra — first point of contact for repairs in the village.',
        'Gram Panchayat / VWSC — supervises the village works and the Nal Jal Mitra.',
        'Assistant Engineer (block) — owns escalated repairs and the block SLA.',
        'PHED district office / DDWS — for unresolved supply and quality problems.',
        'State Jal Jeevan Mission cell — through the IMIS grievance route.'
      ]
    },
    {
      h: 'Grievance officer',
      list: [
        'Grievance Officer, District Water and Sanitation Mission (DDWS), Zilla Parishad, Pune, Maharashtra 411001.',
        '<a href="mailto:helpdesk@jaldrishti.gov.in">helpdesk@jaldrishti.gov.in</a> · <a href="tel:18001234567">1800-123-4567</a> (toll-free, 8:00–20:00).',
        'Privacy requests are answered within 30 days of receipt.'
      ]
    }
  ]
});

/* ------------------------------------------------------------
   renderer — shared shell for every public document
   ------------------------------------------------------------ */
Docs.jump = function (id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

Docs.render = function (id) {
  const d = Docs.map[id];
  if (!d) return '';
  const back = App.role
    ? `<button class="lnk" onclick="App.go('${App.roles[App.role].home}')"><i class="ph ph-arrow-left"></i>Back to dashboard</button>`
    : `<button class="lnk" onclick="App.backToSignIn()"><i class="ph ph-sign-in"></i>Back to sign-in</button>`;
  const toc = d.sections.map((s, i) =>
    `<button class="doc-toc-link" onclick="Docs.jump('doc-s${i + 1}')">${i + 1}. ${s.h}</button>`).join('');
  const body = d.sections.map((s, i) => `
    <section class="doc-sec" id="doc-s${i + 1}">
      <h2>${i + 1}. ${s.h}</h2>
      ${(s.p || []).map(t => `<p>${t}</p>`).join('')}
      ${s.list ? `<ul>${s.list.map(li => `<li>${li}</li>`).join('')}</ul>` : ''}
      ${s.note ? `<div class="doc-note"><i class="ph ph-info"></i><span>${s.note}</span></div>` : ''}
    </section>`).join('');
  const sibs = Docs.order.filter(k => k !== id)
    .map(k => `<button class="lnk" onclick="App.go('${k}')">${Docs.map[k].title}</button>`)
    .join('<span class="sep">·</span>');
  return `
  <div class="doc-wrap">
    <header class="doc-head card card-pad">
      <div class="doc-tag"><i class="ph ph-file-text"></i>JalDrishti · public document</div>
      <h1>${d.title}</h1>
      <div class="sub">${d.summary}</div>
      <div class="doc-meta">
        <span><i class="ph ph-calendar-blank"></i>Last updated ${Docs.updated}</span>
        <span><i class="ph ph-git-commit"></i>${Docs.version}</span>
        <span><i class="ph ph-translate"></i>English is the authoritative version</span>
        <span><i class="ph ph-flask"></i>Applies to this simulated build</span>
      </div>
    </header>
    <div class="doc-grid">
      <nav class="doc-toc" aria-label="On this page">
        <div class="doc-toc-head">On this page</div>
        ${toc}
      </nav>
      <article class="doc-body card card-pad">
        ${body}
        <div class="doc-contact">
          <div class="dc-t"><i class="ph ph-headset"></i>Still stuck?</div>
          <div class="dc-d">Helpline <a href="tel:18001234567">1800-123-4567</a> · <a href="mailto:helpdesk@jaldrishti.gov.in">helpdesk@jaldrishti.gov.in</a> · grievance officer details on the <button class="lnk" onclick="App.go('grievance')">grievance page</button>.</div>
        </div>
      </article>
    </div>
    <div class="doc-foot">
      <div class="legal-links">${sibs}</div>
      <div class="row" style="gap:10px;flex-wrap:wrap">${back}</div>
    </div>
  </div>`;
};

/* register one public screen per document */
Docs.order.forEach(id => {
  const d = Docs.map[id];
  App.reg(id, {
    title: d.title, i18n: d.i18n, group: 'Settings', icon: d.icon, public: true,
    render() { return Docs.render(id); }
  });
});

/* the same links, reused by the login footer, role menu and public pages */
Docs.links = function (cls) {
  return `<div class="legal-links ${cls || ''}">${Docs.order
    .map(k => `<button class="lnk" onclick="App.go('${k}')">${Docs.map[k].title}</button>`)
    .join('<span class="sep">·</span>')}</div>`;
};
Docs.icons = function () { return Docs.order.map(k => Docs.map[k].icon); };
