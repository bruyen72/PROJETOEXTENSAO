/* ============================================================
   GERENCIADOR OS — Background "Aurora Professional"
   Blobs suaves + partículas leves + brilho respirando
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

  /* ── Blobs aurora ────────────────────────────────────────── */
  const blobs = [
    { xF:.18, yF:.22, r:.38, color:'rgba(22,163,74,',  speed:.00018, phase:0       },
    { xF:.78, yF:.65, r:.42, color:'rgba(34,197,94,',  speed:.00014, phase:2.1     },
    { xF:.50, yF:.88, r:.30, color:'rgba(255,255,255,', speed:.00022, phase:4.3    },
    { xF:.85, yF:.18, r:.28, color:'rgba(16,185,129,',  speed:.00016, phase:1.5    },
    { xF:.10, yF:.70, r:.25, color:'rgba(255,255,255,', speed:.00020, phase:3.7    },
  ];

  /* ── Partículas leves ────────────────────────────────────── */
  let pts = [];

  function spawnPts() {
    const n = window.innerWidth < 768 ? 28 : 50;
    pts = Array.from({ length: n }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     Math.random() * 1.4 + 0.3,
      vx:    (Math.random() - 0.5) * 0.18,
      vy:    -(Math.random() * 0.22 + 0.04),
      alpha: Math.random() * 0.35 + 0.08,
      phase: Math.random() * Math.PI * 2,
      white: Math.random() < 0.3,
    }));
  }

  /* ── Linhas de conexão suaves ────────────────────────────── */
  function drawConnections() {
    const limit = 130;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < limit) {
          const a = 0.06 * (1 - d / limit);
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(34,197,94,${a})`;
          ctx.lineWidth   = 0.6;
          ctx.stroke();
        }
      }
    }
  }

  /* ── Draw ────────────────────────────────────────────────── */
  function draw(ts) {
    ctx.clearRect(0, 0, W, H);

    /* 1. Blobs aurora */
    blobs.forEach(b => {
      b.phase += b.speed * ts;
      const x  = W * b.xF + Math.sin(b.phase * 1.3) * W * 0.06;
      const y  = H * b.yF + Math.cos(b.phase)       * H * 0.06;
      const r  = Math.min(W, H) * b.r;
      const al = 0.055 + 0.025 * Math.sin(b.phase * 0.7);

      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0,   b.color + (al * 1.8).toFixed(3) + ')');
      g.addColorStop(0.5, b.color + (al * 0.8).toFixed(3) + ')');
      g.addColorStop(1,   b.color + '0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    });

    /* 2. Linhas suaves de conexão */
    drawConnections();

    /* 3. Partículas */
    pts.forEach(p => {
      p.phase += 0.018;
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -6)    { p.y = H + 6;  p.x = Math.random() * W; }
      if (p.x < -6)    p.x = W + 6;
      if (p.x > W + 6) p.x = -6;

      const a = p.alpha * (0.7 + 0.3 * Math.sin(p.phase));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.white
        ? `rgba(255,255,255,${a})`
        : `rgba(34,197,94,${a})`;
      ctx.fill();
    });

    /* 4. Vinheta suave nas bordas */
    const vg = ctx.createRadialGradient(
      W / 2, H / 2, Math.min(W, H) * 0.3,
      W / 2, H / 2, Math.max(W, H) * 0.85
    );
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); spawnPts(); });
  resize();
  spawnPts();
  requestAnimationFrame(draw);
})();
