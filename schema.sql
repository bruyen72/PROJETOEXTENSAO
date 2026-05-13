-- ============================================================
--  GERENCIADOR DE OS PARA CAMPO — DDL Schema
--  Compatível com MySQL 8+ e SQLite 3
-- ============================================================

-- Usuários do sistema (admin, supervisor, técnico)
CREATE TABLE IF NOT EXISTS usuario (
    id          INTEGER      PRIMARY KEY AUTOINCREMENT,
    nome        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    senha_hash  VARCHAR(255) NOT NULL,
    perfil      VARCHAR(20)  NOT NULL DEFAULT 'tecnico',   -- admin | supervisor | tecnico
    ativo       BOOLEAN      NOT NULL DEFAULT 1,
    criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Extensão técnico (1:1 com usuario)
CREATE TABLE IF NOT EXISTS tecnico (
    id            INTEGER      PRIMARY KEY AUTOINCREMENT,
    usuario_id    INTEGER      NOT NULL UNIQUE,
    especialidade VARCHAR(100),
    geo_lat       DECIMAL(10,8),
    geo_lng       DECIMAL(11,8),
    atualizado_em DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
);

-- Clientes (soft delete via ativo)
CREATE TABLE IF NOT EXISTS cliente (
    id          INTEGER      PRIMARY KEY AUTOINCREMENT,
    nome        VARCHAR(100) NOT NULL,
    telefone    VARCHAR(20),
    email       VARCHAR(150),
    endereco    TEXT,
    ativo       BOOLEAN      NOT NULL DEFAULT 1,
    criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Equipamentos vinculados ao cliente (soft delete via ativo)
CREATE TABLE IF NOT EXISTS equipamento (
    id           INTEGER      PRIMARY KEY AUTOINCREMENT,
    tipo         VARCHAR(50)  NOT NULL,
    marca        VARCHAR(50)  NOT NULL,
    modelo       VARCHAR(100) NOT NULL,
    numero_serie VARCHAR(100) NOT NULL UNIQUE,
    cliente_id   INTEGER      NOT NULL,
    cor_identificacao VARCHAR(80),
    canal_frequencia  VARCHAR(80),
    ativo        BOOLEAN      NOT NULL DEFAULT 1,
    criado_em    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE RESTRICT
);

-- Ordens de Serviço (soft delete obrigatório — ativo=0 em vez de DELETE)
CREATE TABLE IF NOT EXISTS ordem_servico (
    id                  INTEGER      PRIMARY KEY AUTOINCREMENT,
    numero_os           VARCHAR(50)  NOT NULL UNIQUE,
    descricao           TEXT,
    status              VARCHAR(20)  NOT NULL DEFAULT 'Aberto',      -- Aberto | Em Andamento | Concluido | Cancelado
    prioridade          VARCHAR(10)  NOT NULL DEFAULT 'Baixa',       -- Baixa | Media | Urgente
    tipo_ocorrencia     VARCHAR(20),                                 -- Preventiva | Manutencao | Corretiva
    data_entrada        DATE         NOT NULL,
    hora_entrada        TIME,
    data_saida          DATE,
    condicoes_fisicas   TEXT,
    defeito_relatado    TEXT,
    status_equipamento  VARCHAR(50),
    laudo_tecnico       TEXT,
    solucao_aplicada    TEXT,
    pecas_utilizadas    TEXT,
    termos_observacoes  TEXT,
    geo_lat             DECIMAL(10,8),
    geo_lng             DECIMAL(11,8),
    geo_endereco        VARCHAR(255),
    ativo               BOOLEAN      NOT NULL DEFAULT 1,             -- soft delete
    criado_em           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- FK
    cliente_id          INTEGER      NOT NULL,
    tecnico_id          INTEGER,
    criado_por          INTEGER      NOT NULL,
    FOREIGN KEY (cliente_id)  REFERENCES cliente(id)  ON DELETE RESTRICT,
    FOREIGN KEY (tecnico_id)  REFERENCES tecnico(id)  ON DELETE SET NULL,
    FOREIGN KEY (criado_por)  REFERENCES usuario(id)  ON DELETE RESTRICT
);

-- Equipamentos vinculados a uma OS (N:N)
CREATE TABLE IF NOT EXISTS os_equipamento (
    os_id          INTEGER NOT NULL,
    equipamento_id INTEGER NOT NULL,
    PRIMARY KEY (os_id, equipamento_id),
    FOREIGN KEY (os_id)          REFERENCES ordem_servico(id) ON DELETE CASCADE,
    FOREIGN KEY (equipamento_id) REFERENCES equipamento(id)   ON DELETE RESTRICT
);

-- Acessórios recebidos com o equipamento
CREATE TABLE IF NOT EXISTS os_acessorio (
    id     INTEGER      PRIMARY KEY AUTOINCREMENT,
    os_id  INTEGER      NOT NULL,
    nome   VARCHAR(100) NOT NULL,
    FOREIGN KEY (os_id) REFERENCES ordem_servico(id) ON DELETE CASCADE
);

-- Checklist de testes por OS
CREATE TABLE IF NOT EXISTS os_checklist (
    id                  INTEGER      PRIMARY KEY AUTOINCREMENT,
    os_id               INTEGER      NOT NULL,
    item_id             VARCHAR(20)  NOT NULL,
    item_nome           VARCHAR(100) NOT NULL,
    feito               BOOLEAN      NOT NULL DEFAULT 0,
    data_verificacao    DATE,
    tecnico_verificador VARCHAR(100),
    FOREIGN KEY (os_id) REFERENCES ordem_servico(id) ON DELETE CASCADE
);

-- Fotos anexadas à OS
CREATE TABLE IF NOT EXISTS os_foto (
    id             INTEGER      PRIMARY KEY AUTOINCREMENT,
    os_id          INTEGER      NOT NULL,
    nome_arquivo   VARCHAR(255) NOT NULL,
    caminho        VARCHAR(500) NOT NULL,
    tamanho_bytes  INTEGER,
    criado_em      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (os_id) REFERENCES ordem_servico(id) ON DELETE CASCADE
);

-- Assinaturas digitais (base64 PNG)
CREATE TABLE IF NOT EXISTS os_assinatura (
    id          INTEGER  PRIMARY KEY AUTOINCREMENT,
    os_id       INTEGER  NOT NULL UNIQUE,
    sig_cliente TEXT,
    sig_tecnico TEXT,
    criado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (os_id) REFERENCES ordem_servico(id) ON DELETE CASCADE
);

-- Notificações por usuário
CREATE TABLE IF NOT EXISTS notificacao (
    id         INTEGER      PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER      NOT NULL,
    os_id      INTEGER,
    mensagem   TEXT         NOT NULL,
    tipo       VARCHAR(20)  NOT NULL DEFAULT 'info',   -- info | alerta | urgente
    lida       BOOLEAN      NOT NULL DEFAULT 0,
    criado_em  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id)        ON DELETE CASCADE,
    FOREIGN KEY (os_id)      REFERENCES ordem_servico(id)  ON DELETE SET NULL
);

-- Relatórios gerados (PDF / Word)
CREATE TABLE IF NOT EXISTS relatorio (
    id           INTEGER      PRIMARY KEY AUTOINCREMENT,
    os_id        INTEGER      NOT NULL,
    tipo         VARCHAR(50)  NOT NULL,
    formato      VARCHAR(10)  NOT NULL,   -- PDF | Word
    nome_arquivo VARCHAR(255) NOT NULL,
    caminho      VARCHAR(500) NOT NULL,
    gerado_por   INTEGER      NOT NULL,
    gerado_em    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (os_id)      REFERENCES ordem_servico(id) ON DELETE CASCADE,
    FOREIGN KEY (gerado_por) REFERENCES usuario(id)       ON DELETE RESTRICT
);

-- Fila de sincronização offline (dispositivos que ficaram sem internet)
CREATE TABLE IF NOT EXISTS sync_queue (
    id            INTEGER      PRIMARY KEY AUTOINCREMENT,
    device_id     VARCHAR(100) NOT NULL,
    acao          VARCHAR(20)  NOT NULL,   -- criar_os | editar_os | criar_cliente
    payload       TEXT         NOT NULL,   -- JSON serializado
    status        VARCHAR(20)  NOT NULL DEFAULT 'pendente',   -- pendente | processado | erro
    erro_msg      TEXT,
    criado_em     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processado_em DATETIME
);

-- ─── Índices de performance ───────────────────────────────
CREATE INDEX IF NOT EXISTS idx_os_cliente    ON ordem_servico(cliente_id);
CREATE INDEX IF NOT EXISTS idx_os_tecnico    ON ordem_servico(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_os_status     ON ordem_servico(status);
CREATE INDEX IF NOT EXISTS idx_os_ativo      ON ordem_servico(ativo);
CREATE INDEX IF NOT EXISTS idx_os_entrada    ON ordem_servico(data_entrada);
CREATE INDEX IF NOT EXISTS idx_equip_cliente ON equipamento(cliente_id);
CREATE INDEX IF NOT EXISTS idx_notif_usuario ON notificacao(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notif_lida    ON notificacao(lida);
CREATE INDEX IF NOT EXISTS idx_sync_status   ON sync_queue(status);

-- ─── Usuário admin padrão (senha: Admin@123) ─────────────
INSERT OR IGNORE INTO usuario (nome, email, senha_hash, perfil)
VALUES (
    'Administrador',
    'admin@gerenciadoros.local',
    'pbkdf2:sha256:600000$seed$hash_placeholder',
    'admin'
);
