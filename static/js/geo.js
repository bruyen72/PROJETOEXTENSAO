/** geo.js — GPS + ViaCEP + reverse geocoding (Nominatim) */

/* ── Máscara CEP ──────────────────────────────────────────── */
function geoMascaraCep(inp) {
  let v = inp.value.replace(/\D/g, '').slice(0, 8);
  if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5);
  inp.value = v;
  if (v.replace(/\D/g, '').length === 8) geoBuscarCep();
}

/* ── ViaCEP ──────────────────────────────────────────────── */
async function geoBuscarCep() {
  const cep = (document.getElementById('geo-cep').value || '').replace(/\D/g, '');
  if (cep.length !== 8) return;

  const spinner = document.getElementById('geo-cep-spinner');
  if (spinner) spinner.style.display = '';

  try {
    const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const d = await r.json();
    if (d.erro) {
      const st = document.getElementById('geo-status');
      if (st) { st.textContent = 'CEP não encontrado.'; st.className = 'geo-status erro'; }
      return;
    }
    _geoPreencherCampos(d.logradouro || '', d.bairro || '', d.localidade || '', (d.uf || '').toUpperCase());
    _geoComporEndereco();
    const num = document.getElementById('geo-numero');
    if (num) num.focus();
  } catch {
    const st = document.getElementById('geo-status');
    if (st) { st.textContent = 'Erro ao consultar CEP.'; st.className = 'geo-status erro'; }
  } finally {
    if (spinner) spinner.style.display = 'none';
  }
}

function _geoPreencherCampos(logradouro, bairro, cidade, uf) {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  set('geo-logradouro', logradouro);
  set('geo-bairro',     bairro);
  set('geo-cidade',     cidade);
  set('geo-uf',         uf);
}

function _geoComporEndereco() {
  const g = id => (document.getElementById(id)?.value || '').trim();
  const logradouro = g('geo-logradouro');
  const numero     = g('geo-numero');
  const bairro     = g('geo-bairro');
  const cidade     = g('geo-cidade');
  const uf         = g('geo-uf').toUpperCase();
  const cep        = g('geo-cep');

  const partes = [
    logradouro + (numero ? `, ${numero}` : ''),
    bairro,
    cidade + (uf ? `/${uf}` : ''),
    cep ? `CEP ${cep}` : '',
  ].filter(Boolean);

  const endereco = partes.join(' — ');
  const el = document.getElementById('geo-endereco');
  if (el) el.value = endereco;
  return endereco;
}

/* ── GPS + Nominatim reverse geocoding ──────────────────── */
function capturarGeo() {
  const statusEl = document.getElementById('geo-status');
  const latEl    = document.getElementById('geo-lat');
  const lngEl    = document.getElementById('geo-lng');

  if (!navigator.geolocation) {
    if (statusEl) { statusEl.textContent = 'Geolocalização não suportada.'; statusEl.className = 'geo-status erro'; }
    return;
  }

  if (statusEl) { statusEl.textContent = 'Capturando GPS…'; statusEl.className = 'geo-status'; }

  navigator.geolocation.getCurrentPosition(
    async pos => {
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);
      if (latEl) latEl.value = lat;
      if (lngEl) lngEl.value = lng;
      if (statusEl) {
        statusEl.textContent = `Capturado ±${Math.round(pos.coords.accuracy)}m`;
        statusEl.className = 'geo-status ok';
      }

      /* Tenta geocodificação reversa via Nominatim */
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR`,
          { headers: { 'Accept-Language': 'pt-BR' } }
        );
        const d = await r.json();
        if (d?.address) {
          const a = d.address;
          const logradouro = a.road || a.pedestrian || a.path || '';
          const bairro     = a.suburb || a.neighbourhood || a.quarter || a.village || '';
          const cidade     = a.city || a.town || a.municipality || '';
          const uf         = a.state_code ? a.state_code.replace('BR-','') : (a.state || '').slice(0,2).toUpperCase();
          const cepRemoto  = (a.postcode || '').replace(/\D/g,'');

          _geoPreencherCampos(logradouro, bairro, cidade, uf);
          if (cepRemoto.length === 8) {
            const cepEl = document.getElementById('geo-cep');
            if (cepEl) cepEl.value = cepRemoto.slice(0,5) + '-' + cepRemoto.slice(5);
          }
          _geoComporEndereco();
        }
      } catch { /* Nominatim indisponível — campos permanecem editáveis */ }
    },
    err => {
      const msgs = {
        [err.PERMISSION_DENIED]:    'Permissão de GPS negada.',
        [err.POSITION_UNAVAILABLE]: 'Localização indisponível.',
        [err.TIMEOUT]:              'Tempo de GPS esgotado.',
      };
      if (statusEl) {
        statusEl.textContent = msgs[err.code] || 'Erro ao capturar GPS.';
        statusEl.className = 'geo-status erro';
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

/* ── Atualiza geo-endereco ao digitar nos campos ─────────── */
document.addEventListener('DOMContentLoaded', () => {
  ['geo-logradouro','geo-numero','geo-bairro','geo-cidade','geo-uf'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', _geoComporEndereco);
  });
});
