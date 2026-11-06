// Add <script src="/frontend-form.js" defer></script> to your website.
// Replace the URL below with the REAL public Railway service domain.
const QUOTE_API_URL = 'https://REPLACE-WITH-YOUR-RAILWAY-DOMAIN.up.railway.app/api/quote';
const quoteForm = document.querySelector('form[name="moving-quote"]');
if (quoteForm) {
  quoteForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = quoteForm.querySelector('button[type="submit"]');
    let status = quoteForm.querySelector('[data-form-status]');
    if (!status) {
      status = document.createElement('p');
      status.setAttribute('data-form-status', '');
      status.setAttribute('role', 'status');
      button.insertAdjacentElement('afterend', status);
    }
    if (!quoteForm.reportValidity()) return;
    button.disabled = true;
    status.textContent = 'Sending your request…';
    try {
      const response = await fetch(QUOTE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(quoteForm)))
      });
      if (!response.ok) throw new Error('Submission failed');
      window.location.assign('/thank-you.html');
    } catch (_err) {
      status.textContent = 'We could not send your request. Please try again.';
      button.disabled = false;
    }
  });
}
