(function () {
  'use strict';

  var HLS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.15/hls.min.js';
  var RETRY_INTERVAL_MS = 3500;
  var WATCHDOG_INTERVAL_MS = 5000;

  var STATUS = {
    IDLE: 'idle',
    TUNING: 'tuning',
    LIVE: 'live',
    RECONNECTING: 'reconnecting',
    PAUSED: 'paused',
    UNAVAILABLE: 'unavailable'
  };

  var STATUS_LABEL = {
    tuning: '▶ SINTONIZANDO…',
    live: '🔴 EN DIRECTO',
    reconnecting: '🔁 RECONECTANDO…',
    paused: '⏸ EN PAUSA',
    unavailable: '⚠ NO DISPONIBLE AQUÍ'
  };

  var audio = document.getElementById('audio-player');
  var grid = document.getElementById('stations-grid');

  var stations = [];
  var cards = [];
  var currentIndex = -1;
  var currentStatus = STATUS.IDLE;
  var userPaused = false;

  var hls = null;
  var hlsLoadPromise = null;

  var retryTimer = null;
  var watchdogTimer = null;
  var lastCurrentTime = 0;
  var reconnecting = false;

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
  }

  function playStation(index) {
    var station = stations[index];
    if (!station || isUnavailable(station)) {
      return;
    }

    if (currentIndex === index && !userPaused && currentStatus !== STATUS.IDLE) {
      // Ya es la emisora activa: pulsar de nuevo la pausa/reanuda.
      togglePauseResume();
      return;
    }

    stopPlayback();
    currentIndex = index;
    userPaused = false;
    setStatus(STATUS.TUNING);

    startStream(station);
    startWatchdog();
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
      playPromise.catch(function () {
        // El navegador rechazó el play (p.ej. mientras se reconecta); el watchdog/reintento se encarga.
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
    }
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
    setStatus(STATUS.LIVE);
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

  function createCard(station, index) {
    var unavailable = isUnavailable(station);
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'station-card' + (unavailable ? ' is-unavailable' : '');

    var name = document.createElement('div');
    name.className = 'station-name';
    name.textContent = station.name;
    card.appendChild(name);

    var freq = document.createElement('div');
    freq.className = 'station-freq';
    freq.textContent = station.freq;
    card.appendChild(freq);

    var status = document.createElement('div');
    status.className = 'station-status ' + (unavailable ? 'status-unavailable' : 'status-idle');
    status.textContent = unavailable ? STATUS_LABEL.unavailable : station.freq;
    card.appendChild(status);

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
      card.disabled = false;
      card.addEventListener('click', function () {
        window.open(station.officialUrl, '_blank', 'noopener,noreferrer');
      });
    } else {
      card.addEventListener('click', function () {
        playStation(index);
      });
    }

    return card;
  }

  function renderGrid() {
    grid.innerHTML = '';
    cards = stations.map(function (station, index) {
      var card = createCard(station, index);
      grid.appendChild(card);
      return card;
    });
  }

  fetch('stations.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      stations = data;
      renderGrid();
    })
    .catch(function () {
      grid.textContent = 'No se pudo cargar la lista de emisoras.';
    });
})();
