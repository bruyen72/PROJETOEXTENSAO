/**
 * db.js — IndexedDB wrapper para armazenamento offline
 * Banco: gerenciador_os_idb
 * Stores: os_pendentes (OS criadas sem internet)
 */

const osDB = (() => {
  const DB_NAME    = 'gerenciador_os_idb';
  const DB_VERSION = 1;
  const STORE      = 'os_pendentes';
  let db = null;

  function abrir() {
    if (db) return Promise.resolve(db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = e => {
        const _db = e.target.result;
        if (!_db.objectStoreNames.contains(STORE)) {
          const store = _db.createObjectStore(STORE, { keyPath: 'local_id' });
          store.createIndex('status', 'status', { unique: false });
        }
      };

      req.onsuccess = e => { db = e.target.result; resolve(db); };
      req.onerror   = e => reject(e.target.error);
    });
  }

  function transacao(mode) {
    return abrir().then(db => db.transaction([STORE], mode).objectStore(STORE));
  }

  return {
    // Salva uma OS localmente como pendente
    salvarPendente(dados) {
      dados.status    = 'pendente';
      dados.criado_em = new Date().toISOString();
      return transacao('readwrite').then(store =>
        new Promise((resolve, reject) => {
          const req = store.put(dados);
          req.onsuccess = () => resolve(req.result);
          req.onerror   = e => reject(e.target.error);
        })
      );
    },

    // Retorna todas as OS com status pendente
    listarPendentes() {
      return abrir().then(db =>
        new Promise((resolve, reject) => {
          const tx    = db.transaction([STORE], 'readonly');
          const store = tx.objectStore(STORE);
          const idx   = store.index('status');
          const req   = idx.getAll('pendente');
          req.onsuccess = () => resolve(req.result || []);
          req.onerror   = e => reject(e.target.error);
        })
      );
    },

    // Conta OS pendentes
    contarPendentes() {
      return this.listarPendentes().then(l => l.length);
    },

    // Marca uma OS como sincronizada
    marcarSincronizada(localId, idServidor) {
      return abrir().then(db =>
        new Promise((resolve, reject) => {
          const tx    = db.transaction([STORE], 'readwrite');
          const store = tx.objectStore(STORE);
          const req   = store.get(localId);
          req.onsuccess = () => {
            const rec = req.result;
            if (!rec) { resolve(null); return; }
            rec.status     = 'sincronizado';
            rec.id_servidor = idServidor;
            store.put(rec).onsuccess = resolve;
          };
          req.onerror = e => reject(e.target.error);
        })
      );
    },

    // Remove registros já sincronizados
    limparSincronizados() {
      return abrir().then(db =>
        new Promise((resolve, reject) => {
          const tx    = db.transaction([STORE], 'readwrite');
          const store = tx.objectStore(STORE);
          const idx   = store.index('status');
          const req   = idx.openCursor(IDBKeyRange.only('sincronizado'));
          req.onsuccess = e => {
            const cursor = e.target.result;
            if (cursor) { cursor.delete(); cursor.continue(); }
            else resolve();
          };
          req.onerror = e => reject(e.target.error);
        })
      );
    },
  };
})();
