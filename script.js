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
const chat = $('#chat'), typed = $('#typed'), chips = $$('#chips .chip');
const PLACEHOLDER = 'Try a command below…';
const CMDS = {
  ticket: { text: '/ticket open category:support', title: 'Ticket #0042 opened', cls: '',
    fields: [['Category', 'Support'], ['Status', 'Open'], ['Claimed by', 'Unclaimed']],
    buttons: ['Claim', 'Close'], note: 'A private channel was created for you and staff.' },
  ban: { text: '/ban user:@spammer reason:raid links', title: 'Member banned', cls: 'danger',
    fields: [['User', '@spammer'], ['Reason', 'Raid links'], ['Logged in', '#mod-logs']],
    note: 'Auto-moderation also cleaned up their recent messages.' },
  rank: { text: '/rank', title: 'Level 12', cls: '', progress: 68,
    fields: [['XP', '3,410 / 5,000'], ['Server rank', '#4']] },
  giveaway: { text: '/giveaway start prize:Nitro time:24h', title: 'Giveaway started', cls: 'ok',
    fields: [['Prize', 'Discord Nitro'], ['Ends', 'In 24 hours'], ['Entries', '0']], buttons: ['Enter'] },
  verify: { text: '/verify username:Steve', title: 'Account linked', cls: 'ok',
    fields: [['Discord', 'You'], ['Minecraft', 'Steve'], ['Role', 'Verified']],
    note: 'Minecraft and Discord accounts are now linked.' }
};

function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
function scrollChat() { chat.scrollTop = chat.scrollHeight; }
function trim() { while (chat.children.length > 6) chat.firstChild.remove(); }

function userMsg(text) {
  const [cmd, ...rest] = text.split(' ');
  chat.append(el(`<div class="msg"><div class="av you">Y</div><div><div class="who">You</div><div class="cmd"><em>${cmd}</em> ${rest.join(' ')}</div></div></div>`));
}
function botMsg(c) {
  const fields = c.fields.map(([k, v]) => `<div><span>${k}</span>${v}</div>`).join('');
  const prog = c.progress ? `<div class="bar"><i data-w="${c.progress}"></i></div>` : '';
  const btns = c.buttons ? `<div class="btnrow">${c.buttons.map((b) => `<span>${b}</span>`).join('')}</div>` : '';
  const note = c.note ? `<div class="note">${c.note}</div>` : '';
  const m = el(`<div class="msg"><div class="av bot">S</div><div><div class="who">SavageBot <span class="badge">BOT</span></div><div class="embed ${c.cls}"><h4>${c.title}</h4><div class="fields">${fields}</div>${prog}${btns}${note}</div></div></div>`);
  chat.append(m);
  const i = $('.bar i', m);
  if (i) requestAnimationFrame(() => requestAnimationFrame(() => (i.style.width = i.dataset.w + '%')));
}

let running = false;
async function run(key) {
  if (running) return;
  running = true;
  chips.forEach((c) => (c.disabled = true));
  const c = CMDS[key];
  typed.classList.remove('ph');
  typed.textContent = '';
  for (const ch of c.text) { typed.textContent += ch; await sleep(28); }
  await sleep(250);
  userMsg(c.text);
  typed.textContent = PLACEHOLDER; typed.classList.add('ph');
  scrollChat();
  const typing = el('<div class="msg"><div class="av bot">S</div><div class="typing" aria-hidden="true"><i></i><i></i><i></i></div></div>');
  chat.append(typing); scrollChat();
  await sleep(750);
  typing.remove();
  botMsg(c); trim(); scrollChat();
  chips.forEach((b) => (b.disabled = false));
  running = false;
}
chips.forEach((b) => b.addEventListener('click', () => run(b.dataset.cmd)));

// Auto-play the first command once the demo is visible
const demoObs = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) { demoObs.disconnect(); setTimeout(() => run('ticket'), reduce ? 0 : 700); }
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
