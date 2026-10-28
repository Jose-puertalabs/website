/*
 * Puerta Labs: simulated demo app.
 *
 * Everything here is simulated. No funds, assets or transactions are involved.
 * The only real interaction is reading the address and network of a browser
 * wallet (EIP-1193). The demo never requests a signature or a transaction.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------- helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const round4 = (x) => Math.round(x * 10000) / 10000;

  const fmtEur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });
  const fmtUnits = new Intl.NumberFormat('en-IE', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  const fmtNav = (n) => 'EUR ' + n.toFixed(4);

  // ---------------------------------------------------------- demo settings
  const CHAINS = {
    1: 'Ethereum',
    10: 'Optimism',
    56: 'BNB Chain',
    137: 'Polygon',
    8453: 'Base',
    42161: 'Arbitrum One',
    43114: 'Avalanche',
    11155111: 'Sepolia (testnet)',
    17000: 'Holesky (testnet)'
  };

  // Examples only. Names, haircuts and credit lines are placeholders.
  const COUNTERPARTIES = [
    { id: 'pb', name: 'Example Prime Broker', haircut: 0.05 },
    { id: 'ex', name: 'Example Exchange', haircut: 0.08 },
    { id: 'ld', name: 'Example Lender', haircut: 0.10 }
  ];

  const MIN_SUBSCRIPTION = 10000;
  const MAX_SUBSCRIPTION = 100000000;
  const STEP_MS = 1100;
  const GATE_OPEN_MS = 950;

  // Simulated NAV series: a slow, smooth rise.
  const SERIES_LEN = 90;
  const navAt = (i) => 100 * (1 + 0.00008 * i) + Math.sin(i / 5) * 0.015;
  const series = Array.from({ length: SERIES_LEN }, (_, i) => navAt(i));
  const LATEST_NAV = series[SERIES_LEN - 1];
  const NEXT_NAV = navAt(SERIES_LEN); // forward pricing: orders deal at the next NAV

  const reducedMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------------------------------------------------------ state
  const freshState = () => ({
    verified: false,
    verifying: false,
    whitelisted: false,
    units: 0,
    reserved: 0,
    pledges: [],
    activity: [],
    busy: false,
    revealing: false,
    tab: 'subscribe'
  });
  const state = freshState();
  let wallet = null; // { type: 'browser' | 'demo', address, chainId, chainLabel }
  let epoch = 0; // bumped on reset so stale timers do nothing

  const pledgedUnits = () => round4(state.pledges.reduce((s, p) => s + p.units, 0));
  const availableUnits = () => Math.max(0, round4(state.units - state.reserved - pledgedUnits()));
  const creditLine = () =>
    state.pledges.reduce((s, p) => s + p.units * LATEST_NAV * (1 - p.cp.haircut), 0);
  const ready = () => Boolean(wallet && state.verified && state.whitelisted);

  function addActivity(text) {
    const when = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    state.activity.unshift({ when, text });
    if (state.activity.length > 12) state.activity.pop();
  }

  // --------------------------------------------------------------- elements
  const el = {
    connectBtn: $('#connectBtn'),
    connectBtn2: $('#connectBtn2'),
    walletInfo: $('#walletInfo'),
    chainBadge: $('#chainBadge'),
    addrPill: $('#addrPill'),
    disconnectBtn: $('#disconnectBtn'),
    viewDisconnected: $('#viewDisconnected'),
    viewConnected: $('#viewConnected'),
    gate: $('#gate'),
    dialog: $('#connectDialog'),
    dlgMsg: $('#dlgMsg'),
    optBrowser: $('#optBrowser'),
    optDemo: $('#optDemo'),
    dlgClose: $('#dlgClose'),
    stWallet: $('#stWallet'),
    stVerify: $('#stVerify'),
    stList: $('#stList'),
    verifyBtn: $('#verifyBtn'),
    resetBtn: $('#resetBtn'),
    navValue: $('#navValue'),
    navDate: $('#navDate'),
    navChart: $('#navChart'),
    tabs: $$('.tab'),
    panels: { subscribe: $('#panel-subscribe'), redeem: $('#panel-redeem'), pledge: $('#panel-pledge') },
    subAmount: $('#subAmount'), subQuote: $('#subQuote'), subError: $('#subError'), subBtn: $('#subBtn'),
    redUnits: $('#redUnits'), redQuote: $('#redQuote'), redError: $('#redError'), redBtn: $('#redBtn'), redMax: $('#redMax'),
    pledgeCp: $('#pledgeCp'), pledgeUnits: $('#pledgeUnits'), pledgeQuote: $('#pledgeQuote'),
    pledgeError: $('#pledgeError'), pledgeBtn: $('#pledgeBtn'),
    tracker: $('#tracker'), trackerTitle: $('#trackerTitle'), trackerSteps: $('#trackerSteps'),
    mUnits: $('#mUnits'), mValue: $('#mValue'), mAvail: $('#mAvail'), mPledged: $('#mPledged'), mCredit: $('#mCredit'),
    pledgeList: $('#pledgeList'), pledgeEmpty: $('#pledgeEmpty'),
    activityList: $('#activityList'), activityEmpty: $('#activityEmpty')
  };

  // ----------------------------------------------------------------- wallet
  const shorten = (a) => (a && a.length > 12 ? a.slice(0, 6) + '\u2026' + a.slice(-4) : a || '');
  const chainName = (w) =>
    w.chainLabel || CHAINS[w.chainId] || (w.chainId ? 'Chain ' + w.chainId : 'Unknown network');

  function openDialog() {
    el.dlgMsg.textContent = '';
    el.optBrowser.disabled = false;
    if (typeof el.dialog.showModal === 'function') {
      if (!el.dialog.open) el.dialog.showModal();
    } else {
      el.dialog.setAttribute('open', '');
    }
  }

  function closeDialog() {
    if (typeof el.dialog.close === 'function') {
      if (el.dialog.open) el.dialog.close();
    } else {
      el.dialog.removeAttribute('open');
    }
  }

  function setWallet(w) {
    wallet = w;
    closeDialog();
    if (reducedMotion()) {
      state.revealing = false;
    } else {
      state.revealing = true;
      el.gate.classList.add('is-open');
      const mine = epoch;
      setTimeout(() => {
        if (mine !== epoch) return;
        state.revealing = false;
        render();
      }, GATE_OPEN_MS + 300);
    }
    addActivity('Wallet connected (' + (w.type === 'demo' ? 'simulated' : 'browser') + ')');
    render();
  }

  function disconnect() {
    wallet = null;
    epoch += 1;
    Object.assign(state, freshState());
    el.gate.classList.remove('is-open');
    el.tracker.hidden = true;
    el.subAmount.value = '';
    el.redUnits.value = '';
    el.pledgeUnits.value = '';
    clearErrors();
    render();
  }

  let listenersBound = false;
  function bindWalletEvents(eth) {
    if (listenersBound || !eth || typeof eth.on !== 'function') return;
    listenersBound = true;
    eth.on('accountsChanged', (accounts) => {
      if (!wallet || wallet.type !== 'browser') return;
      if (!accounts || !accounts.length) {
        disconnect();
      } else {
        wallet.address = accounts[0];
        render();
      }
    });
    eth.on('chainChanged', (hex) => {
      if (!wallet || wallet.type !== 'browser') return;
      wallet.chainId = parseInt(hex, 16);
      render();
    });
  }

  async function connectBrowserWallet() {
    const eth = window.ethereum;
    if (!eth || typeof eth.request !== 'function') {
      el.dlgMsg.textContent = 'No browser wallet found. Install one, or use the simulated demo wallet.';
      return;
    }
    el.optBrowser.disabled = true;
    el.dlgMsg.textContent = 'Waiting for your wallet\u2026';
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      let chainId = null;
      try {
        chainId = parseInt(await eth.request({ method: 'eth_chainId' }), 16);
      } catch (e) { /* network unknown */ }
      if (!accounts || !accounts.length) throw new Error('No account returned.');
      bindWalletEvents(eth);
      setWallet({ type: 'browser', address: accounts[0], chainId: chainId });
    } catch (err) {
      el.optBrowser.disabled = false;
      el.dlgMsg.textContent = err && err.code === 4001
        ? 'The connection request was declined in your wallet.'
        : 'Could not connect: ' + ((err && err.message) || 'unknown error') + '.';
    }
  }

  function randomAddress() {
    const bytes = new Uint8Array(20);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return '0x' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  function connectDemoWallet() {
    setWallet({ type: 'demo', address: randomAddress(), chainId: null, chainLabel: 'Simulated network' });
  }

  // ----------------------------------------------------------- verification
  function runVerification() {
    if (!wallet || state.verified || state.verifying) return;
    const mine = epoch;
    state.verifying = true;
    addActivity('Professional investor check started (simulated)');
    render();
    setTimeout(() => {
      if (mine !== epoch) return;
      state.verified = true;
      state.verifying = false;
      addActivity('Professional investor check passed (simulated)');
      render();
      setTimeout(() => {
        if (mine !== epoch) return;
        state.whitelisted = true;
        addActivity('Wallet whitelisted by the registry (simulated)');
        render();
      }, 900);
    }, 1000);
  }

  // ------------------------------------------------------------ order flows
  function showTracker(title, steps, done) {
    el.tracker.hidden = false;
    el.trackerTitle.textContent = title;
    el.trackerSteps.innerHTML = '';
    steps.forEach((label, i) => {
      const li = document.createElement('li');
      li.textContent = label;
      li.className = i < done ? 'is-done' : i === done ? 'is-active' : '';
      el.trackerSteps.appendChild(li);
    });
  }

  function runOrder(title, steps, onStart, onDone) {
    const mine = epoch;
    state.busy = true;
    if (onStart) onStart();
    let done = 1;
    showTracker(title, steps, done);
    render();
    const tick = () => {
      if (mine !== epoch) return;
      done += 1;
      showTracker(title, steps, done);
      if (done >= steps.length) {
        state.busy = false;
        onDone();
        render();
      } else {
        setTimeout(tick, STEP_MS);
      }
    };
    setTimeout(tick, STEP_MS);
  }

  function parseNumber(input) {
    const v = parseFloat(input.value);
    return Number.isFinite(v) ? v : NaN;
  }

  function clearErrors() {
    el.subError.textContent = '';
    el.redError.textContent = '';
    el.pledgeError.textContent = '';
  }

  function onSubscribe() {
    clearErrors();
    const amount = parseNumber(el.subAmount);
    if (Number.isNaN(amount)) { el.subError.textContent = 'Enter an amount in euros.'; return; }
    if (amount < MIN_SUBSCRIPTION) { el.subError.textContent = 'The minimum subscription in this demo is EUR 10,000.'; return; }
    if (amount > MAX_SUBSCRIPTION) { el.subError.textContent = 'That amount is too large for this demo.'; return; }
    const units = round4(amount / NEXT_NAV);
    runOrder(
      'Subscription order',
      [
        'Order received by the licensed distributor',
        'Cash confirmed at the fund\u2019s depositary',
        'Priced at the next NAV',
        'Units recorded by the registry and token minted'
      ],
      () => addActivity('Subscription order placed for ' + fmtEur.format(amount)),
      () => {
        state.units = round4(state.units + units);
        addActivity(fmtUnits.format(units) + ' units minted at ' + fmtNav(NEXT_NAV));
        el.subAmount.value = '';
      }
    );
  }

  function onRedeem() {
    clearErrors();
    const units = round4(parseNumber(el.redUnits));
    if (Number.isNaN(units) || units <= 0) { el.redError.textContent = 'Enter the number of units to redeem.'; return; }
    if (units > availableUnits()) {
      el.redError.textContent = 'You can redeem up to ' + fmtUnits.format(availableUnits()) + ' units. Pledged units must be released first.';
      return;
    }
    runOrder(
      'Redemption order',
      [
        'Order received by the licensed distributor',
        'Units locked for redemption',
        'Priced at the next NAV',
        'Units burned and cash paid by the fund'
      ],
      () => {
        state.reserved = round4(state.reserved + units);
        addActivity('Redemption order placed for ' + fmtUnits.format(units) + ' units');
      },
      () => {
        state.units = round4(state.units - units);
        state.reserved = round4(state.reserved - units);
        addActivity('Redeemed ' + fmtUnits.format(units) + ' units for ' + fmtEur.format(units * NEXT_NAV));
        el.redUnits.value = '';
      }
    );
  }

  function onPledge() {
    clearErrors();
    const cp = COUNTERPARTIES.find((c) => c.id === el.pledgeCp.value);
    const units = round4(parseNumber(el.pledgeUnits));
    if (!cp) { el.pledgeError.textContent = 'Choose a counterparty.'; return; }
    if (Number.isNaN(units) || units <= 0) { el.pledgeError.textContent = 'Enter the number of units to pledge.'; return; }
    if (units > availableUnits()) {
      el.pledgeError.textContent = 'You have ' + fmtUnits.format(availableUnits()) + ' units available to pledge.';
      return;
    }
    state.pledges.push({ id: Date.now() + Math.random(), cp: cp, units: units });
    addActivity('Pledged ' + fmtUnits.format(units) + ' units to ' + cp.name);
    el.pledgeUnits.value = '';
    render();
  }

  function releasePledge(id) {
    const i = state.pledges.findIndex((p) => p.id === id);
    if (i < 0) return;
    const p = state.pledges[i];
    state.pledges.splice(i, 1);
    addActivity('Released ' + fmtUnits.format(p.units) + ' units from ' + p.cp.name);
    render();
  }

  // ------------------------------------------------------------------- tabs
  function selectTab(name, focus) {
    state.tab = name;
    el.tabs.forEach((t) => {
      const on = t.dataset.tab === name;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    Object.keys(el.panels).forEach((k) => { el.panels[k].hidden = k !== name; });
  }

  // ----------------------------------------------------------------- render
  function setChip(chip, status) {
    chip.classList.toggle('is-done', status === 'done');
    chip.classList.toggle('is-busy', status === 'busy');
  }

  function renderQuotes() {
    if (!ready()) {
      const msg = 'Run the simulated verification above to place orders.';
      el.subQuote.textContent = msg;
      el.redQuote.textContent = msg;
      el.pledgeQuote.textContent = msg;
      return;
    }
    const amount = parseNumber(el.subAmount);
    el.subQuote.textContent = amount >= MIN_SUBSCRIPTION
      ? 'You would receive about ' + fmtUnits.format(round4(amount / NEXT_NAV)) + ' units at the next NAV (' + fmtNav(NEXT_NAV) + ').'
      : '';

    const ru = parseNumber(el.redUnits);
    el.redQuote.textContent = ru > 0
      ? 'You would receive about ' + fmtEur.format(ru * NEXT_NAV) + ' at the next NAV.'
      : '';

    const cp = COUNTERPARTIES.find((c) => c.id === el.pledgeCp.value);
    const pu = parseNumber(el.pledgeUnits);
    el.pledgeQuote.textContent = cp && pu > 0
      ? 'Credit line unlocked: ' + fmtEur.format(pu * LATEST_NAV * (1 - cp.haircut)) + ' (haircut ' + Math.round(cp.haircut * 100) + '%).'
      : '';
  }

  function render() {
    // Header
    el.connectBtn.hidden = Boolean(wallet);
    el.walletInfo.hidden = !wallet;
    if (wallet) {
      el.chainBadge.textContent = chainName(wallet);
      el.addrPill.textContent = shorten(wallet.address);
      el.addrPill.title = wallet.address;
    }

    // Views
    const showConnected = Boolean(wallet) && !state.revealing;
    el.viewConnected.hidden = !showConnected;
    el.viewDisconnected.hidden = showConnected;

    // Status
    setChip(el.stWallet, wallet ? 'done' : '');
    setChip(el.stVerify, state.verified ? 'done' : state.verifying ? 'busy' : '');
    setChip(el.stList, state.whitelisted ? 'done' : '');
    el.verifyBtn.hidden = state.verified;
    el.verifyBtn.disabled = state.verifying;
    el.verifyBtn.textContent = state.verifying ? 'Verifying\u2026' : 'Run simulated verification';

    // Fund
    el.navValue.textContent = fmtNav(LATEST_NAV);

    // Actions
    const locked = !ready() || state.busy;
    [el.subBtn, el.redBtn, el.pledgeBtn, el.redMax].forEach((b) => { b.disabled = locked; });
    [el.subAmount, el.redUnits, el.pledgeUnits, el.pledgeCp].forEach((i) => { i.disabled = !ready(); });
    renderQuotes();

    // Position
    el.mUnits.textContent = fmtUnits.format(state.units);
    el.mValue.textContent = fmtEur.format(state.units * LATEST_NAV);
    el.mAvail.textContent = fmtUnits.format(availableUnits());
    el.mPledged.textContent = fmtUnits.format(pledgedUnits());
    el.mCredit.textContent = fmtEur.format(creditLine());

    // Pledges
    el.pledgeList.innerHTML = '';
    state.pledges.forEach((p) => {
      const li = document.createElement('li');
      const what = document.createElement('span');
      what.className = 'what';
      what.textContent = p.cp.name;
      const sub = document.createElement('span');
      sub.className = 'sub';
      sub.textContent = fmtUnits.format(p.units) + ' units, credit line ' + fmtEur.format(p.units * LATEST_NAV * (1 - p.cp.haircut));
      what.appendChild(sub);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-link';
      btn.textContent = 'Release';
      btn.addEventListener('click', () => releasePledge(p.id));
      li.appendChild(what);
      li.appendChild(btn);
      el.pledgeList.appendChild(li);
    });
    el.pledgeEmpty.hidden = state.pledges.length > 0;

    // Activity
    el.activityList.innerHTML = '';
    state.activity.forEach((a) => {
      const li = document.createElement('li');
      const when = document.createElement('span');
      when.className = 'when';
      when.textContent = a.when;
      const what = document.createElement('span');
      what.className = 'what';
      what.textContent = a.text;
      li.appendChild(when);
      li.appendChild(what);
      el.activityList.appendChild(li);
    });
    el.activityEmpty.hidden = state.activity.length > 0;
  }

  function drawChart() {
    const W = 600, H = 130, pad = 8;
    const min = Math.min.apply(null, series);
    const max = Math.max.apply(null, series);
    const x = (i) => pad + ((W - 2 * pad) * i) / (SERIES_LEN - 1);
    const y = (v) => H - pad - ((H - 2 * pad) * (v - min)) / (max - min);
    let line = '';
    series.forEach((v, i) => { line += (i ? ' L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); });
    const area = line + ' L' + x(SERIES_LEN - 1).toFixed(1) + ' ' + (H - pad) + ' L' + x(0).toFixed(1) + ' ' + (H - pad) + ' Z';
    el.navChart.innerHTML =
      '<path d="' + area + '" fill="#003399" fill-opacity="0.45"/>' +
      '<path d="' + line + '" fill="none" stroke="#FFCC00" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
  }

  // ------------------------------------------------------------------- init
  function init() {
    COUNTERPARTIES.forEach((c) => {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.name + ' (haircut ' + Math.round(c.haircut * 100) + '%)';
      el.pledgeCp.appendChild(o);
    });
    el.navDate.textContent = 'as of ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    drawChart();

    el.connectBtn.addEventListener('click', openDialog);
    el.connectBtn2.addEventListener('click', openDialog);
    el.dlgClose.addEventListener('click', closeDialog);
    el.optBrowser.addEventListener('click', connectBrowserWallet);
    el.optDemo.addEventListener('click', connectDemoWallet);
    el.disconnectBtn.addEventListener('click', disconnect);
    el.verifyBtn.addEventListener('click', runVerification);
    el.resetBtn.addEventListener('click', () => {
      epoch += 1;
      Object.assign(state, freshState());
      el.tracker.hidden = true;
      clearErrors();
      render();
    });

    el.tabs.forEach((t, i) => {
      t.addEventListener('click', () => selectTab(t.dataset.tab, false));
      t.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const next = (i + (e.key === 'ArrowRight' ? 1 : el.tabs.length - 1)) % el.tabs.length;
        selectTab(el.tabs[next].dataset.tab, true);
      });
    });

    el.subBtn.addEventListener('click', onSubscribe);
    el.redBtn.addEventListener('click', onRedeem);
    el.pledgeBtn.addEventListener('click', onPledge);
    el.redMax.addEventListener('click', () => {
      el.redUnits.value = availableUnits() > 0 ? String(availableUnits()) : '';
      renderQuotes();
    });
    [el.subAmount, el.redUnits, el.pledgeUnits].forEach((i) => i.addEventListener('input', renderQuotes));
    el.pledgeCp.addEventListener('change', renderQuotes);

    render();
  }

  init();
})();
