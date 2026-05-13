"""
sync_routes.py — Endpoint de sincronização offline.

O frontend (Service Worker + IndexedDB) acumula OS criadas sem internet
e envia um lote (array JSON) para POST /api/sync/batch quando a
conexão é restabelecida. Cada item é processado individualmente;
erros parciais não bloqueiam o lote inteiro.
"""
import json
from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from models import db, OrdemServico, OsAcessorio, OsChecklist, OsAssinatura, SyncQueue
from blueprints.os_routes import CHECKLIST_PADRAO

sync_bp = Blueprint('sync', __name__)


@sync_bp.route('/batch', methods=['POST'])
@login_required
def batch():
    payload = request.get_json()
    if not isinstance(payload, list):
        return jsonify({'erro': 'Esperado array de OS'}), 400

    resultados = []
    for item in payload:
        fila = SyncQueue(
            device_id=item.get('device_id', 'desconhecido'),
            acao=item.get('acao', 'criar_os'),
            payload=json.dumps(item),
            status='pendente',
        )
        db.session.add(fila)
        db.session.flush()

        try:
            resultado = _processar_item(item)
            fila.status = 'processado'
            fila.processado_em = datetime.utcnow()
            resultados.append({'device_ref': item.get('local_id'), 'ok': True, **resultado})
        except Exception as ex:
            fila.status = 'erro'
            fila.erro_msg = str(ex)
            resultados.append({'device_ref': item.get('local_id'), 'ok': False, 'erro': str(ex)})

    db.session.commit()
    return jsonify({'processados': len(resultados), 'resultados': resultados}), 207


def _processar_item(data):
    from datetime import date
    os_obj = OrdemServico(
        numero_os          = data.get('numero_os') or f"OS-SYNC-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        status             = data.get('status', 'Aberto'),
        prioridade         = data.get('prioridade', 'Baixa'),
        tipo_ocorrencia    = data.get('tipo_ocorrencia'),
        data_entrada       = date.fromisoformat(data['data_entrada']),
        hora_entrada       = data.get('hora_entrada'),
        defeito_relatado   = data.get('defeito_relatado'),
        laudo_tecnico      = data.get('laudo_tecnico'),
        solucao_aplicada   = data.get('solucao_aplicada'),
        pecas_utilizadas   = data.get('pecas_utilizadas'),
        termos_observacoes = data.get('termos_observacoes'),
        geo_lat            = data.get('geo_lat'),
        geo_lng            = data.get('geo_lng'),
        geo_endereco       = data.get('geo_endereco'),
        cliente_id         = data['cliente_id'],
        criado_por         = current_user.id,
    )
    db.session.add(os_obj)
    db.session.flush()

    for nome in (data.get('acessorios') or []):
        db.session.add(OsAcessorio(os_id=os_obj.id, nome=nome))

    for item in (data.get('checklist') or []):
        db.session.add(OsChecklist(
            os_id=os_obj.id, item_id=item['id'], item_nome=item['nome'],
            feito=item.get('feito', False),
        ))

    return {'id': os_obj.id, 'numero_os': os_obj.numero_os}
