import os
from flask import Blueprint, jsonify, send_file, current_app
from flask_login import login_required, current_user
from models import db, OrdemServico, Relatorio
from services.pdf_service import gerar_pdf_os
from services.word_service import gerar_word_os

relatorio_bp = Blueprint('relatorios', __name__)


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
