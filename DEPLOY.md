# Deploy & Atualização — Compras Itajaí

Guia rápido pra publicar e manter a ferramenta no ar. Não precisa ser de TI;
é só seguir os passos.

- **Site no ar:** https://matheusmendesde.github.io/compras-itajai/
- **Repositório:** https://github.com/matheusmendesde/compras-itajai
- **Hospedagem:** GitHub Pages (site estático, sem servidor).

---

## Como funciona (resumo de 30s)

```
data/SKU DAS MP.csv  →  node scripts/build-skus.mjs  →  data/skus.js  →  site
   (export do ERP)         (gera o banco + carimba         (banco usado
                            a versão no index.html)          pela página)
```

- O site roda **no navegador de cada pessoa** — pode ter o time todo usando ao
  mesmo tempo, sem conflito. Cada um monta o seu pedido e exporta o seu arquivo.
- Quem está com a aba aberta só vê dados novos **depois de dar F5**.

---

## 1) Publicar pela primeira vez (já feito)

Caso precise refazer em outra máquina/conta:

```powershell
cd caminho\para\compras-itajai
git init
git add .
git commit -m "Compras Itajai - versao inicial"
git branch -M main
git remote add origin https://github.com/matheusmendesde/compras-itajai.git
git push -u origin main
```

Depois, no GitHub: **Settings → Pages → Source: Deploy from a branch →
Branch `main` / `(root)` → Save**. Em ~1–2 min o site fica no ar.

---

## 2) Atualizar o banco (novo SKU, novo CSV do ERP, etc.)

1. Se for **novo export do ERP**: copie o arquivo pra pasta `data/`
   (pode ser `SKU DAS MP.csv` — o conversor pega o maior CSV da pasta).
2. Se for **item fixo que o ERP não tem** (ex.: EMBALAGENS): edite a lista
   `EXTRAS` em [`scripts/build-skus.mjs`](scripts/build-skus.mjs).
3. Gere o banco e publique:

```powershell
cd caminho\para\compras-itajai
node scripts/build-skus.mjs
git add .
git commit -m "Atualiza banco de SKUs"
git push
```

Pronto. O GitHub Pages republica sozinho; quem der **F5** pega a versão nova
(o conversor troca o `?v=` do `skus.js`, então o navegador nunca usa cache velho).

> Precisa do **Node.js** instalado pra rodar o `node scripts/build-skus.mjs`.
> Download: https://nodejs.org (versão LTS).

---

## Perguntas frequentes

**O time consegue usar ao mesmo tempo?**
Sim, sem limite prático. Não há servidor nem dado compartilhado — cada navegador
roda sua cópia.

**Mexi no CSV e o site não mudou.**
Você rodou `node scripts/build-skus.mjs` **e** deu `git push`? O site só reflete
o que está no `data/skus.js` commitado. Depois, dê F5 na página.

**Os ícones sumiram / o Excel virou CSV.**
É falta de internet (as fontes/ícones/Excel vêm de CDN). Online funciona normal.

**Posso deixar o repositório privado?**
O GitHub Pages em repositório privado exige plano pago. Para uso interno grátis,
ou deixa público, ou cada pessoa abre o `index.html` localmente.
