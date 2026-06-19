# CLAUDE.md

Guia pra agentes/devs trabalhando neste repositório. Leia antes de editar.

## O que é

Ferramenta de **uma página** pro time de Compras buscar matéria-prima (MP) e montar
pedidos pra exportar em **Excel** no formato de um template (faixa amarela "CLIENTE"
+ colunas `N° PEDIDO | ARTIGO | SKU | COR/TAMANHO | UN. MED. | DT. SOLIC. | QUANTIDADE`).

- **HTML/CSS/JS puro, sem build, sem servidor.** Tem que funcionar abrindo o
  `index.html` direto (via `file://`) e também no GitHub Pages.
- UI 100% em **português (PT-BR)**. Ícones via **Lucide** (sem emojis).

## Arquitetura e fluxo de dados

```
data/SKU DAS MP.csv  →  scripts/build-skus.mjs  →  data/skus.js  →  index.html (window.SKUS)
   (export do ERP)        (Node, gera o banco)       (gerado)         js/app.js usa
```

- O banco é carregado por `<script src="data/skus.js?v=HASH">` (define `window.SKUS`).
  **Nada de `fetch`/AJAX** — quebraria em `file://`.
- `js/app.js` é uma IIFE; todo o estado (busca, `pedido[]`, exportação) vive ali.
  Sem framework, sem dependências de build.

## Arquivos

| Arquivo | Papel |
|---|---|
| `index.html` | Página única. Carrega Lucide, ExcelJS e `data/skus.js` por CDN/`<script>`. |
| `css/styles.css` | Tema "etiqueta de chão de fábrica" (papel frio, 1 acento amarelo `#FFD400`, verde só pra "adicionado"). |
| `js/app.js` | Busca, detecção de cor/tamanho, montagem do pedido e exportação (Excel). |
| `scripts/build-skus.mjs` | Converte o CSV do ERP → `data/skus.js`. Tem itens fixos e cache-busting. |
| `data/skus.js` | **Gerado** — não editar à mão. É o que vai pro git e a página usa. |
| `data/SKU DAS MP.csv` | CSV bruto do ERP. **Fora do git** (`.gitignore`). |
| `README.md` / `DEPLOY.md` | Uso e publicação (pro time). |

## Comandos

```bash
# Regenerar o banco a partir do CSV (precisa de Node.js):
node scripts/build-skus.mjs

# Sanidade de sintaxe do front:
node --check js/app.js
```

Deploy = `git push` (GitHub Pages serve estático). Ver `DEPLOY.md`.

## Convenções e regras que NÃO podem quebrar

- **`data/skus.js` é gerado.** Pra mudar dados, edite a fonte (CSV do ERP **ou** a
  lista `EXTRAS` em `build-skus.mjs`) e rode o conversor. Nunca edite o `skus.js` na mão.
- **Itens que o ERP não exporta** (ex.: categoria `EMBALAGENS`) ficam na const
  `EXTRAS` do `build-skus.mjs` — assim sobrevivem a toda regeneração. Dedup por SKU.
- **Conversor:** lê o CSV em **latin1/ANSI**, separador `;`, pula cabeçalho,
  `mp` = miolo (a descrição pode ter `;`), e **descarta linhas corrompidas**
  (só aceita `sku` `^\d{3,}$` e `mp` não-vazio). Escolhe o **maior** CSV em `data/`.
- **Cache-busting:** o conversor carimba `?v=<hash do conteúdo>` em **`skus.js`,
  `styles.css` e `app.js`** no `index.html` (o GitHub Pages manda o navegador cachear
  assets ~10 min, então sem isso um F5 pega CSS/JS velho). Rode o conversor antes de
  cada push e **commite o `index.html`** junto.
- **Dados são ASCII** (descrições do ERP em maiúsculas sem acento). A busca normaliza
  (maiúsculas, sem acento via NFD, espaços colapsados) em `normalizar()`.
- **Busca:** por tokens, ordem livre, todos precisam casar — na descrição **ou no SKU**
  (`buscar()`). SKU exato vai pro topo.
- **Detecção de cor/tamanho** (`detectarCorTamanho`): cor vem do dicionário `CORES`
  (compostas ganham das simples; cor mais ao final prioriza); tamanho = token após
  `UNICA`. Pra adicionar cores novas, edite o array `CORES`.
- **Unidades:** mapa `UNIDADES` (`UN→unidades, MT/M→metros, KG→kg, PR→pares,
  PC→peças, RL→rolos, KM→km, M2→m², ML→ml`).
- **Excel usa ExcelJS** (não SheetJS) — a versão grátis do SheetJS não aplica estilo.
  ExcelJS vem por CDN: **sem internet, não exporta** — o app avisa ("Sem conexão com a
  internet…") em vez de gerar arquivo. (Não há mais exportação CSV nem importação.)
- **DT. SOLIC. (data de solicitação):** no modelo cada item guarda `dataSolic` em ISO
  (`aaaa-mm-dd`, o value do `<input type="date">`); só vira `dd/mm/aaaa` na exportação
  (`isoParaBR`). Ao selecionar/adicionar um item, se estiver vazia é preenchida com **hoje**
  (`hojeISO`). A coluna existe pra **não somar** itens iguais de datas diferentes — cada um
  vira uma linha (o app nunca agregou linhas, então isso é natural).
- **CSS:** existe `[hidden] { display: none !important; }` global porque alguns
  componentes têm `display` custom que sobrescreveria o atributo `hidden`. Não remover.
- Acessibilidade é piso: foco visível, `prefers-reduced-motion` respeitado.

## Vários clientes (multi-aba)

O estado é uma lista `clientes[]` (`{nome, numPedido, itens[]}`) + índice `ativo`;
`atual()` é o cliente visível e `totalItens()` soma tudo. O **pager** (setas + swipe +
Novo/Remover) troca o `ativo` via `irPara(i, dir)`. **Exportar Excel** gera **uma aba
por cliente com itens** (`montarAba` por cliente, `nomeAbaUnico` evita abas repetidas).
Os campos N° Pedido/Cliente operam só no cliente ativo.

## Editar pedido

Não há importação/reabertura de arquivo — o pedido vive só na sessão. Na tabela,
**QUANTIDADE**, **COR/TAMANHO** e **DT. SOLIC.** são editáveis inline (atualizam o modelo
sem re-render, pra não perder o foco); dá pra remover linhas e adicionar novas pela busca.

## Verificação (manual, no navegador)

Abrir o `index.html` e: buscar (palavra-chave e SKU) → adicionar itens → conferir
cor/tamanho automáticos e **Dt. Solic. = hoje** → editar inline (inclusive a data) →
adicionar o mesmo item com outra data e conferir que viram **linhas separadas** →
remover → **Exportar Excel** e conferir a coluna `DT. SOLIC.` em `dd/mm/aaaa`.
Rodar `node --check js/app.js`.

## Não-objetivos (decisões já tomadas)

- Sem backend, sem banco compartilhado, sem login.
- Sem autosave do pedido (localStorage) — descartado de propósito.
- Dependências de CDN ficam como estão (time usa sempre online).
