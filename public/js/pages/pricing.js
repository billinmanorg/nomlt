/* NOLMT — pricing page
   "Pay with NOLMT token" opens a coming-soon dialog. Per Bill: the token
   landing page does not exist yet, so for now the button only has to say
   tokens are launching soon. Swap the dialog for a link when the token
   site ships. */
(function () {
  var modal = document.getElementById('tokenModal');
  if (!modal) return;

  var lastFocus = null;

  function open(trigger) {
    lastFocus = trigger || null;
    modal.hidden = false;
    var close = modal.querySelector('[data-token-close]');
    if (close) close.focus();
    document.addEventListener('keydown', onKey);
  }

  function close() {
    modal.hidden = true;
    document.removeEventListener('keydown', onKey);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
  }

  document.querySelectorAll('[data-token-pay]').forEach(function (btn) {
    btn.addEventListener('click', function () { open(btn); });
  });

  modal.querySelectorAll('[data-token-close]').forEach(function (btn) {
    btn.addEventListener('click', close);
  });

  // Click the backdrop (but not the dialog itself) to dismiss.
  modal.addEventListener('click', function (e) {
    if (e.target === modal) close();
  });
})();
