# Compras Itajaí

Ferramenta de **uma página** para o time de Compras buscar matéria-prima (MP) e montar
um pedido para exportar em **Excel/CSV** no formato do template.

- HTML/CSS/JS puro, **sem build e sem servidor**.
- Funciona via `file://` — basta abrir o `index.html` no navegador.

---

## Como o time usa (dia a dia)

1. Abra o arquivo **`index.html`** (duplo clique).
2. Preencha **N° Pedido** e **Cliente** no topo da coluna direita.
3. Na coluna esquerda, digite palavras-chave (ex.: `anis preto 16`).
   - A ordem das palavras não importa; acentos são ignorados.
   - Use **↑ / ↓** para navegar e **Enter** para escolher (ou clique no resultado).
4. No item selecionado, informe **Cor/Tamanho** e **Quantidade** e clique **Adicionar ao pedido**.
5. Clique em **Exportar CSV** ou **Exportar Excel (.xlsx)**.
   - O CSV é UTF-8 com BOM e separador `;` (abre certinho no Excel PT-BR).
   - O Excel reproduz o template (faixa **CLIENTE** mesclada + cabeçalho).
   - Sem internet, o botão Excel cai automaticamente para CSV e avisa.

> Internet é necessária apenas para as fontes, ícones e o gerador de Excel (via CDN).
> O CSV funciona 100% offline.

### Vários clientes num só Excel

Cada cliente é um **card** (passe pro lado com as setas `‹ ›` ou arrastando, ou crie
com **Novo cliente**). Ao **Exportar Excel**, todos viram **um único arquivo com uma
aba por cliente** (nome da aba = cliente). O **CSV** exporta só o cliente que está
aberto na tela. **Importar** um `.xlsx` com várias abas recria um card por aba.

### Reabrir um pedido pra editar (CSV/XLSX)

Pedidos mudam durante a semana. Pra retomar um pedido já exportado:

1. Clique em **Importar pedido** (rodapé do card) e escolha o **CSV** ou **XLSX**
   que você exportou aqui (também aceita um arquivo editado à mão no Excel).
2. Cliente, N° Pedido e todas as linhas voltam pra tela. Importar **substitui** o
   pedido atual (pede confirmação se já houver itens).
3. Edite na própria tabela: **Quantidade** e **Cor/Tamanho** são editáveis ali mesmo;
   dá pra remover linhas e adicionar novas pela busca.
4. **Exporte de novo** (CSV/Excel) — sai no mesmo formato do template.

---

## Como gerar / atualizar o banco de dados

O banco vem de um CSV exportado do ERP: **`SKU DAS MP.csv`**
(encoding **latin1/ANSI**, separador `;`, cabeçalho `SKU;MP;UNID;GRUPO_MP`).

1. Copie o CSV para **`data/sku-mp.csv`** (substituindo o que estiver lá).
2. Rode o conversor (precisa de **Node.js**):

   ```bash
   node scripts/build-skus.mjs
   ```

3. Isso gera **`data/skus.js`** (`window.SKUS = [...]`), que o `index.html`
   carrega via `<script>` — por isso funciona em `file://` (nada de `fetch`).

O conversor:
- lê o arquivo como **latin1**;
- pula o cabeçalho;
- separa por `;` → `sku` = 1º campo, `grupo` = último, `unid` = penúltimo,
  `mp` = o miolo (mantém `;` que existirem na descrição);
- **descarta linhas corrompidas** (só aceita `sku` numérico com 3+ dígitos e `mp` não-vazio).

> Importante: **commite o `data/skus.js` gerado**, pois é ele que a página usa.
> O CSV bruto (`data/sku-mp.csv`) fica fora do git por padrão (veja `.gitignore`).

---

## Estrutura

```
compras-itajai/
  index.html            # a página
  css/styles.css        # tema "etiqueta de chão de fábrica"
  js/app.js             # busca, seleção, pedido e exportação
  data/sku-mp.csv       # CSV bruto do ERP (você coloca aqui)
  data/skus.js          # banco gerado (commitado)
  scripts/build-skus.mjs# conversor CSV -> skus.js
  README.md
  .gitignore
```

## Mapa de unidades (UN. MED.)

`UN`→unidades · `MT`/`M`→metros · `KG`→kg · `PR`→pares · `PC`→peças ·
`RL`→rolos · `KM`→km · `M2`→m² · `ML`→ml · (outras: mostra o próprio código)
