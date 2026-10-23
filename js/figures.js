/* =========================================================================
   figures.js: the one table of contract figures (C1, C2, C5, C6, C7)
   -------------------------------------------------------------------------
   Every amount is stored once, in cents, under the same id that
   tools/check_figures.py uses. The page reads it in the browser (NQ.figures)
   and tools/build.mjs reads it in Node to fill {{R:id}} tokens in the
   partials, so a figure is never typed twice.

   money(cents)  -> "R 171,992.00", with a no-break space (U+00A0) after R so
                    the currency never splits from its amount (C10).
   rands(cents)  -> "R 199", whole rand, for the verbatim hero lines and the
                    copy deck's reference values ("about R 18,000").
   ========================================================================= */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.NQ = root.NQ || {};
    root.NQ.figures = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var NBSP = ' ';

  /* id: [cents, contract item, kind, meaning]   kind: excl | incl | vat */
  var TABLE = {
    web_rate:          [899900,   'C1', 'excl', 'website build for National, Eastern Cape, Gauteng, KwaZulu-Natal; first-estimate rate; optional Western Cape rebuild (C3)'],
    web_offer:         [770000,   'C1', 'excl', 'website build for Free State, Limpopo, Mpumalanga, North West, Northern Cape'],
    web_subtotal:      [7449600,  'C1', 'excl', 'website subtotal'],
    ws_rate:           [1249900,  'C1', 'excl', 'workshop build for the four; first-estimate rate'],
    ws_offer:          [950000,   'C1', 'excl', 'workshop build for the five'],
    ws_subtotal:       [9749600,  'C1', 'excl', 'workshop subtotal'],
    entity_rate:       [2149800,  'C1', 'excl', 'entity total for each of the four'],
    entity_offer:      [1720000,  'C1', 'excl', 'entity total for each of the five'],
    wc_zero:           [0,        'C1', 'excl', 'Western Cape, no new build charge'],
    build:             [17199200, 'C1', 'excl', 'combined once-off build'],
    build_vat:         [2579880,  'C1', 'vat',  'VAT on the build'],
    build_incl:        [19779080, 'C1', 'incl', 'build incl. VAT'],
    web_first:         [8999000,  'C2', 'excl', 'website first estimate (10 x 8,999)'],
    web_saving:        [1549400,  'C2', 'excl', 'website saving'],
    ws_first:          [11249100, 'C2', 'excl', 'workshop first estimate (9 x 12,499)'],
    ws_saving:         [1499500,  'C2', 'excl', 'workshop saving'],
    first:             [20248100, 'C2', 'excl', 'combined first estimate'],
    saving:            [3048900,  'C2', 'excl', 'combined saving'],
    ref_site:          [1800000,  'C2', 'excl', 'reference: usual website service per site (about)'],
    ref_search_low:    [800000,   'C2', 'excl', 'reference: search foundation per new site, low end'],
    ref_search_high:   [1200000,  'C2', 'excl', 'reference: search foundation per new site, high end'],
    ref_nine_sites:    [16200000, 'C2', 'excl', 'reference: nine sites at about 18,000 each (PDF wording)'],
    host:              [19900,    'C5', 'excl', 'hosting per new site per month'],
    host_standard:     [29900,    'C5', 'excl', 'hosting standard rate per site'],
    host_total:        [179100,   'C5', 'excl', 'hosting for nine new sites per month'],
    data:              [49900,    'C5', 'excl', 'Option B per environment per month'],
    data_standard:     [69900,    'C5', 'excl', 'Option B standard rate per environment'],
    data_total:        [449100,   'C5', 'excl', 'Option B, nine environments per month'],
    monthly_b:         [628200,   'C5', 'excl', 'monthly with Option B'],
    monthly_b_vat:     [94230,    'C5', 'vat',  'VAT on the Option B monthly total'],
    monthly_b_incl:    [722430,   'C5', 'incl', 'monthly with Option B incl. VAT'],
    monthly_standard:  [898200,   'C5', 'excl', 'standard combined monthly'],
    monthly_reduction: [270000,   'C5', 'excl', 'monthly reduction'],
    training:          [250000,   'C6', 'excl', 'training per person, both modules'],
    training_normal:   [500000,   'C6', 'excl', 'normal training per person, both modules'],
    training_incl:     [287500,   'C6', 'incl', 'training per person incl. VAT'],
    refresher:         [55000,    'C6', 'excl', 'later or refresher training per hour'],
    refresher_incl:    [63250,    'C6', 'incl', 'later or refresher training per hour incl. VAT'],
    deposit:           [8599600,  'C7', 'excl', '50% build deposit, also the 50% balance'],
    deposit_incl:      [9889540,  'C7', 'incl', '50% build deposit incl. VAT']
  };

  /* Facts that are not amounts. Dates and the reference are C7. */
  var FACTS = {
    reference: 'LBTEC-NAPTOSA-NATIONAL-WEB-WS-001',
    issued: '22 October 2026',
    validUntil: '21 November 2026',
    validDays: 30,
    vatPercent: 15,
    depositPercent: 50,
    trainingReductionPercent: 50,
    newSites: 9,
    destinations: 10
  };

  function cents(id) {
    var row = TABLE[id];
    if (!row) throw new Error('figures: unknown figure id "' + id + '"');
    return row[0];
  }

  function group(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /* 17199200 -> "171,992.00" */
  function amount(c) {
    c = Math.round(Number(c) || 0);
    var neg = c < 0;
    c = Math.abs(c);
    var whole = Math.floor(c / 100);
    var dec = c % 100;
    return (neg ? '-' : '') + group(whole) + '.' + (dec < 10 ? '0' : '') + dec;
  }

  /* 17199200 -> "R 171,992.00" with U+00A0 after R */
  function money(c) {
    return 'R' + NBSP + amount(c);
  }

  /* 19900 -> "R 199" (whole rand only; refuses a figure with cents) */
  function rands(c) {
    c = Math.round(Number(c) || 0);
    if (c % 100 !== 0) throw new Error('figures: rands() needs a whole-rand amount, got ' + c);
    return 'R' + NBSP + group(c / 100);
  }

  function vatOf(c) {
    return Math.floor((c * 15 + 50) / 100);
  }

  /* The same arithmetic tools/check_figures.py proves; returns a list of
     failures (empty when the table is consistent). The build refuses to
     write a page when this is not empty. */
  function selfCheck() {
    var v = function (id) { return TABLE[id][0]; };
    var sums = [
      ['C1 website subtotal', 4 * v('web_rate') + 5 * v('web_offer'), v('web_subtotal')],
      ['C1 workshop subtotal', 4 * v('ws_rate') + 5 * v('ws_offer'), v('ws_subtotal')],
      ['C1 entity total, the four', v('web_rate') + v('ws_rate'), v('entity_rate')],
      ['C1 entity total, the five', v('web_offer') + v('ws_offer'), v('entity_offer')],
      ['C1 combined build', v('web_subtotal') + v('ws_subtotal'), v('build')],
      ['C1 VAT', vatOf(v('build')), v('build_vat')],
      ['C1 build incl. VAT', v('build') + v('build_vat'), v('build_incl')],
      ['C2 website first estimate', 10 * v('web_rate'), v('web_first')],
      ['C2 website saving', v('web_first') - v('web_subtotal'), v('web_saving')],
      ['C2 workshop first estimate', 9 * v('ws_rate'), v('ws_first')],
      ['C2 workshop saving', v('ws_first') - v('ws_subtotal'), v('ws_saving')],
      ['C2 combined first estimate', v('web_first') + v('ws_first'), v('first')],
      ['C2 combined saving', v('first') - v('build'), v('saving')],
      ['C2 nine sites at the reference rate', 9 * v('ref_site'), v('ref_nine_sites')],
      ['C5 hosting', 9 * v('host'), v('host_total')],
      ['C5 Option B data', 9 * v('data'), v('data_total')],
      ['C5 monthly with Option B', v('host_total') + v('data_total'), v('monthly_b')],
      ['C5 monthly VAT', vatOf(v('monthly_b')), v('monthly_b_vat')],
      ['C5 monthly incl. VAT', v('monthly_b') + v('monthly_b_vat'), v('monthly_b_incl')],
      ['C5 standard monthly', 9 * v('host_standard') + 9 * v('data_standard'), v('monthly_standard')],
      ['C5 monthly reduction', v('monthly_standard') - v('monthly_b'), v('monthly_reduction')],
      ['C6 training at 50% of normal', v('training_normal') / 2, v('training')],
      ['C6 training incl. VAT', v('training') + vatOf(v('training')), v('training_incl')],
      ['C6 refresher incl. VAT', v('refresher') + vatOf(v('refresher')), v('refresher_incl')],
      ['C7 deposit', v('build') / 2, v('deposit')],
      ['C7 deposit incl. VAT', v('build_incl') / 2, v('deposit_incl')]
    ];
    var bad = [];
    sums.forEach(function (s) { if (s[1] !== s[2]) bad.push(s[0] + ': computes ' + amount(s[1]) + ', table says ' + amount(s[2])); });
    return bad;
  }

  return {
    NBSP: NBSP,
    TABLE: TABLE,
    FACTS: FACTS,
    cents: cents,
    amount: amount,
    money: money,
    rands: rands,
    vatOf: vatOf,
    selfCheck: selfCheck
  };
});
