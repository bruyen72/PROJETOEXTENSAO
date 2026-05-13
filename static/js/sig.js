/** sig.js — Assinaturas digitais em canvas (touch + mouse) */

function initSig(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr  = window.devicePixelRatio || 1;
    const data = canvas.toDataURL();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
    img.src = data;
  }

  requestAnimationFrame(resize);
  window.addEventListener('resize', resize);

  let drawing = false, lx = 0, ly = 0;

  function pos(e) {
    const r = canvas.getBoundingClientRect();
    return e.touches
      ? { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top }
      : { x: e.clientX - r.left,            y: e.clientY - r.top };
  }

  function start(e) {
    e.preventDefault(); drawing = true;
    const p = pos(e); lx = p.x; ly = p.y;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.2, 0, Math.PI*2);
    ctx.fillStyle = '#f1f5f9'; ctx.fill();
  }

  function draw(e) {
    e.preventDefault();
    if (!drawing) return;
    const p = pos(e);
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 2.5;
    ctx.lineCap = 'round'; ctx.stroke();
    lx = p.x; ly = p.y;
  }

  function end(e) { if (e) e.preventDefault(); drawing = false; }

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
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

function getSigBase64(canvasId) {
  const canvas = document.getElementById(canvasId);
  return canvas ? canvas.toDataURL('image/png') : '';
}
