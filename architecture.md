# Arquitetura — Gerenciador de OS para Campo

## Tarefa 1 — Diagrama de Classes UML (Mermaid)

```mermaid
classDiagram
    direction TB

    class Usuario {
        +int id
        +String nome
        +String email
        +String senha_hash
        +String perfil
        +Boolean ativo
        +DateTime criado_em
        +set_senha(senha) void
        +check_senha(senha) Boolean
        +to_dict() dict
    }

    class Tecnico {
        +int id
        +int usuario_id
        +String especialidade
        +Decimal geo_lat
        +Decimal geo_lng
        +DateTime atualizado_em
        +to_dict() dict
    }

    class Cliente {
        +int id
        +String nome
        +String telefone
        +String email
        +String endereco
        +Boolean ativo
        +DateTime criado_em
        +to_dict() dict
    }

    class Equipamento {
        +int id
        +String tipo
        +String marca
        +String modelo
        +String numero_serie
        +int cliente_id
        +String cor_identificacao
        +String canal_frequencia
        +Boolean ativo
        +to_dict() dict
    }

    class OrdemServico {
        +int id
        +String numero_os
        +String descricao
        +String status
        +String prioridade
        +String tipo_ocorrencia
        +Date data_entrada
        +Time hora_entrada
        +Date data_saida
        +Text laudo_tecnico
        +Text solucao_aplicada
        +Text defeito_relatado
        +Text pecas_utilizadas
        +Text termos_observacoes
        +Decimal geo_lat
        +Decimal geo_lng
        +String geo_endereco
        +Boolean ativo
        +desativar() void
        +to_dict() dict
    }

    class OsChecklist {
        +int id
        +int os_id
        +String item_id
        +String item_nome
        +Boolean feito
        +Date data_verificacao
        +String tecnico_verificador
    }

    class OsFoto {
        +int id
        +int os_id
        +String nome_arquivo
        +String caminho
        +int tamanho_bytes
    }

    class OsAssinatura {
        +int id
        +int os_id
        +Text sig_cliente
        +Text sig_tecnico
    }

    class OsAcessorio {
        +int id
        +int os_id
        +String nome
    }

    class Notificacao {
        +int id
        +int usuario_id
        +int os_id
        +String mensagem
        +String tipo
        +Boolean lida
        +DateTime criado_em
        +to_dict() dict
    }

    class Relatorio {
        +int id
        +int os_id
        +String tipo
        +String formato
        +String nome_arquivo
        +String caminho
        +int gerado_por
        +DateTime gerado_em
    }

    class SyncQueue {
        +int id
        +String device_id
        +String acao
        +Text payload
        +String status
        +String erro_msg
        +DateTime criado_em
        +DateTime processado_em
    }

    %% Relacionamentos
    Usuario "1" --> "0..1" Tecnico : extends
    Usuario "1" --> "0..*" OrdemServico : cria
    Usuario "1" --> "0..*" Notificacao : recebe

    Cliente "1" --> "0..*" Equipamento : possui
    Cliente "1" --> "0..*" OrdemServico : associado a

    Tecnico "1" --> "0..*" OrdemServico : atende

    OrdemServico "1" --> "0..*" OsChecklist : contém
    OrdemServico "1" --> "0..*" OsFoto      : anexa
    OrdemServico "1" --> "0..1" OsAssinatura: possui
    OrdemServico "1" --> "0..*" OsAcessorio : lista
    OrdemServico "0..*" --> "0..*" Equipamento : vincula
    OrdemServico "1" --> "0..*" Notificacao : gera
    OrdemServico "1" --> "0..*" Relatorio   : exporta
```

---

## Tarefa 2 — Diagrama de Componentes (Mermaid)

```mermaid
graph TD
    subgraph DISPOSITIVO["📱 Dispositivo do Técnico (Frontend)"]
        direction TB
        UI["🖥️ Interface Web\n(HTML · CSS · JS)"]
        SW["⚙️ Service Worker\n(Cache-First / Network-First)"]
        IDB["💾 IndexedDB\nos_pendentes"]
        SYNC["🔄 sync.js\nBatch Sync"]
    end

    subgraph FLASK["🐍 Backend Flask (Python)"]
        direction TB
        AUTH["🔐 Blueprint: auth\n/login · /logout"]
        OS_BP["📋 Blueprint: os\n/api/os/"]
        CLI_BP["👤 Blueprint: clientes\n/api/clientes/"]
        NOTIF_BP["🔔 Blueprint: notificacoes\n/api/notificacoes/"]
        REL_BP["📄 Blueprint: relatorios\n/api/relatorios/"]
        SYNC_BP["🔄 Blueprint: sync\n/api/sync/batch"]
    end

    subgraph SERVICES["🛠️ Serviços"]
        PDF["📑 pdf_service\n(ReportLab)"]
        WORD["📝 word_service\n(python-docx)"]
    end

    subgraph DB["🗃️ Banco de Dados"]
        ORM["🔗 SQLAlchemy ORM"]
        SQLITE["📦 SQLite / MySQL"]
    end

    subgraph EXTERNOS["🌐 Serviços Externos (simulados)"]
        EMAIL["📧 SMTP / Email"]
        WHATS["💬 WhatsApp / SMS"]
        GEO["📍 Geolocation API"]
    end

    %% Frontend → Service Worker → IDB
    UI -->|"Fetch (online)"| SW
    UI -->|"salvarOffline()"| IDB
    SW -->|"Cache miss"| FLASK
    SW -->|"Cache hit"| UI
    IDB -->|"listarPendentes()"| SYNC
    SYNC -->|"POST /api/sync/batch"| SYNC_BP

    %% Frontend → Flask
    UI -->|"POST /api/os/"| OS_BP
    UI -->|"GET /api/os/"| OS_BP
    UI -->|"DELETE /api/os/id"| OS_BP
    UI -->|"POST /api/relatorios/id/pdf"| REL_BP
    UI -->|"POST /api/relatorios/id/word"| REL_BP
    UI -->|"GET /api/notificacoes/"| NOTIF_BP
    UI -->|"/login"| AUTH

    %% Flask → Serviços
    REL_BP --> PDF
    REL_BP --> WORD

    %% Flask → DB
    OS_BP --> ORM
    CLI_BP --> ORM
    NOTIF_BP --> ORM
    SYNC_BP --> ORM
    AUTH --> ORM
    ORM --> SQLITE

    %% Flask → Externos
    OS_BP -.->|"Notificação urgente"| EMAIL
    OS_BP -.->|"Alerta SMS"| WHATS
    UI -.->|"navigator.geolocation"| GEO
```

---

## Tarefa 3 — SQL DDL

> Veja o arquivo `schema.sql` na raiz do projeto.  
> Contém todas as tabelas com chaves primárias, estrangeiras,
> índices de performance e **soft delete** (`ativo BOOLEAN DEFAULT 1`)
> garantindo a RN04.

---

## Tarefa 4 — Arquitetura de Sincronização Offline

### Descrição Técnica

O suporte offline é implementado em duas camadas complementares:

**Frontend — Service Worker + IndexedDB**

O `sw.js` intercepta todas as requisições `GET` com estratégia **Cache-First** para
assets estáticos (HTML, CSS, JS) e **Network-First** para rotas de API, armazenando
respostas bem-sucedidas no `CacheStorage` (versão `gerenciador-os-v1`). Quando o
técnico cria uma OS sem conexão, o `app.js` chama `salvarOffline()`, que serializa
todo o payload da OS em JSON e o persiste no IndexedDB (store `os_pendentes`,
keyPath `local_id = "OS-LOCAL-{timestamp}"`). O `sync.js` registra um `BackgroundSync`
com tag `sync-os-pendentes` via `SyncManager` e adiciona listeners para os eventos
`online` e mensagens do Service Worker. Ao detectar reconexão, o `tentarSync()`
lê todos os registros com `status='pendente'` via `osDB.listarPendentes()` e monta
um único **array JSON** com todos eles.

**Backend Flask — Endpoint de batch (`/api/sync/batch`)**

O `sync_bp` recebe o array via `POST /api/sync/batch`, itera sobre cada item e
processa individualmente dentro de um bloco `try/except`, gravando o resultado
(sucesso ou erro) na tabela `sync_queue` para auditoria. A estratégia de **processamento
parcial** com resposta `207 Multi-Status` garante que um item inválido não bloqueie
os demais. Após o processamento, o frontend chama `osDB.marcarSincronizada(localId)`
para cada item bem-sucedido e `osDB.limparSincronizados()` para liberar espaço no
IndexedDB. O resultado final é exibido ao usuário via toast com contagem de
sincronizações bem-sucedidas e erros.

---

## Estrutura de Arquivos

```
PROJETO EXTESAO/
├── app.py                     ← Factory Flask + registro de blueprints
├── config.py                  ← SQLite (dev) / MySQL (prod)
├── models.py                  ← SQLAlchemy models (todos os relacionamentos)
├── schema.sql                 ← DDL completo (MySQL/SQLite)
├── requirements.txt
│
├── blueprints/
│   ├── auth.py                ← Login / logout / registro
│   ├── os_routes.py           ← CRUD de OS + dashboard
│   ├── cliente_routes.py      ← CRUD de clientes + equipamentos
│   ├── notificacao_routes.py  ← Notificações por usuário
│   ├── relatorio_routes.py    ← Export PDF e Word
│   └── sync_routes.py         ← Endpoint de sincronização batch
│
├── services/
│   ├── pdf_service.py         ← ReportLab — PDF estilizado
│   └── word_service.py        ← python-docx — Word estilizado
│
├── templates/
│   ├── base.html              ← Layout Sidebar + Header (Jinja2)
│   ├── login.html             ← Tela de login glassmorphism
│   ├── dashboard.html         ← Dashboard com estatísticas
│   └── os/
│       ├── nova.html          ← Formulário de Nova OS (8 seções)
│       └── lista.html         ← Listagem com filtros e cards
│
└── static/
    ├── css/style.css          ← Design "Nebula Dark" (indigo/violet/cyan)
    ├── manifest.json          ← PWA manifest
    └── js/
        ├── app.js             ← Lógica do formulário + IndexedDB
        ├── lista.js           ← Listagem dinâmica + export
        ├── sig.js             ← Assinaturas digitais canvas
        ├── geo.js             ← Geolocalização GPS
        ├── sw.js              ← Service Worker (offline)
        ├── db.js              ← IndexedDB wrapper
        └── sync.js            ← Sync batch offline→servidor
```
