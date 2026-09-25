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
  var SLEEP_MODE_KEY = 'radioMicroSleepMode';
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

  var sleepMode = false;
  var normalStationsCache = null;
  var sleepStationsCache = null;
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
    tuning: '▶ SINTONIZANDO…',
    live: '🔴 EN DIRECTO',
    reconnecting: '🔁 RECONECTANDO…',
    paused: '⏸ EN PAUSA',
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
  var miniPlayerStatus = document.getElementById('mini-player-status');
  var miniPlayerToggle = document.getElementById('mini-player-toggle');
  var miniPlayerVolume = document.getElementById('mini-player-volume');

  var easterEggTrigger = document.getElementById('easter-egg-trigger');
  var easterEggVideoWrap = document.getElementById('easter-egg-video-wrap');

  var sleepModeToggle = document.getElementById('sleep-mode-toggle');
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
    if (playerMode === 'buzzer') {
      document.body.classList.add('has-mini-player');
      miniPlayer.hidden = false;
      miniPlayerName.textContent = BUZZER_NAME;
      miniPlayerName.removeAttribute('lang');
      miniPlayerStatus.textContent = buzzerPaused ? STATUS_LABEL.paused : STATUS_LABEL.live;
      miniPlayerToggle.textContent = buzzerPaused ? '▶' : '⏸';
      miniPlayerToggle.setAttribute('aria-label', buzzerPaused ? 'Reanudar' : 'Pausar');
      return;
    }

    var station = stations[currentIndex];
    document.body.classList.toggle('has-mini-player', !!station);

    if (!station) {
      miniPlayer.hidden = true;
      return;
    }

    miniPlayer.hidden = false;
    miniPlayerName.textContent = station.name;
    if (station.lang) {
      miniPlayerName.lang = station.lang;
    } else {
      miniPlayerName.removeAttribute('lang');
    }
    miniPlayerStatus.textContent = STATUS_LABEL[currentStatus] || station.freq;

    var showResumeIcon = userPaused || currentStatus === STATUS.BLOCKED;
    miniPlayerToggle.textContent = showResumeIcon ? '▶' : '⏸';
    miniPlayerToggle.setAttribute('aria-label', showResumeIcon ? 'Reanudar' : 'Pausar');
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

    if (sleepMode) {
      saveLastSleepStation(station.name);
      updateMediaSession(station);
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
    if (document.visibilityState === 'visible' && sleepMode) {
      if (timerEndAt) {
        tickSleepTimer();
      }
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

  function createCard(station, index) {
    var unavailable = isUnavailable(station);
    var card = document.createElement('div');
    card.className = 'station-card' + (unavailable ? ' is-unavailable' : '') +
      (station.category ? ' category-' + station.category : '');
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
    attachDragHandle(card, handle);

    if (!unavailable) {
      var podiumBtn = document.createElement('button');
      podiumBtn.type = 'button';
      podiumBtn.className = 'podium-add-btn';
      podiumBtn.title = 'Al podio';
      podiumBtn.setAttribute('aria-label', 'Añadir ' + station.name + ' al podio');
      podiumBtn.textContent = '⭐';
      podiumBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        addToPodium(card);
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

    if (sleepMode && station.category && SLEEP_CATEGORY_META[station.category]) {
      var catTag = document.createElement('div');
      catTag.className = 'station-category-tag';
      catTag.textContent = SLEEP_CATEGORY_META[station.category].icon + ' ' + SLEEP_CATEGORY_META[station.category].label;
      content.appendChild(catTag);
    }

    var name = document.createElement('div');
    name.className = 'station-name';
    name.textContent = station.name;
    if (station.lang) {
      name.lang = station.lang;
    }
    content.appendChild(name);

    var freq = document.createElement('div');
    freq.className = 'station-freq';
    freq.textContent = station.freq;
    content.appendChild(freq);

    var status = document.createElement('div');
    status.className = 'station-status ' + (unavailable ? 'status-unavailable' : 'status-idle');
    status.textContent = unavailable ? STATUS_LABEL.unavailable : station.freq;
    content.appendChild(status);

    if (sleepMode && (station.votos || station.bitrate)) {
      var meta = document.createElement('div');
      meta.className = 'station-meta';
      var bits = [];
      if (station.votos) {
        bits.push(station.votos.toLocaleString('es-ES') + ' votos');
      }
      if (station.bitrate) {
        bits.push(station.bitrate + ' kbps');
      }
      meta.textContent = bits.join(' · ');
      content.appendChild(meta);
    }

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
    cards = stations.map(function (station, index) {
      var card = createCard(station, index);
      grid.appendChild(card);
      return card;
    });
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
    // Se comprueba tras el siguiente frame para que el navegador ya haya
    // calculado el alto real de la cuadrícula (scrollHeight) con las tarjetas
    // recién insertadas.
    requestAnimationFrame(function () {
      var overflows = grid.scrollHeight > gridWrap.clientHeight + 4;
      toggleGridBtn.hidden = !overflows;
    });
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
    return sleepMode ? SLEEP_STORAGE_KEY : STORAGE_KEY;
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
    if (sleepMode) {
      // El modo dormir no tiene claves antiguas que migrar: empieza vacío.
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
      if (!sleepMode) {
        window.localStorage.removeItem(LEGACY_ORDER_KEY);
        window.localStorage.removeItem(LEGACY_TOP3_KEY);
      }
    } catch (e) { /* localStorage no disponible; el orden y el podio simplemente no persisten */ }
  }

  /* --- Alternativa táctil al arrastrar: botón "Al podio" en cada tarjeta --- */

  function addToPodium(card) {
    if (card.parentNode && card.parentNode.classList && card.parentNode.classList.contains('podium-drop')) {
      return;
    }
    var sorted = podiumSlots.slice().sort(function (a, b) {
      return (parseInt(a.dataset.rank, 10) || 9) - (parseInt(b.dataset.rank, 10) || 9);
    });
    var emptySlot = sorted.filter(function (s) { return !s.querySelector('.station-card'); })[0];
    var slot = emptySlot || sorted[0];
    var occupant = slot.querySelector('.station-card');
    if (occupant) {
      grid.insertBefore(occupant, grid.firstChild);
    }
    slot.appendChild(card);
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

  function attachDragHandle(card, handle) {
    var state = null;

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
      if (target) {
        var before = clientX < targetRect.left + targetRect.width / 2;
        grid.insertBefore(state.placeholder, before ? target : target.nextSibling);
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

    function onPointerDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) {
        return;
      }
      e.preventDefault();
      var rect = card.getBoundingClientRect();
      var placeholder = document.createElement('div');
      placeholder.className = 'drag-placeholder';
      placeholder.style.width = rect.width + 'px';
      placeholder.style.height = rect.height + 'px';
      card.parentNode.insertBefore(placeholder, card);

      state = {
        pointerId: e.pointerId,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        placeholder: placeholder
      };

      card.classList.add('dragging');
      card.style.position = 'fixed';
      card.style.width = rect.width + 'px';
      card.style.height = rect.height + 'px';
      updateCardPosition(e.clientX, e.clientY);
      activeDragUpdate = updateDragTarget;
      startAutoScroll(e.clientX, e.clientY);

      try { handle.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
    }

    function onPointerMove(e) {
      if (!state || e.pointerId !== state.pointerId) {
        return;
      }
      updateAutoScrollPointer(e.clientX, e.clientY);
      updateDragTarget(e.clientX, e.clientY);
    }

    function onPointerEnd(e) {
      if (!state || e.pointerId !== state.pointerId) {
        return;
      }
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
      try { handle.releasePointerCapture(state.pointerId); } catch (err) { /* noop */ }
      state = null;
      saveState();
    }

    handle.addEventListener('pointerdown', onPointerDown);
    handle.addEventListener('pointermove', onPointerMove);
    handle.addEventListener('pointerup', onPointerEnd);
    handle.addEventListener('pointercancel', onPointerEnd);
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

  function saveSleepModePref() {
    try { window.localStorage.setItem(SLEEP_MODE_KEY, sleepMode ? '1' : '0'); } catch (e) { /* noop */ }
  }

  function loadSleepModePref() {
    try { return window.localStorage.getItem(SLEEP_MODE_KEY) === '1'; } catch (e) { return false; }
  }

  function saveLastSleepStation(name) {
    try { window.localStorage.setItem(SLEEP_LAST_KEY, name); } catch (e) { /* noop */ }
  }

  function updateModeUI() {
    if (sleepModeToggle) {
      sleepModeToggle.textContent = sleepMode ? '☀️ Modo normal' : '🌙 Modo dormir';
      sleepModeToggle.setAttribute('aria-pressed', sleepMode ? 'true' : 'false');
      sleepModeToggle.setAttribute('aria-label', sleepMode ? 'Volver al modo normal' : 'Activar modo dormir');
    }
    if (titleMainEl) {
      titleMainEl.textContent = sleepMode ? 'SONIDOS' : 'RADIOS DE ESPAÑA';
    }
    if (titleSubEl) {
      titleSubEl.textContent = sleepMode ? 'PARA DORMIR' : 'SIN MICROCORTES';
    }
    if (taglineEl) {
      taglineEl.textContent = sleepMode
        ? 'Cierra los ojos y déjate llevar.'
        : 'Elige tu emisora y suena, aunque falle la conexión.';
    }
    if (top3TitleEl) {
      top3TitleEl.textContent = sleepMode ? '🌙 TOP 3 PARA DORMIR' : '🏆 TOP 3';
    }
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', sleepMode ? '#0b1026' : '#1a0b2e');
    }
    if (sleepTimerWrap) {
      sleepTimerWrap.hidden = !sleepMode;
    }
    if (!sleepMode && sleepChipsWrap) {
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
    sleepChipsWrap.innerHTML = '';
    sleepChipsWrap.hidden = !sleepMode;
    if (!sleepMode) {
      return;
    }
    activeCategoryFilter = 'all';
    sleepChipsWrap.appendChild(makeCategoryChip('all', 'Todas'));
    SLEEP_CATEGORY_ORDER.forEach(function (id) {
      var meta = SLEEP_CATEGORY_META[id];
      sleepChipsWrap.appendChild(makeCategoryChip(id, meta.icon + ' ' + meta.label));
    });
    applyCategoryFilter();
  }

  function makeCategoryChip(id, label) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sleep-chip' + (activeCategoryFilter === id ? ' is-active' : '');
    btn.textContent = label;
    btn.addEventListener('click', function () {
      activeCategoryFilter = id;
      Array.prototype.forEach.call(sleepChipsWrap.children, function (c) { c.classList.remove('is-active'); });
      btn.classList.add('is-active');
      applyCategoryFilter();
    });
    return btn;
  }

  function applyCategoryFilter() {
    cards.forEach(function (card, i) {
      var station = stations[i];
      var show = activeCategoryFilter === 'all' || (station && station.category === activeCategoryFilter);
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
    sleepContinueBtn.textContent = '▶ Continuar: ' + name;
    sleepContinueBtn.onclick = function () {
      sleepContinueBtn.hidden = true;
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

  /* --- Media Session (control desde la pantalla de bloqueo) --- */

  function updateMediaSession(station) {
    if (!('mediaSession' in navigator)) {
      return;
    }
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: station.name,
        artist: station.category && SLEEP_CATEGORY_META[station.category]
          ? SLEEP_CATEGORY_META[station.category].label
          : 'Radios de España'
      });
      navigator.mediaSession.setActionHandler('play', function () {
        if (currentIndex !== -1) {
          togglePauseResume();
        }
      });
      navigator.mediaSession.setActionHandler('pause', function () {
        if (currentIndex !== -1) {
          togglePauseResume();
        }
      });
      navigator.mediaSession.setActionHandler('stop', function () {
        if (currentIndex !== -1) {
          togglePauseResume();
        }
      });
    } catch (e) { /* noop: Media Session no disponible en este navegador */ }
  }

  /* --- Cambio de modo --- */

  function setSleepMode(enabled, skipSave) {
    if (sleepMode === enabled) {
      return;
    }
    // Se guarda el orden y el podio del modo que se abandona, con su propia
    // clave, antes de cambiar. Solo si ya hay tarjetas pintadas: si la carga
    // anterior no había terminado se guardaría un estado vacío.
    if (cards.length) {
      saveState();
    }
    stopPlayback();
    currentIndex = -1;
    currentStatus = STATUS.IDLE;
    userPaused = false;
    clearScreenDim();
    releaseWakeLock();
    clearSleepTimer(false);
    if (miniPlayer) {
      miniPlayer.hidden = true;
    }
    document.body.classList.remove('has-mini-player');

    sleepMode = enabled;
    document.body.classList.toggle('sleep-mode', sleepMode);
    updateModeUI();
    if (!skipSave) {
      saveSleepModePref();
    }

    if (sleepMode) {
      initSleepMode();
    } else {
      initNormalMode();
    }
  }

  if (sleepModeToggle) {
    sleepModeToggle.addEventListener('click', function () {
      setSleepMode(!sleepMode);
    });
  }

  /* --- Carga de datos por modo --- */

  function initNormalMode() {
    var fetchPromise = normalStationsCache
      ? Promise.resolve(normalStationsCache)
      : fetch('stations.json').then(function (res) { return res.json(); });

    return fetchPromise.then(function (data) {
      normalStationsCache = data;
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
      }).then(flattenSleepData);

    return fetchPromise.then(function (flat) {
      sleepStationsCache = flat;
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
      grid.textContent = 'No se pudieron cargar las emisoras para dormir. Volviendo al modo normal…';
      setSleepMode(false, true);
    });
  }

  document.addEventListener('visibilitychange', function () {
    document.body.classList.toggle('tab-hidden', document.hidden);
  });

  /* --- Arranque --- */

  sleepMode = loadSleepModePref();
  document.body.classList.toggle('sleep-mode', sleepMode);
  updateModeUI();
  if (sleepMode) {
    initSleepMode();
  } else {
    initNormalMode();
  }
})();
