(function () {
  'use strict';

  // La vista compacta solo habla con la web a través de window.radioMicro
  // (definido al final de app.js). No reproduce audio por su cuenta.
  var B = window.radioMicro;
  if (!B) {
    return;
  }

  var STORAGE_OPEN = 'radioMicroCompact';
  var STORAGE_STATION = 'radioMicroCompactStation';
  var DRAG_STEP_PX = 14;     // píxeles de arrastre por cada paso
  var TAP_MOVE_PX = 8;       // movimiento máximo para que un toque cuente como clic
  var FAST_DRAG_PX = 24;
  var FAST_MULTIPLIER = 4;

  var MODE_NAMES = {
    normal: 'NORMAL',
    sleep: 'DORMIR',
    calm: 'BIG CALM',
    music: 'MUSIC TIME',
    buggy: 'BUGGY TIME'
  };
  // Letra que aparece junto a cada posición del dial de modo
  var MODE_LETTERS = { normal: 'N', sleep: 'D', calm: 'C', music: 'M', buggy: 'B' };

  function $(id) { return document.getElementById(id); }

  var root = $('compact');
  var stage = $('compactStage');
  var openBtn = $('compact-toggle');
  var exitBtn = $('cpExit');
  var led = $('cpLed');
  var deck = document.querySelector('#compact .deck');
  var modeDial = $('cpModeDial');
  var modeWrap = $('cpModeWrap');
  var modeRing = $('cpModeRing');
  var modeVal = $('cpModeVal');
  var stDial = $('cpStDial');
  var stVal = $('cpStVal');
  var win = $('cpWindow');
  var label = $('cpLabel');
  var nameEl = $('cpName');
  var subEl = $('cpSub');
  var trackBox = $('cpTrack');
  var trackText = $('cpTrackText');
  var reelL = $('cpReelL');
  var reelR = $('cpReelR');
  var btnPower = $('cpPower');
  var btnPlay = $('cpPlay');
  var btnStop = $('cpStop');
  var btnStyle = $('cpStyle');
  var btnMode = $('cpModeBtn');
  var needleL = $('cpNeedleL');
  var needleR = $('cpNeedleR');
  var bars = $('cpBars');
  var listBtn = $('cpList');
  var screen = $('cpScreen');
  var screenBody = $('cpScreenBody');

  var st = {
    open: false,
    style: 'todos',
    tab: 'emisoras',
    pick: -1,          // índice en la lista de emisoras de la web
    pickMode: null,    // modo al que pertenece "pick"
    dragging: false,
    modePreview: null, // posición del dial de modo mientras se gira
    lastActive: -1,
    staticTimer: null,
    vuTimer: null
  };

  /* --- Datos --- */

  function allStations() { return B.getStations() || []; }
  function modeList() { return B.getModes(); }
  function isOn() { return B.getCurrentIndex() !== -1; }

  function filtered() {
    var out = [];
    allStations().forEach(function (s, i) {
      if (st.style === 'todos' || s.category === st.style) {
        out.push(i);
      }
    });
    return out;
  }

  function catLabel(id) {
    var cats = B.getCategories();
    for (var i = 0; i < cats.length; i++) {
      if (cats[i].id === id) {
        return cats[i].label;
      }
    }
    return id;
  }

  function firstLetter(name) {
    var c = String(name).normalize('NFD').replace(/[̀-ͯ]/g, '').charAt(0).toUpperCase();
    return /[A-Z]/.test(c) ? c : '#';
  }

  function saveStationName(i) {
    var s = allStations()[i];
    if (!s) { return; }
    try { window.localStorage.setItem(STORAGE_STATION, s.name); } catch (e) { /* sin almacenamiento */ }
  }

  // Si cambia el modo, la selección anterior ya no vale: se empieza de cero.
  // Si no hay selección, se recupera la última emisora escuchada si existe.
  function ensurePick() {
    var mode = B.getMode();
    if (st.pickMode !== mode) {
      st.pickMode = mode;
      st.style = 'todos';
      st.pick = -1;
    }
    var list = filtered();
    if (st.pick >= 0 && list.indexOf(st.pick) !== -1) {
      return;
    }
    var stored = null;
    try { stored = window.localStorage.getItem(STORAGE_STATION); } catch (e) { /* noop */ }
    var found = -1;
    if (stored) {
      list.forEach(function (i) {
        if (found === -1 && allStations()[i].name === stored) { found = i; }
      });
    }
    st.pick = found !== -1 ? found : (list.length ? list[0] : -1);
  }

  /* --- Acciones: pasan por las mismas funciones que la lista normal --- */

  function selectStation(i, play) {
    st.pick = i;
    saveStationName(i);
    if (play && i !== B.getCurrentIndex()) {
      B.play(i);
    }
    render();
  }

  function setModeByIndex(i) {
    var mode = modeList()[i];
    if (mode && mode !== B.getMode()) {
      st.pick = -1;
      st.style = 'todos';
      B.setMode(mode);
    }
  }

  function setStyle(id) {
    st.style = id;
    st.pick = -1;
    ensurePick();
    var list = filtered();
    if (isOn() && st.pick >= 0 && list.length) {
      if (st.pick !== B.getCurrentIndex()) { B.play(st.pick); }
    }
    setTab('emisoras');
    render();
  }

  /* --- Diales ---
     Un clic (o toque) avanza una posición. Arrastrar también sirve: cada paso
     de arrastre mueve una posición y, en el de emisoras, un arrastre rápido
     avanza de cuatro en cuatro. Mientras se arrastra solo se previsualiza; al
     soltar se aplica, para no parar y arrancar la radio en cada paso. */

  function attachDial(el, opts) {
    var drag = null;

    function step(delta) {
      var n = opts.count();
      if (n < 2) { return; }
      var cur = opts.index();
      var next = ((cur + delta) % n + n) % n;
      if (next !== cur) { opts.set(next); }
    }

    // Un paso completo: empezar, mover y aplicar
    function turn(delta) {
      if (opts.start) { opts.start(); }
      step(delta);
      if (opts.end) { opts.end(); }
    }

    el.addEventListener('pointerdown', function (e) {
      drag = { x: e.clientX, y: e.clientY, last: e.clientY, acc: 0, moved: false };
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
      el.classList.add('grab');
    });

    el.addEventListener('pointermove', function (e) {
      if (!drag) { return; }
      if (!drag.moved) {
        if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < TAP_MOVE_PX) { return; }
        drag.moved = true;
        if (opts.start) { opts.start(); }
      }
      var dy = drag.last - e.clientY;
      drag.last = e.clientY;
      drag.acc += dy;
      var mul = opts.fast && Math.abs(dy) >= FAST_DRAG_PX ? FAST_MULTIPLIER : 1;
      while (Math.abs(drag.acc) >= DRAG_STEP_PX) {
        var s = drag.acc > 0 ? 1 : -1;
        drag.acc -= DRAG_STEP_PX * s;
        step(s * mul);
      }
    });

    function end() {
      if (!drag) { return; }
      var wasTap = !drag.moved;
      drag = null;
      el.classList.remove('grab');
      if (wasTap) {
        // Clic: un paso adelante
        turn(1);
      } else if (opts.end) {
        opts.end();
      }
    }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', function () {
      if (drag) { drag = null; el.classList.remove('grab'); if (opts.end) { opts.end(); } }
    });

    el.addEventListener('wheel', function (e) {
      e.preventDefault();
      turn(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });

    el.addEventListener('keydown', function (e) {
      var d = 0;
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { d = 1; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { d = -1; }
      if (!d) { return; }
      e.preventDefault();
      turn(d);
    });
  }

  function paintDial(el, n, i) {
    var angle = n <= 1 ? 0 : -135 + 270 * i / (n - 1);
    el.style.transform = 'rotate(' + angle + 'deg)';
    el.setAttribute('aria-valuenow', String(i + 1));
    el.setAttribute('aria-valuemax', String(n));
  }

  // Letras alrededor del dial de modo, cada una en su posición, para saber dónde girar
  function buildModeRing() {
    var ms = modeList();
    var wrapSize = modeWrap.clientWidth || 120;
    var r = wrapSize / 2 - 10;
    var c = wrapSize / 2;
    if (modeRing.children.length !== ms.length) {
      modeRing.textContent = '';
      ms.forEach(function (m) {
        var s = document.createElement('span');
        s.textContent = MODE_LETTERS[m] || m.charAt(0).toUpperCase();
        s.setAttribute('title', MODE_NAMES[m] || m);
        modeRing.appendChild(s);
      });
    }
    var current = Math.max(0, ms.indexOf(B.getMode()));
    if (st.modePreview !== null) { current = st.modePreview; }
    Array.prototype.forEach.call(modeRing.children, function (s, i) {
      var a = (-135 + 270 * i / (ms.length - 1)) * Math.PI / 180;
      s.style.left = (c + r * Math.sin(a)) + 'px';
      s.style.top = (c - r * Math.cos(a)) + 'px';
      s.classList.toggle('on', i === current);
    });
  }

  var modeOpts = {
    count: function () { return modeList().length; },
    index: function () {
      if (st.modePreview !== null) { return st.modePreview; }
      return Math.max(0, modeList().indexOf(B.getMode()));
    },
    set: function (i) { st.modePreview = i; render(); },
    start: function () {
      if (st.modePreview === null) {
        st.modePreview = Math.max(0, modeList().indexOf(B.getMode()));
      }
    },
    end: function () {
      var i = st.modePreview;
      st.modePreview = null;
      if (i !== null) { setModeByIndex(i); }
      render();
    }
  };

  var stOpts = {
    fast: true,
    count: function () { return filtered().length; },
    index: function () {
      var pos = filtered().indexOf(st.pick);
      return pos < 0 ? 0 : pos;
    },
    set: function (p) {
      var list = filtered();
      if (list[p] !== undefined) { st.pick = list[p]; render(); }
    },
    start: function () { st.dragging = true; },
    end: function () {
      st.dragging = false;
      if (isOn() && st.pick >= 0 && st.pick !== B.getCurrentIndex()) {
        B.play(st.pick);
      }
      render();
    }
  };

  attachDial(modeDial, modeOpts);
  attachDial(stDial, stOpts);

  // Botones ‹ › junto a cada dial: mismo paso que un clic
  function stepBy(opts, delta) {
    if (opts.start) { opts.start(); }
    var n = opts.count();
    if (n >= 2) {
      var cur = opts.index();
      var next = ((cur + delta) % n + n) % n;
      if (next !== cur) { opts.set(next); }
    }
    if (opts.end) { opts.end(); }
  }
  $('cpModePrev').addEventListener('click', function () { stepBy(modeOpts, -1); });
  $('cpModeNext').addEventListener('click', function () { stepBy(modeOpts, 1); });
  $('cpStPrev').addEventListener('click', function () { stepBy(stOpts, -1); });
  $('cpStNext').addEventListener('click', function () { stepBy(stOpts, 1); });

  /* --- Botones --- */

  btnPower.addEventListener('click', function () {
    if (isOn()) {
      B.stop();
    } else {
      ensurePick();
      if (st.pick >= 0) { B.play(st.pick); }
    }
  });

  btnPlay.addEventListener('click', function () {
    if (!isOn()) {
      ensurePick();
      if (st.pick >= 0) { B.play(st.pick); }
    } else {
      B.toggle();
    }
  });

  btnStop.addEventListener('click', function () { B.stop(); });

  btnStyle.addEventListener('click', function () {
    openScreen(true);
    setTab('estilos');
  });

  // El botón MODO abre el panel inferior en la pestaña de modos
  btnMode.addEventListener('click', function () {
    openScreen(true);
    setTab('modos');
  });

  /* --- Panel inferior (lista, estilos y modos) --- */

  function openScreen(show) {
    screen.hidden = !show;
    listBtn.setAttribute('aria-expanded', String(show));
    listBtn.textContent = show ? '▼ CERRAR' : '▲ LISTA';
    if (show) { renderScreen(); }
  }

  function setTab(tab) {
    st.tab = tab;
    document.querySelectorAll('#compact .screen-tab').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === tab);
    });
    renderScreen();
  }

  listBtn.addEventListener('click', function () { openScreen(screen.hidden); });
  document.querySelectorAll('#compact .screen-tab').forEach(function (b) {
    b.addEventListener('click', function () { setTab(b.getAttribute('data-tab')); });
  });

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text !== undefined && text !== null) { n.textContent = text; }
    return n;
  }

  function renderScreen() {
    screenBody.textContent = '';
    var all = allStations();

    if (st.tab === 'emisoras') {
      var list = filtered();
      var ai = isOn() ? B.getCurrentIndex() : st.pick;
      var styleName = st.style === 'todos' ? 'TODOS' : catLabel(st.style).toUpperCase();
      screenBody.appendChild(el('div', 'screen-line', 'GRUPO ' + (MODE_NAMES[B.getMode()] || '') + ' · ESTILO ' + styleName));

      // Letras para saltar directamente a la primera emisora de esa letra
      var firstPos = {};
      list.forEach(function (i, p) {
        var L = firstLetter(all[i].name);
        if (!(L in firstPos)) { firstPos[L] = p; }
      });
      var letters = el('div', 'letters');
      Object.keys(firstPos).sort().forEach(function (L) {
        var b = el('button', 'letter', L);
        b.type = 'button';
        b.setAttribute('aria-label', 'Ir a la letra ' + L);
        b.addEventListener('click', function () { selectStation(list[firstPos[L]], isOn()); });
        letters.appendChild(b);
      });
      if (Object.keys(firstPos).length) { screenBody.appendChild(letters); }

      if (!list.length) {
        screenBody.appendChild(el('div', 'screen-line', 'No hay emisoras en este grupo.'));
      }
      var activeRow = null;
      list.forEach(function (i, p) {
        var row = el('button', 'row' + (i === ai ? ' active' : ''));
        row.type = 'button';
        row.appendChild(el('span', 'idx', (p + 1) + '.'));
        row.appendChild(el('span', 'name', all[i].name));
        row.appendChild(el('span', 'cat', all[i].category ? catLabel(all[i].category) : ''));
        row.addEventListener('click', function () { selectStation(i, true); });
        screenBody.appendChild(row);
        if (i === ai) { activeRow = row; }
      });
      if (activeRow) { activeRow.scrollIntoView({ block: 'nearest' }); }

    } else if (st.tab === 'estilos') {
      var wrap = el('div', 'style-btns');
      var options = [{ id: 'todos', label: 'Todos' }].concat(B.getCategories());
      options.forEach(function (c) {
        var b = el('button', 'style-btn' + (c.id === st.style ? ' active' : ''), c.label);
        b.type = 'button';
        b.addEventListener('click', function () { setStyle(c.id); });
        wrap.appendChild(b);
      });
      screenBody.appendChild(wrap);

    } else {
      // Pestaña MODOS: el mismo cambio que el dial y el selector de la cabecera
      var mwrap = el('div', 'style-btns');
      modeList().forEach(function (m) {
        var b = el('button', 'style-btn' + (m === B.getMode() ? ' active' : ''), (MODE_LETTERS[m] ? MODE_LETTERS[m] + ' · ' : '') + (MODE_NAMES[m] || m));
        b.type = 'button';
        b.addEventListener('click', function () {
          setModeByIndex(modeList().indexOf(m));
          render();
        });
        mwrap.appendChild(b);
      });
      screenBody.appendChild(mwrap);
    }
  }

  /* --- Pintado --- */

  // Solo el estado de la radio; la canción va en su propia línea
  function statusText(on, status, paused) {
    if (!on) { return 'PULSA ENCENDER'; }
    if (paused) { return 'EN PAUSA'; }
    if (status === 'reconnecting') { return 'RECONECTANDO…'; }
    if (status === 'tuning') { return 'SINTONIZANDO…'; }
    if (status === 'blocked') { return 'TOCA PARA REANUDAR'; }
    if (status === 'unavailable') { return 'NO DISPONIBLE'; }
    if (status === 'live') { return 'EN DIRECTO'; }
    return '';
  }

  function trackString(on, status, paused) {
    if (!on || paused || status !== 'live') { return ''; }
    var t = B.getTrack();
    if (t) { return '♪ ' + (t.artist ? t.artist + ' — ' + t.title : t.title); }
    return '♪ sin datos de canción';
  }

  // Si el texto no cabe, se desplaza despacio en vez de cortarse
  function setTrack(text) {
    trackText.textContent = text;
    trackBox.classList.remove('scroll');
    trackText.style.transform = '';
    if (!text) { return; }
    var over = trackText.offsetWidth - trackBox.clientWidth + 12;
    if (over > 0) {
      trackBox.style.setProperty('--cp-shift', (-over) + 'px');
      trackBox.style.setProperty('--cp-dur', Math.max(6, Math.round(over / 25)) + 's');
      trackBox.classList.add('scroll');
    }
  }

  var lastTrack = null;

  function render() {
    if (!st.open) { return; }
    ensurePick();

    var on = isOn();
    var status = B.getStatus();
    var paused = B.isUserPaused();
    if (on && !st.dragging) {
      // Con la radio sonando, el dial sigue a la emisora que suena.
      st.pick = B.getCurrentIndex();
    }

    var mode = B.getMode();
    var ms = modeList();
    var modePos = st.modePreview !== null ? st.modePreview : Math.max(0, ms.indexOf(mode));
    paintDial(modeDial, ms.length, modePos);
    buildModeRing();
    modeVal.textContent = MODE_NAMES[mode] || mode.toUpperCase();

    var list = filtered();
    var pos = list.indexOf(st.pick);
    paintDial(stDial, list.length, pos < 0 ? 0 : pos);
    stVal.textContent = list.length ? ((pos < 0 ? 0 : pos) + 1) + ' / ' + list.length : '—';

    var s = st.pick >= 0 ? allStations()[st.pick] : null;
    nameEl.textContent = s ? s.name : 'SIN EMISORAS';
    subEl.textContent = statusText(on, status, paused);

    var track = trackString(on, status, paused);
    if (track !== lastTrack) {
      lastTrack = track;
      setTrack(track);
    }

    label.classList.toggle('beat', on && status === 'live' && !paused);
    label.classList.toggle('beat-slow', on && status === 'reconnecting' && !paused);
    var spinning = on && !paused && (status === 'live' || status === 'tuning');
    var recon = on && !paused && status === 'reconnecting';
    reelL.className = 'reel ' + (recon ? 'spin-recon' : spinning ? 'spin' : 'still');
    reelR.className = reelL.className;

    led.classList.toggle('on', on);
    deck.classList.toggle('off', !on);
    btnPower.classList.toggle('lit', on);
    btnPower.textContent = on ? 'APAGAR' : 'ENCENDER';
    btnPlay.classList.toggle('lit', on && !paused);
    btnPlay.textContent = on && !paused ? 'PAUSA' : 'PLAY';
    btnStyle.disabled = B.getCategories().length === 0;

    // Interferencia breve al cambiar de emisora mientras suena
    var active = on ? B.getCurrentIndex() : -1;
    if (active !== st.lastActive && on && st.lastActive !== -1) {
      win.classList.add('static');
      clearTimeout(st.staticTimer);
      st.staticTimer = setTimeout(function () { win.classList.remove('static'); }, 450);
    }
    st.lastActive = active;

    if (!screen.hidden) { renderScreen(); }
  }

  /* --- Vúmetros y barras: simulados, solo se mueven mientras suena --- */

  function buildBars() {
    if (bars.children.length) { return; }
    for (var i = 0; i < 8; i++) { bars.appendChild(el('div', 'bar')); }
  }

  function tickVU() {
    if (document.hidden) { return; }
    var live = isOn() && !B.isUserPaused() && B.getStatus() === 'live';
    needleL.style.transform = 'rotate(' + (live ? -30 + Math.random() * 60 : -42) + 'deg)';
    needleR.style.transform = 'rotate(' + (live ? -30 + Math.random() * 60 : -42) + 'deg)';
    var lit = live ? Math.round(3 + Math.random() * 5) : 0;
    Array.prototype.forEach.call(bars.children, function (b, i) {
      var on = i < lit;
      b.classList.toggle('on', on);
      b.style.height = on ? (40 + Math.random() * 60) + '%' : '20%';
    });
  }

  function startVU() {
    buildBars();
    if (!st.vuTimer) { st.vuTimer = setInterval(tickVU, 150); }
  }

  function stopVU() {
    if (st.vuTimer) { clearInterval(st.vuTimer); st.vuTimer = null; }
  }

  /* --- Abrir / cerrar --- */

  // En el móvil, con el teléfono en vertical, se gira la vista para que
  // siempre se vea en horizontal.
  function orient() {
    var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    var portrait = window.innerHeight > window.innerWidth;
    var rotated = st.open && coarse && portrait;
    root.classList.toggle('rotated', rotated);
    // Espacio justo: vista girada o pantalla baja (p. ej. el móvil en horizontal)
    var low = rotated || window.innerHeight <= 520;
    root.classList.toggle('small', st.open && low);
    if (st.open) { buildModeRing(); }
  }

  function setOpen(v) {
    st.open = v;
    root.hidden = !v;
    document.body.classList.toggle('compact-open', v);
    openBtn.setAttribute('aria-pressed', String(v));
    openBtn.setAttribute('title', v ? 'Salir del modo compacto' : 'Modo compacto');
    openBtn.setAttribute('aria-label', v ? 'Salir del modo compacto' : 'Modo compacto (casete)');
    try { window.localStorage.setItem(STORAGE_OPEN, v ? '1' : '0'); } catch (e) { /* sin almacenamiento */ }
    if (v) {
      orient();
      startVU();
      stage.scrollTop = 0;
      ensurePick();
      render();
    } else {
      stopVU();
      openScreen(false);
      // La radio sigue sonando al cerrar la vista compacta: el mini reproductor de siempre la controla.
    }
  }

  openBtn.addEventListener('click', function () { setOpen(!st.open); });
  exitBtn.addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && st.open) { setOpen(false); }
  });
  window.addEventListener('resize', orient);
  window.addEventListener('orientationchange', orient);
  window.addEventListener('radio:change', function () { render(); });

  // Arranque: recuerda si la vista estaba abierta. No arranca la radio sola.
  var saved = null;
  try { saved = window.localStorage.getItem(STORAGE_OPEN); } catch (e) { /* noop */ }
  if (saved === '1') {
    setOpen(true);
  }
})();
