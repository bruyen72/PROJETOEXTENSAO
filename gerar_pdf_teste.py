"""Script standalone para gerar PDF de teste sem precisar do servidor."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import date, time
from services.pdf_service import gerar_pdf_os

# ── Dados fictícios de uma OS ──────────────────────────────
class FakeTecnico:
    class usuario:
        nome = "João Silva"

class FakeCliente:
    nome = "Distribuidora Rádio Sul Ltda"

class FakeChecklist:
    def __init__(self, nome, feito, tecnico=None, data=None):
        self.item_nome           = nome
        self.feito               = feito
        self.tecnico_verificador = tecnico
        self.data_verificacao    = data

class FakeOS:
    id                 = 42
    numero_os          = "OS-20260514001"
    status             = "Concluído"
    prioridade         = "Urgente"
    tipo_ocorrencia    = "Corretiva"
    acompanhante       = "Carlos Eduardo (Supervisor de Campo)"
    data_entrada       = date(2026, 5, 14)
    hora_entrada       = time(8, 30)
    data_saida         = date(2026, 5, 14)
    condicoes_fisicas  = "Rádio com carcaça amassada no lado direito, antena quebrada na base."
    defeito_relatado   = "Equipamento sem transmissão (TX). Cliente relata que o rádio parou de funcionar após queda de aproximadamente 1,5m."
    laudo_tecnico      = "Após análise interna, constatou-se ruptura do cristal do oscilador e dano ao módulo de RF. Conector de antena com mau contato devido ao impacto."
    solucao_aplicada   = "Substituição do cristal oscilador modelo 16.000 MHz, troca do conector SMA e realinhamento do módulo de RF. Programação de canais refeita via software RPS."
    pecas_utilizadas   = "1x Cristal 16.000 MHz\n1x Conector SMA fêmea\n1x Etiqueta de identificação"
    termos_observacoes = "Equipamento em garantia de 90 dias para os serviços realizados. Cliente ciente das condições de uso e manuseio correto do equipamento."
    geo_endereco       = "Av. Getúlio Vargas, 1500 — Centro, Cuiabá/MT"
    geo_lat            = -15.5989
    geo_lng            = -56.0949
    cliente            = FakeCliente()
    tecnico            = FakeTecnico()
    checklist          = [
        FakeChecklist("Teste de Bateria / Carga",        True,  "João Silva",  date(2026,5,14)),
        FakeChecklist("Teste de Transmissão (TX)",        True,  "João Silva",  date(2026,5,14)),
        FakeChecklist("Teste de Recepção (RX)",           True,  "João Silva",  date(2026,5,14)),
        FakeChecklist("Verificação de Frequência / Canal",True,  "João Silva",  date(2026,5,14)),
        FakeChecklist("Programação / Software",           True,  "João Silva",  date(2026,5,14)),
        FakeChecklist("Inspeção da Antena",               True,  "João Silva",  date(2026,5,14)),
        FakeChecklist("Teste de Microfone / Áudio",       True,  "João Silva",  date(2026,5,14)),
        FakeChecklist("Teste de Botões / Display",        True,  "João Silva",  date(2026,5,14)),
        FakeChecklist("Teste de Conector / Solda",        True,  "João Silva",  date(2026,5,14)),
        FakeChecklist("Inspeção Física / Limpeza",        True,  "João Silva",  date(2026,5,14)),
        FakeChecklist("Encaminhado ao Fabricante",        False, None,          None),
        FakeChecklist("Controle de Qualidade Final",      True,  "João Silva",  date(2026,5,14)),
    ]

from services.word_service import gerar_word_os

# ── Gerar PDF e Word ───────────────────────────────────────
saida = os.path.join(os.path.dirname(__file__), "static", "uploads")
os.makedirs(saida, exist_ok=True)

print("Gerando PDF de teste...")
caminho_pdf, nome_pdf = gerar_pdf_os(FakeOS(), saida)
print(f"PDF : {caminho_pdf}")

print("Gerando Word de teste...")
caminho_doc, nome_doc = gerar_word_os(FakeOS(), saida)
print(f"Word: {caminho_doc}")
