"""Geração de PDF da OS usando ReportLab."""
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, HRFlowable)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# Paleta de cores
INDIGO  = colors.HexColor('#6366f1')
VIOLET  = colors.HexColor('#8b5cf6')
CYAN    = colors.HexColor('#06b6d4')
DARK    = colors.HexColor('#0f172a')
MUTED   = colors.HexColor('#64748b')
SUCCESS = colors.HexColor('#10b981')
DANGER  = colors.HexColor('#ef4444')
WARNING = colors.HexColor('#f59e0b')
WHITE   = colors.white
LIGHT   = colors.HexColor('#f8fafc')


def gerar_pdf_os(os_obj, upload_folder):
    nome = f"OS-{os_obj.numero_os}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.pdf"
    caminho = os.path.join(upload_folder, nome)

    doc = SimpleDocTemplate(caminho, pagesize=A4,
                            leftMargin=15*mm, rightMargin=15*mm,
                            topMargin=15*mm, bottomMargin=15*mm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('title', fontName='Helvetica-Bold',
                                  fontSize=18, textColor=WHITE, alignment=TA_LEFT)
    sub_style   = ParagraphStyle('sub',   fontName='Helvetica',
                                  fontSize=9, textColor=colors.HexColor('#a5b4fc'))
    h2_style    = ParagraphStyle('h2',    fontName='Helvetica-Bold',
                                  fontSize=10, textColor=WHITE, spaceAfter=2)
    body_style  = ParagraphStyle('body',  fontName='Helvetica',
                                  fontSize=9,  textColor=DARK, leading=13)
    label_style = ParagraphStyle('label', fontName='Helvetica-Bold',
                                  fontSize=7,  textColor=MUTED)

    elements = []

    # ── Cabeçalho ────────────────────────────────────────
    header_data = [[
        Paragraph('GERENCIADOR DE OS', title_style),
        Paragraph(f'Nº {os_obj.numero_os}', ParagraphStyle('osnum', fontName='Helvetica-Bold',
                  fontSize=14, textColor=colors.HexColor('#67e8f9'), alignment=TA_CENTER)),
    ]]
    header_table = Table(header_data, colWidths=[110*mm, 65*mm])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), DARK),
        ('VALIGN',     (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING',(0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING',(0,0),(-1,-1),8),
        ('ROUNDEDCORNERS', (0,0), (-1,-1), [6,6,0,0]),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 4*mm))

    def secao(titulo):
        t = Table([[Paragraph(titulo, h2_style)]], colWidths=[175*mm])
        t.setStyle(TableStyle([
            ('BACKGROUND',  (0,0),(-1,-1), INDIGO),
            ('LEFTPADDING', (0,0),(-1,-1), 6),
            ('TOPPADDING',  (0,0),(-1,-1), 4),
            ('BOTTOMPADDING',(0,0),(-1,-1),4),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 2*mm))

    def campo(label, valor):
        return [Paragraph(label.upper(), label_style),
                Paragraph(str(valor or '—'), body_style)]

    # ── Identificação ────────────────────────────────────
    secao('1. IDENTIFICAÇÃO')
    grid = Table([
        campo('Nº OS', os_obj.numero_os) + campo('Status', os_obj.status) + campo('Prioridade', os_obj.prioridade),
        campo('Data Entrada', os_obj.data_entrada) + campo('Hora', os_obj.hora_entrada) + campo('Data Saída', os_obj.data_saida),
        campo('Cliente', os_obj.cliente.nome if os_obj.cliente else '—') + ['', ''] + ['', ''],
    ], colWidths=[30*mm, 28*mm, 30*mm, 28*mm, 30*mm, 29*mm])
    grid.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('BACKGROUND', (0,0), (-1,-1), LIGHT),
        ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#e2e8f0')),
    ]))
    elements.append(grid)
    elements.append(Spacer(1, 3*mm))

    # ── Laudo e Solução ──────────────────────────────────
    secao('2. LAUDO TÉCNICO & SOLUÇÃO')
    for label, val in [('Defeito Relatado', os_obj.defeito_relatado),
                        ('Laudo / Diagnóstico', os_obj.laudo_tecnico),
                        ('Solução Aplicada', os_obj.solucao_aplicada),
                        ('Peças Utilizadas', os_obj.pecas_utilizadas)]:
        if val:
            elements.append(Paragraph(label.upper(), label_style))
            elements.append(Paragraph(val, body_style))
            elements.append(Spacer(1, 2*mm))

    # ── Checklist ────────────────────────────────────────
    if os_obj.checklist:
        secao('3. CHECKLIST DE TESTES')
        rows = [['#', 'Teste', 'Feito', 'Data', 'Técnico']]
        for i, item in enumerate(os_obj.checklist, 1):
            rows.append([
                str(i), item.item_nome,
                '✓' if item.feito else '✗',
                str(item.data_verificacao or ''),
                item.tecnico_verificador or '',
            ])
        t = Table(rows, colWidths=[8*mm, 70*mm, 15*mm, 32*mm, 50*mm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), VIOLET),
            ('TEXTCOLOR',  (0,0), (-1,0), WHITE),
            ('FONTNAME',   (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE',   (0,0), (-1,-1), 8),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT, WHITE]),
            ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#e2e8f0')),
            ('ALIGN', (2,0), (2,-1), 'CENTER'),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 3*mm))

    # ── Termos ───────────────────────────────────────────
    if os_obj.termos_observacoes:
        secao('4. TERMOS / OBSERVAÇÕES')
        elements.append(Paragraph(os_obj.termos_observacoes, body_style))
        elements.append(Spacer(1, 4*mm))

    # ── Assinaturas ──────────────────────────────────────
    secao('5. ASSINATURAS')
    sig_data = [['Assinatura do Cliente', 'Assinatura do Técnico']]
    sig_t = Table(sig_data, colWidths=[87*mm, 88*mm])
    sig_t.setStyle(TableStyle([
        ('FONTNAME',  (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE',  (0,0), (-1,-1), 8),
        ('TEXTCOLOR', (0,0), (-1,-1), MUTED),
        ('TOPPADDING',(0,0), (-1,-1), 30),
        ('BOTTOMPADDING',(0,0),(-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
    ]))
    elements.append(sig_t)

    # ── Rodapé ───────────────────────────────────────────
    elements.append(Spacer(1, 4*mm))
    elements.append(HRFlowable(width='100%', thickness=0.5, color=MUTED))
    elements.append(Paragraph(
        f'Gerenciador OS para Campo — Gerado em {datetime.now().strftime("%d/%m/%Y %H:%M")}',
        ParagraphStyle('footer', fontName='Helvetica', fontSize=7, textColor=MUTED, alignment=TA_CENTER)
    ))

    doc.build(elements)
    return caminho, nome
