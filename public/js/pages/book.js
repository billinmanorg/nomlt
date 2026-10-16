/* Independent inquiry endpoint: does not activate rewards or other APIs. */
(function () {
  'use strict';
  var form = document.getElementById('form');
  if (!form) return;
  var msg = document.getElementById('book-msg');
  var button = form.querySelector('[type="submit"]');
  var pending = null;
  var busy = false;
  function show(text) { msg.hidden = false; msg.className = 'notice'; msg.textContent = text; }
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (busy) return;
    var fd = new FormData(form);
    var payload = {};
    ['name', 'email', 'topic', 'notes'].forEach(function (field) { payload[field] = String(fd.get(field) || '').trim(); });
    if (!payload.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) { show('Add your name and a valid email address.'); return; }
    var base = (window.NOLMT_CONFIG || {}).contactApiBase;
    if (!base || !/^https:\/\//.test(base) || typeof window.NOLMT_CONTACT_CHALLENGE !== 'function') { show('Requests are not available yet. Nothing was sent.'); return; }
    var snapshot = JSON.stringify(payload);
    if (!pending || pending.snapshot !== snapshot) pending = { snapshot: snapshot, id: crypto.randomUUID() };
    var attempt = pending;
    busy = true; button.disabled = true;
    var controller = new AbortController();
    var timer;
    try {
      var token = await window.NOLMT_CONTACT_CHALLENGE();
      timer = setTimeout(function () { controller.abort(); }, 15000);
      var response = await fetch(base.replace(/\/$/, '') + '/contact', { method: 'POST', credentials: 'omit', signal: controller.signal, headers: { 'Content-Type': 'application/json', 'Idempotency-Key': attempt.id }, body: JSON.stringify(Object.assign({}, payload, { challengeToken: token })) });
      var result = await response.json();
      if (!response.ok || result.ok !== true || result.receipt !== attempt.id) throw new Error('Unconfirmed');
      show('Request received. Reference: ' + result.receipt + '. This is a call request, not a confirmed appointment.');
      var latest = new FormData(form);
      var unchanged = ['name', 'email', 'topic', 'notes'].every(function (field) { return String(latest.get(field) || '').trim() === payload[field]; });
      if (unchanged) form.reset();
      if (pending === attempt) pending = null;
    } catch (_) { show('Receipt could not be confirmed. Your information is still here. Retry unchanged information to avoid a duplicate.'); }
    finally { clearTimeout(timer); busy = false; button.disabled = false; }
  });
})();
