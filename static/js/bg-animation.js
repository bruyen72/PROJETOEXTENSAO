/* ============================================================
   GERENCIADOR OS — Background "Radio Frequency Professional"
   Grid técnico · Anéis de broadcast · Espectro de frequência
   ============================================================ */

(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  /* ── Anéis de broadcast (canto superior direito) ──────── */
  const rings = [];
  let lastRing = 0;

  const SRC_X = () => W * 0.88;
  const SRC_Y = () => H * 0.12;

  /* ── Linhas de frequência horizontal ─────────────────── */
  const freqLines = [
    { yFrac:.28, segs:[], speed:.012, alpha:.13, height:18 },
    { yFrac:.55, segs:[], speed:.009, alpha:.10, height:14 },
    { yFrac:.78, segs:[], speed:.014, alpha:.11, height:16 },
  ];

  function initFreqSegs(line) {
    line.segs = Array.from({ length: Math.ceil(W / 6) + 2 }, (_, i) => ({
      x:  i * 6,
      h:  Math.random() * line.height + 2,
      phase: Math.random() * Math.PI * 2,
      speed: line.speed * (0.8 + Math.random() * 0.4),
    }));
  }

  /* ── Partículas ───────────────────────────────────────── */
  let pts = [];

  function spawnPts() {
    const n = window.innerWidth < 768 ? 30 : 55;
    pts = Array.from({ length: n }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     Math.random() * 1.5 + 0.3,
      vx:    (Math.random() - 0.5) * 0.15,
      vy:    -(Math.random() * 0.25 + 0.04),
      alpha: Math.random() * 0.40 + 0.08,
      phase: Math.random() * Math.PI * 2,
      white: Math.random() < 0.22,
    }));
  }

  /* ── Draw ─────────────────────────────────────────────── */
  function draw(ts) {
    ctx.clearRect(0, 0, W, H);

    /* 1. Grid técnico de pontos */
    const gs = 52;
    for (let x = 0; x <= W + gs; x += gs) {
      for (let y = 0; y <= H + gs; y += gs) {
        const dx = x - SRC_X();
        const dy = y - SRC_Y();
        const d  = Math.sqrt(dx * dx + dy * dy);
        const a  = Math.max(0, 0.07 - d / (Math.max(W, H) * 3));
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(22,163,74,${a + 0.02})`;
        ctx.fill();
      }
    }

    /* 2. Linhas de grade horizontal (sutis) */
    for (let y = gs; y < H; y += gs) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.strokeStyle = 'rgba(22,163,74,.03)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    for (let x = gs; x < W; x += gs) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.strokeStyle = 'rgba(22,163,74,.025)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* 3. Anéis de broadcast */
    if (ts - lastRing > 2200) {
      rings.push({ r: 0 });
      lastRing = ts;
    }

    const maxR = Math.max(W, H) * 1.1;
    const sx = SRC_X(), sy = SRC_Y();

    for (let i = rings.length - 1; i >= 0; i--) {
      const rg  = rings[i];
      rg.r += 1.4;
      const a = 0.45 * Math.max(0, 1 - rg.r / maxR);
      if (a <= 0.005) { rings.splice(i, 1); continue; }

      ctx.beginPath();
      ctx.arc(sx, sy, rg.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(22,163,74,${a})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* Ponto central do broadcast */
    const pulse = 0.5 + 0.5 * Math.sin(ts * 0.003);
    const pg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 24 + pulse * 8);
    pg.addColorStop(0,   `rgba(34,197,94,${0.5 + pulse * 0.3})`);
    pg.addColorStop(0.4, `rgba(22,163,74,${0.2 + pulse * 0.1})`);
    pg.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = pg;
    ctx.fillRect(sx - 32, sy - 32, 64, 64);

    ctx.beginPath();
    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(74,222,128,${0.8 + pulse * 0.2})`;
    ctx.fill();

    /* 4. Espectro de frequência */
    freqLines.forEach(line => {
      const baseY = H * line.yFrac;
      ctx.beginPath();
      line.segs.forEach(seg => {
        seg.phase += seg.speed;
        const h = seg.h * (0.4 + 0.6 * Math.abs(Math.sin(seg.phase)));
        const y = baseY - h / 2;
        if (seg === line.segs[0]) ctx.moveTo(seg.x, baseY);
        ctx.lineTo(seg.x, baseY - h);
        ctx.lineTo(seg.x + 3, baseY - h);
        ctx.lineTo(seg.x + 3, baseY);
      });
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, baseY - line.height, 0, baseY);
      grad.addColorStop(0, `rgba(34,197,94,${line.alpha * 1.4})`);
      grad.addColorStop(1, `rgba(22,163,74,${line.alpha * 0.4})`);
      ctx.fillStyle = grad;
      ctx.fill();

      /* Linha de base */
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      ctx.lineTo(W, baseY);
      ctx.strokeStyle = `rgba(22,163,74,${line.alpha * 0.8})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });

    /* 5. Partículas */
    pts.forEach(p => {
      p.phase += 0.02;
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; }
      if (p.x < -6) p.x = W + 6;
      if (p.x > W + 6) p.x = -6;

      const a = p.alpha * (0.65 + 0.35 * Math.sin(p.phase));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.white
        ? `rgba(255,255,255,${a * 0.8})`
        : `rgba(34,197,94,${a})`;
      ctx.fill();
    });

    /* 6. Vinheta */
    const vg = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*.28, W/2, H/2, Math.max(W,H)*.9);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.50)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => {
    resize();
    spawnPts();
    freqLines.forEach(l => initFreqSegs(l));
  });

  resize();
  spawnPts();
  freqLines.forEach(l => initFreqSegs(l));
  rings.push({ r: 0 });
  lastRing = 0;
  requestAnimationFrame(draw);
})();
