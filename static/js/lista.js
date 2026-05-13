/**
 * lista.js — Lógica da listagem de OS (lista.html)
 */

let paginaAtual = 1;

document.addEventListener('DOMContentLoaded', () => {
  filtrarLista();
});

function escHTML(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function filtrarLista(pg) {
  paginaAtual = pg || 1;
  const q    = document.getElementById('busca')?.value || '';
  const st   = document.getElementById('filtro-status')?.value || '';
  const pr   = document.getElementById('filtro-prioridade')?.value || '';
  const cli  = document.getElementById('filtro-cliente')?.value || '';

  const params = new URLSearchParams({ q, page: paginaAtual });
  if (st)  params.append('status', st);
  if (pr)  params.append('prioridade', pr);
  if (cli) params.append('cliente_id', cli);

  const container = document.getElementById('lista-container');
  container.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div><h3>Carregando…</h3></div>';

  try {
    const r    = await fetch('/api/os/?' + params);
    const data = await r.json();
    renderLista(data);
  } catch {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">❌</div><h3>Erro ao carregar</h3><p>Verifique a conexão.</p></div>';
  }
}

function renderLista(data) {
  const container = document.getElementById('lista-container');
  const contador  = document.getElementById('contador-lista');
  if (contador) contador.textContent = data.total + ' OS';

  if (!data.items?.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>Nenhuma OS encontrada</h3>
        <p>Tente outros filtros ou crie uma nova OS.</p>
      </div>`;
    document.getElementById('paginacao').innerHTML = '';
    return;
  }

  const BADGE_STATUS = {
    'Aberto': 'aberto', 'Em Andamento': 'andamento',
    'Concluido': 'concluido', 'Cancelado': 'cancelado'
  };
  const BADGE_PRIO = { Baixa:'baixa', Media:'media', Urgente:'urgente' };

  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px';

  grid.innerHTML = data.items.map(os => `
    <div class="os-card ${os.prioridade === 'Urgente' ? 'pulse' : ''}">
      <div class="os-card-top">
        <span class="os-num">${escHTML(os.numero_os)}</span>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <span class="badge badge-${BADGE_STATUS[os.status] || 'aberto'}">${escHTML(os.status)}</span>
          <span class="badge badge-${BADGE_PRIO[os.prioridade] || 'baixa'}">${escHTML(os.prioridade)}</span>
        </div>
      </div>
      <div class="os-card-body">
        <div class="os-client">${escHTML(os.cliente_nome || '—')}</div>
        <div class="os-equip" style="font-size:.78rem;color:var(--text-2)">
          ${escHTML(os.data_entrada || '')}
        </div>
      </div>
      <div class="os-card-footer">
        <button class="btn btn-ghost btn-sm" onclick="exportarPDF(${os.id})">📄 PDF</button>
        <button class="btn btn-ghost btn-sm" onclick="exportarWord(${os.id})">📝 Word</button>
        <button class="btn btn-danger btn-sm" onclick="desativarOS(${os.id},this)">🗑</button>
      </div>
    </div>
  `).join('');

  container.innerHTML = '';
  container.appendChild(grid);
  renderPaginacao(data);
}

function renderPaginacao(data) {
  const p = document.getElementById('paginacao');
  if (!p || data.pages <= 1) { if (p) p.innerHTML = ''; return; }
  p.innerHTML = '';
  for (let i = 1; i <= data.pages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className   = 'btn ' + (i === data.page ? 'btn-primary btn-sm' : 'btn-ghost btn-sm');
    btn.onclick     = () => filtrarLista(i);
    p.appendChild(btn);
  }
}

async function desativarOS(id, el) {
  if (!confirm('Desativar OS? (soft delete)')) return;
  el.disabled = true;
  const r = await fetch(`/api/os/${id}`, { method: 'DELETE' });
  if (r.ok) { showToast('OS desativada.', 'aviso'); filtrarLista(paginaAtual); }
  else { showToast('Erro ao desativar.', 'erro'); el.disabled = false; }
}

async function exportarPDF(id) {
  showToast('Gerando PDF…', 'info');
  const r = await fetch(`/api/relatorios/${id}/pdf`, { method: 'POST' });
  if (r.ok) {
    const blob = await r.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `OS-${id}.pdf`; a.click();
    URL.revokeObjectURL(url);
    showToast('PDF baixado!', 'sucesso');
  } else {
    showToast('Erro ao gerar PDF.', 'erro');
  }
}

async function exportarWord(id) {
  showToast('Gerando Word…', 'info');
  const r = await fetch(`/api/relatorios/${id}/word`, { method: 'POST' });
  if (r.ok) {
    const blob = await r.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `OS-${id}.docx`; a.click();
    URL.revokeObjectURL(url);
    showToast('Word baixado!', 'sucesso');
  } else {
    showToast('Erro ao gerar Word.', 'erro');
  }
}
