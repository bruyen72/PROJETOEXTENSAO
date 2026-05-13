/** geo.js — Captura de geolocalização */

function capturarGeo() {
  const statusEl = document.getElementById('geo-status');
  const latEl    = document.getElementById('geo-lat');
  const lngEl    = document.getElementById('geo-lng');

  if (!navigator.geolocation) {
    if (statusEl) { statusEl.textContent = '❌ Geolocalização não suportada.'; statusEl.className = 'geo-status erro'; }
    return;
  }

  if (statusEl) { statusEl.textContent = '📡 Capturando…'; statusEl.className = 'geo-status'; }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);
      if (latEl) latEl.value = lat;
      if (lngEl) lngEl.value = lng;
      if (statusEl) {
        statusEl.textContent = `✅ OK ±${Math.round(pos.coords.accuracy)}m`;
        statusEl.className = 'geo-status ok';
      }
    },
    err => {
      const msgs = {
        [err.PERMISSION_DENIED]:   '❌ Permissão negada.',
        [err.POSITION_UNAVAILABLE]:'❌ Localização indisponível.',
        [err.TIMEOUT]:             '❌ Tempo esgotado.',
      };
      if (statusEl) {
        statusEl.textContent = msgs[err.code] || '❌ Erro ao capturar.';
        statusEl.className = 'geo-status erro';
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}
