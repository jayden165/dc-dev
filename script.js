const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sleep = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));

/* ---------- toast ---------- */
const toast = $('#toast');
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

/* ---------- copy buttons ---------- */
$$('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(btn.dataset.copy); showToast('Discord ID copied'); }
  catch { showToast('ID: ' + btn.dataset.copy); }
}));

/* ---------- scroll progress + scrollspy ---------- */
const bar = $('#progress');
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const links = $$('#menu a');
const spy = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      links.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + e.target.id)));
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
links.forEach((a) => { const s = $(a.getAttribute('href')); if (s) spy.observe(s); });

/* ---------- mobile menu ---------- */
const menu = $('#menu'), menuBtn = $('#menu-btn');
menuBtn.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
links.forEach((a) => a.addEventListener('click', () => {
  menu.classList.remove('open');
  menuBtn.setAttribute('aria-expanded', 'false');
}));

/* ---------- spotlight cards ---------- */
$$('.spot').forEach((card) => card.addEventListener('pointermove', (e) => {
  const r = card.getBoundingClientRect();
  card.style.setProperty('--mx', e.clientX - r.left + 'px');
  card.style.setProperty('--my', e.clientY - r.top + 'px');
}));

/* ---------- work filters ---------- */
const filterBtns = $$('[data-filter]');
filterBtns.forEach((btn) => btn.addEventListener('click', () => {
  filterBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  const f = btn.dataset.filter;
  $$('.project').forEach((p) => {
    const show = f === 'all' || p.dataset.tags.split(' ').includes(f);
    p.hidden = !show;
    if (show) { p.classList.remove('in'); void p.offsetWidth; p.classList.add('in'); }
  });
}));

/* ---------- interactive bot demo ---------- */
const chat = $('#chat'), chips = $$('#chips .chip');
const demoForm = $('#demo-form'), input = $('#demo-input');
// Text the chips type into the box
const CHIP = {
  help: '/help',
  ticket: '/ticket open category:support',
  ban: '/ban user:@spammer reason:raid links',
  rank: '/rank',
  giveaway: '/giveaway start prize:Nitro time:24h'
};

const cl = (s, n = 40) => esc(String(s).trim().slice(0, n));
const hash = (s) => [...s.toLowerCase()].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

// Splits "open key:value other:more words" into positional text and named options
function parseArgs(rest) {
  const named = {};
  const re = /(\w+):/g;
  const marks = [...rest.matchAll(re)];
  const pos = (marks.length ? rest.slice(0, marks[0].index) : rest).trim();
  marks.forEach((m, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].index : rest.length;
    named[m[1].toLowerCase()] = rest.slice(m.index + m[0].length, end).trim();
  });
  return { pos, named };
}

let ticketNo = 42;
const CMDS = {
  help: () => ({ title: 'Commands', cls: '',
    fields: [['/ticket', 'Open a support ticket'], ['/ban', 'Ban a member'], ['/rank', 'Show a level'], ['/giveaway', 'Start a giveaway']],
    note: 'Add your own details, e.g. /ban @someone spamming or /giveaway prize:Pizza time:2h' }),

  ticket: ({ pos, named }) => {
    const subject = (named.subject || pos.replace(/^open\b/i, '')).trim();
    const fields = [['Category', cl(named.category || 'Support')], ['Status', 'Open']];
    if (subject) fields.push(['Subject', cl(subject, 60)]);
    fields.push(['Claimed by', 'Unclaimed']);
    return { title: `Ticket #${String(ticketNo++).padStart(4, '0')} opened`, cls: '', fields,
      buttons: ['Claim', 'Close'], note: 'A private channel was created for you and staff.' };
  },

  ban: ({ pos, named }) => {
    const [first = '', ...more] = pos.split(/\s+/);
    let user = (named.user || first || '@spammer').trim();
    if (!user.startsWith('@')) user = '@' + user;
    const reason = (named.reason || more.join(' ') || 'No reason given').trim();
    return { title: 'Member banned', cls: 'danger',
      fields: [['User', cl(user, 32)], ['Reason', cl(reason, 60)], ['Logged in', '#mod-logs']],
      note: 'Auto-moderation also cleaned up their recent messages.' };
  },

  rank: ({ pos, named }) => {
    const who = (named.user || pos.split(/\s+/)[0] || 'You').trim();
    const h = hash(who);
    const level = (h % 40) + 1, pct = (h % 85) + 10, need = 100 + level * 50;
    return { title: `${cl(who, 24)} · Level ${level}`, cls: '', progress: pct,
      fields: [['XP', `${Math.floor(need * pct / 100).toLocaleString()} / ${need.toLocaleString()}`], ['Server rank', `#${(h % 20) + 1}`]] };
  },

  giveaway: ({ pos, named }) => {
    const prize = (named.prize || pos.replace(/^start\b/i, '')).trim() || 'Discord Nitro';
    const time = (named.time || '24h').trim();
    return { title: 'Giveaway started', cls: 'ok',
      fields: [['Prize', cl(prize, 40)], ['Ends', 'In ' + cl(time, 12)], ['Entries', '0']], buttons: ['Enter'] };
  }
};
const unknown = (raw) => ({ title: 'Unknown command', cls: 'danger', fields: [],
  note: `"${cl(raw, 40)}" isn't a demo command. Type /help to see what I can do.` });

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
function scrollChat() { chat.scrollTop = chat.scrollHeight; }
function trim() { while (chat.children.length > 6) chat.firstChild.remove(); }

function userMsg(text) {
  const [first, ...rest] = text.split(/\s+/);
  const head = first.startsWith('/') ? `<em>${esc(first)}</em>` : esc(first);
  chat.append(el(`<div class="msg"><div class="av you">Y</div><div><div class="who">You</div><div class="cmd">${head} ${esc(rest.join(' '))}</div></div></div>`));
}
function botMsg(c) {
  const fields = c.fields.length ? `<div class="fields">${c.fields.map(([k, v]) => `<div><span>${k}</span>${v}</div>`).join('')}</div>` : '';
  const prog = c.progress ? `<div class="bar"><i data-w="${c.progress}"></i></div>` : '';
  const btns = c.buttons ? `<div class="btnrow">${c.buttons.map((b) => `<span>${b}</span>`).join('')}</div>` : '';
  const note = c.note ? `<div class="note">${c.note}</div>` : '';
  const m = el(`<div class="msg"><div class="av bot">S</div><div><div class="who">SavageBot <span class="badge">BOT</span></div><div class="embed ${c.cls}"><h4>${c.title}</h4>${fields}${prog}${btns}${note}</div></div></div>`);
  chat.append(m);
  const i = $('.bar i', m);
  if (i) requestAnimationFrame(() => requestAnimationFrame(() => (i.style.width = i.dataset.w + '%')));
}

let running = false;
function setBusy(b) {
  running = b;
  chips.forEach((c) => (c.disabled = b));
  input.disabled = b;
}

async function reply(text, refocus) {
  if (running) return;
  setBusy(true);
  const raw = text.trim();
  const [head, ...restWords] = raw.split(/\s+/);
  const name = head.replace(/^\//, '').toLowerCase();
  const data = CMDS[name] ? CMDS[name](parseArgs(restWords.join(' '))) : unknown(head);
  userMsg(text.trim());
  input.value = '';
  scrollChat();
  const typing = el('<div class="msg"><div class="av bot">S</div><div class="typing" aria-hidden="true"><i></i><i></i><i></i></div></div>');
  chat.append(typing); scrollChat();
  await sleep(650);
  typing.remove();
  botMsg(data); trim(); scrollChat();
  setBusy(false);
  if (refocus) input.focus({ preventScroll: true });
}

// Chips type the command into the box, then send it
async function typeAndSend(key) {
  if (running) return;
  const text = CHIP[key];
  input.value = '';
  for (const ch of text) { input.value += ch; await sleep(26); }
  await sleep(200);
  reply(text, false);
}
chips.forEach((b) => b.addEventListener('click', () => typeAndSend(b.dataset.cmd)));

demoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (text && !running) reply(text, true);
});

// Auto-play the first command once the demo is visible
const demoObs = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) { demoObs.disconnect(); setTimeout(() => typeAndSend('ticket'), reduce ? 0 : 700); }
}, { threshold: 0.4 });
demoObs.observe($('.discord'));

/* ---------- request form -> /api/hire (sends a Discord DM) ---------- */
const form = $('#hire-form');
if (form) {
  const status = $('#form-status');
  const button = $('button[type="submit"]', form);
  const fallback = ' You can also message me on Discord (ID: 1347129235898237010).';
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    button.disabled = true;
    status.className = '';
    status.textContent = 'Sending…';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      if (res.ok) {
        form.reset();
        status.className = 'ok';
        status.textContent = 'Request sent. I will get back to you soon.';
      } else {
        let reason;
        try { reason = (await res.json()).error; } catch {}
        if (!reason) {
          reason = res.status === 404 || res.status === 405
            ? 'The /api/hire endpoint was not found. The site must be deployed on Vercel with the api folder included.'
            : 'The server returned an error (' + res.status + ').';
        }
        status.className = 'err';
        status.textContent = 'Could not send: ' + reason + fallback;
      }
    } catch {
      status.className = 'err';
      status.textContent = 'Could not reach the server. If you opened this file locally or on GitHub Pages, the form only works on Vercel.' + fallback;
    }
    button.disabled = false;
  });
}
