/* Buscador de emisoras (se descarga al pulsar la lupa de la cabecera).
 *
 * Busca en radio-browser.info, el catálogo libre de emisoras del que salen
 * también las de la web, y deja añadir una al modo que se elija (Big Calm no:
 * solo lleva emisoras con la afinación medida). El estilo no se elige: en los
 * modos con temáticas va siempre a "★ Para ti".
 *
 * Las añadidas se guardan solo en este navegador; app.js las mezcla con las
 * de cada modo (window.radioMicro.added). Desde "Mis añadidas" se quitan, se
 * exportan a un archivo y se importan en otro dispositivo.
 */
(function () {
  'use strict';

  var B = window.radioMicro;
  var toggle = document.getElementById('search-toggle');
  if (!B || !B.added || !toggle) { return; }
  var A = B.added;

  var SERVERS = ['https://de1.api.radio-browser.info', 'https://de2.api.radio-browser.info'];
  var REQUEST_TIMEOUT_MS = 9000;
  var MAX_RESULTS = 30;
  var MODE_LABELS = {
    normal: '☀️ Normal',
    sleep: '🌙 Dormir',
    music: '🎸 Music Time',
    buggy: '🐞 Buggy Time'
  };
  var MODE_NAMES = { normal: 'Normal', sleep: 'Dormir', music: 'Music Time', buggy: 'Buggy Time', calm: 'Big Calm' };

  var serverIndex = 0;
  var searchSeq = 0;
  var lastFocus = null;
  var preview = { audio: null, url: null, btn: null };
  var catalog = null;

  /* --- Utilidades --- */

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) { node.className = cls; }
    if (text !== undefined && text !== null) { node.textContent = text; }
    return node;
  }

  function btn(cls, text, label) {
    var b = el('button', cls, text);
    b.type = 'button';
    if (label) { b.setAttribute('aria-label', label); }
    return b;
  }

  // Las mismas iniciales que pinta app.js en la tarjeta
  function initials(name) {
    return A.initials(name);
  }

  function cleanName(name) {
    return String(name || '').replace(/\s+/g, ' ').replace(/^[\s\-–—|·.]+/, '').trim().slice(0, A.nameMax);
  }

  function logoBox(name) {
    var box = el('span', 'station-logo is-initials is-added rs-logo', initials(name));
    box.setAttribute('aria-hidden', 'true');
    return box;
  }

  /* --- radio-browser.info --- */

  function fetchWithTimeout(url) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) { ctrl.abort(); } }, REQUEST_TIMEOUT_MS);
    return fetch(url, ctrl ? { signal: ctrl.signal } : {}).then(function (res) {
      clearTimeout(timer);
      if (!res.ok) { throw new Error('HTTP ' + res.status); }
      return res.json();
    }, function (err) {
      clearTimeout(timer);
      throw err;
    });
  }

  // Prueba los servidores por turno y se queda con el que responde.
  function rbGet(path, attempt) {
    attempt = attempt || 0;
    var i = (serverIndex + attempt) % SERVERS.length;
    return fetchWithTimeout(SERVERS[i] + path).then(function (data) {
      serverIndex = i;
      return Array.isArray(data) ? data : [];
    }, function (err) {
      if (attempt + 1 < SERVERS.length) { return rbGet(path, attempt + 1); }
      throw err;
    });
  }

  function search(query) {
    var q = encodeURIComponent(query);
    var common = '&hidebroken=true&is_https=true&order=votes&reverse=true&limit=60';
    return Promise.all([
      rbGet('/json/stations/search?name=' + q + common),
      rbGet('/json/stations/search?tag=' + q + common).catch(function () { return []; })
    ]).then(function (r) {
      var seen = {};
      return r[0].concat(r[1]).filter(function (s) {
        var url = s && s.url_resolved;
        // Solo HTTPS (el navegador bloquea el resto), que funcionaran en la
        // última comprobación y sin error de certificado.
        if (!url || !/^https:\/\//i.test(url) || s.lastcheckok !== 1 || s.ssl_error === 1 || !cleanName(s.name)) {
          return false;
        }
        var key = A.streamKey(url);
        if (seen[key] || seen[s.stationuuid]) { return false; }
        seen[key] = true;
        seen[s.stationuuid] = true;
        return true;
      }).sort(function (a, b) {
        return (b.votes || 0) - (a.votes || 0);
      }).slice(0, MAX_RESULTS);
    });
  }

  /* --- Panel --- */

  var backdrop = el('div', 'rs-backdrop');
  backdrop.hidden = true;
  var panel = el('section', 'rs-panel');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'rs-title');
  backdrop.appendChild(panel);

  var head = el('header', 'rs-head');
  var title = el('h2', 'rs-title', 'BUSCAR EMISORAS');
  title.id = 'rs-title';
  var closeBtn = btn('rs-close', '✕', 'Cerrar el buscador');
  head.appendChild(title);
  head.appendChild(closeBtn);
  panel.appendChild(head);

  var tabs = el('div', 'rs-tabs');
  tabs.setAttribute('role', 'tablist');
  var tabSearch = btn('rs-tab is-active', '🔍 BUSCAR');
  var tabMine = btn('rs-tab', '★ MIS AÑADIDAS');
  [tabSearch, tabMine].forEach(function (t) {
    t.setAttribute('role', 'tab');
    tabs.appendChild(t);
  });
  panel.appendChild(tabs);

  // Vista "Buscar"
  var viewSearch = el('div', 'rs-view');
  var form = el('form', 'rs-form');
  form.setAttribute('role', 'search');
  var input = el('input', 'rs-input');
  input.type = 'search';
  input.placeholder = 'Nombre o estilo: jazz, flamenco, lluvia…';
  input.setAttribute('aria-label', 'Nombre o estilo de la emisora');
  input.autocomplete = 'off';
  input.enterKeyHint = 'search';
  input.maxLength = 60;
  var goBtn = el('button', 'rs-btn rs-btn--go', 'BUSCAR');
  goBtn.type = 'submit';
  form.appendChild(input);
  form.appendChild(goBtn);
  var msg = el('p', 'rs-msg');
  msg.setAttribute('aria-live', 'polite');
  var results = el('ul', 'rs-list');
  var footSearch = el('p', 'rs-foot', 'Busca en radio-browser.info, un catálogo libre de emisoras. Solo salen las que emiten por HTTPS y funcionaban en su última comprobación. Las añadidas no muestran el título de la canción.');
  viewSearch.appendChild(form);
  viewSearch.appendChild(msg);
  viewSearch.appendChild(results);
  viewSearch.appendChild(footSearch);
  panel.appendChild(viewSearch);

  // Vista "Mis añadidas"
  var viewMine = el('div', 'rs-view');
  viewMine.hidden = true;
  var mineMsg = el('p', 'rs-msg');
  mineMsg.setAttribute('aria-live', 'polite');
  var mineList = el('ul', 'rs-list');
  var io = el('div', 'rs-io');
  var exportBtn = btn('rs-btn', '⬇ EXPORTAR');
  var importBtn = btn('rs-btn', '⬆ IMPORTAR');
  var fileInput = el('input');
  fileInput.type = 'file';
  fileInput.accept = '.json,application/json';
  fileInput.hidden = true;
  io.appendChild(exportBtn);
  io.appendChild(importBtn);
  io.appendChild(fileInput);
  var footMine = el('p', 'rs-foot', 'Se guardan solo en este navegador. Para pasarlas a otro móvil u ordenador, exporta el archivo y luego impórtalo allí: se suman a las que ya haya, no se borra ninguna.');
  viewMine.appendChild(mineMsg);
  viewMine.appendChild(mineList);
  viewMine.appendChild(io);
  viewMine.appendChild(footMine);
  panel.appendChild(viewMine);

  document.body.appendChild(backdrop);

  /* --- Abrir y cerrar --- */

  function open() {
    lastFocus = document.activeElement;
    backdrop.hidden = false;
    document.body.classList.add('rs-open');
    toggle.setAttribute('aria-expanded', 'true');
    A.catalog().then(function (c) { catalog = c; });
    updateMineCount();
    showTab(tabSearch.classList.contains('is-active') ? 'search' : 'mine');
    setTimeout(function () {
      if (!viewSearch.hidden) { input.focus(); } else { closeBtn.focus(); }
    }, 30);
  }

  function close() {
    stopPreview();
    backdrop.hidden = true;
    document.body.classList.remove('rs-open');
    toggle.setAttribute('aria-expanded', 'false');
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }

  toggle.addEventListener('click', function () {
    if (backdrop.hidden) { open(); } else { close(); }
  });
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', function (e) {
    if (e.target === backdrop) { close(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !backdrop.hidden) {
      e.stopPropagation();
      close();
    }
  });

  function showTab(which) {
    var mine = which === 'mine';
    tabSearch.classList.toggle('is-active', !mine);
    tabMine.classList.toggle('is-active', mine);
    tabSearch.setAttribute('aria-selected', mine ? 'false' : 'true');
    tabMine.setAttribute('aria-selected', mine ? 'true' : 'false');
    viewSearch.hidden = mine;
    viewMine.hidden = !mine;
    if (mine) {
      stopPreview();
      renderMine();
    }
  }

  tabSearch.addEventListener('click', function () { showTab('search'); input.focus(); });
  tabMine.addEventListener('click', function () { showTab('mine'); });

  function updateMineCount() {
    var n = A.list().length;
    tabMine.textContent = '★ MIS AÑADIDAS' + (n ? ' (' + n + ')' : '');
  }

  /* --- Escuchar antes de añadir --- */

  function stopPreview() {
    if (preview.audio) {
      preview.audio.pause();
      preview.audio.removeAttribute('src');
      try { preview.audio.load(); } catch (e) { /* noop */ }
    }
    if (preview.btn) {
      preview.btn.textContent = '▶';
      preview.btn.classList.remove('is-on');
      preview.btn.setAttribute('aria-label', preview.btn.dataset.label);
    }
    preview.url = null;
    preview.btn = null;
  }

  function togglePreview(url, button) {
    if (preview.url === url) {
      stopPreview();
      return;
    }
    stopPreview();
    // Si la radio de la web está sonando, se pausa para no oír las dos a la vez.
    var status = B.getStatus();
    if (B.getCurrentIndex() >= 0 && !B.isUserPaused() && status !== 'idle' && status !== 'paused') {
      B.toggle();
    }
    if (!preview.audio) {
      preview.audio = new Audio();
      preview.audio.preload = 'none';
      preview.audio.addEventListener('error', function () {
        if (preview.url) {
          var b = preview.btn;
          stopPreview();
          if (b) { b.textContent = '✕'; b.classList.add('is-error'); }
          msg.textContent = 'Esa emisora no suena ahora mismo desde aquí.';
        }
      });
    }
    preview.url = url;
    preview.btn = button;
    button.textContent = '■';
    button.classList.add('is-on');
    button.classList.remove('is-error');
    button.setAttribute('aria-label', 'Parar la prueba');
    preview.audio.src = url;
    var p = preview.audio.play();
    if (p && p.catch) { p.catch(function () { /* lo recoge el evento error */ }); }
  }

  /* --- Resultados --- */

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value.replace(/\s+/g, ' ').trim();
    if (q.length < 2) {
      msg.textContent = 'Escribe al menos dos letras.';
      return;
    }
    stopPreview();
    var seq = ++searchSeq;
    results.textContent = '';
    msg.textContent = 'Buscando «' + q + '»…';
    goBtn.disabled = true;
    Promise.all([search(q), A.catalog().catch(function () { return null; })]).then(function (r) {
      if (seq !== searchSeq) { return; }
      catalog = r[1];
      var list = r[0];
      msg.textContent = list.length
        ? list.length + (list.length === 1 ? ' emisora' : ' emisoras') + ' para «' + q + '», de más a menos votadas.'
        : 'Nada para «' + q + '». Prueba con otra palabra o en inglés (rain, piano, rock…).';
      list.forEach(function (s) { results.appendChild(resultItem(s)); });
    }, function () {
      if (seq !== searchSeq) { return; }
      msg.textContent = 'No se ha podido conectar con el catálogo de emisoras. Revisa la conexión y vuelve a probar.';
    }).then(function () {
      if (seq === searchSeq) { goBtn.disabled = false; }
    });
  });

  function metaLine(s) {
    var parts = [];
    if (s.countrycode) { parts.push(s.countrycode); }
    if (s.codec && s.codec !== 'UNKNOWN') { parts.push(s.codec); }
    if (s.bitrate) { parts.push(s.bitrate + ' kbps'); }
    if (s.votes) { parts.push(s.votes + ' votos'); }
    return parts.join(' · ');
  }

  function addedModesFor(url) {
    var key = A.streamKey(url);
    return A.list().filter(function (e) { return A.streamKey(e.stream) === key; }).map(function (e) { return e.modo; });
  }

  function resultItem(s) {
    var name = cleanName(s.name);
    var url = s.url_resolved;
    var li = el('li', 'rs-item');
    var row = el('div', 'rs-row');
    row.appendChild(logoBox(name));

    var info = el('div', 'rs-info');
    info.appendChild(el('div', 'rs-name', name));
    info.appendChild(el('div', 'rs-meta', metaLine(s)));
    var tags = String(s.tags || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean).slice(0, 5);
    if (tags.length) { info.appendChild(el('div', 'rs-tags', tags.join(' · '))); }
    var badge = el('div', 'rs-badge');
    info.appendChild(badge);
    row.appendChild(info);

    var actions = el('div', 'rs-actions');
    var play = btn('rs-btn rs-btn--icon', '▶');
    play.dataset.label = 'Escuchar ' + name + ' sin añadirla';
    play.setAttribute('aria-label', play.dataset.label);
    play.title = 'Escuchar sin añadir';
    if (s.hls) {
      play.disabled = true;
      play.title = 'Esta emisora no se puede probar aquí; añadida sí suena.';
    }
    play.addEventListener('click', function () { togglePreview(url, play); });
    var add = btn('rs-btn rs-btn--add', '＋ AÑADIR');
    add.setAttribute('aria-expanded', 'false');
    actions.appendChild(play);
    actions.appendChild(add);
    row.appendChild(actions);
    li.appendChild(row);

    var webMode = catalog && catalog.streams[A.streamKey(url)];
    function paintBadge() {
      var mine = addedModesFor(url).map(function (m) { return MODE_NAMES[m]; });
      var text = [];
      if (webMode) { text.push('Ya está en la web (' + MODE_NAMES[webMode] + ')'); }
      if (mine.length) { text.push('Añadida en ' + mine.join(', ')); }
      badge.textContent = text.join(' · ');
      badge.hidden = !text.length;
    }
    paintBadge();

    var formBox = null;
    add.addEventListener('click', function () {
      if (formBox) {
        formBox.remove();
        formBox = null;
        add.setAttribute('aria-expanded', 'false');
        return;
      }
      // Solo un formulario abierto a la vez
      Array.prototype.forEach.call(results.querySelectorAll('.rs-addform'), function (f) {
        if (f.__close) { f.__close(); }
      });
      formBox = addForm(s, name, function (saved) {
        paintBadge();
        updateMineCount();
        if (saved) { add.textContent = '＋ OTRO MODO'; }
      });
      formBox.__close = function () {
        formBox.remove();
        formBox = null;
        add.setAttribute('aria-expanded', 'false');
      };
      li.appendChild(formBox);
      add.setAttribute('aria-expanded', 'true');
      formBox.querySelector('input').focus();
    });
    return li;
  }

  /* --- Formulario de añadir: nombre y modo --- */

  function addForm(s, name, onDone) {
    var box = el('form', 'rs-addform');
    var nameLabel = el('label', 'rs-label', 'NOMBRE');
    var nameInput = el('input', 'rs-input rs-input--small');
    nameInput.type = 'text';
    nameInput.value = name;
    nameInput.maxLength = A.nameMax;
    nameInput.required = true;
    nameLabel.appendChild(nameInput);
    box.appendChild(nameLabel);

    var modeTitle = el('div', 'rs-label', 'MODO');
    box.appendChild(modeTitle);
    var modes = el('div', 'rs-modes');
    modes.setAttribute('role', 'radiogroup');
    modes.setAttribute('aria-label', 'Modo donde añadirla');
    var current = B.getMode();
    var chosen = A.modes().indexOf(current) !== -1 ? current : 'normal';
    var groupName = 'rs-mode-' + Math.random().toString(36).slice(2, 8);
    var hint = el('p', 'rs-hint');

    function paintHint() {
      hint.textContent = chosen === 'normal'
        ? 'Irá al final de la lista del modo normal.'
        : 'Irá a la temática ★ Para ti de ' + MODE_NAMES[chosen] + '.';
    }

    A.modes().forEach(function (m) {
      var lab = el('label', 'rs-mode' + (m === chosen ? ' is-active' : ''));
      var radio = el('input');
      radio.type = 'radio';
      radio.name = groupName;
      radio.value = m;
      radio.checked = m === chosen;
      radio.addEventListener('change', function () {
        chosen = m;
        Array.prototype.forEach.call(modes.children, function (c) {
          c.classList.toggle('is-active', c.querySelector('input').value === m);
        });
        paintHint();
      });
      lab.appendChild(radio);
      lab.appendChild(el('span', null, MODE_LABELS[m]));
      modes.appendChild(lab);
    });
    box.appendChild(modes);
    paintHint();
    box.appendChild(hint);
    box.appendChild(el('p', 'rs-hint rs-hint--dim', 'Big Calm no admite emisoras añadidas: solo lleva las que tienen la afinación medida.'));

    var status = el('p', 'rs-msg');
    status.setAttribute('aria-live', 'polite');
    box.appendChild(status);

    var buttons = el('div', 'rs-formbtns');
    var cancel = btn('rs-btn', 'CANCELAR');
    var save = el('button', 'rs-btn rs-btn--save', '★ GUARDAR');
    save.type = 'submit';
    buttons.appendChild(cancel);
    buttons.appendChild(save);
    box.appendChild(buttons);

    cancel.addEventListener('click', function () { if (box.__close) { box.__close(); } });

    box.addEventListener('submit', function (e) {
      e.preventDefault();
      var nombre = cleanName(nameInput.value);
      if (!nombre) {
        status.textContent = 'Ponle un nombre.';
        nameInput.focus();
        return;
      }
      save.disabled = true;
      A.add({
        id: s.stationuuid,
        nombre: nombre,
        stream: s.url_resolved,
        web: s.homepage,
        pais: s.countrycode,
        codec: s.codec,
        bitrate: s.bitrate,
        hls: s.hls === 1,
        modo: chosen
      }).then(function (res) {
        save.disabled = false;
        if (!res.ok) {
          status.textContent = res.error;
          return;
        }
        var entry = res.entry;
        // Ya guardada: el nombre y el modo dejan de poder tocarse
        Array.prototype.forEach.call(box.querySelectorAll('input'), function (inp) { inp.disabled = true; });
        buttons.textContent = '';
        status.textContent = '✓ Añadida en ' + MODE_NAMES[entry.modo] + (entry.categoria ? ' · ★ Para ti' : '') + '.';
        var see = btn('rs-btn rs-btn--save', 'VER EN LA LISTA →');
        see.addEventListener('click', function () {
          close();
          A.goTo(entry.modo, entry.nombre, entry.categoria);
        });
        var done = btn('rs-btn', 'SEGUIR BUSCANDO');
        done.addEventListener('click', function () { if (box.__close) { box.__close(); } });
        buttons.appendChild(done);
        buttons.appendChild(see);
        onDone(true);
      }, function () {
        save.disabled = false;
        status.textContent = 'No se ha podido guardar.';
      });
    });
    return box;
  }

  /* --- Mis añadidas --- */

  function renderMine() {
    mineList.textContent = '';
    var list = A.list();
    updateMineCount();
    exportBtn.disabled = !list.length;
    if (!list.length) {
      mineMsg.textContent = 'Todavía no has añadido ninguna. Búscalas en la pestaña BUSCAR.';
      return;
    }
    mineMsg.textContent = list.length === 1 ? '1 emisora añadida.' : list.length + ' emisoras añadidas.';
    list.forEach(function (e) {
      var li = el('li', 'rs-item');
      var row = el('div', 'rs-row');
      row.appendChild(logoBox(e.nombre));
      var info = el('div', 'rs-info');
      info.appendChild(el('div', 'rs-name', e.nombre));
      info.appendChild(el('div', 'rs-meta', MODE_LABELS[e.modo] + (e.categoria ? ' · ★ Para ti' : '')));
      row.appendChild(info);
      var actions = el('div', 'rs-actions');
      var go = btn('rs-btn', 'IR', 'Ir a ' + e.nombre + ' en ' + MODE_NAMES[e.modo]);
      go.addEventListener('click', function () {
        close();
        A.goTo(e.modo, e.nombre, e.categoria);
      });
      var del = btn('rs-btn rs-btn--del', '✕ QUITAR', 'Quitar ' + e.nombre);
      var armed = null;
      // Doble toque para quitar: el primero pide confirmación
      del.addEventListener('click', function () {
        if (!armed) {
          del.textContent = '¿SEGURO?';
          del.classList.add('is-armed');
          armed = setTimeout(function () {
            armed = null;
            del.textContent = '✕ QUITAR';
            del.classList.remove('is-armed');
          }, 3000);
          return;
        }
        clearTimeout(armed);
        A.remove(e.stream, e.modo);
        renderMine();
        mineMsg.textContent = '«' + e.nombre + '» quitada. ' + mineMsg.textContent;
      });
      actions.appendChild(go);
      actions.appendChild(del);
      row.appendChild(actions);
      li.appendChild(row);
      mineList.appendChild(li);
    });
  }

  exportBtn.addEventListener('click', function () {
    var blob = new Blob([A.exportJson()], { type: 'application/json' });
    var a = document.createElement('a');
    var d = new Date();
    var stamp = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    a.href = URL.createObjectURL(blob);
    a.download = 'radio-sin-cortes-anadidas-' + stamp + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    mineMsg.textContent = 'Archivo exportado. Ábrelo con IMPORTAR en el otro dispositivo.';
  });

  importBtn.addEventListener('click', function () {
    fileInput.value = '';
    fileInput.click();
  });

  fileInput.addEventListener('change', function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) { return; }
    if (file.size > 512 * 1024) {
      mineMsg.textContent = 'Ese archivo es demasiado grande para ser una lista de emisoras.';
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      A.importJson(String(reader.result || '')).then(function (res) {
        renderMine();
        if (!res.ok) {
          mineMsg.textContent = res.error;
          return;
        }
        var parts = [res.added === 1 ? '1 emisora importada' : res.added + ' emisoras importadas'];
        if (res.skipped) { parts.push(res.skipped + ' ya estaban'); }
        if (res.invalid) { parts.push(res.invalid + ' no válidas'); }
        mineMsg.textContent = parts.join(', ') + '.';
      });
    };
    reader.onerror = function () { mineMsg.textContent = 'No se ha podido leer el archivo.'; };
    reader.readAsText(file);
  });

  window.__searchReady = true;
})();
