from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from models import db, Notificacao

notificacao_bp = Blueprint('notificacoes', __name__)


@notificacao_bp.route('/', methods=['GET'])
@login_required
def listar():
    notifs = (Notificacao.query
              .filter_by(usuario_id=current_user.id)
              .order_by(Notificacao.criado_em.desc())
              .limit(50).all())
    return jsonify([n.to_dict() for n in notifs])


@notificacao_bp.route('/nao-lidas', methods=['GET'])
@login_required
def nao_lidas():
    count = Notificacao.query.filter_by(usuario_id=current_user.id, lida=False).count()
    return jsonify({'count': count})


@notificacao_bp.route('/<int:nid>/ler', methods=['PATCH'])
@login_required
def marcar_lida(nid):
    n = Notificacao.query.filter_by(id=nid, usuario_id=current_user.id).first_or_404()
    n.lida = True
    db.session.commit()
    return jsonify({'ok': True})


@notificacao_bp.route('/ler-todas', methods=['PATCH'])
@login_required
def ler_todas():
    Notificacao.query.filter_by(usuario_id=current_user.id, lida=False).update({'lida': True})
    db.session.commit()
    return jsonify({'ok': True})
