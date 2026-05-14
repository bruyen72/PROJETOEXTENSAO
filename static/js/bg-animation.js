/* ============================================================
   GERENCIADOR OS — Background Animation "Radio Signal"
   Radar sweep · Pulse rings · Signal waves · Particles
   ============================================================ */

(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, cx, cy;

  /* ── Resize ─────────────────────────────────────────────── */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    cx = W / 2;
    cy = H / 2;
  }

  /* ── Particles ──────────────────────────────────────────── */
  let pts = [];

  function spawnParticles() {
    pts = Array.from({ length: window.innerWidth < 768 ? 45 : 80 }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     Math.random() * 1.8 + 0.4,
      vx:    (Math.random() - 0.5) * 0.22,
      vy:    -(Math.random() * 0.45 + 0.06),
      alpha: Math.random() * 0.55 + 0.12,
      phase: Math.random() * Math.PI * 2,
      white: Math.random() < 0.18, /* 18 % are white/silver */
    }));
  }

  /* ── Rings ──────────────────────────────────────────────── */
  const rings = [];
  let  lastRing = -3000;

  /* ── Signal Waves ───────────────────────────────────────── */
  const waves = [
    { yFrac: 0.20, amp: 10, freq: 0.010, speed: 0.018, alpha: 0.10, width: 1   },
    { yFrac: 0.42, amp: 16, freq: 0.008, speed: 0.013, alpha: 0.14, width: 1.2 },
    { yFrac: 0.65, amp: 9,  freq: 0.013, speed: 0.020, alpha: 0.09, width: 1   },
    { yFrac: 0.83, amp: 14, freq: 0.007, speed: 0.011, alpha: 0.12, width: 1.2 },
  ];
  waves.forEach((w, i) => { w.phase = i * 1.8; });

  /* ── Radar angle ────────────────────────────────────────── */
  let sweepAngle = 0;

  /* ── Vertical scan line ─────────────────────────────────── */
  let scanX = 0;

  /* ═══════════════════════════════════════════════════════
     DRAW
  ═══════════════════════════════════════════════════════ */
  function draw(ts) {
    ctx.clearRect(0, 0, W, H);

    /* ─── 1. Dot grid ──────────────────────────────────── */
    const gs = 58;
    for (let x = 0; x <= W + gs; x += gs) {
      for (let y = 0; y <= H + gs; y += gs) {
        const d  = Math.hypot(x - cx, y - cy);
        const a  = 0.055 * Math.max(0, 1 - d / (Math.max(W, H) * 0.65));
        ctx.beginPath();
        ctx.arc(x, y, 1.1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,230,118,${a + 0.018})`;
        ctx.fill();
      }
    }

    /* ─── 2. Ambient center glow ───────────────────────── */
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.55);
    cg.addColorStop(0,   'rgba(0,230,118,.07)');
    cg.addColorStop(0.5, 'rgba(0,230,118,.025)');
    cg.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = cg;
    ctx.fillRect(0, 0, W, H);

    /* ─── 3. Radar sweep ───────────────────────────────── */
    sweepAngle += 0.0055;
    const sweepR = Math.max(W, H) * 0.9;

    ctx.save();
    ctx.translate(cx, cy);

    /* Trailing arc glow (fanning) */
    const trailSteps = 38;
    for (let i = 0; i < trailSteps; i++) {
      const a  = sweepAngle - i * 0.022;
      const al = (1 - i / trailSteps) * 0.16;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, sweepR, a, a + 0.023);
      ctx.closePath();
      ctx.fillStyle = `rgba(0,230,118,${al})`;
      ctx.fill();
    }

    /* Main sweep line */
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(sweepAngle) * sweepR, Math.sin(sweepAngle) * sweepR);
    ctx.strokeStyle = 'rgba(0,230,118,.85)';
    ctx.lineWidth = 1.6;
    ctx.shadowColor = '#00e676';
    ctx.shadowBlur  = 12;
    ctx.stroke();
    ctx.shadowBlur  = 0;

    ctx.restore();

    /* ─── 4. Pulse rings ───────────────────────────────── */
    if (ts - lastRing > 2600) {
      rings.push({ r: 0 });
      lastRing = ts;
    }

    const maxR = Math.max(W, H) * 0.72;
    for (let i = rings.length - 1; i >= 0; i--) {
      const rg = rings[i];
      rg.r += 1.6;
      const alpha = 0.55 * Math.max(0, 1 - rg.r / maxR);
      if (alpha <= 0.006) { rings.splice(i, 1); continue; }

      ctx.beginPath();
      ctx.arc(cx, cy, rg.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,230,118,${alpha})`;
      ctx.lineWidth   = 1.3;
      ctx.shadowColor = '#00e676';
      ctx.shadowBlur  = 6;
      ctx.stroke();
      ctx.shadowBlur  = 0;
    }

    /* ─── 5. Signal wave lines ─────────────────────────── */
    waves.forEach(w => {
      w.phase += w.speed;
      const baseY = H * w.yFrac;

      ctx.beginPath();
      for (let x = 0; x <= W; x += 4) {
        const y = baseY + Math.sin(x * w.freq + w.phase) * w.amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(0,230,118,${w.alpha})`;
      ctx.lineWidth   = w.width;
      ctx.stroke();

      /* White glint on crest every ~6 s */
      const crestX = ((ts * w.speed * 60) % W + W) % W;
      const crestY = baseY + Math.sin(crestX * w.freq + w.phase) * w.amp;
      const wg = ctx.createRadialGradient(crestX, crestY, 0, crestX, crestY, 18);
      wg.addColorStop(0,   'rgba(255,255,255,.28)');
      wg.addColorStop(0.4, 'rgba(0,230,118,.15)');
      wg.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = wg;
      ctx.fillRect(crestX - 18, crestY - 18, 36, 36);
    });

    /* ─── 6. Vertical scan line ────────────────────────── */
    scanX = (scanX + 0.55) % W;
    const sg = ctx.createLinearGradient(scanX - 60, 0, scanX + 2, 0);
    sg.addColorStop(0,   'rgba(255,255,255,0)');
    sg.addColorStop(0.7, 'rgba(0,230,118,.06)');
    sg.addColorStop(1,   'rgba(255,255,255,.12)');
    ctx.fillStyle = sg;
    ctx.fillRect(scanX - 60, 0, 62, H);

    /* ─── 7. Particles ─────────────────────────────────── */
    pts.forEach(p => {
      p.phase += 0.028;
      p.x += p.vx;
      p.y += p.vy;

      if (p.y < -8)  { p.y = H + 8;  p.x = Math.random() * W; }
      if (p.x < -8)  p.x = W + 8;
      if (p.x > W + 8) p.x = -8;

      const a    = p.alpha * (0.65 + 0.35 * Math.sin(p.phase));
      const color = p.white ? `rgba(220,255,230,${a})` : `rgba(0,230,118,${a})`;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = color;

      if (p.r > 1.3 || p.white) {
        ctx.shadowColor = p.white ? 'rgba(255,255,255,.6)' : '#00e676';
        ctx.shadowBlur  = p.white ? 8 : 6;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    /* ─── 8. Edge vignette ──────────────────────────────── */
    const vg = ctx.createRadialGradient(cx, cy, Math.min(W,H)*0.35, cx, cy, Math.max(W,H)*0.85);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,4,0,.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    requestAnimationFrame(draw);
  }

  /* ── Init ────────────────────────────────────────────────── */
  window.addEventListener('resize', () => {
    resize();
    spawnParticles();
  });

  resize();
  spawnParticles();
  rings.push({ r: 0 });
  lastRing = 0;
  requestAnimationFrame(draw);
})();
