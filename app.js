(function () {
  'use strict';

  var HLS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.15/hls.min.js';
  var RETRY_INTERVAL_MS = 3500;
  var WATCHDOG_INTERVAL_MS = 5000;
  var STORAGE_KEY = 'radioMicroState';
  var LEGACY_ORDER_KEY = 'radioMicroOrder';
  var LEGACY_TOP3_KEY = 'radioMicroTop3';
  var VOLUME_STORAGE_KEY = 'radioMicroVolume';
  var DEFAULT_ORDER = ['Los 40 Classic', 'Cadena 100'];
  var RECONNECT_ATTEMPTS_BEFORE_FALLBACK = 5;
  var BUZZER_VIDEO_ID = 'ZAOVHbXdDoU';
  var BUZZER_NAME = '📡 4625 kHz';

  /* --- Modo dormir --- */
  var SLEEP_STORAGE_KEY = 'radioMicroSleepState';
  var SLEEP_TIMER_KEY = 'radioMicroSleepTimerEnd';
  var SLEEP_TIMER_MIN_KEY = 'radioMicroSleepTimerMinutes';
  var SLEEP_LAST_KEY = 'radioMicroSleepLast';
  var SLEEP_DIM_DELAY_MS = 20000;

  var SLEEP_CATEGORY_ORDER = ['lluvia', 'mar', 'bosque', 'naturaleza', 'ruido', 'ambient', 'dormir', 'meditacion', 'piano', 'chillout', 'lofi'];
  var SLEEP_CATEGORY_META = {
    lluvia: { icon: '🌧', label: 'Lluvia' },
    mar: { icon: '🌊', label: 'Mar' },
    bosque: { icon: '🌲', label: 'Bosque' },
    naturaleza: { icon: '🌿', label: 'Naturaleza' },
    ruido: { icon: '🔊', label: 'Ruido' },
    ambient: { icon: '🌌', label: 'Ambient' },
    dormir: { icon: '😴', label: 'Dormir' },
    meditacion: { icon: '🧘', label: 'Meditación' },
    piano: { icon: '🎹', label: 'Piano' },
    chillout: { icon: '🍸', label: 'Chillout' },
    lofi: { icon: '🎧', label: 'Lo-fi' }
  };

  var MUSIC_CATEGORY_ORDER = ['blues', 'crooners', 'rock70', 'rocknroll', 'ochentas', 'rockespanol', 'soundtracks', 'metal', 'melodico', 'folkmetal', 'newage', 'indie', 'cielos', 'clasica'];
  var MUSIC_CATEGORY_META = {
    blues: { icon: '🎷', label: 'Blues' },
    crooners: { icon: '🎩', label: 'Crooners' },
    rock70: { icon: '🎸', label: 'Rock años 70' },
    rocknroll: { icon: '🕺', label: "Rock'n'roll clásico" },
    ochentas: { icon: '📼', label: 'Años 80' },
    rockespanol: { icon: '🎤', label: 'Rock en español' },
    soundtracks: { icon: '🎬', label: 'Soundtracks' },
    metal: { icon: '🤘', label: 'Metal' },
    melodico: { icon: '⚔️', label: 'Metal melódico' },
    folkmetal: { icon: '🍺', label: 'Folk metal' },
    newage: { icon: '🌿', label: 'New age' },
    indie: { icon: '🌌', label: 'Indie y alternativo' },
    cielos: { icon: '🌠', label: 'Sky y The Expanse' },
    clasica: { icon: '🎻', label: 'Clásica' }
  };

  var BUGGY_CATEGORY_ORDER = ['scifi', 'oldies', 'fallout', 'gta', 'games', 'buggy'];
  var BUGGY_CATEGORY_META = {
    scifi: { icon: '🛸', label: 'Sci-fi' },
    oldies: { icon: '📻', label: 'Oldies' },
    fallout: { icon: '☢️', label: 'Fallout' },
    gta: { icon: '🚗', label: 'GTA' },
    games: { icon: '🎮', label: 'Games' },
    buggy: { icon: '🐞', label: 'Buggy' }
  };

  /* Modos con filtro por temática */
  var MODE_CATEGORIES = {
    sleep: { order: SLEEP_CATEGORY_ORDER, meta: SLEEP_CATEGORY_META },
    music: { order: MUSIC_CATEGORY_ORDER, meta: MUSIC_CATEGORY_META },
    buggy: { order: BUGGY_CATEGORY_ORDER, meta: BUGGY_CATEGORY_META }
  };

  /* --- Modos de escucha --- */
  var EXTRA_MODES_FILE = 'emisoras-modos.json';
  var MODE_STORAGE_KEYS = {
    normal: STORAGE_KEY,
    sleep: SLEEP_STORAGE_KEY,
    calm: 'radioMicroCalmState',
    music: 'radioMicroMusicState',
    buggy: 'radioMicroBuggyState'
  };
  var MODE_UI = {
    normal: {
      titleMain: 'RADIOS DE ESPAÑA',
      titleSub: 'SIN MICROCORTES',
      tagline: 'Elige tu emisora y suena, aunque falle la conexión.',
      top3: '🏆 TOP 3',
      themeColor: '#1a0b2e'
    },
    sleep: {
      titleMain: 'SONIDOS',
      titleSub: 'PARA DORMIR',
      tagline: 'Cierra los ojos y déjate llevar.',
      top3: '🌙 TOP 3 PARA DORMIR',
      themeColor: '#0b1026'
    },
    calm: {
      titleMain: 'BIG CALM',
      titleSub: 'AFINADA A 432 HZ',
      tagline: 'Solo emisoras con la afinación comprobada.',
      top3: '🧘 TOP 3 BIG CALM',
      themeColor: '#0a2326',
      empty: 'Todavía no hay emisoras en Big Calm.'
    },
    music: {
      titleMain: 'MUSIC TIME',
      titleSub: 'BLUES, ROCK Y METAL',
      tagline: 'Sube el volumen.',
      top3: '🎸 TOP 3 MUSIC TIME',
      themeColor: '#1a0d08',
      empty: 'Todavía no hay emisoras en Music Time.'
    },
    buggy: {
      titleMain: 'BUGGY TIME',
      titleSub: 'SIN PARCHES',
      tagline: 'Tus emisoras más raras, todas juntas.',
      top3: '🐞 TOP 3 BUGGY',
      themeColor: '#0e120a',
      empty: 'Todavía no hay emisoras en Buggy Time.'
    }
  };

  var appMode = 'normal';
  var renderedMode = null;
  var sleepMode = false;
  var normalStationsCache = null;
  var sleepStationsCache = null;
  var extraModesCache = null;
  var rankByName = null;
  var activeCategoryFilter = 'all';
  var wakeLockSentinel = null;
  var dimTimeout = null;
  var timerEndAt = 0;
  var timerInterval = null;
  var volumeFadeInterval = null;
  var volumeFadeInInterval = null;

  var STATUS = {
    IDLE: 'idle',
    TUNING: 'tuning',
    LIVE: 'live',
    RECONNECTING: 'reconnecting',
    PAUSED: 'paused',
    UNAVAILABLE: 'unavailable',
    BLOCKED: 'blocked'
  };

  var STATUS_LABEL = {
    tuning: '▶︎ SINTONIZANDO…',
    live: '🔴 EN DIRECTO',
    reconnecting: '🔁 RECONECTANDO…',
    paused: '⏸︎ EN PAUSA',
    unavailable: '⚠ NO DISPONIBLE AQUÍ',
    blocked: '👆 TOCA PARA REANUDAR'
  };

  var audio = document.getElementById('audio-player');
  var grid = document.getElementById('stations-grid');
  var gridWrap = document.getElementById('stations-grid-wrap');
  var toggleGridBtn = document.getElementById('toggle-grid-btn');
  var podiumSlots = Array.prototype.slice.call(document.querySelectorAll('.podium-drop'));
  var gridExpanded = false;

  var miniPlayer = document.getElementById('mini-player');
  var miniPlayerName = document.getElementById('mini-player-name');
  var miniPlayerLogo = document.getElementById('mini-player-logo');
  var miniPlayerStatus = document.getElementById('mini-player-status');
  var miniPlayerToggle = document.getElementById('mini-player-toggle');
  var miniPlayerVolume = document.getElementById('mini-player-volume');
  var tracksBtn = document.getElementById('mini-player-tracks-btn');
  var tracksPanel = document.getElementById('tracks-panel');
  var tracksPanelBody = document.getElementById('tracks-panel-body');
  var tracksPanelTitle = document.getElementById('tracks-panel-title');
  var tracksPanelClose = document.getElementById('tracks-panel-close');

  var easterEggTrigger = document.getElementById('easter-egg-trigger');
  var easterEggVideoWrap = document.getElementById('easter-egg-video-wrap');

  var modeSelect = document.getElementById('mode-select');
  var top3Section = document.querySelector('.top3-section');
  var titleMainEl = document.querySelector('.title-main');
  var titleSubEl = document.querySelector('.title-sub');
  var taglineEl = document.querySelector('.tagline');
  var top3TitleEl = document.querySelector('.top3-title');
  var themeColorMeta = document.getElementById('theme-color-meta');
  var sleepChipsWrap = document.getElementById('sleep-chips');
  var sleepContinueBtn = document.getElementById('sleep-continue-btn');
  var sleepTimerWrap = document.getElementById('sleep-timer');
  var sleepTimerBtn = document.getElementById('sleep-timer-btn');
  var sleepTimerMenu = document.getElementById('sleep-timer-menu');
  var sleepTimerCountdown = document.getElementById('sleep-timer-countdown');
  var sleepFallbackToast = document.getElementById('sleep-fallback-toast');
  var sleepDimOverlay = document.getElementById('sleep-dim-overlay');
  var sleepDimName = document.getElementById('sleep-dim-name');

  var stations = [];
  var cards = [];
  var currentIndex = -1;
  var currentStatus = STATUS.IDLE;
  var userPaused = false;

  var playerMode = 'radio';
  var buzzerPlayer = null;
  var buzzerPaused = false;
  var youTubeApiPromise = null;

  var hls = null;
  var hlsLoadPromise = null;

  var retryTimer = null;
  var watchdogTimer = null;
  var lastCurrentTime = 0;
  var reconnecting = false;
  var reconnectAttemptCount = 0;

  function isUnavailable(station) {
    return !station.streamUrl || station.reliable === false;
  }

  function loadHlsJs() {
    if (window.Hls) {
      return Promise.resolve();
    }
    if (hlsLoadPromise) {
      return hlsLoadPromise;
    }
    hlsLoadPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = HLS_CDN;
      script.onload = function () { resolve(); };
      script.onerror = function () { reject(new Error('No se pudo cargar hls.js')); };
      document.head.appendChild(script);
    });
    return hlsLoadPromise;
  }

  function destroyHls() {
    if (hls) {
      try { hls.destroy(); } catch (e) { /* noop */ }
      hls = null;
    }
  }

  function clearTimers() {
    if (retryTimer) {
      clearInterval(retryTimer);
      retryTimer = null;
    }
    if (watchdogTimer) {
      clearInterval(watchdogTimer);
      watchdogTimer = null;
    }
  }

  function setStatus(status) {
    currentStatus = status;
    renderStatuses();
    updateMiniPlayer();
  }

  function updateMiniPlayer() {
    syncNowPlaying();
    updateMiniPlayerLogo();
    if (sleepTimerWrap) {
      // Con la zumbadora (vídeo de YouTube) el temporizador no tiene efecto.
      sleepTimerWrap.hidden = playerMode === 'buzzer';
    }
    if (playerMode === 'buzzer') {
      document.body.classList.add('has-mini-player');
      miniPlayer.hidden = false;
      miniPlayerName.textContent = BUZZER_NAME;
      miniPlayerName.removeAttribute('lang');
      miniPlayerStatus.textContent = buzzerPaused ? STATUS_LABEL.paused : STATUS_LABEL.live;
      setToggleIcon(buzzerPaused);
      return;
    }

    var station = stations[currentIndex];
    document.body.classList.toggle('has-mini-player', !!station);

    if (!station) {
      miniPlayer.hidden = true;
      return;
    }

    miniPlayer.hidden = false;
    miniPlayerName.textContent = station.afinacion ? station.name + ' · ' + station.afinacion : station.name;
    if (station.lang) {
      miniPlayerName.lang = station.lang;
    } else {
      miniPlayerName.removeAttribute('lang');
    }
    miniPlayerStatus.textContent = STATUS_LABEL[currentStatus] || station.freq;

    var showResumeIcon = userPaused || currentStatus === STATUS.BLOCKED;
    setToggleIcon(showResumeIcon);
    updateMediaSessionState();

    var nowTrack = currentStatus === STATUS.LIVE ? getCurrentTrack() : null;
    if (nowTrack) {
      miniPlayerStatus.textContent = '♪︎ ' + formatTrack(nowTrack);
      miniPlayerStatus.title = formatTrack(nowTrack);
    } else {
      miniPlayerStatus.removeAttribute('title');
    }
  }

  // Iconos en SVG y no con los caracteres ▶ / ⏸: en el móvil esos caracteres
  // se pintan como emoji (cuadrado de color de Android/iOS) y en el ordenador
  // como un símbolo de texto, así que el botón se veía distinto en cada sitio.
  var ICON_PLAY = '<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false"><rect fill="currentColor" x="6" y="5" width="4.2" height="14" rx="1.2"/><rect fill="currentColor" x="13.8" y="5" width="4.2" height="14" rx="1.2"/></svg>';
  var toggleIconShown = null;

  function setToggleIcon(showResume) {
    var key = showResume ? 'play' : 'pause';
    if (toggleIconShown !== key) {
      miniPlayerToggle.innerHTML = showResume ? ICON_PLAY : ICON_PAUSE;
      toggleIconShown = key;
    }
    miniPlayerToggle.setAttribute('aria-label', showResume ? 'Reanudar' : 'Pausar');
  }

  function renderStatuses() {
    cards.forEach(function (card, i) {
      var station = stations[i];
      card.classList.remove('is-playing', 'is-reconnecting');
      if (isUnavailable(station)) {
        return;
      }
      var statusEl = card.querySelector('.station-status');
      var isCurrent = i === currentIndex;
      var status = isCurrent ? currentStatus : STATUS.IDLE;

      statusEl.className = 'station-status status-' + status;

      if (status === STATUS.LIVE) {
        statusEl.innerHTML = '<span class="eq"><span></span><span></span><span></span></span>' + STATUS_LABEL.live;
        card.classList.add('is-playing');
      } else if (status === STATUS.RECONNECTING) {
        statusEl.textContent = STATUS_LABEL.reconnecting;
        card.classList.add('is-reconnecting');
      } else if (status === STATUS.TUNING) {
        statusEl.textContent = STATUS_LABEL.tuning;
        card.classList.add('is-reconnecting');
      } else if (status === STATUS.BLOCKED) {
        statusEl.textContent = STATUS_LABEL.blocked;
        card.classList.add('is-reconnecting');
      } else if (status === STATUS.PAUSED) {
        statusEl.textContent = STATUS_LABEL.paused;
      } else {
        statusEl.textContent = station.freq;
      }
    });
  }

  function stopPlayback() {
    clearTimers();
    destroyHls();
    audio.pause();
    audio.removeAttribute('src');
    try { audio.load(); } catch (e) { /* noop */ }
    reconnecting = false;
    releaseWakeLock();
    clearScreenDim();
  }

  function playStation(index, isAutoFallback) {
    var station = stations[index];
    if (!station || isUnavailable(station)) {
      return;
    }

    if (playerMode === 'buzzer') {
      deactivateBuzzer();
    }

    if (currentIndex === index && !userPaused && currentStatus !== STATUS.IDLE) {
      if (currentStatus === STATUS.BLOCKED) {
        // El navegador bloqueó el intento automático anterior; este toque sí
        // es una interacción real y debería desbloquear la reproducción.
        setStatus(STATUS.TUNING);
        reconnectNow();
        return;
      }
      // Ya es la emisora activa: pulsar de nuevo la pausa/reanuda.
      togglePauseResume();
      return;
    }

    stopPlayback();
    currentIndex = index;
    userPaused = false;
    if (!isAutoFallback) {
      // Elección manual del usuario: se reinicia el contador de reintentos
      // fallidos que dispara el salto automático a otra emisora del TOP3.
      reconnectAttemptCount = 0;
    }
    setStatus(STATUS.TUNING);

    updateMediaSession(station);
    if (sleepMode) {
      saveLastSleepStation(station.name);
      fadeInVolume();
    }

    startStream(station);
    startWatchdog();
  }

  /* --- Salto automático a otra emisora del TOP3 tras varios reintentos fallidos --- */

  function getTop3IndexesByRank() {
    return podiumSlots
      .map(function (slot) {
        var occupant = slot.querySelector('.station-card');
        return {
          rank: parseInt(slot.dataset.rank, 10) || 99,
          name: occupant ? occupant.dataset.name : null
        };
      })
      .filter(function (entry) { return entry.name; })
      .sort(function (a, b) { return a.rank - b.rank; })
      .map(function (entry) {
        for (var i = 0; i < stations.length; i++) {
          if (stations[i].name === entry.name) {
            return i;
          }
        }
        return -1;
      })
      .filter(function (index) { return index !== -1 && !isUnavailable(stations[index]); });
  }

  function switchToNextFavorite() {
    var favorites = getTop3IndexesByRank();
    if (favorites.length < 1) {
      return false;
    }

    var currentPos = favorites.indexOf(currentIndex);
    var nextIndex = favorites[(currentPos + 1) % favorites.length];
    if (nextIndex === currentIndex) {
      // La única emisora fiable del TOP3 es la que ya está sonando (o fallando):
      // no hay a dónde rotar.
      return false;
    }

    playStation(nextIndex, true);
    return true;
  }

  function startStream(station, isReconnect) {
    if (station.streamType === 'hls') {
      startHlsStream(station, isReconnect);
    } else {
      startNativeStream(station, isReconnect);
    }
  }

  function bustCache(url) {
    var sep = url.indexOf('?') === -1 ? '?' : '&';
    return url + sep + 't=' + Date.now();
  }

  function startNativeStream(station) {
    audio.src = bustCache(station.streamUrl);
    audio.load();
    attemptPlay();
  }

  function startHlsStream(station) {
    var nativeHls = audio.canPlayType('application/vnd.apple.mpegurl');
    if (nativeHls) {
      audio.src = bustCache(station.streamUrl);
      audio.load();
      attemptPlay();
      return;
    }

    loadHlsJs().then(function () {
      if (!window.Hls || !window.Hls.isSupported()) {
        setStatus(STATUS.UNAVAILABLE);
        return;
      }
      destroyHls();
      hls = new window.Hls();
      hls.on(window.Hls.Events.ERROR, function (event, data) {
        if (data && data.fatal) {
          scheduleReconnect();
        }
      });
      hls.loadSource(bustCache(station.streamUrl));
      hls.attachMedia(audio);
      attemptPlay();
    }).catch(function () {
      setStatus(STATUS.UNAVAILABLE);
    });
  }

  function attemptPlay() {
    var playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function (err) {
        // El navegador puede bloquear la reproducción automática tras varios
        // intentos fallidos sin una interacción reciente del usuario (política
        // de autoplay). Si eso pasa, reintentar cada 3,5 s en bucle nunca
        // funcionaría: hay que pedir un toque real, que sí cuenta como
        // interacción y desbloquea el audio.
        if (err && err.name === 'NotAllowedError' && currentIndex !== -1 && !userPaused) {
          if (retryTimer) {
            clearInterval(retryTimer);
            retryTimer = null;
          }
          setStatus(STATUS.BLOCKED);
        }
      });
    }
  }

  function togglePauseResume() {
    if (userPaused) {
      userPaused = false;
      setStatus(STATUS.TUNING);
      reconnectNow();
    } else {
      userPaused = true;
      clearTimers();
      destroyHls();
      audio.pause();
      setStatus(STATUS.PAUSED);
      releaseWakeLock();
      clearScreenDim();
    }
  }

  /* --- Salto a otra emisora de la misma temática (modo dormir) --- */

  function getSameCategoryFallbackIndex(fromIndex) {
    var station = stations[fromIndex];
    if (!station || !station.category) {
      return -1;
    }
    var candidates = [];
    stations.forEach(function (s, i) {
      if (i !== fromIndex && s.category === station.category && !isUnavailable(s)) {
        candidates.push({ index: i, votos: s.votos || 0 });
      }
    });
    if (!candidates.length) {
      return -1;
    }
    candidates.sort(function (a, b) { return b.votos - a.votos; });
    return candidates[0].index;
  }

  function showSleepFallbackToast(message) {
    if (!sleepFallbackToast) {
      return;
    }
    sleepFallbackToast.textContent = message;
    sleepFallbackToast.hidden = false;
    clearTimeout(sleepFallbackToast._hideTimer);
    sleepFallbackToast._hideTimer = setTimeout(function () {
      sleepFallbackToast.hidden = true;
    }, 4000);
  }

  function scheduleReconnect() {
    if (userPaused || currentIndex === -1) {
      return;
    }
    setStatus(STATUS.RECONNECTING);
    if (!retryTimer) {
      retryTimer = setInterval(reconnectNow, RETRY_INTERVAL_MS);
    }
  }

  function reconnectNow() {
    if (userPaused || currentIndex === -1 || reconnecting) {
      return;
    }
    var station = stations[currentIndex];
    if (!station) {
      return;
    }

    reconnectAttemptCount++;
    if (reconnectAttemptCount > RECONNECT_ATTEMPTS_BEFORE_FALLBACK) {
      reconnectAttemptCount = 0;
      // Demasiados intentos fallidos seguidos con esta emisora. En modo
      // dormir se prueba primero con otra de la misma temática (más votada);
      // si no hay ninguna, o en modo normal, se prueba con la siguiente
      // fiable del TOP3. Si tampoco hay ninguna a la que rotar, se sigue
      // reintentando la misma como hasta ahora.
      if (sleepMode) {
        var altIndex = getSameCategoryFallbackIndex(currentIndex);
        if (altIndex !== -1) {
          showSleepFallbackToast('Cambiando a ' + stations[altIndex].name + '…');
          playStation(altIndex, true);
          return;
        }
      }
      if (switchToNextFavorite()) {
        return;
      }
    }

    reconnecting = true;
    destroyHls();
    startStream(station, true);
    reconnecting = false;
  }

  function startWatchdog() {
    lastCurrentTime = audio.currentTime;
    watchdogTimer = setInterval(function () {
      if (userPaused || currentIndex === -1) {
        return;
      }
      if (!audio.paused && audio.currentTime === lastCurrentTime) {
        scheduleReconnect();
      } else if (!audio.paused) {
        if (currentStatus !== STATUS.LIVE && retryTimer === null) {
          setStatus(STATUS.LIVE);
        }
      }
      lastCurrentTime = audio.currentTime;
    }, WATCHDOG_INTERVAL_MS);
  }

  audio.addEventListener('playing', function () {
    if (userPaused) {
      return;
    }
    if (retryTimer) {
      clearInterval(retryTimer);
      retryTimer = null;
    }
    reconnectAttemptCount = 0;
    setStatus(STATUS.LIVE);
    if (sleepMode) {
      requestWakeLock();
      scheduleScreenDim();
    }
  });

  audio.addEventListener('error', function () {
    if (userPaused || currentIndex === -1) {
      return;
    }
    scheduleReconnect();
  });

  audio.addEventListener('stalled', function () {
    if (userPaused || currentIndex === -1) {
      return;
    }
    scheduleReconnect();
  });

  audio.addEventListener('pause', function () {
    if (currentIndex === -1) {
      return;
    }
    if (!userPaused && currentStatus !== STATUS.RECONNECTING && currentStatus !== STATUS.TUNING) {
      scheduleReconnect();
    }
  });

  window.addEventListener('online', function () {
    if (!userPaused && currentIndex !== -1) {
      reconnectNow();
    }
  });

  window.addEventListener('offline', function () {
    if (!userPaused && currentIndex !== -1) {
      setStatus(STATUS.RECONNECTING);
    }
  });

  document.addEventListener('visibilitychange', function () {
    // El navegador puede ralentizar o pausar el temporizador de reintento
    // mientras la pestaña está en segundo plano o la pantalla bloqueada; al
    // volver, se fuerza un intento inmediato en vez de esperar al siguiente
    // disparo del intervalo (que podría tardar, o haberse perdido).
    if (document.visibilityState === 'visible' && !userPaused && currentIndex !== -1 &&
        currentStatus !== STATUS.LIVE && currentStatus !== STATUS.BLOCKED) {
      reconnectNow();
    }
    if (document.visibilityState === 'visible' && timerEndAt) {
      tickSleepTimer();
    }
    if (document.visibilityState === 'visible' && sleepMode) {
      if (currentStatus === STATUS.LIVE) {
        requestWakeLock();
      }
    }
  });

  /* --- Mini reproductor: play/pausa y volumen --- */

  function loadSavedVolume() {
    try {
      var raw = window.localStorage.getItem(VOLUME_STORAGE_KEY);
      var value = raw === null ? 1 : parseFloat(raw);
      return isNaN(value) ? 1 : Math.min(1, Math.max(0, value));
    } catch (e) {
      return 1;
    }
  }

  function saveVolume(value) {
    try {
      window.localStorage.setItem(VOLUME_STORAGE_KEY, String(value));
    } catch (e) { /* localStorage no disponible; el volumen simplemente no persiste */ }
  }

  audio.volume = loadSavedVolume();
  miniPlayerVolume.value = String(audio.volume);

  miniPlayerVolume.addEventListener('input', function () {
    var value = parseFloat(miniPlayerVolume.value);
    if (isNaN(value)) {
      return;
    }
    saveVolume(value);
    if (playerMode === 'buzzer') {
      if (buzzerPlayer && typeof buzzerPlayer.setVolume === 'function') {
        buzzerPlayer.setVolume(Math.round(value * 100));
      }
      return;
    }
    audio.volume = value;
  });

  miniPlayerToggle.addEventListener('click', function () {
    if (playerMode === 'buzzer') {
      toggleBuzzerPauseResume();
      return;
    }
    if (currentIndex === -1) {
      return;
    }
    if (currentStatus === STATUS.BLOCKED) {
      // Este clic sí es una interacción real y debería desbloquear el audio.
      setStatus(STATUS.TUNING);
      reconnectNow();
      return;
    }
    togglePauseResume();
  });

  /* --- Detalle discreto: retransmisión en directo de UVB-76 ("La Zumbadora") --- */

  function loadYouTubeApi() {
    if (window.YT && window.YT.Player) {
      return Promise.resolve();
    }
    if (youTubeApiPromise) {
      return youTubeApiPromise;
    }
    youTubeApiPromise = new Promise(function (resolve) {
      var previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof previousReady === 'function') {
          previousReady();
        }
        resolve();
      };
      var script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    });
    return youTubeApiPromise;
  }

  function activateBuzzer() {
    if (playerMode === 'buzzer') {
      return;
    }
    stopPlayback();
    currentIndex = -1;
    currentStatus = STATUS.IDLE;
    renderStatuses();

    playerMode = 'buzzer';
    buzzerPaused = false;
    easterEggVideoWrap.hidden = false;
    updateMiniPlayer();

    loadYouTubeApi().then(function () {
      if (playerMode !== 'buzzer') {
        return;
      }
      if (buzzerPlayer) {
        buzzerPlayer.playVideo();
        return;
      }
      buzzerPlayer = new window.YT.Player('easter-egg-video', {
        videoId: BUZZER_VIDEO_ID,
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          origin: window.location.origin
        },
        events: {
          onReady: function (e) {
            e.target.setVolume(Math.round(loadSavedVolume() * 100));
            if (playerMode === 'buzzer' && !buzzerPaused) {
              e.target.playVideo();
            }
          }
        }
      });
    });
  }

  function deactivateBuzzer() {
    if (playerMode !== 'buzzer') {
      return;
    }
    playerMode = 'radio';
    buzzerPaused = false;
    easterEggVideoWrap.hidden = true;
    if (buzzerPlayer && typeof buzzerPlayer.pauseVideo === 'function') {
      try { buzzerPlayer.pauseVideo(); } catch (e) { /* noop */ }
    }
    updateMiniPlayer();
  }

  function toggleBuzzerPauseResume() {
    if (!buzzerPlayer) {
      return;
    }
    if (buzzerPaused) {
      buzzerPaused = false;
      try { buzzerPlayer.playVideo(); } catch (e) { /* noop */ }
    } else {
      buzzerPaused = true;
      try { buzzerPlayer.pauseVideo(); } catch (e) { /* noop */ }
    }
    updateMiniPlayer();
  }

  easterEggTrigger.addEventListener('click', function () {
    if (playerMode === 'buzzer') {
      deactivateBuzzer();
    } else {
      activateBuzzer();
    }
  });

  /* --- Carátulas de las emisoras ---
   *
   * Los logos están en logos/<slug>.webp (los descarga scripts/fetch-logos.py)
   * y logos/index.json dice cuáles existen, para no pedir imágenes que no
   * hay. Sin logo se pintan las iniciales de la emisora.
   */

  var LOGO_INDEX_FILE = 'logos/index.json';
  var logoSet = null;

  function logoSlug(name) {
    // Debe dar el mismo resultado que slugify() en scripts/fetch-logos.py.
    return String(name)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function stationInitials(name) {
    var words = String(name)
      .replace(/\([^)]*\)/g, ' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[^A-Za-z0-9]+/)
      .filter(Boolean);
    if (!words.length) {
      return '♪';
    }
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }

  function fillStationLogo(el, station) {
    el.textContent = '';
    var slug = logoSlug(station.name);
    if (logoSet && logoSet[slug]) {
      el.classList.remove('is-initials');
      var img = document.createElement('img');
      img.src = 'logos/' + slug + '.webp';
      img.alt = '';
      img.width = 128;
      img.height = 128;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', function () {
        // Si el archivo falta, se vuelve a las iniciales.
        el.classList.add('is-initials');
        el.textContent = stationInitials(station.name);
      });
      el.appendChild(img);
    } else {
      el.classList.add('is-initials');
      el.textContent = stationInitials(station.name);
    }
  }

  function loadLogoIndex() {
    fetch(LOGO_INDEX_FILE)
      .then(function (res) { return res.ok ? res.json() : []; })
      .catch(function () { return []; })
      .then(function (list) {
        logoSet = {};
        (Array.isArray(list) ? list : []).forEach(function (slug) { logoSet[slug] = true; });
        // Las tarjetas que ya estaban pintadas cambian las iniciales por el logo.
        cards.forEach(function (card, i) {
          var el = card.querySelector('.station-logo');
          if (el && stations[i]) {
            fillStationLogo(el, stations[i]);
          }
        });
        updateMiniPlayerLogo();
      });
  }

  var miniPlayerLogoFor = null;

  function updateMiniPlayerLogo() {
    var station = playerMode === 'radio' ? stations[currentIndex] : null;
    if (!station) {
      miniPlayerLogo.hidden = true;
      miniPlayerLogoFor = null;
      return;
    }
    miniPlayerLogo.hidden = false;
    var key = station.name + '|' + (logoSet ? '1' : '0');
    if (miniPlayerLogoFor !== key) {
      fillStationLogo(miniPlayerLogo, station);
      miniPlayerLogoFor = key;
    }
  }

  function createCard(station, index) {
    var unavailable = isUnavailable(station);
    var card = document.createElement('div');
    card.className = 'station-card' + (unavailable ? ' is-unavailable' : '') +
      (station.category ? ' category-' + station.category : '') +
      (station.afinacion ? ' has-tuning' : '');
    card.dataset.name = station.name;
    if (station.category) {
      card.dataset.category = station.category;
    }

    var toolbar = document.createElement('div');
    toolbar.className = 'card-toolbar';

    var handle = document.createElement('div');
    handle.className = 'drag-handle';
    handle.setAttribute('aria-hidden', 'true');
    handle.title = 'Arrastra para reordenar';
    handle.textContent = '⠿';
    toolbar.appendChild(handle);
    attachDragHandle(card);

    if (!unavailable) {
      var podiumBtn = document.createElement('button');
      podiumBtn.type = 'button';
      podiumBtn.className = 'podium-add-btn';
      podiumBtn.title = 'Al podio';
      podiumBtn.setAttribute('aria-label', 'Añadir ' + station.name + ' al podio');
      podiumBtn.textContent = '⭐';
      podiumBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        togglePodium(card);
      });
      toolbar.appendChild(podiumBtn);
    }

    card.appendChild(toolbar);

    if (sleepMode) {
      var rank = rankByName ? rankByName[station.name] : null;
      if (rank) {
        var badge = document.createElement('div');
        badge.className = 'rank-badge' + (rank <= 3 ? ' rank-' + rank : '');
        badge.textContent = '#' + rank;
        card.appendChild(badge);
      }
    }

    var content = document.createElement('button');
    content.type = 'button';
    content.className = 'card-content';

    var logo = document.createElement('span');
    logo.className = 'station-logo';
    logo.setAttribute('aria-hidden', 'true');
    fillStationLogo(logo, station);
    content.appendChild(logo);

    // Todo el texto de la tarjeta va en su propio bloque, a la derecha del
    // logo en escritorio y debajo en el móvil.
    var textBox = document.createElement('span');
    textBox.className = 'card-text';
    content.appendChild(textBox);
    var cardContent = content;
    content = textBox;

    var modeCategories = MODE_CATEGORIES[appMode];
    var categoryMeta = modeCategories && station.category ? modeCategories.meta[station.category] : null;
    if (categoryMeta) {
      var catTag = document.createElement('div');
      catTag.className = 'station-category-tag';
      catTag.textContent = categoryMeta.icon + ' ' + categoryMeta.label;
      content.appendChild(catTag);
    }

    var name = document.createElement('div');
    name.className = 'station-name';
    name.textContent = station.name;
    if (station.lang) {
      name.lang = station.lang;
    }
    content.appendChild(name);

    if (station.afinacion) {
      var tuning = document.createElement('div');
      tuning.className = 'station-tuning';
      tuning.textContent = '🎵 ' + station.afinacion;
      if (station.afinacionNota) {
        tuning.title = station.afinacionNota;
      }
      content.appendChild(tuning);
    }

    var status = document.createElement('div');
    status.className = 'station-status ' + (unavailable ? 'status-unavailable' : 'status-idle');
    status.textContent = unavailable ? STATUS_LABEL.unavailable : station.freq;
    content.appendChild(status);

    // En el modo dormir solo se muestra la calidad; los votos no aportan nada.
    if (sleepMode && station.bitrate) {
      var meta = document.createElement('div');
      meta.className = 'station-meta';
      meta.textContent = station.bitrate + ' kbps';
      content.appendChild(meta);
    }

    content = cardContent;
    card.appendChild(content);

    if (unavailable) {
      var link = document.createElement('a');
      link.className = 'official-link';
      link.href = station.officialUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Escuchar en la web oficial →';
      link.addEventListener('click', function (e) {
        e.stopPropagation();
      });
      card.appendChild(link);
      content.addEventListener('click', function () {
        window.open(station.officialUrl, '_blank', 'noopener,noreferrer');
      });
    } else {
      content.addEventListener('click', function () {
        playStation(index);
      });
    }

    return card;
  }

  function renderGrid() {
    // El podio es un único bloque de HTML compartido por los dos modos: hay
    // que vaciarlo antes de pintar las tarjetas del modo actual, si no se
    // quedan las del modo anterior y se mezclan o duplican.
    podiumSlots.forEach(function (slot) { slot.innerHTML = ''; });
    grid.innerHTML = '';
    renderedMode = appMode;
    cards = stations.map(function (station, index) {
      var card = createCard(station, index);
      grid.appendChild(card);
      return card;
    });
    if (top3Section) {
      top3Section.hidden = !stations.length;
    }
    if (!stations.length) {
      var empty = document.createElement('div');
      empty.className = 'stations-empty';
      empty.textContent = MODE_UI[appMode].empty || '';
      grid.appendChild(empty);
    }
    updateGridToggleVisibility();
  }

  /* --- "Ver más": la cuadrícula se colapsa a una altura fija si hay muchas
     emisoras, para que la lista larga no sature la pantalla de entrada. --- */

  function updateGridToggleVisibility() {
    if (!gridWrap || !toggleGridBtn) {
      return;
    }
    if (gridExpanded) {
      toggleGridBtn.hidden = false;
      return;
    }
    // Leer scrollHeight obliga al navegador a calcular el alto real de la
    // cuadrícula con las tarjetas recién insertadas.
    var overflows = grid.scrollHeight > gridWrap.clientHeight + 4;
    toggleGridBtn.hidden = !overflows;
    gridWrap.classList.toggle('fits-all', !overflows);
  }

  if (toggleGridBtn) {
    toggleGridBtn.addEventListener('click', function () {
      gridExpanded = !gridExpanded;
      gridWrap.classList.toggle('is-expanded', gridExpanded);
      toggleGridBtn.textContent = gridExpanded ? 'Ver menos ▴' : 'Ver más ▾';
      if (!gridExpanded) {
        gridWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  window.addEventListener('resize', updateGridToggleVisibility);

  /* --- Reordenar emisoras arrastrando (ratón y táctil) --- */

  function loadLegacyState() {
    var order = [];
    var top3 = [];
    try {
      var rawOrder = window.localStorage.getItem(LEGACY_ORDER_KEY);
      var parsedOrder = rawOrder ? JSON.parse(rawOrder) : [];
      order = Array.isArray(parsedOrder) ? parsedOrder : [];
    } catch (e) { /* noop */ }
    try {
      var rawTop3 = window.localStorage.getItem(LEGACY_TOP3_KEY);
      var parsedTop3 = rawTop3 ? JSON.parse(rawTop3) : [];
      top3 = Array.isArray(parsedTop3) ? parsedTop3 : [];
    } catch (e) { /* noop */ }
    return { order: order, top3: top3 };
  }

  function currentStorageKey() {
    return MODE_STORAGE_KEYS[appMode];
  }

  function loadState() {
    try {
      var raw = window.localStorage.getItem(currentStorageKey());
      if (raw) {
        var parsed = JSON.parse(raw);
        return {
          order: Array.isArray(parsed.order) ? parsed.order : [],
          top3: Array.isArray(parsed.top3) ? parsed.top3 : []
        };
      }
    } catch (e) { /* noop */ }
    if (appMode !== 'normal') {
      // Solo el modo normal tiene claves antiguas que migrar: el resto empieza vacío.
      return { order: [], top3: [] };
    }
    // Sin datos en la clave actual: se migran (si existen) las claves antiguas
    // de versiones previas de la web, que guardaban orden y podio por separado.
    return loadLegacyState();
  }

  function saveState() {
    try {
      var order = Array.prototype.map.call(
        grid.querySelectorAll('.station-card'),
        function (el) { return el.dataset.name; }
      );
      var top3 = podiumSlots.map(function (slot) {
        var occupant = slot.querySelector('.station-card');
        return occupant ? occupant.dataset.name : null;
      });
      window.localStorage.setItem(currentStorageKey(), JSON.stringify({ order: order, top3: top3 }));
      if (appMode === 'normal') {
        window.localStorage.removeItem(LEGACY_ORDER_KEY);
        window.localStorage.removeItem(LEGACY_TOP3_KEY);
      }
    } catch (e) { /* localStorage no disponible; el orden y el podio simplemente no persisten */ }
  }

  /* --- Alternativa táctil al arrastrar: botón "Al podio" en cada tarjeta --- */

  function isInPodium(card) {
    return !!(card.parentNode && card.parentNode.classList && card.parentNode.classList.contains('podium-drop'));
  }

  function updatePodiumButtons() {
    cards.forEach(function (card, i) {
      var btn = card.querySelector('.podium-add-btn');
      if (!btn) {
        return;
      }
      var inPodium = isInPodium(card);
      btn.title = inPodium ? 'Quitar del podio' : 'Al podio';
      btn.setAttribute('aria-label', (inPodium ? 'Quitar ' : 'Añadir ') + stations[i].name + (inPodium ? ' del podio' : ' al podio'));
    });
  }

  /* La estrella alterna: sube la emisora al podio o la devuelve a la lista.
     Con el podio lleno sustituye al 3.º, para no perder la favorita. */
  function togglePodium(card) {
    if (isInPodium(card)) {
      grid.insertBefore(card, grid.firstChild);
    } else {
      var sorted = podiumSlots.slice().sort(function (a, b) {
        return (parseInt(a.dataset.rank, 10) || 9) - (parseInt(b.dataset.rank, 10) || 9);
      });
      var emptySlot = sorted.filter(function (s) { return !s.querySelector('.station-card'); })[0];
      var slot = emptySlot || sorted[sorted.length - 1];
      var occupant = slot.querySelector('.station-card');
      if (occupant) {
        grid.insertBefore(occupant, grid.firstChild);
      }
      slot.appendChild(card);
    }
    applyCategoryFilter();
    updatePodiumButtons();
    saveState();
  }

  function applyTop3ToDom(top3Names) {
    top3Names.forEach(function (name, i) {
      if (!name || !podiumSlots[i]) {
        return;
      }
      var card = cards.filter(function (c) { return c.dataset.name === name; })[0];
      if (card) {
        podiumSlots[i].appendChild(card);
      }
    });
    updatePodiumButtons();
  }

  function findPodiumSlotAt(clientX, clientY) {
    for (var i = 0; i < podiumSlots.length; i++) {
      var r = podiumSlots[i].getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        return podiumSlots[i];
      }
    }
    return null;
  }

  function clearPodiumHighlight() {
    podiumSlots.forEach(function (slot) { slot.classList.remove('drop-hover'); });
  }

  /* --- Autoscroll de la página mientras se arrastra una tarjeta cerca del borde --- */

  var AUTOSCROLL_MARGIN = 90;
  var AUTOSCROLL_MAX_SPEED = 16;
  var autoScrollPointerX = 0;
  var autoScrollPointerY = 0;
  var autoScrollRAF = null;
  var activeDragUpdate = null;

  function autoScrollStep() {
    var viewportHeight = window.innerHeight;
    var distanceFromTop = autoScrollPointerY;
    var distanceFromBottom = viewportHeight - autoScrollPointerY;
    var scrollDelta = 0;

    if (distanceFromTop < AUTOSCROLL_MARGIN) {
      scrollDelta = -AUTOSCROLL_MAX_SPEED * (1 - Math.max(distanceFromTop, 0) / AUTOSCROLL_MARGIN);
    } else if (distanceFromBottom < AUTOSCROLL_MARGIN) {
      scrollDelta = AUTOSCROLL_MAX_SPEED * (1 - Math.max(distanceFromBottom, 0) / AUTOSCROLL_MARGIN);
    }

    if (scrollDelta !== 0) {
      window.scrollBy(0, scrollDelta);
      if (activeDragUpdate) {
        activeDragUpdate(autoScrollPointerX, autoScrollPointerY);
      }
    }
    autoScrollRAF = requestAnimationFrame(autoScrollStep);
  }

  function startAutoScroll(clientX, clientY) {
    autoScrollPointerX = clientX;
    autoScrollPointerY = clientY;
    if (!autoScrollRAF) {
      autoScrollRAF = requestAnimationFrame(autoScrollStep);
    }
  }

  function updateAutoScrollPointer(clientX, clientY) {
    autoScrollPointerX = clientX;
    autoScrollPointerY = clientY;
  }

  function stopAutoScroll() {
    if (autoScrollRAF) {
      cancelAnimationFrame(autoScrollRAF);
      autoScrollRAF = null;
    }
  }

  function applySavedOrder(rawStations, savedOrder) {
    if (!savedOrder.length) {
      return rawStations.slice();
    }
    var byName = {};
    rawStations.forEach(function (s) { byName[s.name] = s; });
    var used = {};
    var ordered = [];
    savedOrder.forEach(function (name) {
      if (byName[name] && !used[name]) {
        ordered.push(byName[name]);
        used[name] = true;
      }
    });
    rawStations.forEach(function (s) {
      if (!used[s.name]) {
        ordered.push(s);
        used[s.name] = true;
      }
    });
    return ordered;
  }

  function attachDragHandle(card) {
    var DRAG_THRESHOLD_PX = 6;
    var state = null;
    var pending = null;
    var suppressClick = false;

    function updateCardPosition(clientX, clientY) {
      card.style.left = (clientX - state.offsetX) + 'px';
      card.style.top = (clientY - state.offsetY) + 'px';
    }

    function moveePlaceholder(clientX, clientY) {
      var siblings = grid.querySelectorAll('.station-card:not(.dragging)');
      var target = null;
      var targetRect = null;
      var closestDist = Infinity;
      siblings.forEach(function (sib) {
        // Las tarjetas ocultas por el filtro miden 0 y no son un destino válido.
        if (sib.style.display === 'none') {
          return;
        }
        var r = sib.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var dist = Math.hypot(clientX - cx, clientY - cy);
        if (dist < closestDist) {
          closestDist = dist;
          target = sib;
          targetRect = r;
        }
      });
      if (!target) {
        if (state.placeholder.parentNode !== grid) {
          grid.appendChild(state.placeholder);
        }
        return;
      }
      var before = clientX < targetRect.left + targetRect.width / 2;
      var reference = before ? target : target.nextSibling;
      // Mover el hueco solo si cambia de sitio evita recolocar la cuadrícula en cada movimiento.
      if (reference !== state.placeholder && state.placeholder.nextSibling !== reference) {
        grid.insertBefore(state.placeholder, reference);
      }
    }

    function updateDragTarget(clientX, clientY) {
      updateCardPosition(clientX, clientY);
      var hoverSlot = findPodiumSlotAt(clientX, clientY);
      state.hoverSlot = hoverSlot;
      clearPodiumHighlight();
      if (hoverSlot) {
        hoverSlot.classList.add('drop-hover');
      } else {
        moveePlaceholder(clientX, clientY);
      }
    }

    function beginDrag(pointerId, startX, startY, clientX, clientY) {
      var rect = card.getBoundingClientRect();
      var placeholder = document.createElement('div');
      placeholder.className = 'drag-placeholder';
      placeholder.style.width = rect.width + 'px';
      placeholder.style.height = rect.height + 'px';
      card.parentNode.insertBefore(placeholder, card);

      state = {
        pointerId: pointerId,
        offsetX: startX - rect.left,
        offsetY: startY - rect.top,
        placeholder: placeholder
      };

      document.body.classList.add('is-dragging');
      card.classList.add('dragging');
      card.style.position = 'fixed';
      card.style.width = rect.width + 'px';
      card.style.height = rect.height + 'px';
      updateCardPosition(clientX, clientY);
      activeDragUpdate = updateDragTarget;
      startAutoScroll(clientX, clientY);

      try { card.setPointerCapture(pointerId); } catch (err) { /* noop */ }
    }

    function onPointerDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) {
        return;
      }
      if (e.target.closest('.podium-add-btn, a')) {
        return;
      }
      if (e.target.closest('.drag-handle')) {
        e.preventDefault();
        beginDrag(e.pointerId, e.clientX, e.clientY, e.clientX, e.clientY);
      } else if (e.pointerType === 'mouse') {
        // Con ratón el arrastre empieza al moverse: sin movimiento sigue siendo un clic.
        pending = { pointerId: e.pointerId, x: e.clientX, y: e.clientY };
      }
    }

    function onPointerMove(e) {
      if (pending && e.pointerId === pending.pointerId) {
        if (Math.hypot(e.clientX - pending.x, e.clientY - pending.y) < DRAG_THRESHOLD_PX) {
          return;
        }
        var start = pending;
        pending = null;
        beginDrag(e.pointerId, start.x, start.y, e.clientX, e.clientY);
      }
      if (!state || e.pointerId !== state.pointerId) {
        return;
      }
      updateAutoScrollPointer(e.clientX, e.clientY);
      updateDragTarget(e.clientX, e.clientY);
    }

    function onPointerEnd(e) {
      if (pending && e.pointerId === pending.pointerId) {
        pending = null;
      }
      if (!state || e.pointerId !== state.pointerId) {
        return;
      }
      suppressClick = true;
      setTimeout(function () { suppressClick = false; }, 0);
      document.body.classList.remove('is-dragging');
      stopAutoScroll();
      activeDragUpdate = null;
      clearPodiumHighlight();

      if (state.hoverSlot) {
        var occupant = state.hoverSlot.querySelector('.station-card');
        if (occupant && occupant !== card) {
          grid.insertBefore(occupant, grid.firstChild);
        }
        state.placeholder.remove();
        state.hoverSlot.appendChild(card);
      } else {
        grid.insertBefore(card, state.placeholder);
        state.placeholder.remove();
      }

      card.classList.remove('dragging');
      card.style.position = '';
      card.style.left = '';
      card.style.top = '';
      card.style.width = '';
      card.style.height = '';
      try { card.releasePointerCapture(state.pointerId); } catch (err) { /* noop */ }
      state = null;
      applyCategoryFilter();
      updatePodiumButtons();
      saveState();
    }

    card.addEventListener('pointerdown', onPointerDown);
    card.addEventListener('pointermove', onPointerMove);
    card.addEventListener('pointerup', onPointerEnd);
    card.addEventListener('pointercancel', onPointerEnd);
    // Soltar una tarjeta arrastrada no debe contar como clic para reproducirla.
    card.addEventListener('click', function (e) {
      if (suppressClick) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);
  }

  /* =========================================================================
     Modo dormir
     ========================================================================= */

  function flattenSleepData(data) {
    var out = [];
    (data.categorias || []).forEach(function (cat) {
      (cat.emisoras || []).forEach(function (e) {
        out.push({
          name: e.nombre,
          freq: 'Stream',
          streamUrl: e.stream,
          streamType: (e.codec || 'mp3').toLowerCase(),
          officialUrl: e.web,
          notes: e.descripcion,
          category: cat.id,
          votos: e.votos || 0,
          bitrate: e.bitrate,
          pais: e.pais
        });
      });
    });
    return out;
  }

  function defaultSleepOrder(list) {
    var catIndex = {};
    SLEEP_CATEGORY_ORDER.forEach(function (id, i) { catIndex[id] = i; });
    return list.slice().sort(function (a, b) {
      var ca = catIndex[a.category] !== undefined ? catIndex[a.category] : 99;
      var cb = catIndex[b.category] !== undefined ? catIndex[b.category] : 99;
      if (ca !== cb) {
        return ca - cb;
      }
      return (b.votos || 0) - (a.votos || 0);
    });
  }

  function computeRankMap(list) {
    var sorted = list.slice().sort(function (a, b) { return (b.votos || 0) - (a.votos || 0); });
    var map = {};
    sorted.forEach(function (s, i) { map[s.name] = i + 1; });
    return map;
  }

  function saveLastSleepStation(name) {
    try { window.localStorage.setItem(SLEEP_LAST_KEY, name); } catch (e) { /* noop */ }
  }

  function updateModeUI() {
    var ui = MODE_UI[appMode];
    if (modeSelect) {
      modeSelect.value = appMode;
    }
    if (titleMainEl) {
      titleMainEl.textContent = ui.titleMain;
    }
    if (titleSubEl) {
      titleSubEl.textContent = ui.titleSub;
    }
    if (taglineEl) {
      taglineEl.textContent = ui.tagline;
    }
    if (top3TitleEl) {
      top3TitleEl.textContent = ui.top3;
    }
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', ui.themeColor);
    }
    if (sleepTimerWrap) {
      sleepTimerWrap.hidden = false;
    }
    if (sleepChipsWrap) {
      sleepChipsWrap.hidden = true;
    }
    if (!sleepMode && sleepContinueBtn) {
      sleepContinueBtn.hidden = true;
    }
  }

  /* --- Filtro por temática (chips) --- */

  function renderCategoryChips() {
    if (!sleepChipsWrap) {
      return;
    }
    var modeCategories = MODE_CATEGORIES[appMode];
    sleepChipsWrap.innerHTML = '';
    sleepChipsWrap.hidden = !modeCategories;
    if (!modeCategories) {
      return;
    }
    activeCategoryFilter = modeCategories.order[0];
    modeCategories.order.forEach(function (id) {
      var meta = modeCategories.meta[id];
      sleepChipsWrap.appendChild(makeCategoryChip(id, meta.icon + ' ' + meta.label));
    });
    applyCategoryFilter();
  }

  function makeCategoryChip(id, label) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sleep-chip' + (activeCategoryFilter === id ? ' is-active' : '');
    btn.dataset.category = id;
    btn.textContent = label;
    btn.addEventListener('click', function () {
      selectCategory(id);
    });
    return btn;
  }

  function selectCategory(id) {
    activeCategoryFilter = id;
    Array.prototype.forEach.call(sleepChipsWrap.children, function (c) {
      c.classList.toggle('is-active', c.dataset.category === id);
    });
    applyCategoryFilter();
  }

  function applyCategoryFilter() {
    if (!MODE_CATEGORIES[appMode]) {
      return;
    }
    cards.forEach(function (card, i) {
      var station = stations[i];
      // El podio siempre se ve entero, sea cual sea la temática elegida.
      var show = isInPodium(card) || (station && station.category === activeCategoryFilter);
      card.style.display = show ? '' : 'none';
    });
    updateGridToggleVisibility();
  }

  /* --- Continuar donde lo dejé --- */

  function showContinueButtonIfAny() {
    if (!sleepContinueBtn) {
      return;
    }
    var name;
    try { name = window.localStorage.getItem(SLEEP_LAST_KEY); } catch (e) { name = null; }
    if (!name) {
      sleepContinueBtn.hidden = true;
      return;
    }
    var idx = -1;
    for (var i = 0; i < stations.length; i++) {
      if (stations[i].name === name) {
        idx = i;
        break;
      }
    }
    if (idx === -1) {
      sleepContinueBtn.hidden = true;
      return;
    }
    sleepContinueBtn.hidden = false;
    sleepContinueBtn.textContent = '▶︎ Continuar: ' + name;
    sleepContinueBtn.onclick = function () {
      sleepContinueBtn.hidden = true;
      selectCategory(stations[idx].category);
      playStation(idx);
    };
  }

  /* --- Fundidos de volumen --- */

  function fadeInVolume() {
    var target = loadSavedVolume();
    audio.volume = 0;
    var steps = 15;
    var i = 0;
    if (volumeFadeInInterval) {
      clearInterval(volumeFadeInInterval);
    }
    volumeFadeInInterval = setInterval(function () {
      i++;
      audio.volume = target * Math.min(1, i / steps);
      if (i >= steps) {
        clearInterval(volumeFadeInInterval);
        volumeFadeInInterval = null;
        audio.volume = target;
      }
    }, 100);
  }

  function fadeOutAndPause() {
    var startVolume = audio.volume;
    var steps = 40;
    var i = 0;
    if (volumeFadeInterval) {
      clearInterval(volumeFadeInterval);
    }
    volumeFadeInterval = setInterval(function () {
      i++;
      audio.volume = Math.max(0, startVolume * (1 - i / steps));
      if (i >= steps) {
        clearInterval(volumeFadeInterval);
        volumeFadeInterval = null;
        if (!userPaused && currentIndex !== -1) {
          togglePauseResume();
        }
        audio.volume = loadSavedVolume();
      }
    }, 750);
  }

  /* --- Temporizador de apagado --- */

  function startSleepTimer(minutes) {
    timerEndAt = Date.now() + minutes * 60000;
    try {
      window.localStorage.setItem(SLEEP_TIMER_KEY, String(timerEndAt));
      window.localStorage.setItem(SLEEP_TIMER_MIN_KEY, String(minutes));
    } catch (e) { /* noop */ }
    restartTimerLoop();
  }

  function clearSleepTimer(removeStorage) {
    timerEndAt = 0;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (sleepTimerCountdown) {
      sleepTimerCountdown.textContent = '';
    }
    if (removeStorage) {
      try {
        window.localStorage.removeItem(SLEEP_TIMER_KEY);
        window.localStorage.removeItem(SLEEP_TIMER_MIN_KEY);
      } catch (e) { /* noop */ }
    }
  }

  function restartTimerLoop() {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    tickSleepTimer();
    timerInterval = setInterval(tickSleepTimer, 1000);
  }

  function tickSleepTimer() {
    if (!timerEndAt) {
      return;
    }
    var remaining = timerEndAt - Date.now();
    if (remaining <= 0) {
      clearSleepTimer(true);
      fadeOutAndPause();
      return;
    }
    if (sleepTimerCountdown) {
      var mins = Math.floor(remaining / 60000);
      var secs = Math.floor((remaining % 60000) / 1000);
      sleepTimerCountdown.textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
    }
  }

  function restoreSleepTimer() {
    try {
      var raw = window.localStorage.getItem(SLEEP_TIMER_KEY);
      if (raw) {
        var end = parseInt(raw, 10);
        if (end && end > Date.now()) {
          timerEndAt = end;
          restartTimerLoop();
          return;
        }
      }
    } catch (e) { /* noop */ }
    clearSleepTimer(true);
  }

  if (sleepTimerBtn && sleepTimerMenu) {
    sleepTimerBtn.addEventListener('click', function () {
      var isHidden = sleepTimerMenu.hidden;
      sleepTimerMenu.hidden = !isHidden;
      sleepTimerBtn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    });
    Array.prototype.forEach.call(sleepTimerMenu.querySelectorAll('button'), function (btn) {
      btn.addEventListener('click', function () {
        var minutes = parseInt(btn.dataset.min, 10) || 0;
        if (minutes > 0) {
          startSleepTimer(minutes);
        } else {
          clearSleepTimer(true);
        }
        sleepTimerMenu.hidden = true;
        sleepTimerBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function closeSleepTimerMenu() {
    if (sleepTimerMenu && !sleepTimerMenu.hidden) {
      sleepTimerMenu.hidden = true;
      sleepTimerBtn.setAttribute('aria-expanded', 'false');
    }
  }

  document.addEventListener('click', function (e) {
    if (sleepTimerWrap && !sleepTimerWrap.contains(e.target)) {
      closeSleepTimerMenu();
    }
  });

  /* --- Pantalla encendida (Wake Lock) --- */

  function requestWakeLock() {
    if (!sleepMode || !navigator.wakeLock) {
      return;
    }
    try {
      navigator.wakeLock.request('screen').then(function (sentinel) {
        wakeLockSentinel = sentinel;
      }).catch(function () { /* noop: la web sigue funcionando sin bloqueo de pantalla */ });
    } catch (e) { /* noop */ }
  }

  function releaseWakeLock() {
    if (wakeLockSentinel) {
      try { wakeLockSentinel.release(); } catch (e) { /* noop */ }
      wakeLockSentinel = null;
    }
  }

  /* --- Capa de atenuación de pantalla en modo dormir --- */

  function isTouchDevice() {
    return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  }

  function scheduleScreenDim() {
    clearTimeout(dimTimeout);
    if (!sleepMode || currentIndex === -1 || !isTouchDevice()) {
      return;
    }
    dimTimeout = setTimeout(function () {
      if (!sleepDimOverlay || currentStatus !== STATUS.LIVE) {
        return;
      }
      var station = stations[currentIndex];
      if (sleepDimName) {
        sleepDimName.textContent = station ? station.name : '';
      }
      sleepDimOverlay.hidden = false;
    }, SLEEP_DIM_DELAY_MS);
  }

  function clearScreenDim() {
    clearTimeout(dimTimeout);
    if (sleepDimOverlay) {
      sleepDimOverlay.hidden = true;
    }
  }

  if (sleepDimOverlay) {
    sleepDimOverlay.addEventListener('pointerdown', function () {
      clearScreenDim();
      scheduleScreenDim();
    });
  }

  document.addEventListener('pointerdown', function () {
    if (sleepMode && currentStatus === STATUS.LIVE) {
      clearScreenDim();
      scheduleScreenDim();
    }
  });

  /* --- Canción que suena ahora, anteriores y próximas --- */
  //
  // Los datos vienen de /api/now-playing (función de Vercel en api/), que los
  // saca de la API del proveedor (Triton, SomaFM, laut.fm, Radio.co,
  // RadioKing, Rainwave, Zeno) o de los metadatos ICY del propio stream. No
  // todas las emisoras los publican: si no hay nada, simplemente no se muestra.
  // "Próximas" solo existe en las pocas que lo anuncian (RadioKing, Rainwave).
  // Si el proveedor no da historial, se usa el que va guardando el navegador
  // con las canciones que han sonado mientras escuchabas.

  var NOW_PLAYING_ENDPOINT = 'api/now-playing';
  var NOW_PLAYING_POLL_MS = 20000;
  var NOW_PLAYING_POLL_HIDDEN_MS = 45000;
  var NOW_PLAYING_MAX_MISSES = 3;
  var TRACK_HISTORY_KEY = 'radioMicroTrackHistory';
  var TRACK_HISTORY_PER_STATION = 20;
  var TRACK_HISTORY_MAX_STATIONS = 40;

  var np = { url: null, now: null, history: [], next: [], misses: 0, timer: null, req: 0 };

  function sameTrack(a, b) {
    return !!a && !!b && a.title === b.title && (a.artist || '') === (b.artist || '');
  }

  function formatTrack(t) {
    return t.artist ? t.artist + ' — ' + t.title : t.title;
  }

  function getCurrentTrack() {
    var station = stations[currentIndex];
    return station && np.url === station.streamUrl ? np.now : null;
  }

  function readAllTrackHistory() {
    try {
      var all = JSON.parse(window.localStorage.getItem(TRACK_HISTORY_KEY) || '{}');
      return all && typeof all === 'object' ? all : {};
    } catch (e) {
      return {};
    }
  }

  function loadTrackHistory(url) {
    var list = readAllTrackHistory()[url];
    return Array.isArray(list) ? list : [];
  }

  function rememberTrack(url, t) {
    try {
      var all = readAllTrackHistory();
      var list = Array.isArray(all[url]) ? all[url] : [];
      if (list.length && sameTrack(list[0], t)) {
        return;
      }
      list.unshift({ artist: t.artist || '', title: t.title, at: new Date().toISOString() });
      delete all[url];
      all[url] = list.slice(0, TRACK_HISTORY_PER_STATION);
      var keys = Object.keys(all);
      // Se conserva solo el historial de las últimas emisoras escuchadas.
      while (keys.length > TRACK_HISTORY_MAX_STATIONS) {
        delete all[keys.shift()];
      }
      window.localStorage.setItem(TRACK_HISTORY_KEY, JSON.stringify(all));
    } catch (e) { /* sin localStorage no se guarda historial propio */ }
  }

  function stopNowPlaying() {
    if (np.timer) {
      clearTimeout(np.timer);
      np.timer = null;
    }
    np.req++;
  }

  function resetNowPlaying() {
    stopNowPlaying();
    np.url = null;
    np.now = null;
    np.history = [];
    np.next = [];
    np.misses = 0;
    renderTracksButton();
    closeTracksPanel();
  }

  function scheduleNowPlaying(ms) {
    if (np.timer) {
      clearTimeout(np.timer);
    }
    np.timer = setTimeout(fetchNowPlaying, ms);
  }

  function fetchNowPlaying() {
    np.timer = null;
    var station = stations[currentIndex];
    if (!station || playerMode !== 'radio' || currentStatus !== STATUS.LIVE || np.url !== station.streamUrl) {
      return;
    }
    var reqId = ++np.req;
    var url = station.streamUrl;
    fetch(NOW_PLAYING_ENDPOINT + '?url=' + encodeURIComponent(url))
      .then(function (res) { return res.ok ? res.json() : null; })
      .catch(function () { return null; })
      .then(function (data) {
        if (reqId !== np.req || np.url !== url) {
          return;
        }
        if (data && data.now && data.now.title) {
          np.misses = 0;
          if (!sameTrack(np.now, data.now)) {
            rememberTrack(url, data.now);
          }
          np.now = data.now;
          np.history = Array.isArray(data.history) ? data.history : [];
          np.next = Array.isArray(data.next) ? data.next : [];
        } else {
          np.misses++;
        }
        updateMiniPlayer();
        renderTracksButton();
        updateMediaSessionTrack();
        if (!tracksPanel.hidden) {
          renderTracksPanel();
        }
        // Si la emisora no da título tras varios intentos seguidos, se deja de
        // preguntar hasta que se vuelva a elegir.
        if (np.misses < NOW_PLAYING_MAX_MISSES) {
          scheduleNowPlaying(document.hidden ? NOW_PLAYING_POLL_HIDDEN_MS : NOW_PLAYING_POLL_MS);
        }
      });
  }

  // Se llama cada vez que cambia el estado del reproductor.
  function syncNowPlaying() {
    var station = stations[currentIndex];
    if (!station || playerMode !== 'radio') {
      if (np.url) {
        resetNowPlaying();
      }
      return;
    }
    if (np.url !== station.streamUrl) {
      resetNowPlaying();
      np.url = station.streamUrl;
      renderTracksButton();
    }
    if (currentStatus === STATUS.LIVE) {
      if (!np.timer && np.misses < NOW_PLAYING_MAX_MISSES) {
        scheduleNowPlaying(np.now ? NOW_PLAYING_POLL_MS : 0);
      }
    } else {
      stopNowPlaying();
    }
  }

  function getHistoryToShow() {
    if (np.history.length) {
      return { list: np.history, own: false };
    }
    var own = loadTrackHistory(np.url).filter(function (t) { return !sameTrack(t, np.now); });
    return { list: own, own: true };
  }

  function renderTracksButton() {
    var show = !!getCurrentTrack() || (!!np.url && loadTrackHistory(np.url).length > 0);
    tracksBtn.hidden = !show;
  }

  function formatTime(iso) {
    if (!iso) {
      return '';
    }
    var d = new Date(iso);
    if (isNaN(d.getTime())) {
      return '';
    }
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  function buildTrackItem(t, withTime) {
    var li = document.createElement('li');
    li.className = 'tracks-item';
    var text = document.createElement('div');
    text.className = 'tracks-item-text';
    var title = document.createElement('div');
    title.className = 'tracks-item-title';
    title.textContent = t.title;
    text.appendChild(title);
    if (t.artist) {
      var artist = document.createElement('div');
      artist.className = 'tracks-item-artist';
      artist.textContent = t.artist;
      text.appendChild(artist);
    }
    li.appendChild(text);
    var time = withTime ? formatTime(t.at) : '';
    if (time) {
      var timeEl = document.createElement('time');
      timeEl.className = 'tracks-item-time';
      timeEl.dateTime = t.at;
      timeEl.textContent = time;
      li.appendChild(timeEl);
    }
    return li;
  }

  function appendTrackNote(parent, text) {
    var p = document.createElement('p');
    p.className = 'tracks-note';
    p.textContent = text;
    parent.appendChild(p);
  }

  function appendTrackSection(label, list, options) {
    options = options || {};
    var section = document.createElement('section');
    section.className = 'tracks-section' + (options.className ? ' ' + options.className : '');
    var h = document.createElement('h3');
    h.className = 'tracks-section-title';
    h.textContent = label;
    section.appendChild(h);
    var ul = document.createElement('ul');
    ul.className = 'tracks-list';
    list.forEach(function (t) { ul.appendChild(buildTrackItem(t, options.withTime)); });
    section.appendChild(ul);
    if (options.note) {
      appendTrackNote(section, options.note);
    }
    tracksPanelBody.appendChild(section);
  }

  function renderTracksPanel() {
    var station = stations[currentIndex];
    tracksPanelTitle.textContent = station ? station.name : 'Canciones';
    if (station && station.lang) {
      tracksPanelTitle.lang = station.lang;
    } else {
      tracksPanelTitle.removeAttribute('lang');
    }
    tracksPanelBody.textContent = '';
    var now = getCurrentTrack();
    if (now) {
      appendTrackSection('Sonando ahora', [now], { className: 'is-now' });
    }
    if (np.next.length) {
      appendTrackSection('Próximas', np.next);
    }
    var history = getHistoryToShow();
    if (history.list.length) {
      appendTrackSection('Anteriores', history.list, {
        withTime: true,
        note: history.own ? 'La emisora no publica su historial: estas son las que han sonado mientras la escuchabas.' : null
      });
    }
    if (!now && !history.list.length) {
      appendTrackNote(tracksPanelBody, 'Esta emisora no publica qué canción está sonando.');
    } else if (!np.next.length) {
      appendTrackNote(tracksPanelBody, 'Esta emisora no anuncia las próximas canciones.');
    }
  }

  function openTracksPanel() {
    renderTracksPanel();
    tracksPanel.hidden = false;
    tracksBtn.setAttribute('aria-expanded', 'true');
    tracksPanelClose.focus();
  }

  function closeTracksPanel() {
    if (tracksPanel.hidden) {
      return;
    }
    tracksPanel.hidden = true;
    tracksBtn.setAttribute('aria-expanded', 'false');
  }

  tracksBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (tracksPanel.hidden) {
      openTracksPanel();
    } else {
      closeTracksPanel();
    }
  });

  tracksPanelClose.addEventListener('click', function () {
    closeTracksPanel();
    tracksBtn.focus();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !tracksPanel.hidden) {
      closeTracksPanel();
      tracksBtn.focus();
    }
  });

  document.addEventListener('click', function (e) {
    if (!tracksPanel.hidden && !tracksPanel.contains(e.target) && !tracksBtn.contains(e.target)) {
      closeTracksPanel();
    }
  });

  document.addEventListener('visibilitychange', function () {
    // Al volver a la pestaña se actualiza enseguida en vez de esperar.
    if (!document.hidden && np.url && currentStatus === STATUS.LIVE && np.misses < NOW_PLAYING_MAX_MISSES) {
      scheduleNowPlaying(0);
    }
  });

  // En la pantalla de bloqueo y en las notificaciones del móvil se ve la canción.
  function updateMediaSessionTrack() {
    if (!('mediaSession' in navigator) || !window.MediaMetadata) {
      return;
    }
    var station = stations[currentIndex];
    var t = getCurrentTrack();
    if (!station || !t) {
      return;
    }
    try {
      var meta = {
        title: t.title,
        artist: t.artist ? t.artist + ' · ' + station.name : station.name
      };
      meta.artwork = t.cover && /^https:\/\//.test(t.cover)
        ? [{ src: t.cover, sizes: '512x512' }]
        : getAppArtwork();
      navigator.mediaSession.metadata = new window.MediaMetadata(meta);
    } catch (e) { /* noop */ }
  }

  /* --- Media Session (control desde la pantalla de bloqueo) --- */

  // Controles del móvil (pantalla de bloqueo, auriculares, coche) en todos los
  // modos. "Siguiente" y "anterior" recorren el TOP 3; si no hay favoritas en
  // el podio, recorren todas las emisoras del modo en el orden de la pantalla.

  function getMediaSessionArtist(station) {
    var categories = MODE_CATEGORIES[appMode];
    var meta = categories && station.category ? categories.meta[station.category] : null;
    if (meta) {
      return meta.label;
    }
    return station.freq && station.freq !== 'Stream' ? station.freq : 'Radios de España';
  }

  // Icono de la web para la pantalla de bloqueo cuando no hay carátula del disco.
  function getAppArtwork() {
    return [
      { src: new URL('icons/icon-192.png', window.location.href).href, sizes: '192x192', type: 'image/png' },
      { src: new URL('icons/icon-512.png', window.location.href).href, sizes: '512x512', type: 'image/png' }
    ];
  }

  function updateMediaSession(station) {
    if (!('mediaSession' in navigator) || !window.MediaMetadata) {
      return;
    }
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: station.name,
        artist: getMediaSessionArtist(station),
        artwork: getAppArtwork()
      });
    } catch (e) { /* noop: Media Session no disponible en este navegador */ }
  }

  function clearMediaSession() {
    if (!('mediaSession' in navigator)) {
      return;
    }
    try {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
    } catch (e) { /* noop */ }
  }

  function updateMediaSessionState() {
    if (!('mediaSession' in navigator) || playerMode !== 'radio' || currentIndex === -1) {
      return;
    }
    try {
      navigator.mediaSession.playbackState =
        userPaused || currentStatus === STATUS.BLOCKED ? 'paused' : 'playing';
    } catch (e) { /* noop */ }
  }

  function getSkipList() {
    var favorites = getTop3IndexesByRank();
    var others = favorites.filter(function (i) { return i !== currentIndex; });
    if (others.length) {
      return favorites;
    }
    var all = [];
    stations.forEach(function (s, i) {
      if (!isUnavailable(s)) {
        all.push(i);
      }
    });
    return all;
  }

  function skipStation(step) {
    if (playerMode !== 'radio') {
      return;
    }
    var list = getSkipList();
    if (!list.length) {
      return;
    }
    var pos = list.indexOf(currentIndex);
    var target;
    if (pos === -1) {
      // La emisora que suena no está en la lista (p. ej. no es favorita):
      // "siguiente" va a la primera y "anterior" a la última.
      target = step > 0 ? list[0] : list[list.length - 1];
    } else {
      target = list[(pos + step + list.length) % list.length];
    }
    if (target === currentIndex) {
      return;
    }
    playStation(target);
  }

  function mediaResume() {
    if (playerMode !== 'radio' || currentIndex === -1) {
      return;
    }
    if (currentStatus === STATUS.BLOCKED) {
      setStatus(STATUS.TUNING);
      reconnectNow();
    } else if (userPaused) {
      togglePauseResume();
    }
  }

  function mediaPause() {
    if (playerMode !== 'radio' || currentIndex === -1) {
      return;
    }
    if (!userPaused) {
      togglePauseResume();
    }
  }

  function setupMediaSessionHandlers() {
    if (!('mediaSession' in navigator)) {
      return;
    }
    var handlers = {
      play: mediaResume,
      pause: mediaPause,
      stop: mediaPause,
      nexttrack: function () { skipStation(1); },
      previoustrack: function () { skipStation(-1); }
    };
    Object.keys(handlers).forEach(function (action) {
      try {
        navigator.mediaSession.setActionHandler(action, handlers[action]);
      } catch (e) { /* acción no soportada por este navegador */ }
    });
  }

  setupMediaSessionHandlers();

  /* --- Cambio de modo --- */

  function applyModeClasses() {
    document.body.classList.toggle('sleep-mode', appMode === 'sleep');
    document.body.classList.toggle('calm-mode', appMode === 'calm');
    document.body.classList.toggle('music-mode', appMode === 'music');
    document.body.classList.toggle('buggy-mode', appMode === 'buggy');
  }

  function collapseGrid() {
    gridExpanded = false;
    if (gridWrap && toggleGridBtn) {
      gridWrap.classList.remove('is-expanded');
      toggleGridBtn.textContent = 'Ver más ▾';
    }
  }

  function initCurrentMode() {
    if (appMode === 'sleep') {
      return initSleepMode();
    }
    if (appMode === 'normal') {
      return initNormalMode();
    }
    return initExtraMode();
  }

  function setMode(mode) {
    if (appMode === mode) {
      return;
    }
    // Se guarda el orden y el podio del modo que se abandona, con su propia
    // clave, antes de cambiar. Solo si sus tarjetas ya están pintadas: si la
    // carga no había terminado se guardaría un estado vacío o el de otro modo.
    if (cards.length && renderedMode === appMode) {
      saveState();
    }
    stopPlayback();
    currentIndex = -1;
    currentStatus = STATUS.IDLE;
    userPaused = false;
    clearScreenDim();
    releaseWakeLock();
    // El temporizador del modo dormir se conserva para restaurarlo al volver
    // a él; el de los demás modos se cancela, porque la radio se detiene.
    clearSleepTimer(appMode !== 'sleep');
    clearMediaSession();
    if (miniPlayer) {
      miniPlayer.hidden = true;
    }
    document.body.classList.remove('has-mini-player');

    appMode = mode;
    sleepMode = appMode === 'sleep';
    collapseGrid();
    applyModeClasses();
    updateModeUI();

    initCurrentMode();
  }

  if (modeSelect) {
    modeSelect.addEventListener('change', function () {
      setMode(modeSelect.value);
    });
  }

  /* --- Emisoras ocultas por fallos ---
     La comprobación de los lunes (scripts/check-streams.mjs) guarda en
     stream-health.json los fallos seguidos de cada emisora. Las que llevan
     HIDE_AFTER_CONSECUTIVE_FAILURES o más no se muestran; vuelven solas en
     cuanto una comprobación sale bien. Las marcadas geoRestricted no se
     ocultan: fallan desde los servidores de GitHub pero funcionan en España.
     Si el historial no se puede leer, no se oculta nada. */

  var HIDE_AFTER_CONSECUTIVE_FAILURES = 3;
  var hiddenStationsPromise = null;

  function loadHiddenStations() {
    if (!hiddenStationsPromise) {
      hiddenStationsPromise = fetch('stream-health.json').then(function (res) {
        if (!res.ok) {
          throw new Error('Sin historial de fallos');
        }
        return res.json();
      }).then(function (health) {
        var hidden = {};
        var entries = (health && health.stations) || {};
        Object.keys(entries).forEach(function (key) {
          if ((entries[key].consecutiveFailures || 0) >= HIDE_AFTER_CONSECUTIVE_FAILURES) {
            hidden[key] = true;
          }
        });
        return hidden;
      }).catch(function () {
        return {};
      });
    }
    return hiddenStationsPromise;
  }

  function withoutFailingStations(list, file) {
    return loadHiddenStations().then(function (hidden) {
      return list.filter(function (s) {
        return s.geoRestricted || !hidden[file + '|' + s.name];
      });
    });
  }

  /* --- Carga de datos por modo --- */

  function initNormalMode() {
    var fetchPromise = normalStationsCache
      ? Promise.resolve(normalStationsCache)
      : fetch('stations.json').then(function (res) { return res.json(); }).then(function (data) {
        return withoutFailingStations(data, 'stations.json');
      });

    return fetchPromise.then(function (data) {
      normalStationsCache = data;
      // Si se ha cambiado de modo mientras cargaba, esta lista ya no toca pintarla.
      if (appMode !== 'normal') {
        return;
      }
      rankByName = null;
      var savedState = loadState();
      var withDefaultOrder = applySavedOrder(data, DEFAULT_ORDER);
      stations = applySavedOrder(withDefaultOrder, savedState.order);
      renderGrid();
      applyTop3ToDom(savedState.top3);
      updateGridToggleVisibility();
    }).catch(function () {
      grid.textContent = 'No se pudo cargar la lista de emisoras.';
    });
  }

  function initSleepMode() {
    var fetchPromise = sleepStationsCache
      ? Promise.resolve(sleepStationsCache)
      : fetch('emisoras-relax.json').then(function (res) {
        if (!res.ok) {
          throw new Error('No se pudo cargar emisoras-relax.json');
        }
        return res.json();
      }).then(flattenSleepData).then(function (flat) {
        return withoutFailingStations(flat, 'emisoras-relax.json');
      });

    return fetchPromise.then(function (flat) {
      sleepStationsCache = flat;
      if (appMode !== 'sleep') {
        return;
      }
      rankByName = computeRankMap(flat);
      var savedState = loadState();
      var defaultOrder = defaultSleepOrder(flat);
      stations = applySavedOrder(defaultOrder, savedState.order);
      renderGrid();
      applyTop3ToDom(savedState.top3);
      updateGridToggleVisibility();
      renderCategoryChips();
      showContinueButtonIfAny();
      restoreSleepTimer();
    }).catch(function () {
      if (appMode !== 'sleep') {
        return;
      }
      grid.textContent = 'No se pudieron cargar las emisoras para dormir. Volviendo al modo normal…';
      setMode('normal');
    });
  }

  function flattenExtraMode(data, mode) {
    var modo = (data.modos || {})[mode] || {};
    return (modo.emisoras || []).map(function (e) {
      return {
        name: e.nombre,
        freq: 'Stream',
        streamUrl: e.stream,
        streamType: (e.codec || 'mp3').toLowerCase(),
        officialUrl: e.web,
        notes: e.descripcion,
        bitrate: e.bitrate,
        pais: e.pais,
        category: e.categoria,
        afinacion: e.afinacion,
        afinacionNota: e.afinacionNota
      };
    });
  }

  function initExtraMode() {
    var mode = appMode;
    var fetchPromise = extraModesCache
      ? Promise.resolve(extraModesCache)
      : fetch(EXTRA_MODES_FILE).then(function (res) {
        if (!res.ok) {
          throw new Error('No se pudo cargar ' + EXTRA_MODES_FILE);
        }
        return res.json();
      });

    return fetchPromise.then(function (data) {
      extraModesCache = data;
      return withoutFailingStations(flattenExtraMode(data, mode), EXTRA_MODES_FILE);
    }).then(function (modeStations) {
      if (appMode !== mode) {
        return;
      }
      rankByName = null;
      var savedState = loadState();
      stations = applySavedOrder(modeStations, savedState.order);
      renderGrid();
      applyTop3ToDom(savedState.top3);
      updateGridToggleVisibility();
      renderCategoryChips();
    }).catch(function () {
      if (appMode !== mode) {
        return;
      }
      grid.textContent = 'No se pudieron cargar las emisoras de este modo. Volviendo al modo normal…';
      setMode('normal');
    });
  }

  document.addEventListener('visibilitychange', function () {
    document.body.classList.toggle('tab-hidden', document.hidden);
  });

  /* --- Arranque: la web entra siempre en el modo normal --- */

  applyModeClasses();
  updateModeUI();
  loadLogoIndex();
  initCurrentMode();
})();
