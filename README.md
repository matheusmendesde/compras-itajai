# Compras Itajaí

Ferramenta de **uma página** para o time de Compras buscar matéria-prima (MP) e montar
um pedido para exportar em **Excel (.xlsx)** no formato do template.

- HTML/CSS/JS puro, **sem build e sem servidor**.
- Funciona via `file://` — basta abrir o `index.html` no navegador.

---

## Como o time usa (dia a dia)

1. Abra o arquivo **`index.html`** (duplo clique).
2. Preencha **N° Pedido** e **Cliente** no topo da coluna direita.
3. Na coluna esquerda, digite palavras-chave (ex.: `anis preto 16`).
   - A ordem das palavras não importa; acentos são ignorados.
   - Use **↑ / ↓** para navegar e **Enter** para escolher (ou clique no resultado).
4. No item selecionado, informe **Cor/Tamanho**, **Dt. Solic.** e **Quantidade** e clique
   **Adicionar ao pedido**.
   - A **Dt. Solic.** (data de solicitação) já vem preenchida com a **data de hoje** — mude
     se precisar. Itens iguais com datas diferentes ficam em **linhas separadas** (não somam),
     pra orientar a separação de material.
5. Clique em **Exportar Excel (.xlsx)**.
   - O Excel reproduz o template (faixa **CLIENTE** mesclada + cabeçalho), com a data no
     formato `dd/mm/aaaa`.

> **Precisa de internet.** As fontes, os ícones e o leitor/gerador de Excel vêm por CDN.
> Sem conexão, o app mostra um aviso ("Sem conexão com a internet…") e não exporta nem
> importa — basta conectar e tentar de novo.

### Vários clientes num só Excel

Cada cliente é um **card** (passe pro lado com as setas `‹ ›` ou arrastando, ou crie
com **Novo cliente**). Ao **Exportar Excel**, todos viram **um único arquivo com uma
aba por cliente** (nome da aba = cliente).

### Editar o pedido na tela

Na própria tabela dá pra ajustar **Quantidade**, **Cor/Tamanho** e **Dt. Solic.** de cada
linha, **remover** linhas e **adicionar** novas pela busca — tudo antes de exportar. Depois
de exportado, a edição é feita no próprio Excel.

### Reabrir um pedido (Importar Excel)

Clique em **Importar Excel** (rodapé do pedido) e escolha um **`.xlsx`** exportado aqui
(também aceita um arquivo editado à mão no Excel). Cliente, N° Pedido e todas as linhas
voltam pra tela — e cada **aba** do arquivo vira um **cliente**. A importação **substitui**
o que estiver aberto (o app pede confirmação antes). Só `.xlsx` (CSV não é mais usado).

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
  js/app.js             # busca, seleção, pedido, exportação e importação (.xlsx)
  data/sku-mp.csv       # CSV bruto do ERP (você coloca aqui)
  data/skus.js          # banco gerado (commitado)
  scripts/build-skus.mjs# conversor CSV -> skus.js
  README.md
  .gitignore
```

## Mapa de unidades (UN. MED.)

`UN`→unidades · `MT`/`M`→metros · `KG`→kg · `PR`→pares · `PC`→peças ·
`RL`→rolos · `KM`→km · `M2`→m² · `ML`→ml · (outras: mostra o próprio código)
