/**
 * sync.js — Sincronização offline → servidor
 *
 * Fluxo:
 *  1. Quando o navegador volta online, tentarSync() é chamado.
 *  2. Lê todas as OS com status='pendente' do IndexedDB.
 *  3. Envia em lote para POST /api/sync/batch.
 *  4. Para cada item processado com sucesso, marca como sincronizado.
 *  5. Exibe toast com resultado.
 *  6. Registra Background Sync (se suportado) para retry automático.
 */

let syncEmAndamento = false;

// ── Listeners automáticos ────────────────────────────────
window.addEventListener('online',  () => setTimeout(tentarSync, 1500));

// Mensagem do Service Worker pedindo sync
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data?.type === 'SYNC_REQUEST') tentarSync();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Ao carregar, exibe contador de pendentes
  atualizarBadgePendentes();

  // Registra Background Sync periodicamente (Chrome/Android)
  registrarBackgroundSync();

  // Tenta sincronizar ao abrir se já online
  if (navigator.onLine) setTimeout(tentarSync, 3000);
});

// ── Sync principal ───────────────────────────────────────
async function tentarSync() {
  if (syncEmAndamento || !navigator.onLine) return;
  if (typeof osDB === 'undefined')          return;

  let pendentes;
  try { pendentes = await osDB.listarPendentes(); } catch { return; }

  if (!pendentes.length) return;

  syncEmAndamento = true;
  showToast(`Sincronizando ${pendentes.length} OS pendente(s)…`, 'info');

  try {
    const resp = await fetch('/api/sync/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pendentes),
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const resultado = await resp.json();
    let ok = 0, erros = 0;

    for (const item of resultado.resultados) {
      if (item.ok) {
        await osDB.marcarSincronizada(item.device_ref, item.id);
        ok++;
      } else {
        erros++;
      }
    }

    await osDB.limparSincronizados();

    if (ok > 0)    showToast(`✅ ${ok} OS sincronizada(s) com sucesso!`, 'sucesso');
    if (erros > 0) showToast(`⚠️ ${erros} OS não puderam ser sincronizadas.`, 'aviso');

  } catch (e) {
    showToast('Erro na sincronização: ' + e.message, 'erro');
  } finally {
    syncEmAndamento = false;
    atualizarBadgePendentes();
  }
}

// ── Badge de pendentes ───────────────────────────────────
async function atualizarBadgePendentes() {
  if (typeof osDB === 'undefined') return;
  try {
    const count = await osDB.contarPendentes();
    const badge = document.getElementById('sync-badge');
    if (!badge) return;
    badge.textContent = count;
    badge.style.display = count > 0 ? '' : 'none';
  } catch {}
}

// ── Background Sync (PWA) ────────────────────────────────
async function registrarBackgroundSync() {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.sync.register('sync-os-pendentes');
  } catch {}
}
