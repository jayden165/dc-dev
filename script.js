const form = document.getElementById('hire-form');
if (form) {
  const status = document.getElementById('form-status');
  const button = form.querySelector('button[type="submit"]');
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
      if (res.ok) {
        form.reset();
        status.textContent = 'Inquiry sent. I will get back to you soon.';
      } else {
        status.textContent = 'Could not send. Message me on Discord instead (ID: 1347129235898237010).';
      }
    } catch {
      status.textContent = 'Could not send. Message me on Discord instead (ID: 1347129235898237010).';
    }
    button.disabled = false;
  });
}
