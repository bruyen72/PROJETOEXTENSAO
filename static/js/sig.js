/** sig.js — Assinaturas digitais em canvas (touch + mouse) */

function initSig(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* sigData fica no próprio elemento para clearSig poder apagá-lo */
  canvas._sigData = null;

  function applyStyles() {
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return; /* canvas invisível — ignora */

    const dpr = window.devicePixelRatio || 1;
    const nw  = Math.round(rect.width  * dpr);
    const nh  = Math.round(rect.height * dpr);

    /* evita loop: só redesenha se dimensão mudou de verdade */
    if (canvas.width === nw && canvas.height === nh) return;

    canvas.width  = nw;
    canvas.height = nh;
    ctx.scale(dpr, dpr);
    applyStyles();

    /* restaura assinatura salva (sem race condition) */
    if (canvas._sigData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        applyStyles();
      };
      img.src = canvas._sigData;
    }
  }

  /* debounce: espera 120ms após último resize antes de agir */
  let _resizeTimer;
  function debouncedResize() {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(resize, 120);
  }

  requestAnimationFrame(resize);
  window.addEventListener('resize', debouncedResize);

  /* ── Captura de pontos ──────────────────────────────────── */
  let drawing = false, lx = 0, ly = 0;

  function pos(e) {
    const r = canvas.getBoundingClientRect();
    return e.touches
      ? { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top }
      : { x: e.clientX - r.left,            y: e.clientY - r.top };
  }

  function start(e) {
    e.preventDefault();
    drawing = true;
    const p = pos(e); lx = p.x; ly = p.y;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = '#f1f5f9';
    ctx.fill();
  }

  function draw(e) {
    e.preventDefault();
    if (!drawing) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(p.x, p.y);
    applyStyles();
    ctx.stroke();
    lx = p.x; ly = p.y;
  }

  function end(e) {
    if (e) e.preventDefault();
    if (!drawing) return;
    drawing = false;
    /* salva APENAS quando o traço termina — sem race condition */
    canvas._sigData = canvas.toDataURL('image/png');
  }

  canvas.addEventListener('mousedown',  start);
  canvas.addEventListener('mousemove',  draw);
  canvas.addEventListener('mouseup',    end);
  canvas.addEventListener('mouseleave', end);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove',  draw,  { passive: false });
  canvas.addEventListener('touchend',   end,   { passive: false });
}

function clearSig(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  canvas._sigData = null; /* apaga o dado salvo também */
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

function getSigBase64(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return '';
  /* prefere o dado salvo (mais confiável que o buffer atual) */
  return canvas._sigData || canvas.toDataURL('image/png');
}
