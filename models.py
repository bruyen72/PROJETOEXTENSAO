from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

# ─── Tabela associativa OS ↔ Equipamento ──────────────────
os_equipamento = db.Table(
    'os_equipamento',
    db.Column('os_id',          db.Integer, db.ForeignKey('ordem_servico.id'), primary_key=True),
    db.Column('equipamento_id', db.Integer, db.ForeignKey('equipamento.id'),   primary_key=True),
)


class Usuario(UserMixin, db.Model):
    __tablename__ = 'usuario'

    id            = db.Column(db.Integer, primary_key=True)
    nome          = db.Column(db.String(100), nullable=False)
    email         = db.Column(db.String(150), nullable=False, unique=True)
    senha_hash    = db.Column(db.String(255), nullable=False)
    perfil        = db.Column(db.String(20),  nullable=False, default='tecnico')
    ativo         = db.Column(db.Boolean, nullable=False, default=True)
    criado_em     = db.Column(db.DateTime, default=datetime.utcnow)
    atualizado_em = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tecnico       = db.relationship('Tecnico', back_populates='usuario', uselist=False, cascade='all, delete-orphan')
    os_criadas    = db.relationship('OrdemServico', foreign_keys='OrdemServico.criado_por', back_populates='criador')
    notificacoes  = db.relationship('Notificacao', back_populates='usuario', cascade='all, delete-orphan')

    def set_senha(self, senha):
        self.senha_hash = generate_password_hash(senha)

    def check_senha(self, senha):
        return check_password_hash(self.senha_hash, senha)

    def to_dict(self):
        return {'id': self.id, 'nome': self.nome, 'email': self.email, 'perfil': self.perfil}


class Tecnico(db.Model):
    __tablename__ = 'tecnico'

    id            = db.Column(db.Integer, primary_key=True)
    usuario_id    = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False, unique=True)
    especialidade = db.Column(db.String(100))
    geo_lat       = db.Column(db.Numeric(10, 8))
    geo_lng       = db.Column(db.Numeric(11, 8))
    atualizado_em = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    usuario       = db.relationship('Usuario', back_populates='tecnico')
    os_atendidas  = db.relationship('OrdemServico', foreign_keys='OrdemServico.tecnico_id', back_populates='tecnico')

    def to_dict(self):
        return {
            'id': self.id,
            'usuario': self.usuario.to_dict(),
            'especialidade': self.especialidade,
            'geo_lat': float(self.geo_lat) if self.geo_lat else None,
            'geo_lng': float(self.geo_lng) if self.geo_lng else None,
        }


class Cliente(db.Model):
    __tablename__ = 'cliente'

    id            = db.Column(db.Integer, primary_key=True)
    nome          = db.Column(db.String(100), nullable=False)
    telefone      = db.Column(db.String(20))
    email         = db.Column(db.String(150))
    endereco      = db.Column(db.Text)
    ativo         = db.Column(db.Boolean, nullable=False, default=True)
    criado_em     = db.Column(db.DateTime, default=datetime.utcnow)
    atualizado_em = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    equipamentos  = db.relationship('Equipamento', back_populates='cliente', cascade='all, delete-orphan')
    ordens        = db.relationship('OrdemServico',  back_populates='cliente')

    def to_dict(self):
        return {
            'id': self.id, 'nome': self.nome,
            'telefone': self.telefone, 'email': self.email,
            'endereco': self.endereco, 'ativo': self.ativo,
        }


class Equipamento(db.Model):
    __tablename__ = 'equipamento'

    id                = db.Column(db.Integer, primary_key=True)
    tipo              = db.Column(db.String(50),  nullable=False)
    marca             = db.Column(db.String(50),  nullable=False)
    modelo            = db.Column(db.String(100), nullable=False)
    numero_serie      = db.Column(db.String(100), nullable=False, unique=True)
    cliente_id        = db.Column(db.Integer, db.ForeignKey('cliente.id'), nullable=False)
    cor_identificacao = db.Column(db.String(80))
    canal_frequencia  = db.Column(db.String(80))
    ativo             = db.Column(db.Boolean, nullable=False, default=True)
    criado_em         = db.Column(db.DateTime, default=datetime.utcnow)

    cliente           = db.relationship('Cliente', back_populates='equipamentos')

    def to_dict(self):
        return {
            'id': self.id, 'tipo': self.tipo, 'marca': self.marca,
            'modelo': self.modelo, 'numero_serie': self.numero_serie,
            'cliente_id': self.cliente_id, 'cor_identificacao': self.cor_identificacao,
            'canal_frequencia': self.canal_frequencia, 'ativo': self.ativo,
        }


class OrdemServico(db.Model):
    __tablename__ = 'ordem_servico'

    id                 = db.Column(db.Integer, primary_key=True)
    numero_os          = db.Column(db.String(50), nullable=False, unique=True)
    descricao          = db.Column(db.Text)
    status             = db.Column(db.String(20),  nullable=False, default='Aberto')
    prioridade         = db.Column(db.String(10),  nullable=False, default='Baixa')
    tipo_ocorrencia    = db.Column(db.String(20))
    data_entrada       = db.Column(db.Date,   nullable=False)
    hora_entrada       = db.Column(db.Time)
    data_saida         = db.Column(db.Date)
    acompanhante       = db.Column(db.String(150))  # RF12 — quem acompanhou a execução
    condicoes_fisicas  = db.Column(db.Text)
    defeito_relatado   = db.Column(db.Text)
    status_equipamento = db.Column(db.String(50))
    laudo_tecnico      = db.Column(db.Text)
    solucao_aplicada   = db.Column(db.Text)
    pecas_utilizadas   = db.Column(db.Text)
    termos_observacoes = db.Column(db.Text)
    geo_lat            = db.Column(db.Numeric(10, 8))
    geo_lng            = db.Column(db.Numeric(11, 8))
    geo_endereco       = db.Column(db.String(255))
    ativo              = db.Column(db.Boolean, nullable=False, default=True)  # soft delete
    criado_em          = db.Column(db.DateTime, default=datetime.utcnow)
    atualizado_em      = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    cliente_id  = db.Column(db.Integer, db.ForeignKey('cliente.id'),  nullable=False)
    tecnico_id  = db.Column(db.Integer, db.ForeignKey('tecnico.id'),  nullable=True)
    criado_por  = db.Column(db.Integer, db.ForeignKey('usuario.id'),  nullable=False)

    cliente      = db.relationship('Cliente',    back_populates='ordens')
    tecnico      = db.relationship('Tecnico',    foreign_keys=[tecnico_id], back_populates='os_atendidas')
    criador      = db.relationship('Usuario',    foreign_keys=[criado_por], back_populates='os_criadas')
    equipamentos = db.relationship('Equipamento', secondary=os_equipamento, backref='ordens')
    acessorios   = db.relationship('OsAcessorio',  back_populates='os', cascade='all, delete-orphan')
    checklist    = db.relationship('OsChecklist',  back_populates='os', cascade='all, delete-orphan')
    fotos        = db.relationship('OsFoto',       back_populates='os', cascade='all, delete-orphan')
    assinatura   = db.relationship('OsAssinatura', back_populates='os', uselist=False, cascade='all, delete-orphan')
    notificacoes = db.relationship('Notificacao',  back_populates='os')
    relatorios   = db.relationship('Relatorio',    back_populates='os', cascade='all, delete-orphan')

    def desativar(self):
        self.ativo = False
        self.atualizado_em = datetime.utcnow()

    def to_dict(self):
        return {
            'id': self.id, 'numero_os': self.numero_os,
            'status': self.status, 'prioridade': self.prioridade,
            'tipo_ocorrencia': self.tipo_ocorrencia,
            'acompanhante': self.acompanhante,
            'data_entrada': self.data_entrada.isoformat() if self.data_entrada else None,
            'data_saida': self.data_saida.isoformat() if self.data_saida else None,
            'cliente_id': self.cliente_id,
            'cliente_nome': self.cliente.nome if self.cliente else None,
            'tecnico_id': self.tecnico_id, 'ativo': self.ativo,
            'criado_em': self.criado_em.isoformat(),
        }


class OsAcessorio(db.Model):
    __tablename__ = 'os_acessorio'
    id    = db.Column(db.Integer, primary_key=True)
    os_id = db.Column(db.Integer, db.ForeignKey('ordem_servico.id'), nullable=False)
    nome  = db.Column(db.String(100), nullable=False)
    os    = db.relationship('OrdemServico', back_populates='acessorios')


class OsChecklist(db.Model):
    __tablename__ = 'os_checklist'
    id                  = db.Column(db.Integer, primary_key=True)
    os_id               = db.Column(db.Integer, db.ForeignKey('ordem_servico.id'), nullable=False)
    item_id             = db.Column(db.String(20),  nullable=False)
    item_nome           = db.Column(db.String(100), nullable=False)
    feito               = db.Column(db.Boolean, default=False)
    data_verificacao    = db.Column(db.Date)
    tecnico_verificador = db.Column(db.String(100))
    os                  = db.relationship('OrdemServico', back_populates='checklist')


class OsFoto(db.Model):
    __tablename__ = 'os_foto'
    id            = db.Column(db.Integer, primary_key=True)
    os_id         = db.Column(db.Integer, db.ForeignKey('ordem_servico.id'), nullable=False)
    nome_arquivo  = db.Column(db.String(255), nullable=False)
    caminho       = db.Column(db.String(500), nullable=False)
    tamanho_bytes = db.Column(db.Integer)
    criado_em     = db.Column(db.DateTime, default=datetime.utcnow)
    os            = db.relationship('OrdemServico', back_populates='fotos')


class OsAssinatura(db.Model):
    __tablename__ = 'os_assinatura'
    id          = db.Column(db.Integer, primary_key=True)
    os_id       = db.Column(db.Integer, db.ForeignKey('ordem_servico.id'), nullable=False, unique=True)
    sig_cliente = db.Column(db.Text)
    sig_tecnico = db.Column(db.Text)
    criado_em   = db.Column(db.DateTime, default=datetime.utcnow)
    os          = db.relationship('OrdemServico', back_populates='assinatura')


class Notificacao(db.Model):
    __tablename__ = 'notificacao'
    id         = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    os_id      = db.Column(db.Integer, db.ForeignKey('ordem_servico.id'), nullable=True)
    mensagem   = db.Column(db.Text, nullable=False)
    tipo       = db.Column(db.String(20), default='info')
    lida       = db.Column(db.Boolean, default=False)
    criado_em  = db.Column(db.DateTime, default=datetime.utcnow)
    usuario    = db.relationship('Usuario', back_populates='notificacoes')
    os         = db.relationship('OrdemServico', back_populates='notificacoes')

    def to_dict(self):
        return {
            'id': self.id, 'mensagem': self.mensagem,
            'tipo': self.tipo, 'lida': self.lida,
            'criado_em': self.criado_em.isoformat(),
            'os_id': self.os_id,
        }


class Relatorio(db.Model):
    __tablename__ = 'relatorio'
    id           = db.Column(db.Integer, primary_key=True)
    os_id        = db.Column(db.Integer, db.ForeignKey('ordem_servico.id'), nullable=False)
    tipo         = db.Column(db.String(50),  nullable=False)
    formato      = db.Column(db.String(10),  nullable=False)
    nome_arquivo = db.Column(db.String(255), nullable=False)
    caminho      = db.Column(db.String(500), nullable=False)
    gerado_por   = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    gerado_em    = db.Column(db.DateTime, default=datetime.utcnow)
    os           = db.relationship('OrdemServico', back_populates='relatorios')


class SyncQueue(db.Model):
    __tablename__ = 'sync_queue'
    id            = db.Column(db.Integer, primary_key=True)
    device_id     = db.Column(db.String(100), nullable=False)
    acao          = db.Column(db.String(20),  nullable=False)
    payload       = db.Column(db.Text,        nullable=False)
    status        = db.Column(db.String(20),  nullable=False, default='pendente')
    erro_msg      = db.Column(db.Text)
    criado_em     = db.Column(db.DateTime, default=datetime.utcnow)
    processado_em = db.Column(db.DateTime)
