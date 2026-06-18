// build-skus.mjs
// Lê data/sku-mp.csv (latin1/ANSI, separador ";") e gera data/skus.js
// com "window.SKUS = [{sku, mp, unid, grupo}, ...]".
//
// Uso: node scripts/build-skus.mjs
//
// Regras de parsing:
//  - Ler como latin1 (ANSI). Pular a linha de cabeçalho (SKU;MP;UNID;GRUPO_MP).
//  - Split por ";": sku = 1º campo; grupo = último; unid = penúltimo;
//    mp = juntar o miolo (a descrição pode conter ";").
//  - Descartar linhas corrompidas: aceitar apenas sku numérico (^\d{3,}$)
//    e mp não-vazio (ex.: linhas quebradas tipo "-63213;ECIDO TING...").

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'data');
const OUTPUT = join(DATA, 'skus.js');

// Aceita tanto o nome "limpo" quanto o arquivo exportado do ERP (com espaços).
// Basta jogar o CSV em data/ com qualquer um destes nomes e rodar.
const CANDIDATOS = [
  'sku-mp.csv',
  'SKU DAS MP.csv',
  'SKU_DAS_MP.csv',
  'SKU DAS MP.CSV'
];

// Itens fixos que NÃO vêm no CSV do ERP. Ficam embutidos aqui pra
// sobreviverem a toda regeneração. (categoria EMBALAGENS, AVIAMENTOS etc.)
const EXTRAS = [
  { sku: '5000412', mp: 'EMBALAGEM 15x20', unid: 'KG', grupo: 'EMBALAGENS' },
  { sku: '5000655', mp: 'EMBALAGEM 13x18', unid: 'KG', grupo: 'EMBALAGENS' },
  { sku: '5000413', mp: 'EMBALAGEM 20x30', unid: 'KG', grupo: 'EMBALAGENS' },
  { sku: '5000515', mp: 'EMBALAGEM 18x40', unid: 'KG', grupo: 'EMBALAGENS' },
  { sku: '5000080', mp: 'EMBALAGEM 23x48', unid: 'KG', grupo: 'EMBALAGENS' },
  { sku: '5002042', mp: 'EMBALAGEM 30x40', unid: 'KG', grupo: 'EMBALAGENS' },
  { sku: '5010209', mp: 'EMBALAGEM 60x90', unid: 'KG', grupo: 'EMBALAGENS' },
  { sku: '5002041', mp: 'EMBALAGEM 20x25', unid: 'KG', grupo: 'EMBALAGENS' },
  { sku: '5002335', mp: 'SAQUINHO ILHOS', unid: 'KG', grupo: 'EMBALAGENS' },
  { sku: '5010000', mp: 'EMBALAGEM 14x16', unid: 'KG', grupo: 'EMBALAGENS' },
  { sku: '5009999', mp: 'EMBALAGEM 15x12', unid: 'KG', grupo: 'EMBALAGENS' },
  { sku: '5009998', mp: 'EMBALAGEM 12x18', unid: 'KG', grupo: 'EMBALAGENS' },
  { sku: '5010002', mp: 'EMBALAGEM 16x20', unid: 'KG', grupo: 'EMBALAGENS' },
  { sku: '5009197', mp: 'SACO DE RÁFIA', unid: 'KG', grupo: 'EMBALAGENS' },
  { sku: '5001374', mp: 'EMBALAGEM CAMURCA 0,13MM 20X27 (LEGGING) UNICA U', unid: 'UN', grupo: 'EMBALAGENS' },

  // Aviamentos avulsos que não vieram no export do ERP
  { sku: '1157887', mp: 'AVIAMENTO VIES DOBRAVEL MALIBU 16', unid: 'MT', grupo: 'AVIAMENTO' }
];

function acharEntrada() {
  // Entre os candidatos existentes, escolhe o MAIOR arquivo — assim o
  // export completo do ERP sempre vence a amostra (sku-mp.csv).
  let melhor = null;
  for (const nome of CANDIDATOS) {
    const caminho = join(DATA, nome);
    if (!existsSync(caminho)) continue;
    const tam = statSync(caminho).size;
    if (!melhor || tam > melhor.tam) melhor = { caminho, tam };
  }
  return melhor ? melhor.caminho : null;
}

function main() {
  const INPUT = acharEntrada();
  if (!INPUT) {
    console.error('\n[erro] Não encontrei o CSV em data/.');
    console.error('Coloque seu arquivo "SKU DAS MP.csv" (ou data/sku-mp.csv) e rode de novo.\n');
    process.exit(1);
  }

  let raw;
  try {
    raw = readFileSync(INPUT, 'latin1');
  } catch (err) {
    console.error(`\n[erro] Não consegui ler ${INPUT}\n`);
    process.exit(1);
  }
  console.log(`[info] Lendo: ${INPUT}`);

  const lines = raw.split(/\r?\n/);

  const seen = new Set();
  const skuToMp = new Map(); // sku -> descrição (pra avisar duplicados nos EXTRAS)
  const items = [];
  let skipped = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;

    // Pula cabeçalho
    if (i === 0 && /^SKU\s*;/i.test(line)) continue;
    if (/^SKU;MP;UNID;GRUPO_MP/i.test(line)) continue;

    const parts = line.split(';');
    if (parts.length < 4) { skipped++; continue; }

    const sku = parts[0].trim();
    const grupo = parts[parts.length - 1].trim();
    const unid = parts[parts.length - 2].trim();
    const mp = parts.slice(1, parts.length - 2).join(';').trim();

    // Descarta linhas corrompidas
    if (!/^\d{3,}$/.test(sku)) { skipped++; continue; }
    if (!mp) { skipped++; continue; }

    if (seen.has(sku)) { skipped++; continue; }
    seen.add(sku);
    skuToMp.set(sku, mp);

    items.push({ sku, mp, unid, grupo });
  }

  // Acrescenta os itens fixos (EMBALAGENS etc.), sem duplicar SKU.
  // Se um EXTRA tiver SKU que já existe (no ERP ou listado antes), ele é
  // IGNORADO e o aviso aparece no final — você não precisa conferir à mão.
  let extrasAdd = 0;
  const extrasDup = [];
  for (const ex of EXTRAS) {
    if (seen.has(ex.sku)) {
      extrasDup.push({ sku: ex.sku, mp: ex.mp, existente: skuToMp.get(ex.sku) || '(repetido na lista EXTRAS)' });
      continue;
    }
    seen.add(ex.sku);
    skuToMp.set(ex.sku, ex.mp);
    items.push({ sku: ex.sku, mp: ex.mp, unid: ex.unid, grupo: ex.grupo });
    extrasAdd++;
  }

  const banner = `// ARQUIVO GERADO AUTOMATICAMENTE por scripts/build-skus.mjs
// Não edite à mão. Rode: node scripts/build-skus.mjs
// Total de itens: ${items.length}
`;

  const body = 'window.SKUS = ' + JSON.stringify(items) + ';\n';

  writeFileSync(OUTPUT, banner + body, 'utf8');

  // Cache-busting: carimba ?v=<hash do conteúdo> em skus.js, styles.css e app.js
  // no index.html. Assim, um F5 sempre baixa a versão nova (nunca uma em cache do
  // navegador / CDN). O hash só muda quando o arquivo muda.
  function hashTexto(txt) { return createHash('md5').update(txt).digest('hex').slice(0, 8); }
  function hashArquivo(caminho) {
    try { return createHash('md5').update(readFileSync(caminho)).digest('hex').slice(0, 8); }
    catch (e) { return '0'; }
  }
  const INDEX = join(ROOT, 'index.html');
  try {
    let html = readFileSync(INDEX, 'utf8');
    const carimbos = [
      { re: /(src=["']data\/skus\.js)(\?v=[^"']*)?(["'])/,    v: hashTexto(body) },
      { re: /(href=["']css\/styles\.css)(\?v=[^"']*)?(["'])/, v: hashArquivo(join(ROOT, 'css', 'styles.css')) },
      { re: /(src=["']js\/app\.js)(\?v=[^"']*)?(["'])/,       v: hashArquivo(join(ROOT, 'js', 'app.js')) }
    ];
    let mudou = false;
    for (const c of carimbos) {
      const novo = html.replace(c.re, `$1?v=${c.v}$3`);
      if (novo !== html) { html = novo; mudou = true; }
    }
    if (mudou) {
      writeFileSync(INDEX, html, 'utf8');
      console.log('[info] index.html carimbado (skus.js, styles.css, app.js).');
    } else {
      console.log('[aviso] não achei refs pra carimbar no index.html.');
    }
  } catch (e) {
    console.log('[aviso] não consegui carimbar o index.html:', e.message);
  }

  console.log(`\n[ok] ${items.length} itens gravados em data/skus.js`);
  console.log(`[info] ${extrasAdd} item(ns) fixo(s) (EMBALAGENS etc.) incluído(s).`);
  console.log(`[info] ${skipped} linha(s) descartada(s)/duplicada(s).`);

  if (extrasDup.length) {
    console.log(`\n[ATENÇÃO] ${extrasDup.length} item(ns) do EXTRAS foram IGNORADOS por SKU já existente:`);
    for (const d of extrasDup) {
      console.log(`   - ${d.sku} "${d.mp}"  ->  já existe como: "${d.existente}"`);
    }
    console.log('   (Se quer mesmo esse SKU, remova/edite a duplicata; senão pode ignorar.)');
  } else {
    console.log('[info] Nenhum SKU duplicado nos EXTRAS.');
  }
  console.log('');
}

main();
