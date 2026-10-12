// Copy buttons
document.querySelectorAll('[data-copy]').forEach((btn) => {
  const original = btn.textContent;
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.textContent = 'Copied';
    } catch {
      btn.textContent = btn.dataset.copy;
    }
    setTimeout(() => (btn.textContent = original), 2000);
  });
});

// Request form -> /api/hire (sends a Discord DM)
const form = document.getElementById('hire-form');
if (form) {
  const status = document.getElementById('form-status');
  const button = form.querySelector('button[type="submit"]');
  const fail = 'Could not send. Message me on Discord instead (ID: 1347129235898237010).';
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    button.disabled = true;
    status.textContent = 'Sending…';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      if (res.ok) { form.reset(); status.textContent = 'Request sent. I will get back to you soon.'; }
      else status.textContent = fail;
    } catch { status.textContent = fail; }
    button.disabled = false;
  });
}
