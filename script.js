const form = document.querySelector('#request-form');
const fallback = document.querySelector('#mailto-fallback');
const formStatus = document.querySelector('#form-status');
const dialog = document.querySelector('#post-dialog');
const requestBar = document.querySelector('#mobile-request-bar');

function fieldValue(id) {
  return document.querySelector(id)?.value.trim() || '';
}

function syncFormMeta() {
  const type = form.querySelector('input[name="Request type"]:checked')?.value || 'Custom request';
  const subject = `New request: ${type}`;
  const body = [
    `Email: ${fieldValue('#email') || 'Not provided'}`,
    `Request type: ${type}`,
    `Reference link: ${fieldValue('#references') || 'Not provided'}`,
    '', 'Message:', fieldValue('#message') || 'Not provided',
  ].join('\n');
  document.querySelector('#email-subject').value = subject;
  document.querySelector('#request-summary').value = body;
  fallback.href = `mailto:bflyzone@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

if (form) {
  let sending = false;
  const message = document.querySelector('#message');
  const reference = document.querySelector('#references');
  const referenceDetails = reference.closest('details');
  // Reveal a collapsed optional field when browser validation needs attention.
  reference.addEventListener('invalid', () => { referenceDetails.open = true; });
  form.addEventListener('input', () => {
    message.setCustomValidity(message.value && !message.value.trim() ? 'Please tell me a little about your idea.' : '');
    syncFormMeta();
  });
  form.addEventListener('change', syncFormMeta);
  syncFormMeta();
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    sending = true;
    syncFormMeta();
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    formStatus.dataset.state = 'sending';
    formStatus.textContent = 'Sending your request…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('https://formsubmit.co/ajax/bflyzone@gmail.com', {
        method: 'POST', body: new FormData(form),
        headers: { Accept: 'application/json' }, signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok || (data.success !== true && data.success !== 'true')) throw new Error('Request was not accepted');
      form.reset();
      syncFormMeta();
      referenceDetails.open = false;
      formStatus.dataset.state = 'success';
      formStatus.textContent = 'Request sent! I’ll reply by email to discuss your idea, pricing, and timing.';
    } catch {
      formStatus.dataset.state = 'error';
      formStatus.textContent = 'Your request could not be confirmed. Your message is still here. Try again, or choose “Email instead” below to send it from your email app.';
    } finally {
      clearTimeout(timeout);
      sending = false;
      button.disabled = false;
      button.textContent = 'Send request ↗';
      form.removeAttribute('aria-busy');
    }
  });
}

// Hide the mobile shortcut while completing the form or previewing artwork.
if (requestBar && form && 'IntersectionObserver' in window) {
  let formVisible = false;
  const updateBar = () => {
    requestBar.hidden = formVisible || Boolean(dialog?.open) || form.contains(document.activeElement);
  };
  new IntersectionObserver(([entry]) => {
    formVisible = entry.isIntersecting;
    updateBar();
  }, { rootMargin: '-76px 0px -90px 0px' }).observe(form);
  form.addEventListener('focusin', updateBar);
  form.addEventListener('focusout', () => setTimeout(updateBar, 0));
  if (dialog) new MutationObserver(updateBar).observe(dialog, { attributes: true, attributeFilter: ['open'] });
}

document.querySelectorAll('.post').forEach((post) => {
  post.addEventListener('click', () => {
    document.querySelector('#dialog-image').src = post.dataset.src;
    document.querySelector('#dialog-image').alt = post.querySelector('img').alt;
    document.querySelector('#dialog-title').textContent = post.dataset.title;
    dialog.showModal();
  });
});
document.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
document.querySelector('.dialog-request')?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  }
});
