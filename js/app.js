/* =========================================================
   Compras Itajaí — lógica da ferramenta (HTML/CSS/JS puro)
   Roda via file:// (sem servidor). Dados em window.SKUS.
   ========================================================= */
(function () {
  'use strict';

  // ----- Dados -----
  var DB = Array.isArray(window.SKUS) ? window.SKUS : [];

  // ----- Mapa de unidades -> rótulo amigável -----
  var UNIDADES = {
    UN: 'unidades',
    MT: 'metros',
    M:  'metros',
    KG: 'kg',
    PR: 'pares',
    PC: 'peças',
    RL: 'rolos',
    KM: 'km',
    M2: 'm²',
    ML: 'ml'
  };
  function rotuloUnidade(cod) {
    if (!cod) return '';
    var c = String(cod).trim().toUpperCase();
    return UNIDADES[c] || c;
  }

  // ----- Dicionário de cores (a cor já vem escrita no artigo) -----
  // Tudo normalizado (MAIÚSCULAS, sem acento). Inclui as cores "fantasia"
  // da empresa (AZULEJO, SANREMO, ODALISCA...) e compostas (MOCHA MOUSSE...).
  // Compostas precisam vir aqui pra "ganhar" das simples na detecção.
  var CORES = [
    // compostas / multi-palavra
    'MOCHA MOUSSE','ROSA DELICATE','ROSA HERA','ROSA FLUOR','ROSA CLARO','ROSA CHICLETE',
    'ROSA BLUSH','ROSA NEON','ROSA INCA','ROSA STIFT','ROSA BEBE','ROSA CEREJA','ROSA ANTIGO',
    'ROSA BALLET','ROSA GERANIUM','ROSA PLOC','ROSA LOVE','ROSA CRISTAL','ROSA YARROW',
    'PINK JAIPUR','PINK FORTE','PINK POP','PINK LINGERIE','PINK HONDURAS','PINK TORNAL','PINK FLUOR','PINK NEON',
    'VERDE FLORENCE','VERDE MILITAR','VERDE MUSGO','VERDE FLUOR','VERDE AGUA','VERDE SALVIA',
    'VERDE LUNETTE','VERDE MAJOR','VERDE ESMERALDA','VERDE OLIVA ESCURO','VERDE OLIVA',
    'VERDE BANDEIRA','VERDE LIMAO','VERDE JADE','VERDE HERCULES','VERDE MARROCOS','VERDE ALGA',
    'VERDE BRACELETE','VERDE COPO','VERDE AGUA','GREEN LIGHT',
    'AZUL ATALAIA','AZUL LAGOON','AZUL SAFARI II','AZUL SAFARI','AZUL INDIGO','AZUL NETUNO',
    'AZUL MIRAGE','AZUL BIC','AZUL MARINHO','AZUL ROYAL','AZUL ACRE','AZUL ESPERANCA',
    'AZUL COBALT','AZUL CLARO','AZUL TITANIO','AZUL ZILO','AZUL SKY BLUE','AZUL SEREIA',
    'AZUL NAUTICA','AZUL JEANS','AZUL TRANQUILO','AZUL AGUA','AZUL MAYA','AZUL MEDITERRANEO',
    'AZUL ANIL','AZUL ATALANTA','AZUL LUXO','AZUL PETROLEO','AZUL NETUNO',
    'AMARELO FLUOR','AMARELO NEON','AMARELO BEBE','AMARELO LIMA','AMARELO CANARIO','AMARELO DIVERTIDO',
    'LARANJA FLUOR','LARANJA DIVERTIDO','LARANJA MIMAR','LARANJA NINNA',
    'MESCLA ESCURO','MESCLA CLARO','MESCLA ESC',
    'CHUMBO PREGO','CHUMBO TRACA','CHUMBO STORM',
    'MARINHO FORTE','MARINHO NOTURNO','MARINHO NOVO','MARINHO FILO',
    'MARROM RMC','MARROM MEDIO','MARROM COURO','MARROM TAUPE',
    'BEGE ROSADO','BEGE NEVOA','BEGE HAVANA','BASE NUDE',
    'CINZA CLARO','CINZA MEDIO','CINZA ESCURO','CINZA NOTURNO','CINZA PROFUNDO','CINZA LELUC',
    'LILAS VERY PERY','LILAS MISTICO','LILAS EREVAN','LILAS EREVEN',
    'SUN KISSES','WATER COLOR','VIVA MAGENTA','OFF WHITE','BRANCO OPTICO','BCO OPTICO',
    'LAGO NESS','MON BLUE','BLUE JEANS','BLUE FOZ','BLUE BOY','PALACE BLUE','COLONY BLUE',
    'SEMENTE DE UVA','GRAPE WINE','BRANCO ROMANCE','PRETO ROMANCE','PRETO BLACK',
    'CROCO - SOJA','VIENA - PASSION','VERDE SALVIA','VINHO CABERNET','VINHO BAROLO','VINHO FILO',
    'BRANCO LELUC','BEGE ROSADO','MARROM IMPERM','ROSA CEA','VERDE SALSA',
    // simples / 1 palavra
    'PRETO','BRANCO','MARINHO','BASE','VERMELHO','RUBI','RUBRO','PINK','FUCSIA','ROSA','ROXO','LILAS',
    'VIOLETA','AMARELO','LARANJA','VERDE','AZUL','CINZA','CHUMBO','GRAFITE','GRAFITO','MESCLA',
    'BORDO','VINHO','CORAL','CASTANHO','CHOCOLATE','MARROM','BEGE','NUDE','DOURADO','OURO','PRATA',
    'NIQUEL','COBRE','BRONZE','GRIS','ACO','CRU','MARFIM','PEROLA','PERLA','TABACO','CANELA',
    'COCOA','COURO','CAQUI','TERRACOTA','TERRA','BANDANA','MAGENTA','BERINJELA','MOCASSIN',
    'SIDERAL','ABSOLUTO','DIVINO','TAME','STELLA','NOBILE','NUAGE','FANTASTICO','ROMANCE',
    'FRUTILLY','JAIPUR','CAMARO','PAVAO','SATIN','MAKE','MELAO','ATOL','VEGAS','LUVITA',
    'ODALISCA','SANREMO','SANDIA','AZULEJO','HERANCA','LICHIA','CHRONOS','TEOS','CORINGA',
    'PANTERA','TURQUESA','AMALIA','DUSK','RICH','CICERO','CROCO','LAURENT','MATCHA','DESEJO',
    'LUCIANA','LOTERIA','RACY','FRAIS','IMBUIA','PINUS','GRAJAU','MOSCATEL','MAVI','RUBRO',
    'SENSUALE','REVELAR','GOA','COOLY','CLUB','NATIVA','MISSISSIPI','STELLA','FROZEN','BIC',
    'JABUTICABA','MANACA','CACAU','CEREJA','CABERNET','SCARLET','MALBEC','PIMENTA','URUCUM',
    'NAVY','ROYAL','BISTRO','ELITE','PETROLEO','MOSTARDA','SALMAO','GOIABA','TANGERINA',
    'GUACAMOLE','MENTOL','MUSGO','OCEAN','RUNNER','PRECIOSA','ENERGIA','BLUSH','MERGE',
    'MIRTILO','ZARAK','VALENTINO','NAOMI','JADORE','MISTIQUE','SUNKISSES','MAGENTA'
  ];
  // Pré-ordena: mais palavras primeiro, depois mais longo (compostas ganham).
  var CORES_NORM = CORES.map(function (c) { return normalizar(c); })
    .filter(function (v, i, a) { return v && a.indexOf(v) === i; })
    .map(function (c) { return { cor: c, palavras: c.split(' ').length }; })
    .sort(function (a, b) {
      if (a.palavras !== b.palavras) return b.palavras - a.palavras;
      return b.cor.length - a.cor.length;
    });

  function ehLimite(ch) { return ch === undefined || !/[A-Z0-9]/.test(ch); }
  function acharTermo(txt, termo) {
    var from = 0, idx;
    while ((idx = txt.indexOf(termo, from)) !== -1) {
      var antes = idx > 0 ? txt[idx - 1] : undefined;
      var depois = txt[idx + termo.length];
      if (ehLimite(antes) && ehLimite(depois)) return idx;
      from = idx + 1;
    }
    return -1;
  }
  // Detecta a cor escrita no artigo. Prioridade: mais palavras > posição mais
  // ao final (cor costuma vir depois do tipo do produto) > termo mais longo.
  function detectarCor(mp) {
    var n = normalizar(mp);
    var melhor = null;
    for (var i = 0; i < CORES_NORM.length; i++) {
      var c = CORES_NORM[i];
      var idx = acharTermo(n, c.cor);
      if (idx === -1) continue;
      if (!melhor ||
          c.palavras > melhor.palavras ||
          (c.palavras === melhor.palavras && idx > melhor.idx) ||
          (c.palavras === melhor.palavras && idx === melhor.idx && c.cor.length > melhor.cor.length)) {
        melhor = { cor: c.cor, palavras: c.palavras, idx: idx };
      }
    }
    return melhor ? melhor.cor : '';
  }

  // Detecta o tamanho: token logo após "UNICA" (ex.: "...UNICA 50" -> 50,
  // "...UNICA G/L" -> G/L, "...UNICA EGG/XXL" -> EGG/XXL). "U" e "." = sem tamanho.
  function detectarTamanho(mp) {
    var toks = normalizar(mp).split(' ');
    var i = toks.indexOf('UNICA');
    if (i !== -1 && i + 1 < toks.length) {
      var t = toks[i + 1];
      if (t && t !== 'U' && t !== '.') return t;
    }
    return '';
  }

  // COR/TAMANHO = cor detectada + tamanho detectado (o que existir).
  function detectarCorTamanho(mp) {
    return [detectarCor(mp), detectarTamanho(mp)].filter(Boolean).join(' ').trim();
  }

  // ----- Normalização (maiúsculas, sem acento, espaços colapsados) -----
  function normalizar(txt) {
    return String(txt == null ? '' : txt)
      .toUpperCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // remove diacríticos
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Pré-calcula a versão normalizada de cada MP
  DB.forEach(function (it) { it._mpNorm = normalizar(it.mp); });

  // ----- Busca por tokens (todos precisam casar, ordem livre) -----
  function buscar(query, limite) {
    var q = normalizar(query);
    if (!q) return [];
    var tokens = q.split(' ').filter(Boolean);
    if (!tokens.length) return [];

    var qSemEspaco = tokens.join('');
    var achados = [];
    for (var i = 0; i < DB.length; i++) {
      var it = DB[i];
      var mp = it._mpNorm;
      var sku = it.sku;
      var ok = true;
      var menorPos = Infinity;   // posição na descrição (Infinity se só casou no SKU)
      for (var t = 0; t < tokens.length; t++) {
        var posMp = mp.indexOf(tokens[t]);
        var posSku = sku.indexOf(tokens[t]);
        if (posMp === -1 && posSku === -1) { ok = false; break; }
        if (posMp !== -1 && posMp < menorPos) menorPos = posMp;
      }
      if (!ok) continue;
      // SKU exato (busca só pelo número) vai pro topo
      var exato = (sku === q || sku === qSemEspaco) ? 0 : 1;
      achados.push({ item: it, exato: exato, score: menorPos, len: mp.length });
    }

    // Ranking: SKU exato > match mais ao começo da descrição > descrição mais curta
    achados.sort(function (a, b) {
      if (a.exato !== b.exato) return a.exato - b.exato;
      if (a.score !== b.score) return a.score - b.score;
      if (a.len !== b.len) return a.len - b.len;
      return a.item._mpNorm < b.item._mpNorm ? -1 : 1;
    });

    return achados.slice(0, limite || 50).map(function (x) { return x.item; });
  }

  // ----- Destaque dos trechos que casaram -----
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  // Destaca, no texto ORIGINAL, os intervalos que casam os tokens
  // (usa a string normalizada — que tem o mesmo comprimento por caractere — pra achar posições)
  function destacar(original, normalizada, query) {
    var tokens = normalizar(query).split(' ').filter(Boolean);
    if (!tokens.length) return escapeHtml(original);

    var marcado = new Array(normalizada.length).fill(false);
    tokens.forEach(function (tok) {
      var from = 0, idx;
      while ((idx = normalizada.indexOf(tok, from)) !== -1) {
        for (var k = idx; k < idx + tok.length; k++) marcado[k] = true;
        from = idx + tok.length;
      }
    });

    var out = '';
    var i = 0;
    var n = Math.min(original.length, normalizada.length);
    while (i < n) {
      if (marcado[i]) {
        var j = i;
        while (j < n && marcado[j]) j++;
        out += '<mark>' + escapeHtml(original.slice(i, j)) + '</mark>';
        i = j;
      } else {
        var k2 = i;
        while (k2 < n && !marcado[k2]) k2++;
        out += escapeHtml(original.slice(i, k2));
        i = k2;
      }
    }
    if (original.length > n) out += escapeHtml(original.slice(n));
    return out;
  }

  // ===================== Estado =====================
  var resultadosAtuais = [];
  var indiceAtivo = -1;
  var selecionado = null;     // item escolhido na busca
  var pedido = [];            // linhas adicionadas

  // ===================== Elementos =====================
  var $ = function (id) { return document.getElementById(id); };
  var searchInput = $('searchInput');
  var clearSearch = $('clearSearch');
  var results = $('results');
  var dbCount = $('dbCount');

  var selectedCard = $('selectedCard');
  var selArtigo = $('selArtigo');
  var selSku = $('selSku');
  var selUnid = $('selUnid');
  var corTamanho = $('corTamanho');
  var quantidade = $('quantidade');
  var addItem = $('addItem');
  var cancelSel = $('cancelSel');

  var numPedido = $('numPedido');
  var cliente = $('cliente');
  var orderClienteLabel = $('orderClienteLabel');
  var orderBody = $('orderBody');
  var orderEmpty = $('orderEmpty');
  var orderTable = $('orderTable');
  var orderTotal = $('orderTotal');
  var exportCsv = $('exportCsv');
  var exportXlsx = $('exportXlsx');
  var toast = $('toast');

  // ===================== Ícones =====================
  function renderIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // ===================== Busca / UI =====================
  dbCount.textContent = DB.length
    ? DB.length + ' itens no banco'
    : 'Banco vazio — rode o conversor';

  var debounceTimer = null;
  searchInput.addEventListener('input', function () {
    clearSearch.hidden = !searchInput.value;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(renderResultados, 110);
  });

  searchInput.addEventListener('keydown', function (e) {
    if (!resultadosAtuais.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      indiceAtivo = (indiceAtivo + 1) % resultadosAtuais.length;
      atualizarAtivo();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      indiceAtivo = (indiceAtivo - 1 + resultadosAtuais.length) % resultadosAtuais.length;
      atualizarAtivo();
    } else if (e.key === 'Enter') {
      if (indiceAtivo >= 0 && resultadosAtuais[indiceAtivo]) {
        e.preventDefault();
        escolher(resultadosAtuais[indiceAtivo]);
      }
    } else if (e.key === 'Escape') {
      limparBusca();
    }
  });

  clearSearch.addEventListener('click', limparBusca);

  function limparBusca() {
    searchInput.value = '';
    clearSearch.hidden = true;
    resultadosAtuais = [];
    indiceAtivo = -1;
    results.innerHTML = '';
    searchInput.setAttribute('aria-expanded', 'false');
    searchInput.focus();
  }

  function renderResultados() {
    var q = searchInput.value;
    resultadosAtuais = buscar(q, 50);
    indiceAtivo = -1;
    results.innerHTML = '';

    if (!q.trim()) {
      searchInput.setAttribute('aria-expanded', 'false');
      return;
    }
    searchInput.setAttribute('aria-expanded', 'true');

    if (!resultadosAtuais.length) {
      var li = document.createElement('li');
      li.className = 'results__empty';
      li.innerHTML = '<i data-lucide="search-x"></i>Nada encontrado para essa combinação.';
      results.appendChild(li);
      renderIcons();
      return;
    }

    resultadosAtuais.forEach(function (it, idx) {
      var li = document.createElement('li');
      li.className = 'result';
      li.setAttribute('role', 'option');
      li.setAttribute('id', 'res-' + idx);
      li.dataset.idx = String(idx);
      li.innerHTML =
        '<span class="result__mp">' + destacar(it.mp, it._mpNorm, q) + '</span>' +
        '<span class="result__meta">' +
          '<span class="result__sku">' + destacar(it.sku, it.sku, q) + '</span>' +
          '<span class="result__chip">' + escapeHtml(rotuloUnidade(it.unid)) + '</span>' +
          '<span class="result__chip">' + escapeHtml(it.grupo) + '</span>' +
        '</span>';
      li.addEventListener('click', function () { escolher(it); });
      results.appendChild(li);
    });
    renderIcons();
  }

  function atualizarAtivo() {
    var nodes = results.querySelectorAll('.result');
    nodes.forEach(function (n, i) {
      var active = i === indiceAtivo;
      n.classList.toggle('is-active', active);
      if (active) {
        n.scrollIntoView({ block: 'nearest' });
        searchInput.setAttribute('aria-activedescendant', n.id);
      }
    });
  }

  // ===================== Seleção / preenchimento =====================
  function escolher(item) {
    selecionado = item;
    selArtigo.textContent = item.mp;
    selSku.textContent = item.sku;
    selUnid.textContent = rotuloUnidade(item.unid);
    corTamanho.value = detectarCorTamanho(item.mp); // cor + tamanho (editável)
    quantidade.value = '';
    selectedCard.hidden = false;
    renderIcons();
    // Cor/Tamanho já vem preenchido -> vai direto pra Quantidade
    quantidade.focus();
    selectedCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  cancelSel.addEventListener('click', function () {
    selecionado = null;
    selectedCard.hidden = true;
  });

  quantidade.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); addItem.click(); }
  });

  addItem.addEventListener('click', function () {
    if (!selecionado) return;
    var qtd = quantidade.value.trim();
    if (!qtd) {
      mostrarToast('Informe a quantidade.', 'warn');
      quantidade.focus();
      return;
    }
    pedido.push({
      sku: selecionado.sku,
      artigo: selecionado.mp,
      unid: rotuloUnidade(selecionado.unid),
      cor: corTamanho.value.trim(),
      qtd: qtd
    });
    selecionado = null;
    selectedCard.hidden = true;
    renderPedido(true);
    mostrarToast('Item adicionado ao pedido.', 'ok');
    searchInput.focus();
  });

  // ===================== Tabela do pedido =====================
  cliente.addEventListener('input', function () {
    var v = cliente.value.trim();
    orderClienteLabel.textContent = v ? v.toUpperCase() : 'CLIENTE';
  });

  function renderPedido(destacarUltima) {
    orderBody.innerHTML = '';
    var temItens = pedido.length > 0;
    orderEmpty.hidden = temItens;
    orderTable.style.display = temItens ? '' : 'none';
    exportCsv.disabled = !temItens;
    exportXlsx.disabled = !temItens;
    orderTotal.textContent = pedido.length + (pedido.length === 1 ? ' item' : ' itens');

    var nped = numPedido.value.trim();

    pedido.forEach(function (linha, idx) {
      var tr = document.createElement('tr');
      if (destacarUltima && idx === pedido.length - 1) tr.className = 'order__row--new';
      tr.innerHTML =
        '<td class="mono">' + escapeHtml(nped) + '</td>' +
        '<td class="col-artigo">' + escapeHtml(linha.artigo) + '</td>' +
        '<td class="mono">' + escapeHtml(linha.sku) + '</td>' +
        '<td>' + escapeHtml(linha.cor) + '</td>' +
        '<td>' + escapeHtml(linha.unid) + '</td>' +
        '<td class="mono">' + escapeHtml(linha.qtd) + '</td>' +
        '<td></td>';
      var tdAcao = tr.lastElementChild;
      var btn = document.createElement('button');
      btn.className = 'rowdel';
      btn.type = 'button';
      btn.title = 'Remover item';
      btn.setAttribute('aria-label', 'Remover item');
      btn.innerHTML = '<i data-lucide="trash-2"></i>';
      btn.addEventListener('click', function () {
        pedido.splice(idx, 1);
        renderPedido(false);
      });
      tdAcao.appendChild(btn);
      orderBody.appendChild(tr);
    });
    renderIcons();
  }

  // Reescrever a coluna N° PEDIDO ao alterar o campo
  numPedido.addEventListener('input', function () {
    if (pedido.length) renderPedido(false);
  });

  // ===================== Exportação =====================
  var COLS = ['N° PEDIDO', 'ARTIGO', 'SKU', 'COR/TAMANHO', 'UN. MED.', 'QUANTIDADE'];

  function linhasMatriz() {
    var nped = numPedido.value.trim();
    return pedido.map(function (l) {
      return [nped, l.artigo, l.sku, l.cor, l.unid, l.qtd];
    });
  }

  function nomeArquivo(ext) {
    var nped = numPedido.value.trim().replace(/[^\w.-]+/g, '_');
    var cli = cliente.value.trim().replace(/[^\w.-]+/g, '_');
    var partes = ['pedido'];
    if (nped) partes.push(nped);
    if (cli) partes.push(cli);
    return partes.join('-') + '.' + ext;
  }

  function baixar(blob, nome) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  // ----- CSV: UTF-8 com BOM, separador ";" (abre certo no Excel PT-BR) -----
  function campoCsv(v) {
    var s = String(v == null ? '' : v);
    if (/[";\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function exportarCsv() {
    if (!pedido.length) return;
    var linhas = [];
    var cli = cliente.value.trim();
    // Faixa do topo = só o nome do cliente (igual ao template)
    linhas.push(campoCsv(cli ? cli.toUpperCase() : 'CLIENTE'));
    linhas.push(COLS.map(campoCsv).join(';'));
    linhasMatriz().forEach(function (row) {
      linhas.push(row.map(campoCsv).join(';'));
    });
    var conteudo = '﻿' + linhas.join('\r\n');
    var blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
    baixar(blob, nomeArquivo('csv'));
    mostrarToast('CSV exportado.', 'ok');
  }

  // Nome da aba (planilha) = nome do cliente. Excel: máx 31 chars, sem * ? : \ / [ ]
  function nomeAba(cli) {
    var s = String(cli || '').toUpperCase()
      .replace(/[\\/?*\[\]:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!s) s = 'PEDIDO';
    return s.slice(0, 31);
  }

  // ----- XLSX via ExcelJS: replica o template (faixa amarela + grade) -----
  function exportarXlsx() {
    if (!pedido.length) return;
    if (typeof window.ExcelJS === 'undefined') {
      mostrarToast('Excel indisponível (offline). Exportando CSV.', 'warn');
      exportarCsv();
      return;
    }
    var cli = cliente.value.trim();
    var tituloCliente = cli ? cli.toUpperCase() : 'CLIENTE';
    var dados = linhasMatriz();

    var wb = new window.ExcelJS.Workbook();
    var ws = wb.addWorksheet(nomeAba(cli));

    ws.columns = [
      { width: 12 }, { width: 46 }, { width: 12 },
      { width: 20 }, { width: 12 }, { width: 13 }
    ];

    // Linha 1: faixa amarela mesclada (A1:F1) só com o nome do cliente
    ws.mergeCells('A1:F1');
    var bar = ws.getCell('A1');
    bar.value = tituloCliente;
    bar.font = { bold: true, size: 14, color: { argb: 'FF000000' } };
    bar.alignment = { horizontal: 'center', vertical: 'middle' };
    bar.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
    ws.getRow(1).height = 22;

    // Linha 2: cabeçalho em negrito
    var head = ws.getRow(2);
    head.values = COLS.slice();
    head.font = { bold: true };
    head.alignment = { vertical: 'middle' };

    // Linhas de dados (a partir da linha 3)
    dados.forEach(function (r) { ws.addRow(r); });

    // Completa com linhas vazias pra lembrar a "grade" do template
    var MIN_LINHAS = 24;
    for (var i = dados.length; i < MIN_LINHAS; i++) ws.addRow(['', '', '', '', '', '']);

    // Bordas finas em toda a grade
    var ultima = 2 + Math.max(dados.length, MIN_LINHAS);
    var fina = { style: 'thin', color: { argb: 'FF000000' } };
    for (var r = 1; r <= ultima; r++) {
      for (var c = 1; c <= 6; c++) {
        ws.getCell(r, c).border = { top: fina, left: fina, bottom: fina, right: fina };
      }
    }

    // Lista suspensa em UN. MED. (coluna E), igual à legenda do template
    var opcoes = '"unidades,metros,kg,pares,peças,rolos,km,m²,ml"';
    for (var r2 = 3; r2 <= ultima; r2++) {
      ws.getCell(r2, 5).dataValidation = { type: 'list', allowBlank: true, formulae: [opcoes] };
    }

    wb.xlsx.writeBuffer().then(function (buf) {
      baixar(
        new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        nomeArquivo('xlsx')
      );
      mostrarToast('Excel exportado.', 'ok');
    }).catch(function () {
      mostrarToast('Falha no Excel. Exportando CSV.', 'warn');
      exportarCsv();
    });
  }

  exportCsv.addEventListener('click', exportarCsv);
  exportXlsx.addEventListener('click', exportarXlsx);

  // ===================== Toast =====================
  var toastTimer = null;
  function mostrarToast(msg, tipo) {
    toast.className = 'toast ' + (tipo === 'warn' ? 'toast--warn' : 'toast--ok');
    var icone = tipo === 'warn' ? 'alert-triangle' : 'check';
    toast.innerHTML = '<i data-lucide="' + icone + '"></i><span>' + escapeHtml(msg) + '</span>';
    toast.hidden = false;
    renderIcons();
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, 2600);
  }

  // ===================== Init =====================
  renderPedido(false);
  renderIcons();
  searchInput.focus();
})();
