/**
 * app.js — Lógica do formulário de OS (nova.html)
 * Usa a API Flask quando online; IndexedDB quando offline.
 */

const CHECKLIST_ITEMS = [
  { id:'bat',  nome:'Teste de Bateria / Carga' },
  { id:'tx',   nome:'Teste de Transmissão (TX)' },
  { id:'rx',   nome:'Teste de Recepção (RX)' },
  { id:'freq', nome:'Verificação de Frequência / Canal' },
  { id:'prog', nome:'Programação / Software' },
  { id:'ant',  nome:'Inspeção da Antena' },
  { id:'mic',  nome:'Teste de Microfone / Áudio' },
  { id:'btn',  nome:'Teste de Botões / Display' },
  { id:'con',  nome:'Teste de Conector / Solda' },
  { id:'fis',  nome:'Inspeção Física / Limpeza' },
  { id:'fab',  nome:'Encaminhado ao Fabricante' },
  { id:'qc',   nome:'Controle de Qualidade Final' },
];

let fotosBase64 = [];

// ─── Init ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initChecklist();
  initChips();
  initPrioridade();
  initStatus();
  initFotos();
  setDefaultDateTime();
  initSig('sig-cliente');
  initSig('sig-tecnico');
});

// ─── Data/Hora padrão ────────────────────────────────────
function setDefaultDateTime() {
  const today  = new Date();
  const dateEl = document.getElementById('data_entrada');
  const timeEl = document.getElementById('hora_entrada');
  if (dateEl && !dateEl.value) dateEl.value = today.toISOString().split('T')[0];
  if (timeEl && !timeEl.value) timeEl.value = today.toTimeString().slice(0, 5);
}

// ─── Checklist ───────────────────────────────────────────
function initChecklist() {
  const c = document.getElementById('checklist-container');
  if (!c) return;
  c.innerHTML = CHECKLIST_ITEMS.map((item, i) => `
    <div class="check-item" id="ci-${item.id}" data-id="${item.id}" onclick="toggleCheck('${item.id}',event)">
      <div class="check-box" id="cb-${item.id}"><span class="check-icon"></span></div>
      <span class="check-name">${i+1}. ${item.nome}</span>
      <input type="date" class="check-data" id="cd-${item.id}" onclick="event.stopPropagation()">
      <input type="text" class="check-tecnico" id="ct-${item.id}" placeholder="Técnico" onclick="event.stopPropagation()">
    </div>
  `).join('');
}

function toggleCheck(id, e) {
  if (e && e.target.tagName === 'INPUT') return;
  const item = document.getElementById('ci-' + id);
  if (!item) return;
  const done = item.classList.toggle('done');
  const icon = item.querySelector('.check-icon');
  if (icon) icon.textContent = done ? '✓' : '';
  const dateEl = document.getElementById('cd-' + id);
  if (done && dateEl && !dateEl.value) dateEl.value = new Date().toISOString().split('T')[0];
  atualizarProgress();
}

function atualizarProgress() {
  const total = CHECKLIST_ITEMS.length;
  const feitos = CHECKLIST_ITEMS.filter(i => document.getElementById('ci-'+i.id)?.classList.contains('done')).length;
  const pct = total ? (feitos / total * 100) : 0;
  const fill = document.getElementById('progress-fill');
  const lbl  = document.getElementById('progress-label');
  if (fill) fill.style.width = pct + '%';
  if (lbl)  lbl.textContent = `${feitos}/${total} testes`;
}

// ─── Chips ───────────────────────────────────────────────
function initChips() {
  document.querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => c.classList.toggle('active'));
  });
}

// ─── Prioridade ──────────────────────────────────────────
function initPrioridade() {
  document.querySelectorAll('.priority-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.priority-btn').forEach(b =>
        b.classList.remove('active-baixa','active-media','active-urgente'));
      btn.classList.add('active-' + btn.dataset.nivel);
    });
  });
}

// ─── Status ──────────────────────────────────────────────
function initStatus() {
  document.querySelectorAll('.status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// ─── Fotos ───────────────────────────────────────────────
function initFotos() {
  const input = document.getElementById('foto-input');
  const drop  = document.getElementById('fotos-drop');
  if (!input) return;

  input.addEventListener('change', e => {
    [...e.target.files].forEach(readFoto);
    input.value = '';
  });

  if (drop) {
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('dragover'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
    drop.addEventListener('drop', e => {
      e.preventDefault();
      drop.classList.remove('dragover');
      [...e.dataTransfer.files].forEach(readFoto);
    });
  }
}

function readFoto(file) {
  const r = new FileReader();
  r.onload = e => { fotosBase64.push(e.target.result); renderFotos(); };
  r.readAsDataURL(file);
}

function renderFotos() {
  const grid = document.getElementById('fotos-grid');
  if (!grid) return;
  grid.innerHTML = fotosBase64.map((src, i) => `
    <div class="foto-thumb">
      <img src="${src}" alt="Foto ${i+1}">
      <button class="foto-remove" onclick="removerFoto(${i})">✕</button>
    </div>
  `).join('');
}

function removerFoto(i) { fotosBase64.splice(i, 1); renderFotos(); }

// ─── Ler formulário ──────────────────────────────────────
function getFormData() {
  const checklist = CHECKLIST_ITEMS.map(item => ({
    id: item.id, nome: item.nome,
    feito:   document.getElementById('ci-'+item.id)?.classList.contains('done') || false,
    data:    document.getElementById('cd-'+item.id)?.value || '',
    tecnico: document.getElementById('ct-'+item.id)?.value || '',
  }));

  const acessorios = [...document.querySelectorAll('.chip.active')].map(c => c.dataset.nome);
  const prioActive = document.querySelector('.priority-btn[class*="active-"]');
  const statActive = document.querySelector('.status-btn.active');

  return {
    numero_os:          val('numero_os'),
    data_entrada:       val('data_entrada'),
    hora_entrada:       val('hora_entrada'),
    cliente_id:         val('cliente_id') ? parseInt(val('cliente_id')) : null,
    tipo_ocorrencia:    val('tipo_ocorrencia'),
    tecnico_id:         val('tecnico_id') ? parseInt(val('tecnico_id')) : null,
    prioridade:         prioActive ? ({ baixa:'Baixa', media:'Média', urgente:'Urgente' }[prioActive.dataset.nivel] || 'Baixa') : 'Baixa',
    status:             val('status_os') || 'Aberto',
    equip_tipo:         val('equip_tipo'),
    equip_marca:        val('equip_marca'),
    equip_modelo:       val('equip_modelo'),
    equip_serie:        val('equip_serie'),
    equip_cor:          val('equip_cor'),
    equip_canal:        val('equip_canal'),
    acessorios:         acessorios,
    acessorios_outros:  val('acessorios_outros'),
    condicoes_fisicas:  val('condicoes_fisicas'),
    defeito_relatado:   val('defeito_relatado'),
    status_equipamento: statActive ? statActive.dataset.status : '',
    laudo_tecnico:      val('laudo_tecnico'),
    solucao_aplicada:   val('solucao_aplicada'),
    pecas_utilizadas:   val('pecas_utilizadas'),
    termos_observacoes: val('termos_observacoes'),
    geo_lat:            val('geo-lat'),
    geo_lng:            val('geo-lng'),
    geo_endereco:       val('geo-endereco'),
    fotos:              fotosBase64.slice(),
    sig_cliente:        getSigBase64('sig-cliente'),
    sig_tecnico:        getSigBase64('sig-tecnico'),
    checklist:          checklist,
    data_conclusao:     val('data_conclusao'),
  };
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

// ─── Validação ───────────────────────────────────────────
function validar() {
  const d = getFormData();
  const erros = [];
  if (!d.cliente_id)     erros.push('Cliente é obrigatório (RN01)');
  if (!d.data_entrada)   erros.push('Data de entrada é obrigatória (RN02)');
  if (!d.equip_tipo)     erros.push('Tipo do equipamento é obrigatório');
  if (!d.equip_marca)    erros.push('Marca do equipamento é obrigatória');
  if (!d.equip_modelo)   erros.push('Modelo do equipamento é obrigatório');
  if (!d.equip_serie)    erros.push('Número de série é obrigatório');
  return erros;
}

// ─── Salvar no servidor ──────────────────────────────────
async function salvarOS() {
  const erros = validar();
  if (erros.length) { erros.forEach(e => showToast(e, 'erro')); return; }

  showToast('Salvando…', 'info');
  try {
    const resp = await fetch('/api/os/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getFormData()),
    });
    const data = await resp.json();
    if (resp.ok) {
      showToast(`OS ${data.numero_os} salva com sucesso!`, 'sucesso');
      setTimeout(() => window.location.href = '/api/os/lista', 1500);
    } else {
      showToast(data.erro || 'Erro ao salvar.', 'erro');
    }
  } catch {
    showToast('Sem conexão — salve offline.', 'aviso');
  }
}

// ─── Salvar offline (IndexedDB) ──────────────────────────
async function salvarOffline() {
  const erros = validar();
  if (erros.length) { erros.forEach(e => showToast(e, 'erro')); return; }

  if (typeof osDB === 'undefined') {
    showToast('IndexedDB não disponível.', 'erro');
    return;
  }

  try {
    const dados = getFormData();
    dados.local_id = 'OS-LOCAL-' + Date.now();
    dados.acao     = 'criar_os';
    dados.device_id = navigator.userAgent.slice(0, 50);
    await osDB.salvarPendente(dados);
    showToast(`OS salva localmente: ${dados.local_id}`, 'sucesso');
  } catch (e) {
    showToast('Erro ao salvar offline: ' + e.message, 'erro');
  }
}

// ─── Limpar ──────────────────────────────────────────────
function limparForm() {
  if (!confirm('Limpar todos os campos?')) return;

  document.querySelectorAll('input[type=text],input[type=date],input[type=time],textarea,select').forEach(el => {
    if (el.readOnly) return;
    el.value = el.tagName === 'SELECT' ? el.options[0]?.value : '';
  });

  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.priority-btn').forEach(b =>
    b.classList.remove('active-baixa','active-media','active-urgente'));
  document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));

  CHECKLIST_ITEMS.forEach(item => {
    const el = document.getElementById('ci-'+item.id);
    if (el) { el.classList.remove('done'); const ic = el.querySelector('.check-icon'); if (ic) ic.textContent=''; }
  });

  fotosBase64 = [];
  renderFotos();
  clearSig('sig-cliente');
  clearSig('sig-tecnico');

  const gs = document.getElementById('geo-status');
  if (gs) { gs.textContent = 'Aguardando…'; gs.className = 'geo-status'; }

  setDefaultDateTime();
  atualizarProgress();
  showToast('Formulário limpo.', 'aviso');
}
