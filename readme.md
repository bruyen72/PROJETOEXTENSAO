# Ficha de Serviço — Rádio

## Como usar

### Abrir o sistema
- Abra a pasta do projeto
- Clique duas vezes em `index.html`
- Abre no Chrome ou Safari (recomendado Chrome 90+)

### Preencher a ficha
1. Preencha os campos de identificação (OS, data, cliente)
2. Informe os dados do equipamento (marca, modelo, série)
3. Marque os acessórios recebidos (clique nos chips)
4. Defina a prioridade e descreva o defeito relatado
5. Marque os testes realizados no checklist
6. Preencha o laudo técnico e a solução aplicada
7. Adicione fotos do equipamento (câmera ou galeria)
8. Capture a localização do atendimento (opcional)
9. Colete as assinaturas digitais (dedo ou mouse)

### Salvar
- Clique em **💾 Salvar**
- Os dados ficam armazenados no navegador (localStorage)
- **ATENÇÃO:** Não limpe o histórico/cache do navegador

### Gerar PDF
- Clique em **📄 Salvar PDF**
- O arquivo é baixado automaticamente
- Nome do arquivo: `ficha-radio-[OS]-[cliente].pdf`

### Ver fichas salvas
- Clique no link **"📋 Fichas Salvas"** no menu superior
- Ou abra diretamente o arquivo `lista.html`

### Carregar uma ficha salva
- Na lista, clique em **👁️ Abrir**
- A ficha é carregada com todos os dados preenchidos
- Faça as alterações e salve novamente

### Backup manual
1. Abra o DevTools (tecla **F12**)
2. Vá em: **Application → Local Storage → file://**
3. Copie as chaves que começam com `ficha_`
4. Salve em um arquivo de texto para backup

---

## Personalização

Para adaptar ao cliente real, edite os seguintes arquivos:

**`index.html` e `lista.html`** — Cabeçalho:
```html
<div class="empresa-nome">NOME DA EMPRESA AQUI</div>
```

**`pdf.js`** — Cabeçalho do PDF (linha ~40):
```javascript
pdf.text('NOME DA EMPRESA AQUI', M, 12);
pdf.text('Endereço — Telefone', M, 18);
```

**`style.css`** — Cores principais (linha ~1):
```css
:root {
  --accent: #0d6e5c;   /* cor principal */
  --accent2: #19b38d;  /* cor secundária */
}
```

---

## Requisitos
- Chrome 90+ ou Safari 14+ (recomendado)
- Sem necessidade de internet (após abrir a página)
- Sem instalação de software
- Sem servidor ou banco de dados

## Dispositivos suportados
- Celular Android e iPhone
- Tablet Android e iPad
- Computador Windows, Mac e Linux

## Estrutura de arquivos
```
projeto-ficha-radio/
├── index.html   ← Ficha de serviço (página principal)
├── lista.html   ← Lista de fichas salvas
├── style.css    ← Estilos globais e responsivos
├── app.js       ← Lógica principal e localStorage
├── lista.js     ← Lógica da lista de fichas
├── pdf.js       ← Geração de PDF
├── sig.js       ← Assinaturas digitais
├── geo.js       ← Geolocalização
└── README.md    ← Este arquivo
```

---

*Versão EXEMPLO — substitua os dados da empresa antes de usar em produção.*
# PROJETOEXTENSAO
