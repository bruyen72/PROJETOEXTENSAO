/* ============================================================
   LOGIN — Animação "Radio Communication"
   Ondas curvas de frequência · Pacotes de sinal · Broadcast
   ============================================================ */

(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    initAll();
  }

  /* ── Ondas de frequência ─────────────────────────────── */
  const WAVE_DEFS = [
    { yFrac:.12, amp:28, freq:.0055, speed:.016, green:220, alpha:.55, thick:1.5 },
    { yFrac:.26, amp:42, freq:.0042, speed:.011, green:163, alpha:.40, thick:1.2 },
    { yFrac:.40, amp:18, freq:.0070, speed:.020, green:197, alpha:.48, thick:1.0 },
    { yFrac:.55, amp:50, freq:.0035, speed:.009, green:163, alpha:.35, thick:1.3 },
    { yFrac:.68, amp:32, freq:.0058, speed:.014, green:220, alpha:.42, thick:1.1 },
    { yFrac:.82, amp:22, freq:.0065, speed:.018, green:185, alpha:.38, thick:1.0 },
    { yFrac:.92, amp:38, freq:.0048, speed:.013, green:163, alpha:.30, thick:1.2 },
  ];

  let waves = [];

  function initAll() {
    waves = WAVE_DEFS.map(d => ({
      ...d,
      phase: Math.random() * Math.PI * 2,
      packets: Array.from({ length: Math.floor(2 + Math.random() * 3) }, () => ({
        t:      Math.random(),       /* posição 0→1 na onda */
        speed:  .0015 + Math.random() * .002,
        size:   2.5 + Math.random() * 2.5,
        bright: Math.random() < .35, /* branco brilhante ou verde */
        trail:  [],
      })),
    }));
  }

  /* ── Nós de broadcast (pontos que pulsam) ────────────── */
  const NODE_COUNT = 6;
  let nodes = [];

  function initNodes() {
    nodes = Array.from({ length: NODE_COUNT }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H,
      phase: Math.random() * Math.PI * 2,
      r:     60 + Math.random() * 80,
      rings: [{ rr: 0, alpha: .6 }],
      timer: Math.random() * 180,
    }));
  }

  /* ── Utilitário: ponto na onda ───────────────────────── */
  function waveY(wave, x) {
    return H * wave.yFrac + Math.sin(x * wave.freq + wave.phase) * wave.amp;
  }

  /* ── Draw ─────────────────────────────────────────────── */
  function draw(ts) {
    ctx.clearRect(0, 0, W, H);

    /* 1. Fundo gradiente */
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0,   '#060f09');
    bg.addColorStop(.5,  '#081608');
    bg.addColorStop(1,   '#050c07');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* 2. Nós de broadcast */
    nodes.forEach(nd => {
      nd.timer--;
      if (nd.timer <= 0) {
        nd.rings.push({ rr: 0, alpha: .55 });
        nd.timer = 120 + Math.random() * 160;
      }

      nd.rings = nd.rings.filter(r => r.alpha > .01);
      nd.rings.forEach(r => {
        r.rr    += 1.2;
        r.alpha -= .004;
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, r.rr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34,197,94,${r.alpha})`;
        ctx.lineWidth   = .9;
        ctx.stroke();
      });

      /* Ponto central pulsante */
      nd.phase += .025;
      const p = .5 + .5 * Math.sin(nd.phase);
      ctx.beginPath();
      ctx.arc(nd.x, nd.y, 2.5 + p, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(74,222,128,${.5 + p * .4})`;
      ctx.fill();
    });

    /* 3. Ondas curvas */
    waves.forEach(wave => {
      wave.phase += wave.speed * .016 * 60;

      /* Linha da onda */
      ctx.beginPath();
      for (let x = 0; x <= W; x += 3) {
        const y = waveY(wave, x);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(34,${wave.green},74,${wave.alpha})`;
      ctx.lineWidth   = wave.thick;
      ctx.stroke();

      /* 4. Pacotes de sinal na onda */
      wave.packets.forEach(pk => {
        pk.t += pk.speed;
        if (pk.t > 1) pk.t = 0;

        const x  = pk.t * W;
        const y  = waveY(wave, x);

        /* Trail */
        pk.trail.push({ x, y });
        if (pk.trail.length > 12) pk.trail.shift();

        pk.trail.forEach((pt, i) => {
          const a = (i / pk.trail.length) * (pk.bright ? .7 : .5) * wave.alpha * 2;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pk.size * (i / pk.trail.length) * .7, 0, Math.PI * 2);
          ctx.fillStyle = pk.bright
            ? `rgba(255,255,255,${a})`
            : `rgba(74,222,128,${a})`;
          ctx.fill();
        });

        /* Ponto principal */
        const glow = ctx.createRadialGradient(x, y, 0, x, y, pk.size * 2.5);
        glow.addColorStop(0, pk.bright ? `rgba(255,255,255,.9)` : `rgba(74,222,128,.85)`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, pk.size * 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, pk.size * .6, 0, Math.PI * 2);
        ctx.fillStyle = pk.bright ? '#fff' : '#4ade80';
        ctx.fill();
      });
    });

    /* 5. Conexões entre nós próximos */
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 240) {
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(34,197,94,${.12 * (1 - d / 240)})`;
          ctx.lineWidth   = .7;
          ctx.stroke();
        }
      }
    }

    /* 6. Vinheta suave */
    const vg = ctx.createRadialGradient(W/2, H/2, H*.2, W/2, H/2, Math.max(W,H)*.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.45)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  initNodes();
  requestAnimationFrame(draw);
})();
