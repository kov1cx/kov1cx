// form.js – handle contact form submission via event delegation
document.addEventListener('submit', async e => {
  const form = e.target.closest('#contact-form');
  if (!form) return;
  e.preventDefault();
  const status = form.querySelector('#form-status') || document.getElementById('form-status');
  const data = new FormData(form);
  const endpoint = form.getAttribute('action');

  const uiSuccess = window.currentUI?.contact?.formSuccess || 'Đã gửi thành công! Cảm ơn bạn.';
  const uiError = window.currentUI?.contact?.formError || 'Gửi thất bại, vui lòng thử lại.';

  const nameVal = (data.get('name') || '').toString().trim();
  const emailVal = (data.get('_replyto') || '').toString().trim();
  const msgVal = (data.get('message') || '').toString().trim();

  if (!nameVal || !emailVal || !msgVal) {
    if (status) {
      status.classList.add('dp-form__status--error');
      status.textContent = uiError;
    }
    return;
  }

  if (!endpoint || endpoint.trim() === '') {
    const emailTo = form.dataset.recipient || 'sinonsan2000@gmail.com';
    const sub = `Liên hệ từ Portfolio: ${nameVal}`;
    const bdy = `Người gửi: ${nameVal}\nEmail phản hồi: ${emailVal}\n\nNội dung tin nhắn:\n${msgVal}`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailTo)}&su=${encodeURIComponent(sub)}&body=${encodeURIComponent(bdy)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    if (status) {
      status.classList.remove('dp-form__status--error');
      status.textContent = window.currentUI?.contact?.openingGmail || 'Đang mở Gmail để soạn thư...';
    }
    return;
  }
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      if (status) {
        status.classList.remove('dp-form__status--error');
        status.textContent = uiSuccess;
      }
      form.reset();
    } else {
      if (status) {
        status.classList.add('dp-form__status--error');
        status.textContent = uiError;
      }
    }
  } catch (err) {
    if (status) {
      status.classList.add('dp-form__status--error');
      status.textContent = uiError;
    }
  }
});
