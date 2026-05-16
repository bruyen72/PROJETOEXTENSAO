"""Geração de PDF da OS usando ReportLab — Design Green Professional."""
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, HRFlowable)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

# ── Paleta Green Professional ──────────────────────────────
GREEN    = colors.HexColor('#16a34a')
GREEN_D  = colors.HexColor('#15803d')
GREEN_L  = colors.HexColor('#dcfce7')
DARK     = colors.HexColor('#0f172a')
MUTED    = colors.HexColor('#64748b')
WHITE    = colors.white
LIGHT    = colors.HexColor('#f8fafc')
DANGER   = colors.HexColor('#dc2626')
WARNING  = colors.HexColor('#d97706')
INFO     = colors.HexColor('#0284c7')


def gerar_pdf_os(os_obj, upload_folder):
    nome    = f"{os_obj.numero_os}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.pdf"
    caminho = os.path.join(upload_folder, nome)
    os.makedirs(upload_folder, exist_ok=True)

    doc = SimpleDocTemplate(caminho, pagesize=A4,
                            leftMargin=14*mm, rightMargin=14*mm,
                            topMargin=14*mm, bottomMargin=14*mm)

    styles  = getSampleStyleSheet()
    title_s = ParagraphStyle('title',  fontName='Helvetica-Bold',
                              fontSize=16, textColor=WHITE, alignment=TA_LEFT)
    num_s   = ParagraphStyle('num',    fontName='Helvetica-Bold',
                              fontSize=13, textColor=GREEN_L, alignment=TA_CENTER)
    h2_s    = ParagraphStyle('h2',     fontName='Helvetica-Bold',
                              fontSize=9,  textColor=WHITE)
    body_s  = ParagraphStyle('body',   fontName='Helvetica',
                              fontSize=9,  textColor=DARK, leading=13)
    label_s = ParagraphStyle('label',  fontName='Helvetica-Bold',
                              fontSize=7,  textColor=MUTED)
    foot_s  = ParagraphStyle('foot',   fontName='Helvetica',
                              fontSize=7,  textColor=MUTED, alignment=TA_CENTER)

    elements = []

    # ── Cabeçalho ─────────────────────────────────────────
    hd = Table([[
        Paragraph('GERENCIADOR DE OS PARA CAMPO', title_s),
        Paragraph(f'Nº {os_obj.numero_os}', num_s),
    ]], colWidths=[110*mm, 65*mm])
    hd.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), GREEN_D),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING',   (0,0), (-1,-1), 8),
        ('TOPPADDING',    (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(hd)
    elements.append(Spacer(1, 4*mm))

    # Faixa de status
    prioridade = os_obj.prioridade or 'Baixa'
    cor_prio   = DANGER if prioridade == 'Urgente' else (WARNING if prioridade == 'Média' else GREEN)
    status_data = [[
        Paragraph(f'Status: {os_obj.status or "—"}',     ParagraphStyle('s', fontName='Helvetica-Bold', fontSize=8, textColor=WHITE)),
        Paragraph(f'Prioridade: {prioridade}',            ParagraphStyle('s', fontName='Helvetica-Bold', fontSize=8, textColor=WHITE)),
        Paragraph(f'Tipo: {os_obj.tipo_ocorrencia or "—"}', ParagraphStyle('s', fontName='Helvetica', fontSize=8, textColor=WHITE)),
    ]]
    st = Table(status_data, colWidths=[59*mm, 58*mm, 58*mm])
    st.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (0,-1), INFO),
        ('BACKGROUND',    (1,0), (1,-1), cor_prio),
        ('BACKGROUND',    (2,0), (2,-1), MUTED),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING',   (0,0), (-1,-1), 6),
        ('TOPPADDING',    (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(st)
    elements.append(Spacer(1, 4*mm))

    def secao(titulo):
        t = Table([[Paragraph(titulo, h2_s)]], colWidths=[175*mm])
        t.setStyle(TableStyle([
            ('BACKGROUND',    (0,0), (-1,-1), GREEN),
            ('LEFTPADDING',   (0,0), (-1,-1), 6),
            ('TOPPADDING',    (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 2*mm))

    def campo(label, valor):
        return [Paragraph(label.upper(), label_s),
                Paragraph(str(valor or '—'), body_s)]

    def campo_texto(label, valor):
        if valor:
            elements.append(Paragraph(label.upper(), label_s))
            elements.append(Paragraph(str(valor), body_s))
            elements.append(Spacer(1, 2*mm))

    # ── 1. Identificação ──────────────────────────────────
    secao('1. IDENTIFICAÇÃO')
    id_rows = [
        campo('Nº OS', os_obj.numero_os) + campo('Data Entrada', os_obj.data_entrada) + campo('Hora', os_obj.hora_entrada),
        campo('Data Saída', os_obj.data_saida) + campo('Técnico', os_obj.tecnico.usuario.nome if os_obj.tecnico else None) + ['', ''],
    ]
    id_t = Table(id_rows, colWidths=[30*mm, 28*mm, 30*mm, 28*mm, 30*mm, 29*mm])
    id_t.setStyle(TableStyle([
        ('VALIGN',      (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('BACKGROUND',  (0,0), (-1,-1), LIGHT),
        ('GRID',        (0,0), (-1,-1), 0.3, colors.HexColor('#e2e8f0')),
    ]))
    elements.append(id_t)
    elements.append(Spacer(1, 3*mm))

    # ── 2. Cliente e Acompanhante ─────────────────────────
    secao('2. CLIENTE E ATENDIMENTO')
    cli_rows = [
        campo('Cliente', os_obj.cliente.nome if os_obj.cliente else None) +
        campo('Acompanhou a Execução', os_obj.acompanhante),
        campo('Endereço / Local', os_obj.geo_endereco) + ['', ''],
    ]
    cli_t = Table(cli_rows, colWidths=[30*mm, 58*mm, 30*mm, 57*mm])
    cli_t.setStyle(TableStyle([
        ('VALIGN',      (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('BACKGROUND',  (0,0), (-1,-1), LIGHT),
        ('GRID',        (0,0), (-1,-1), 0.3, colors.HexColor('#e2e8f0')),
    ]))
    elements.append(cli_t)
    elements.append(Spacer(1, 3*mm))

    # ── 3. Laudo Técnico ──────────────────────────────────
    secao('3. LAUDO TÉCNICO & SOLUÇÃO')
    campo_texto('Condições Físicas do Equipamento', os_obj.condicoes_fisicas)
    campo_texto('Defeito Relatado', os_obj.defeito_relatado)
    campo_texto('Laudo / Diagnóstico Técnico', os_obj.laudo_tecnico)
    campo_texto('Solução Aplicada', os_obj.solucao_aplicada)
    campo_texto('Peças / Materiais Utilizados', os_obj.pecas_utilizadas)

    # ── 4. Checklist ──────────────────────────────────────
    if os_obj.checklist:
        secao('4. CHECKLIST DE TESTES')
        rows = [['#', 'Item de Verificação', 'Feito', 'Data Verificação', 'Técnico Verificador']]
        for i, item in enumerate(os_obj.checklist, 1):
            rows.append([
                str(i), item.item_nome,
                '✓' if item.feito else '✗',
                str(item.data_verificacao or ''),
                item.tecnico_verificador or '',
            ])
        ck = Table(rows, colWidths=[8*mm, 72*mm, 12*mm, 34*mm, 49*mm])
        ck.setStyle(TableStyle([
            ('BACKGROUND',    (0,0), (-1,0), GREEN_D),
            ('TEXTCOLOR',     (0,0), (-1,0), WHITE),
            ('FONTNAME',      (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE',      (0,0), (-1,-1), 8),
            ('ROWBACKGROUNDS',(0,1), (-1,-1), [LIGHT, WHITE]),
            ('GRID',          (0,0), (-1,-1), 0.3, colors.HexColor('#e2e8f0')),
            ('ALIGN',         (2,0), (2,-1), 'CENTER'),
            ('FONTNAME',      (2,1), (2,-1), 'Helvetica-Bold'),
        ]))
        elements.append(ck)
        elements.append(Spacer(1, 3*mm))

    # ── 5. Termos / Observações ───────────────────────────
    if os_obj.termos_observacoes:
        secao('5. TERMOS / OBSERVAÇÕES')
        elements.append(Paragraph(os_obj.termos_observacoes, body_s))
        elements.append(Spacer(1, 3*mm))

    # ── 6. Assinaturas ────────────────────────────────────
    secao('6. ASSINATURAS')
    sig_t = Table(
        [['Assinatura do Cliente', 'Assinatura do Técnico Responsável']],
        colWidths=[87*mm, 88*mm]
    )
    sig_t.setStyle(TableStyle([
        ('FONTNAME',      (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE',      (0,0), (-1,-1), 8),
        ('TEXTCOLOR',     (0,0), (-1,-1), MUTED),
        ('TOPPADDING',    (0,0), (-1,-1), 35),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('GRID',          (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
    ]))
    elements.append(sig_t)

    # ── Rodapé ────────────────────────────────────────────
    elements.append(Spacer(1, 4*mm))
    elements.append(HRFlowable(width='100%', thickness=0.5, color=GREEN))
    elements.append(Paragraph(
        f'TECPOINT · Gerenciador OS para Campo · UniSENAI MT · Gerado em {datetime.now().strftime("%d/%m/%Y às %H:%M")}',
        foot_s
    ))

    doc.build(elements)
    return caminho, nome
