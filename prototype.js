(function () {
  const radar = document.getElementById('radar');
  const edgeTop = document.getElementById('edge-top');
  const edgeRight = document.getElementById('edge-right');
  const edgeBottom = document.getElementById('edge-bottom');
  const edgeLeft = document.getElementById('edge-left');
  const videoFrame = document.getElementById('video-frame');
  const videoInput = document.getElementById('video-url');
  const loadVideoBtn = document.getElementById('load-video');
  const videoError = document.getElementById('video-error');

  if (!radar) return;

  const buttons = document.querySelectorAll('[data-event]');

  const SOUND_CONFIG = {
    footsteps: {
      className: 'sound-ping--footsteps',
      radiusRange: [20, 50],
      angleRange: [200, 340], // behind / flanks
    },
    gunshot: {
      className: 'sound-ping--gunshot',
      radiusRange: [40, 80],
      angleRange: [300, 60], // right side arc
      edge: edgeRight,
      edgeClass: 'edge-indicator--gunshot',
    },
    explosion: {
      className: 'sound-ping--explosion',
      radiusRange: [60, 90],
      // behind the player on this prototype = bottom arc (~90deg)
      angleRange: [60, 120],
      edge: edgeBottom,
      edgeClass: 'edge-indicator--explosion',
    },
    voice: {
      className: 'sound-ping--voice',
      radiusRange: [30, 70],
      angleRange: [120, 240], // left arc
      edge: edgeLeft,
      edgeClass: 'edge-indicator--voice',
    },
    reload: {
      className: 'sound-ping--reload',
      radiusRange: [15, 35],
      angleRange: [0, 360],
    },
  };

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function toCartesian(radiusPercent, angleDeg) {
    const r = (radiusPercent / 100) * 0.5; // scale within radar
    const rad = (angleDeg * Math.PI) / 180;
    const x = 50 + Math.cos(rad) * r * 100;
    const y = 50 + Math.sin(rad) * r * 100;
    return { x, y };
  }

  function spawnPing(type) {
    const config = SOUND_CONFIG[type];
    if (!config) return;

    const radius = randomBetween(config.radiusRange[0], config.radiusRange[1]);
    let angle;
    if (config.angleRange[0] <= config.angleRange[1]) {
      angle = randomBetween(config.angleRange[0], config.angleRange[1]);
    } else {
      // range wraps around 360
      const span = (360 - config.angleRange[0]) + config.angleRange[1];
      angle = config.angleRange[0] + Math.random() * span;
      if (angle >= 360) angle -= 360;
    }

    const { x, y } = toCartesian(radius, angle);

    const ping = document.createElement('div');
    ping.className = `sound-ping ${config.className}`;
    ping.style.left = `${x}%`;
    ping.style.top = `${y}%`;

    radar.appendChild(ping);

    const duration = type === 'explosion' ? 1500 : type === 'gunshot' ? 700 : 1300;
    setTimeout(() => {
      ping.remove();
    }, duration);

    if (config.edge && config.edgeClass) {
      triggerEdge(config.edge, config.edgeClass);
    }
  }

  function triggerEdge(el, className) {
    if (!el) return;
    // Preserve positional classes (top/right/bottom/left) and only toggle effect-specific classes
    el.classList.add(className, 'edge-indicator--active');
    setTimeout(() => {
      el.classList.remove(className, 'edge-indicator--active');
    }, 550);
  }

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-event');
      // For footsteps and reload, spawn several subtle pings
      if (type === 'footsteps' || type === 'reload') {
        const count = type === 'footsteps' ? 3 : 2;
        for (let i = 0; i < count; i++) {
          setTimeout(() => spawnPing(type), i * 170);
        }
      } else {
        spawnPing(type);
      }
    });
  });

  // --- Video loader ---
  function parseYouTubeId(url) {
    try {
      const u = new URL(url);
      // Shorts
      if (u.hostname.includes('youtube.com') && u.pathname.startsWith('/shorts/')) {
        return u.pathname.split('/')[2];
      }
      if (u.hostname === 'youtu.be') {
        return u.pathname.slice(1);
      }
      if (u.hostname.includes('youtube.com')) {
        if (u.pathname === '/watch') {
          return u.searchParams.get('v');
        }
        const parts = u.pathname.split('/');
        const idx = parts.indexOf('embed');
        if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
      }
    } catch (_) {
      return null;
    }
    return null;
  }

  function setVideo(id) {
    if (!videoFrame || !id) return;
    // Use youtube-nocookie to reduce cookie-related restrictions
    const src = `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1`;
    videoFrame.src = src;
    if (videoError) videoError.textContent = '';
  }

  if (loadVideoBtn && videoInput) {
    loadVideoBtn.addEventListener('click', () => {
      const id = parseYouTubeId(videoInput.value.trim());
      if (id) {
        setVideo(id);
      } else if (videoError) {
        videoError.textContent = 'Could not parse a YouTube video ID from that URL.';
      }
    });
  }
})();
