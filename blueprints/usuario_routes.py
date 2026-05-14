from flask import Blueprint, jsonify, render_template, request, abort
from flask_login import login_required, current_user
from models import db, Usuario

usuario_bp = Blueprint('usuarios', __name__)


@usuario_bp.route('/')
@login_required
def lista():
    return render_template('usuarios/lista.html')


@usuario_bp.route('/api/', methods=['GET'])
@login_required
def listar_api():
    if current_user.perfil != 'admin':
        abort(403)
    usuarios = Usuario.query.order_by(Usuario.nome).all()
    result = []
    for u in usuarios:
        d = u.to_dict()
        d['ativo'] = u.ativo
        result.append(d)
    return jsonify(result)


@usuario_bp.route('/api/', methods=['POST'])
@login_required
def criar():
    if current_user.perfil != 'admin':
        abort(403)
    data  = request.get_json()
    nome  = (data.get('nome') or '').strip()
    email = (data.get('email') or '').strip()
    senha = data.get('senha', '')
    perfil= data.get('perfil', 'tecnico')

    if not nome or not email:
        return jsonify({'erro': 'Nome e e-mail são obrigatórios'}), 422
    if not senha or len(senha) < 6:
        return jsonify({'erro': 'Senha deve ter ao menos 6 caracteres'}), 422
    if perfil not in ('admin', 'tecnico'):
        return jsonify({'erro': 'Perfil inválido'}), 422
    if Usuario.query.filter_by(email=email).first():
        return jsonify({'erro': 'E-mail já cadastrado'}), 409

    u = Usuario(nome=nome, email=email, perfil=perfil)
    u.set_senha(senha)
    db.session.add(u)
    db.session.commit()
    d = u.to_dict()
    d['ativo'] = u.ativo
    return jsonify(d), 201


@usuario_bp.route('/api/<int:uid>', methods=['PUT'])
@login_required
def editar(uid):
    if current_user.perfil != 'admin':
        abort(403)
    u    = Usuario.query.get_or_404(uid)
    data = request.get_json()

    nome  = (data.get('nome') or '').strip()
    email = (data.get('email') or '').strip()
    perfil= data.get('perfil', u.perfil)
    senha = data.get('senha', '')

    if not nome or not email:
        return jsonify({'erro': 'Nome e e-mail são obrigatórios'}), 422
    if perfil not in ('admin', 'tecnico'):
        return jsonify({'erro': 'Perfil inválido'}), 422

    existente = Usuario.query.filter_by(email=email).first()
    if existente and existente.id != uid:
        return jsonify({'erro': 'E-mail já está em uso por outro usuário'}), 409

    u.nome  = nome
    u.email = email
    u.perfil= perfil
    if senha:
        if len(senha) < 6:
            return jsonify({'erro': 'Senha deve ter ao menos 6 caracteres'}), 422
        u.set_senha(senha)

    db.session.commit()
    d = u.to_dict()
    d['ativo'] = u.ativo
    return jsonify(d)


@usuario_bp.route('/api/<int:uid>', methods=['DELETE'])
@login_required
def desativar(uid):
    if current_user.perfil != 'admin':
        abort(403)
    if uid == current_user.id:
        return jsonify({'erro': 'Você não pode desativar sua própria conta'}), 400
    u = Usuario.query.get_or_404(uid)
    u.ativo = False
    db.session.commit()
    return jsonify({'ok': True})
