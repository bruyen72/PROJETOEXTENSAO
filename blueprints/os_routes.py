import json
import os
from datetime import date, datetime, time as dtime
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from models import db, OrdemServico, Cliente, Tecnico, Equipamento, OsAcessorio, OsChecklist, OsAssinatura, Notificacao, OsFoto

os_bp = Blueprint('os', __name__)

# ── Domínios válidos (RN07, RN08) ─────────────────────────
PRIORIDADES    = ('Baixa', 'Média', 'Urgente')
TIPOS_OCORRENCIA = ('Preventiva', 'Manutenção', 'Corretiva')
EXTENSOES_FOTO = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'}

def extensao_valida(nome):
    return '.' in nome and nome.rsplit('.', 1)[1].lower() in EXTENSOES_FOTO

CHECKLIST_PADRAO = [
    {'id': 'bat',  'nome': 'Teste de Bateria / Carga'},
    {'id': 'tx',   'nome': 'Teste de Transmissão (TX)'},
    {'id': 'rx',   'nome': 'Teste de Recepção (RX)'},
    {'id': 'freq', 'nome': 'Verificação de Frequência / Canal'},
    {'id': 'prog', 'nome': 'Programação / Software'},
    {'id': 'ant',  'nome': 'Inspeção da Antena'},
    {'id': 'mic',  'nome': 'Teste de Microfone / Áudio'},
    {'id': 'btn',  'nome': 'Teste de Botões / Display'},
    {'id': 'con',  'nome': 'Teste de Conector / Solda'},
    {'id': 'fis',  'nome': 'Inspeção Física / Limpeza'},
    {'id': 'fab',  'nome': 'Encaminhado ao Fabricante'},
    {'id': 'qc',   'nome': 'Controle de Qualidade Final'},
]


@os_bp.route('/dashboard')
@login_required
def dashboard():
    total      = OrdemServico.query.filter_by(ativo=True).count()
    abertas    = OrdemServico.query.filter_by(ativo=True, status='Aberto').count()
    andamento  = OrdemServico.query.filter_by(ativo=True, status='Em Andamento').count()
    concluidas = OrdemServico.query.filter_by(ativo=True, status='Concluido').count()
    urgentes   = OrdemServico.query.filter_by(ativo=True, prioridade='Urgente').count()
    recentes   = OrdemServico.query.filter_by(ativo=True).order_by(OrdemServico.criado_em.desc()).limit(8).all()
    notifs     = Notificacao.query.filter_by(usuario_id=current_user.id, lida=False).order_by(Notificacao.criado_em.desc()).limit(5).all()

    return render_template('dashboard.html',
        total=total, abertas=abertas, andamento=andamento,
        concluidas=concluidas, urgentes=urgentes,
        recentes=recentes, notificacoes=notifs)


@os_bp.route('/nova', methods=['GET', 'POST'])
@login_required
def nova():
    clientes   = Cliente.query.filter_by(ativo=True).order_by(Cliente.nome).all()
    tecnicos   = Tecnico.query.join(Tecnico.usuario).all()
    return render_template('os/nova.html', clientes=clientes, tecnicos=tecnicos,
                           checklist=CHECKLIST_PADRAO)


@os_bp.route('/lista')
@login_required
def lista():
    clientes = Cliente.query.filter_by(ativo=True).order_by(Cliente.nome).all()
    return render_template('os/lista.html', clientes=clientes)


# ── API endpoints (chamados pelo JS) ────────────────────────

@os_bp.route('/', methods=['POST'])
@login_required
def criar():
    data = request.get_json()
    if not data:
        return jsonify({'erro': 'Payload inválido'}), 400

    if not data.get('cliente_id'):
        return jsonify({'erro': 'Cliente é obrigatório (RN01)'}), 422
    if not data.get('data_entrada'):
        return jsonify({'erro': 'Data de entrada é obrigatória (RN02)'}), 422

    # RN07 — Validar prioridade
    prioridade = data.get('prioridade', 'Baixa')
    if prioridade not in PRIORIDADES:
        return jsonify({'erro': f'Prioridade inválida. Valores aceitos: {", ".join(PRIORIDADES)}'}), 422

    # RN08 — Validar tipo de ocorrência
    tipo_ocorrencia = data.get('tipo_ocorrencia')
    if tipo_ocorrencia and tipo_ocorrencia not in TIPOS_OCORRENCIA:
        return jsonify({'erro': f'Tipo de ocorrência inválido. Valores aceitos: {", ".join(TIPOS_OCORRENCIA)}'}), 422

    numero_os = (data.get('numero_os') or '').strip()
    if not numero_os:
        numero_os = f"OS-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

    # Verifica duplicata ANTES de tentar inserir
    if OrdemServico.query.filter_by(numero_os=numero_os).first():
        return jsonify({'erro': f'Número de OS "{numero_os}" já existe. Use um número diferente.'}), 409

    def _hora(s):
        try:
            return dtime.fromisoformat(s) if s else None
        except Exception:
            return None

    def _data(s):
        try:
            return date.fromisoformat(s) if s else None
        except Exception:
            return None

    def _sig_valida(s):
        """Retorna a assinatura só se o usuário realmente desenhou algo."""
        if not s or not s.startswith('data:image/'):
            return None
        # PNG em branco tem menos de 200 bytes em base64; se for maior, tem conteúdo real
        b64 = s.split(',', 1)[-1] if ',' in s else s
        return s if len(b64) > 200 else None

    try:
        os_obj = OrdemServico(
            numero_os          = numero_os,
            descricao          = data.get('descricao') or None,
            status             = data.get('status', 'Aberto'),
            prioridade         = prioridade,
            tipo_ocorrencia    = tipo_ocorrencia or None,
            acompanhante       = data.get('acompanhante') or None,
            data_entrada       = date.fromisoformat(data['data_entrada']),
            hora_entrada       = _hora(data.get('hora_entrada')),
            condicoes_fisicas  = data.get('condicoes_fisicas') or None,
            defeito_relatado   = data.get('defeito_relatado') or None,
            status_equipamento = data.get('status_equipamento') or None,
            laudo_tecnico      = data.get('laudo_tecnico') or None,
            solucao_aplicada   = data.get('solucao_aplicada') or None,
            pecas_utilizadas   = data.get('pecas_utilizadas') or None,
            termos_observacoes = data.get('termos_observacoes') or None,
            geo_lat            = float(data['geo_lat']) if data.get('geo_lat') else None,
            geo_lng            = float(data['geo_lng']) if data.get('geo_lng') else None,
            geo_endereco       = data.get('geo_endereco') or None,
            cliente_id         = data['cliente_id'],
            tecnico_id         = data.get('tecnico_id') or None,
            criado_por         = current_user.id,
        )
        db.session.add(os_obj)
        db.session.flush()

        # Acessórios
        for nome in (data.get('acessorios') or []):
            if nome:
                db.session.add(OsAcessorio(os_id=os_obj.id, nome=nome))

        # Checklist
        for item in (data.get('checklist') or []):
            db.session.add(OsChecklist(
                os_id=os_obj.id,
                item_id=item['id'],
                item_nome=item['nome'],
                feito=item.get('feito', False),
                data_verificacao=_data(item.get('data')),
                tecnico_verificador=item.get('tecnico') or None,
            ))

        # Assinatura — só salva se houver traço real
        sig_cli = _sig_valida(data.get('sig_cliente'))
        sig_tec = _sig_valida(data.get('sig_tecnico'))
        if sig_cli or sig_tec:
            db.session.add(OsAssinatura(
                os_id=os_obj.id,
                sig_cliente=sig_cli,
                sig_tecnico=sig_tec,
            ))

        # Notificação automática para urgente
        if os_obj.prioridade == 'Urgente':
            db.session.add(Notificacao(
                usuario_id=current_user.id,
                os_id=os_obj.id,
                mensagem=f'OS urgente criada: {numero_os}',
                tipo='urgente',
            ))

        db.session.commit()
        return jsonify({'id': os_obj.id, 'numero_os': os_obj.numero_os}), 201

    except Exception as exc:
        db.session.rollback()
        current_app.logger.error('Erro ao criar OS: %s', exc, exc_info=True)
        msg = str(exc)
        if 'UniqueViolation' in msg or 'unique constraint' in msg.lower():
            return jsonify({'erro': f'Número de OS "{numero_os}" já existe. Use um número diferente.'}), 409
        return jsonify({'erro': 'Erro ao salvar OS. Verifique os dados e tente novamente.'}), 500


@os_bp.route('/', methods=['GET'])
@login_required
def listar():
    q          = request.args.get('q', '').strip()
    status     = request.args.get('status')
    prioridade = request.args.get('prioridade')
    cliente_id = request.args.get('cliente_id', type=int)
    page       = request.args.get('page', 1, type=int)

    query = OrdemServico.query.filter_by(ativo=True)

    if q:
        like = f'%{q}%'
        query = query.filter(OrdemServico.numero_os.ilike(like) | OrdemServico.defeito_relatado.ilike(like))
    if status:
        query = query.filter_by(status=status)
    if prioridade:
        query = query.filter_by(prioridade=prioridade)
    if cliente_id:
        query = query.filter_by(cliente_id=cliente_id)

    pag = query.order_by(OrdemServico.criado_em.desc()).paginate(page=page, per_page=20)

    return jsonify({
        'items': [o.to_dict() for o in pag.items],
        'total': pag.total, 'pages': pag.pages, 'page': pag.page,
    })


@os_bp.route('/<int:os_id>', methods=['GET'])
@login_required
def detalhe(os_id):
    os_obj = OrdemServico.query.filter_by(id=os_id, ativo=True).first_or_404()
    return jsonify(os_obj.to_dict())


@os_bp.route('/<int:os_id>', methods=['PUT'])
@login_required
def editar(os_id):
    os_obj = OrdemServico.query.filter_by(id=os_id, ativo=True).first_or_404()
    data   = request.get_json()

    campos = ['descricao','status','prioridade','tipo_ocorrencia','acompanhante',
              'hora_entrada','condicoes_fisicas','defeito_relatado','status_equipamento',
              'laudo_tecnico','solucao_aplicada','pecas_utilizadas',
              'termos_observacoes','geo_lat','geo_lng','geo_endereco','tecnico_id']

    for campo in campos:
        if campo in data:
            # RN07 — validar prioridade na edição
            if campo == 'prioridade' and data[campo] not in PRIORIDADES:
                return jsonify({'erro': f'Prioridade inválida. Use: {", ".join(PRIORIDADES)}'}), 422
            # RN08 — validar tipo_ocorrencia na edição
            if campo == 'tipo_ocorrencia' and data[campo] and data[campo] not in TIPOS_OCORRENCIA:
                return jsonify({'erro': f'Tipo de ocorrência inválido. Use: {", ".join(TIPOS_OCORRENCIA)}'}), 422
            setattr(os_obj, campo, data[campo])

    if 'data_saida' in data and data['data_saida']:
        os_obj.data_saida = date.fromisoformat(data['data_saida'])

    db.session.commit()
    return jsonify({'ok': True, 'numero_os': os_obj.numero_os})


@os_bp.route('/<int:os_id>', methods=['DELETE'])
@login_required
def desativar(os_id):
    os_obj = OrdemServico.query.filter_by(id=os_id, ativo=True).first_or_404()
    os_obj.desativar()
    db.session.commit()
    return jsonify({'ok': True, 'mensagem': 'OS desativada (soft delete)'})


# ── RF27/RF28 — Upload de fotos ───────────────────────────

@os_bp.route('/<int:os_id>/fotos', methods=['GET'])
@login_required
def listar_fotos(os_id):
    OrdemServico.query.filter_by(id=os_id, ativo=True).first_or_404()
    fotos = OsFoto.query.filter_by(os_id=os_id).all()
    return jsonify([{
        'id':           f.id,
        'nome_arquivo': f.nome_arquivo,
        'url':          f'/static/uploads/{f.nome_arquivo}',
        'tamanho_bytes': f.tamanho_bytes,
        'criado_em':    f.criado_em.isoformat(),
    } for f in fotos])


@os_bp.route('/<int:os_id>/fotos', methods=['POST'])
@login_required
def upload_foto(os_id):
    OrdemServico.query.filter_by(id=os_id, ativo=True).first_or_404()

    if 'foto' not in request.files:
        return jsonify({'erro': 'Nenhum arquivo enviado'}), 400

    arquivo = request.files['foto']
    if arquivo.filename == '':
        return jsonify({'erro': 'Nome de arquivo vazio'}), 400
    if not extensao_valida(arquivo.filename):
        return jsonify({'erro': f'Extensão não permitida. Use: {", ".join(EXTENSOES_FOTO)}'}), 422

    upload_dir = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_dir, exist_ok=True)

    ext      = arquivo.filename.rsplit('.', 1)[1].lower()
    nome     = secure_filename(f"os{os_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}.{ext}")
    caminho  = os.path.join(upload_dir, nome)
    arquivo.save(caminho)
    tamanho  = os.path.getsize(caminho)

    foto = OsFoto(os_id=os_id, nome_arquivo=nome, caminho=caminho, tamanho_bytes=tamanho)
    db.session.add(foto)
    db.session.commit()

    return jsonify({
        'id':           foto.id,
        'nome_arquivo': nome,
        'url':          f'/static/uploads/{nome}',
        'tamanho_bytes': tamanho,
    }), 201


@os_bp.route('/<int:os_id>/fotos/<int:foto_id>', methods=['DELETE'])
@login_required
def remover_foto(os_id, foto_id):
    foto = OsFoto.query.filter_by(id=foto_id, os_id=os_id).first_or_404()
    try:
        if os.path.exists(foto.caminho):
            os.remove(foto.caminho)
    except OSError:
        pass
    db.session.delete(foto)
    db.session.commit()
    return jsonify({'ok': True})
