/* ============================================================
   LOGIN — Animação "Radio Signal Overlay"
   Overlay sobre vídeo: ondas de frequência + pacotes de sinal
   ============================================================ */

(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    initWaves();
  }

  /* ── Ondas de frequência ──────────────────────────────── */
  const DEFS = [
    { yFrac:.15, amp:22, freq:.006,  speed:.014, alpha:.45, thick:1.4 },
    { yFrac:.30, amp:38, freq:.0045, speed:.010, alpha:.35, thick:1.1 },
    { yFrac:.48, amp:16, freq:.008,  speed:.018, alpha:.40, thick:1.2 },
    { yFrac:.64, amp:44, freq:.0038, speed:.008, alpha:.30, thick:1.0 },
    { yFrac:.79, amp:28, freq:.007,  speed:.015, alpha:.38, thick:1.1 },
    { yFrac:.92, amp:18, freq:.005,  speed:.012, alpha:.25, thick:0.9 },
  ];

  let waves = [];

  function initWaves() {
    waves = DEFS.map(d => ({
      ...d,
      phase: Math.random() * Math.PI * 2,
      packets: Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => ({
        t:      Math.random(),
        speed:  .0012 + Math.random() * .0018,
        size:   2.8 + Math.random() * 2.5,
        white:  Math.random() < .4,
        trail:  [],
      })),
    }));
  }

  function waveY(wave, x) {
    return H * wave.yFrac + Math.sin(x * wave.freq + wave.phase) * wave.amp;
  }

  /* ── Nós de broadcast ────────────────────────────────── */
  let nodes = [];

  function initNodes() {
    nodes = Array.from({ length: 5 }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H,
      phase: Math.random() * Math.PI * 2,
      rings: [],
      timer: Math.random() * 100,
    }));
  }

  /* ── Draw ─────────────────────────────────────────────── */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* 1. Overlay escuro sobre o vídeo para contraste */
    const ov = ctx.createLinearGradient(0, 0, 0, H);
    ov.addColorStop(0,   'rgba(3,10,5,.62)');
    ov.addColorStop(.4,  'rgba(4,12,6,.50)');
    ov.addColorStop(1,   'rgba(2,8,4,.68)');
    ctx.fillStyle = ov;
    ctx.fillRect(0, 0, W, H);

    /* 2. Nós de broadcast */
    nodes.forEach(nd => {
      nd.timer--;
      if (nd.timer <= 0) {
        nd.rings.push({ r: 0, a: .55 });
        nd.timer = 110 + Math.random() * 140;
      }
      nd.rings = nd.rings.filter(r => r.a > .008);
      nd.rings.forEach(r => {
        r.r += 1.3; r.a -= .0045;
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, r.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34,197,94,${r.a})`;
        ctx.lineWidth   = 1;
        ctx.stroke();
      });
      nd.phase += .022;
      const p = .5 + .5 * Math.sin(nd.phase);
      ctx.beginPath();
      ctx.arc(nd.x, nd.y, 2 + p * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(74,222,128,${.55 + p * .3})`;
      ctx.fill();
    });

    /* 3. Ondas curvas */
    waves.forEach(wave => {
      wave.phase += wave.speed * .016 * 60;

      ctx.beginPath();
      for (let x = 0; x <= W; x += 3) {
        const y = waveY(wave, x);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(34,197,94,${wave.alpha})`;
      ctx.lineWidth   = wave.thick;
      ctx.stroke();

      /* 4. Pacotes de sinal */
      wave.packets.forEach(pk => {
        pk.t += pk.speed;
        if (pk.t > 1) { pk.t = 0; pk.trail = []; }

        const x = pk.t * W;
        const y = waveY(wave, x);

        pk.trail.push({ x, y });
        if (pk.trail.length > 10) pk.trail.shift();

        pk.trail.forEach((pt, i) => {
          const frac = i / pk.trail.length;
          const a    = frac * (pk.white ? .65 : .50) * wave.alpha * 2.2;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pk.size * frac * .65, 0, Math.PI * 2);
          ctx.fillStyle = pk.white
            ? `rgba(255,255,255,${a})`
            : `rgba(74,222,128,${a})`;
          ctx.fill();
        });

        /* Brilho */
        const g = ctx.createRadialGradient(x, y, 0, x, y, pk.size * 2.8);
        g.addColorStop(0, pk.white ? 'rgba(255,255,255,.85)' : 'rgba(74,222,128,.75)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, pk.size * 2.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, pk.size * .55, 0, Math.PI * 2);
        ctx.fillStyle = pk.white ? '#fff' : '#4ade80';
        ctx.fill();
      });
    });

    /* 5. Vinheta nas bordas */
    const vg = ctx.createRadialGradient(W/2, H/2, H*.22, W/2, H/2, Math.max(W,H)*.82);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  initNodes();
  requestAnimationFrame(draw);
})();
