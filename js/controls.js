/* =========================================================================
   controls.js: the two choices the visitor makes (bar.md mechanism 7)
   -------------------------------------------------------------------------
   The data switch (act 4, design-system.md 12.3): a button with
   role="switch"; aria-checked="false" is Option A. Pointer, touch, Space and
   Enter toggle it (a native button). It writes NQ.state.option.
   The trainee stepper (act 6, 12.4): Remove and Add buttons around a
   text input with role="spinbutton" (no type="number", so a wheel never
   changes it). Arrow Up and Down step by one, Page Up and Down by ten,
   Home and End go to 0 and 200; typing commits on Enter or blur, and
   anything other than a whole number from 0 to 200 reverts. It writes
   NQ.state.trainees. Both read the state back, so every surface agrees.
   Exposes NQ.controls = { init }.
   ========================================================================= */
(function (root) {
  'use strict';
  var NQ = root.NQ = root.NQ || {};
  var doc = root.document;

  function initSwitch() {
    var sw = doc.querySelector('[data-nq-switch]');
    if (!sw) return;
    sw.addEventListener('click', function () {
      NQ.state.set({ option: NQ.state.get().option === 'B' ? 'A' : 'B' }, { source: 'user' });
    });
    var sync = function (s) { sw.setAttribute('aria-checked', s.option === 'B' ? 'true' : 'false'); };
    sync(NQ.state.get());
    NQ.state.subscribe(sync);
  }

  function initStepper() {
    var input = doc.querySelector('input[data-nq-trainees]');
    if (!input) return;
    var minus = doc.querySelector('[data-nq-step="-1"]');
    var plus = doc.querySelector('[data-nq-step="1"]');
    var MAX = NQ.state.MAX_TRAINEES;

    function setN(n) { NQ.state.set({ trainees: n }, { source: 'user' }); }
    function nowN() { return NQ.state.get().trainees; }

    function sync(s) {
      var n = s.trainees;
      if (doc.activeElement !== input || input.value.trim() === '' || NQ.state.clampTrainees(input.value) === n) input.value = String(n);
      input.setAttribute('aria-valuenow', String(n));
      input.setAttribute('aria-valuetext', n === 1 ? '1 person' : n + ' people');
      var wasMinus = doc.activeElement === minus, wasPlus = doc.activeElement === plus;
      minus.disabled = n <= 0;
      plus.disabled = n >= MAX;
      if ((wasMinus && minus.disabled) || (wasPlus && plus.disabled)) input.focus();
    }

    function commit() {
      var raw = input.value.trim();
      if (/^\d{1,3}$/.test(raw) && parseInt(raw, 10) <= MAX) setN(parseInt(raw, 10));
      input.value = String(nowN());
    }

    minus.addEventListener('click', function () { setN(nowN() - 1); });
    plus.addEventListener('click', function () { setN(nowN() + 1); });
    input.addEventListener('keydown', function (e) {
      var n = nowN();
      var step = { ArrowUp: 1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[e.key];
      if (step) { e.preventDefault(); setN(n + step); return; }
      if (e.key === 'Home') { e.preventDefault(); setN(0); return; }
      if (e.key === 'End') { e.preventDefault(); setN(MAX); return; }
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
    });
    input.addEventListener('blur', commit);
    sync(NQ.state.get());
    NQ.state.subscribe(sync);
  }

  NQ.controls = {
    init: function () { initSwitch(); initStepper(); }
  };
})(self);
