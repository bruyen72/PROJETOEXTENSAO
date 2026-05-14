import os
from flask import Blueprint, jsonify, send_file, current_app
from flask_login import login_required, current_user
from models import db, OrdemServico, Relatorio
from services.pdf_service import gerar_pdf_os
from services.word_service import gerar_word_os

relatorio_bp = Blueprint('relatorios', __name__)


# RF29 — Listar relatórios gerados por OS
@relatorio_bp.route('/<int:os_id>/', methods=['GET'])
@login_required
def listar(os_id):
    OrdemServico.query.filter_by(id=os_id, ativo=True).first_or_404()
    rels = Relatorio.query.filter_by(os_id=os_id).order_by(Relatorio.gerado_em.desc()).all()
    return jsonify([{
        'id':           r.id,
        'tipo':         r.tipo,
        'formato':      r.formato,
        'nome_arquivo': r.nome_arquivo,
        'gerado_em':    r.gerado_em.isoformat(),
        'download_url': f'/api/relatorios/{os_id}/download/{r.id}',
    } for r in rels])


# Download de relatório já gerado
@relatorio_bp.route('/<int:os_id>/download/<int:rel_id>', methods=['GET'])
@login_required
def download(os_id, rel_id):
    rel = Relatorio.query.filter_by(id=rel_id, os_id=os_id).first_or_404()
    import os as _os
    if not _os.path.exists(rel.caminho):
        return jsonify({'erro': 'Arquivo não encontrado no servidor'}), 404
    mime = 'application/pdf' if rel.formato == 'PDF' else \
           'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    return send_file(rel.caminho, as_attachment=True,
                     download_name=rel.nome_arquivo, mimetype=mime)


@relatorio_bp.route('/<int:os_id>/pdf', methods=['POST'])
@login_required
def exportar_pdf(os_id):
    os_obj = OrdemServico.query.filter_by(id=os_id, ativo=True).first_or_404()
    upload = current_app.config['UPLOAD_FOLDER']
    caminho, nome = gerar_pdf_os(os_obj, upload)

    rel = Relatorio(os_id=os_id, tipo='Ficha OS', formato='PDF',
                    nome_arquivo=nome, caminho=caminho, gerado_por=current_user.id)
    db.session.add(rel)
    db.session.commit()

    return send_file(caminho, as_attachment=True, download_name=nome, mimetype='application/pdf')


@relatorio_bp.route('/<int:os_id>/word', methods=['POST'])
@login_required
def exportar_word(os_id):
    os_obj = OrdemServico.query.filter_by(id=os_id, ativo=True).first_or_404()
    upload = current_app.config['UPLOAD_FOLDER']
    caminho, nome = gerar_word_os(os_obj, upload)

    rel = Relatorio(os_id=os_id, tipo='Ficha OS', formato='Word',
                    nome_arquivo=nome, caminho=caminho, gerado_por=current_user.id)
    db.session.add(rel)
    db.session.commit()

    return send_file(caminho, as_attachment=True, download_name=nome,
                     mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
