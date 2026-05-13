from flask import Blueprint, jsonify, request
from flask_login import login_required
from models import db, Cliente, Equipamento

cliente_bp = Blueprint('clientes', __name__)


@cliente_bp.route('/', methods=['GET'])
@login_required
def listar():
    q     = request.args.get('q', '').strip()
    query = Cliente.query.filter_by(ativo=True)
    if q:
        query = query.filter(Cliente.nome.ilike(f'%{q}%'))
    clientes = query.order_by(Cliente.nome).all()
    return jsonify([c.to_dict() for c in clientes])


@cliente_bp.route('/', methods=['POST'])
@login_required
def criar():
    data = request.get_json()
    if not data or not data.get('nome'):
        return jsonify({'erro': 'Nome do cliente é obrigatório'}), 422
    c = Cliente(nome=data['nome'], telefone=data.get('telefone'),
                email=data.get('email'), endereco=data.get('endereco'))
    db.session.add(c)
    db.session.commit()
    return jsonify(c.to_dict()), 201


@cliente_bp.route('/<int:cid>', methods=['PUT'])
@login_required
def editar(cid):
    c    = Cliente.query.filter_by(id=cid, ativo=True).first_or_404()
    data = request.get_json()
    for campo in ['nome', 'telefone', 'email', 'endereco']:
        if campo in data:
            setattr(c, campo, data[campo])
    db.session.commit()
    return jsonify(c.to_dict())


@cliente_bp.route('/<int:cid>', methods=['DELETE'])
@login_required
def desativar(cid):
    c = Cliente.query.filter_by(id=cid, ativo=True).first_or_404()
    c.ativo = False
    db.session.commit()
    return jsonify({'ok': True})


@cliente_bp.route('/<int:cid>/equipamentos', methods=['GET'])
@login_required
def equipamentos(cid):
    Cliente.query.filter_by(id=cid, ativo=True).first_or_404()
    equips = Equipamento.query.filter_by(cliente_id=cid, ativo=True).all()
    return jsonify([e.to_dict() for e in equips])


@cliente_bp.route('/<int:cid>/equipamentos', methods=['POST'])
@login_required
def criar_equipamento(cid):
    Cliente.query.filter_by(id=cid, ativo=True).first_or_404()
    data = request.get_json()
    campos = ['tipo', 'marca', 'modelo', 'numero_serie']
    for c in campos:
        if not data.get(c):
            return jsonify({'erro': f'Campo {c} obrigatório'}), 422
    e = Equipamento(
        tipo=data['tipo'], marca=data['marca'], modelo=data['modelo'],
        numero_serie=data['numero_serie'], cliente_id=cid,
        cor_identificacao=data.get('cor_identificacao'),
        canal_frequencia=data.get('canal_frequencia'),
    )
    db.session.add(e)
    db.session.commit()
    return jsonify(e.to_dict()), 201
