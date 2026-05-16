/** sig.js — Assinaturas digitais usando signature_pad (szimek/signature_pad) */

const _pads = {}; // armazena instâncias { canvasId: SignaturePad }

function initSig(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof SignaturePad === 'undefined') return;

  /* Ajusta o canvas para o tamanho real do elemento (HiDPI) */
  function redimensionar() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const wrap  = canvas.parentElement;
    const w     = wrap ? wrap.offsetWidth  : canvas.offsetWidth;
    const h     = wrap ? wrap.offsetHeight : canvas.offsetHeight;
    if (!w || !h) return;

    const data = _pads[canvasId] ? _pads[canvasId].toData() : null;
    canvas.width  = w * ratio;
    canvas.height = h * ratio;
    canvas.getContext('2d').scale(ratio, ratio);

    if (_pads[canvasId]) {
      _pads[canvasId].clear();
      if (data && data.length) _pads[canvasId].fromData(data); // restaura traços
    }
  }

  const pad = new SignaturePad(canvas, {
    penColor:        'rgb(10, 10, 10)',    /* preto — visível no PDF/Word */
    backgroundColor: 'rgb(255, 255, 255)', /* fundo branco */
    minWidth:        1.5,
    maxWidth:        3,
  });

  _pads[canvasId] = pad;

  /* Esconde o hint "Assine aqui" quando começar a assinar */
  const hint = canvas.parentElement?.querySelector('.sig-hint');
  pad.addEventListener('beginStroke', () => {
    if (hint) hint.style.display = 'none';
  });
  pad.addEventListener('endStroke', () => {
    if (hint && pad.isEmpty()) hint.style.display = '';
  });

  /* Redimensiona ao carregar e ao mudar tamanho da janela */
  requestAnimationFrame(redimensionar);

  let _resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(redimensionar, 150);
  });
}

function clearSig(canvasId) {
  const pad = _pads[canvasId];
  if (pad) {
    pad.clear();
    const hint = document.getElementById(canvasId)?.parentElement?.querySelector('.sig-hint');
    if (hint) hint.style.display = '';
  }
}

function getSigBase64(canvasId) {
  const pad = _pads[canvasId];
  if (!pad || pad.isEmpty()) return '';
  return pad.toDataURL('image/png');
}
