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

  // ----- Datas (DT. SOLIC.) -----
  // No modelo a data fica em ISO (aaaa-mm-dd, o value do <input type="date">).
  // Vira dd/mm/aaaa só na exportação; volta a ISO na importação.
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function hojeISO() {
    var d = new Date(); // fuso local — não usar toISOString() (cairia em UTC e podia voltar um dia)
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function isoParaBR(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
    return m ? (m[3] + '/' + m[2] + '/' + m[1]) : '';
  }
  function brParaISO(v) {
    if (v == null) return '';
    if (v instanceof Date && !isNaN(v)) {
      return v.getFullYear() + '-' + pad2(v.getMonth() + 1) + '-' + pad2(v.getDate());
    }
    var s = String(v).trim();
    if (!s) return '';
    var br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
    if (br) return br[3] + '-' + pad2(+br[2]) + '-' + pad2(+br[1]);
    var iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (iso) return iso[1] + '-' + iso[2] + '-' + iso[3];
    return '';
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
    'COCOA','COURO','CAQUI','TERRACOTA','TERRA','BANDANA', 'MATILDE','MAGENTA','BERINJELA','MOCASSIN',
    'SIDERAL','ABSOLUTO','DIVINO','TAME','STELLA','NOBILE','NUAGE','FANTASTICO','ROMANCE',
    'FRUTILLY','JAIPUR','CAMARO','PAVAO','SATIN','MAKE','MELAO','ATOL','VEGAS','LUVITA',
    'ODALISCA','SANREMO','SANDIA','AZULEJO','HERANCA','LICHIA','CHRONOS','TEOS','CORINGA',
    'PANTERA','TURQUESA','AMALIA','DUSK','RICH','CICERO','CROCO','LAURENT','MATCHA','DESEJO',
    'LUCIANA','LOTERIA','RACY','FRAIS','IMBUIA','PINUS','GRAJAU','MOSCATEL','MAVI','RUBRO',
    'SENSUALE','REVELAR','GOA','COOLY','CLUB','NATIVA','MISSISSIPI','STELLA','FROZEN','BIC',
    'JABUTICABA','MANACA','CACAU','CEREJA','CABERNET','SCARLET','MALBEC','PIMENTA','URUCUM',
    'NAVY','ROYAL','BISTRO','ELITE','PETROLEO','MOSTARDA','SALMAO','GOIABA','TANGERINA',
    'GUACAMOLE','MENTOL','MUSGO','OCEAN','RUNNER','PRECIOSA','ENERGIA','BLUSH','MERGE',
    'MIRTILO','ZARAK','VALENTINO','NAOMI','JADORE','MISTIQUE','SUNKISSES','MAGENTA','MALIBU'
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
  // Vários clientes; cada um vira uma aba no Excel. "ativo" = card visível na tela.
  var clientes = [{ nome: '', numPedido: '', itens: [] }];
  var ativo = 0;
  function atual() { return clientes[ativo]; }
  function totalItens() {
    var n = 0;
    for (var i = 0; i < clientes.length; i++) n += clientes[i].itens.length;
    return n;
  }

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
  var dataSolic = $('dataSolic');
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
  var importPedido = $('importPedido');
  var importFile = $('importFile');
  var toast = $('toast');

  // Pager de clientes
  var prevCliente = $('prevCliente');
  var nextCliente = $('nextCliente');
  var novoCliente = $('novoCliente');
  var removerCliente = $('removerCliente');
  var pagerCount = $('pagerCount');
  var pagerName = $('pagerName');
  var orderCard = $('orderCard');

  // Modal de confirmação
  var modal = $('modal');
  var modalTitle = $('modalTitle');
  var modalMsg = $('modalMsg');
  var modalOk = $('modalOk');
  var modalCancel = $('modalCancel');

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
    dataSolic.value = hojeISO();                     // já vem com a data de hoje (editável)
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
    atual().itens.push({
      sku: selecionado.sku,
      artigo: selecionado.mp,
      unid: rotuloUnidade(selecionado.unid),
      cor: corTamanho.value.trim(),
      dataSolic: dataSolic.value || hojeISO(), // vazio -> data de hoje
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
    atual().nome = cliente.value;
    var v = cliente.value.trim();
    orderClienteLabel.textContent = v ? v.toUpperCase() : 'CLIENTE';
    atualizarPagerNome();
  });

  function renderPedido(destacarUltima) {
    orderBody.innerHTML = '';
    var itens = atual().itens;
    var temItens = itens.length > 0;
    orderEmpty.hidden = temItens;
    orderTable.style.display = temItens ? '' : 'none';
    exportCsv.disabled = !temItens;            // CSV = cliente ativo
    exportXlsx.disabled = totalItens() === 0;  // Excel = todos os clientes
    orderTotal.textContent = itens.length + (itens.length === 1 ? ' item' : ' itens');

    var nped = (atual().numPedido || '').trim();

    itens.forEach(function (linha, idx) {
      var tr = document.createElement('tr');
      if (destacarUltima && idx === itens.length - 1) tr.className = 'order__row--new';
      tr.innerHTML =
        '<td class="mono">' + escapeHtml(nped) + '</td>' +
        '<td class="col-artigo">' + escapeHtml(linha.artigo) + '</td>' +
        '<td class="mono">' + escapeHtml(linha.sku) + '</td>' +
        '<td class="cell-cor"></td>' +
        '<td>' + escapeHtml(linha.unid) + '</td>' +
        '<td class="cell-data"></td>' +
        '<td class="cell-qtd"></td>' +
        '<td></td>';

      // COR/TAMANHO editável (atualiza o modelo sem re-render, pra não perder o foco)
      var inCor = document.createElement('input');
      inCor.type = 'text';
      inCor.className = 'cell-input';
      inCor.value = linha.cor;
      inCor.setAttribute('aria-label', 'Cor/Tamanho');
      inCor.addEventListener('input', function () { atual().itens[idx].cor = inCor.value; });
      tr.querySelector('.cell-cor').appendChild(inCor);

      // DT. SOLIC. editável
      var inData = document.createElement('input');
      inData.type = 'date';
      inData.className = 'cell-input';
      inData.value = linha.dataSolic || '';
      inData.setAttribute('aria-label', 'Data de solicitação');
      inData.addEventListener('input', function () { atual().itens[idx].dataSolic = inData.value; });
      tr.querySelector('.cell-data').appendChild(inData);

      // QUANTIDADE editável
      var inQtd = document.createElement('input');
      inQtd.type = 'text';
      inQtd.className = 'cell-input mono';
      inQtd.value = linha.qtd;
      inQtd.setAttribute('inputmode', 'decimal');
      inQtd.setAttribute('aria-label', 'Quantidade');
      inQtd.addEventListener('input', function () { atual().itens[idx].qtd = inQtd.value; });
      tr.querySelector('.cell-qtd').appendChild(inQtd);

      var tdAcao = tr.lastElementChild;
      var btn = document.createElement('button');
      btn.className = 'rowdel';
      btn.type = 'button';
      btn.title = 'Remover item';
      btn.setAttribute('aria-label', 'Remover item');
      btn.innerHTML = '<i data-lucide="trash-2"></i>';
      btn.addEventListener('click', function () {
        atual().itens.splice(idx, 1);
        renderPedido(false);
      });
      tdAcao.appendChild(btn);
      orderBody.appendChild(tr);
    });
    renderIcons();
  }

  // Reescrever a coluna N° PEDIDO ao alterar o campo
  numPedido.addEventListener('input', function () {
    atual().numPedido = numPedido.value;
    if (atual().itens.length) renderPedido(false);
  });

  // ===================== Navegação entre clientes (pager) =====================
  function atualizarPagerNome() {
    var nome = (atual().nome || '').trim();
    pagerName.textContent = nome ? nome.toUpperCase() : 'Sem nome';
    pagerName.classList.toggle('is-empty', !nome);
  }
  function renderPager() {
    pagerCount.textContent = 'Cliente ' + (ativo + 1) + ' de ' + clientes.length;
    atualizarPagerNome();
    prevCliente.disabled = ativo <= 0;
    nextCliente.disabled = ativo >= clientes.length - 1;
    removerCliente.disabled = clientes.length <= 1 && !atual().itens.length &&
      !(atual().nome || '').trim() && !(atual().numPedido || '').trim();
  }
  function irPara(i, dir) {
    if (i < 0 || i >= clientes.length) return;
    ativo = i;
    cliente.value = atual().nome || '';
    numPedido.value = atual().numPedido || '';
    var v = (atual().nome || '').trim();
    orderClienteLabel.textContent = v ? v.toUpperCase() : 'CLIENTE';
    selecionado = null;
    selectedCard.hidden = true;
    renderPedido(false);
    renderPager();
    if (dir && orderCard) {
      var cls = dir < 0 ? 'anim-prev' : 'anim-next';
      orderCard.classList.remove('anim-prev', 'anim-next');
      void orderCard.offsetWidth; // reinicia a animação
      orderCard.classList.add(cls);
    }
  }
  function novoClienteFn() {
    clientes.push({ nome: '', numPedido: '', itens: [] });
    irPara(clientes.length - 1, 1);
    cliente.focus();
  }
  function removerClienteAgora() {
    clientes.splice(ativo, 1);
    if (!clientes.length) clientes.push({ nome: '', numPedido: '', itens: [] });
    if (ativo >= clientes.length) ativo = clientes.length - 1;
    irPara(ativo, 0);
    mostrarToast('Cliente removido.', 'ok');
  }
  function removerClienteFn() {
    var qtd = atual().itens.length;
    if (!qtd) { removerClienteAgora(); return; }
    var quem = (atual().nome || '').trim() || 'sem nome';
    abrirModal({
      titulo: 'Remover cliente',
      mensagem: 'Remover "' + quem + '" e os ' + qtd + ' item(ns) dele? Não dá pra desfazer.',
      confirmar: 'Remover',
      cancelar: 'Cancelar',
      perigo: true
    }).then(function (ok) { if (ok) removerClienteAgora(); });
  }
  prevCliente.addEventListener('click', function () { irPara(ativo - 1, -1); });
  nextCliente.addEventListener('click', function () { irPara(ativo + 1, 1); });
  novoCliente.addEventListener('click', novoClienteFn);
  removerCliente.addEventListener('click', removerClienteFn);

  // Gesto de arrastar (swipe) pra trocar de cliente
  (function (el) {
    if (!el) return;
    var x0 = null, y0 = null;
    el.addEventListener('touchstart', function (e) {
      var t = e.changedTouches[0]; x0 = t.clientX; y0 = t.clientY;
    }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - x0, dy = t.clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) irPara(ativo + 1, 1); else irPara(ativo - 1, -1);
      }
    }, { passive: true });
  })(orderCard);

  // ===================== Exportação =====================
  var COLS = ['N° PEDIDO', 'ARTIGO', 'SKU', 'COR/TAMANHO', 'UN. MED.', 'DT. SOLIC.', 'QUANTIDADE'];

  function linhasMatriz(cli) {
    cli = cli || atual();
    var nped = (cli.numPedido || '').trim();
    return cli.itens.map(function (l) {
      return [nped, l.artigo, l.sku, l.cor, l.unid, isoParaBR(l.dataSolic), l.qtd];
    });
  }

  function nomeArquivo(ext, cli) {
    cli = cli || atual();
    var nped = (cli.numPedido || '').trim().replace(/[^\w.-]+/g, '_');
    var nome = (cli.nome || '').trim().replace(/[^\w.-]+/g, '_');
    var partes = ['pedido'];
    if (nped) partes.push(nped);
    if (nome) partes.push(nome);
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
    var cli = atual(); // CSV não tem abas: exporta só o cliente ativo
    if (!cli.itens.length) { mostrarToast('Este cliente não tem itens.', 'warn'); return; }
    var linhas = [];
    var nome = (cli.nome || '').trim();
    // Faixa do topo = só o nome do cliente (igual ao template)
    linhas.push(campoCsv(nome ? nome.toUpperCase() : 'CLIENTE'));
    linhas.push(COLS.map(campoCsv).join(';'));
    linhasMatriz(cli).forEach(function (row) {
      linhas.push(row.map(campoCsv).join(';'));
    });
    var conteudo = '﻿' + linhas.join('\r\n');
    var blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
    baixar(blob, nomeArquivo('csv', cli));
    mostrarToast('CSV exportado (cliente ativo).', 'ok');
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
  // Garante nome de aba único (Excel não aceita abas repetidas): NOME, NOME (2)...
  function nomeAbaUnico(nome, usados) {
    var base = nomeAba(nome), n = base, i = 2;
    while (usados[n]) { n = base.slice(0, 26) + ' (' + i + ')'; i++; }
    usados[n] = true;
    return n;
  }

  // Monta UMA aba (faixa amarela + cabeçalho + grade) pra um cliente.
  function montarAba(ws, cli) {
    var nome = (cli.nome || '').trim();
    var titulo = nome ? nome.toUpperCase() : 'CLIENTE';
    var dados = linhasMatriz(cli);

    ws.columns = [
      { width: 12 }, { width: 46 }, { width: 12 },
      { width: 20 }, { width: 12 }, { width: 14 }, { width: 13 }
    ];
    ws.mergeCells('A1:G1');
    var bar = ws.getCell('A1');
    bar.value = titulo;
    bar.font = { bold: true, size: 14, color: { argb: 'FF000000' } };
    bar.alignment = { horizontal: 'center', vertical: 'middle' };
    bar.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
    ws.getRow(1).height = 22;

    var head = ws.getRow(2);
    head.values = COLS.slice();
    head.font = { bold: true };
    head.alignment = { vertical: 'middle' };

    dados.forEach(function (r) { ws.addRow(r); });

    var MIN_LINHAS = 24;
    for (var i = dados.length; i < MIN_LINHAS; i++) ws.addRow(['', '', '', '', '', '', '']);

    var ultima = 2 + Math.max(dados.length, MIN_LINHAS);
    var fina = { style: 'thin', color: { argb: 'FF000000' } };
    for (var r = 1; r <= ultima; r++) {
      for (var c = 1; c <= 7; c++) {
        ws.getCell(r, c).border = { top: fina, left: fina, bottom: fina, right: fina };
      }
    }
    var opcoes = '"unidades,metros,kg,pares,peças,rolos,km,m²,ml"';
    for (var r2 = 3; r2 <= ultima; r2++) {
      ws.getCell(r2, 5).dataValidation = { type: 'list', allowBlank: true, formulae: [opcoes] };
    }
  }

  // ----- XLSX via ExcelJS: um arquivo, UMA ABA por cliente (com itens) -----
  function exportarXlsx() {
    var comItens = clientes.filter(function (c) { return c.itens.length; });
    if (!comItens.length) { mostrarToast('Nenhum item pra exportar.', 'warn'); return; }
    if (typeof window.ExcelJS === 'undefined') {
      mostrarToast('Excel indisponível (offline). Exportando CSV.', 'warn');
      exportarCsv();
      return;
    }
    var wb = new window.ExcelJS.Workbook();
    var usados = {};
    comItens.forEach(function (cli) {
      var ws = wb.addWorksheet(nomeAbaUnico(cli.nome, usados));
      montarAba(ws, cli);
    });
    var nomeF = comItens.length === 1 ? nomeArquivo('xlsx', comItens[0]) : 'pedidos.xlsx';

    wb.xlsx.writeBuffer().then(function (buf) {
      baixar(
        new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        nomeF
      );
      mostrarToast(comItens.length > 1
        ? (comItens.length + ' clientes exportados em abas.')
        : 'Excel exportado.', 'ok');
    }).catch(function () {
      mostrarToast('Falha no Excel. Exportando CSV.', 'warn');
      exportarCsv();
    });
  }

  exportCsv.addEventListener('click', exportarCsv);
  exportXlsx.addEventListener('click', exportarXlsx);

  // ===================== Importar pedido (CSV/XLSX) =====================
  function limpa(v) { return v == null ? '' : String(v).trim(); }

  // CSV -> matriz (array de linhas). Trata BOM, aspas ("" escapa), ; e \r\n/\n.
  function parseCsvText(text) {
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // remove BOM
    var rows = [], row = [], campo = '', aspas = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (aspas) {
        if (ch === '"') {
          if (text[i + 1] === '"') { campo += '"'; i++; }
          else aspas = false;
        } else campo += ch;
      } else {
        if (ch === '"') aspas = true;
        else if (ch === ';') { row.push(campo); campo = ''; }
        else if (ch === '\n') { row.push(campo); rows.push(row); row = []; campo = ''; }
        else if (ch === '\r') { /* ignora; quebra acontece no \n */ }
        else campo += ch;
      }
    }
    if (campo !== '' || row.length) { row.push(campo); rows.push(row); }
    return rows;
  }

  // Valor de célula do ExcelJS -> texto (cobre string, número, rich text e fórmula).
  function celulaTexto(v) {
    if (v == null) return '';
    if (typeof v === 'object') {
      if (v.richText) return v.richText.map(function (t) { return t.text; }).join('');
      if (v.text != null) return String(v.text);
      if (v.result != null) return String(v.result);
      return '';
    }
    return String(v);
  }

  // Matriz -> { cliente, numPedido, linhas[] }. Acha o cabeçalho e lê por RÓTULO,
  // não por posição fixa: assim arquivos antigos (sem DT. SOLIC.) ainda importam.
  function matrizParaPedido(matriz) {
    // Cabeçalho = primeira linha cujas células (normalizadas) tragam ARTIGO e SKU.
    var hi = -1, idx = {};
    for (var i = 0; i < matriz.length; i++) {
      var linha = matriz[i] || [];
      var mapa = {}, temArtigo = false, temSku = false;
      for (var c = 0; c < linha.length; c++) {
        var rotulo = normalizar(linha[c] == null ? '' : linha[c]);
        if (!rotulo) continue;
        if (!(rotulo in mapa)) mapa[rotulo] = c; // 1ª ocorrência de cada rótulo
        if (rotulo === 'ARTIGO') temArtigo = true;
        if (rotulo === 'SKU') temSku = true;
      }
      if (temArtigo && temSku) { hi = i; idx = mapa; break; }
    }
    if (hi === -1) return null; // não é um pedido reconhecível

    var iNped = idx[normalizar('N° PEDIDO')];
    var iArtigo = idx['ARTIGO'];
    var iSku = idx['SKU'];
    var iCor = idx[normalizar('COR/TAMANHO')];
    var iUnid = idx[normalizar('UN. MED.')];
    var iData = idx[normalizar('DT. SOLIC.')]; // opcional (ausente em arquivos antigos)
    var iQtd = idx['QUANTIDADE'];
    function celula(L, i) { return i == null ? '' : limpa(L[i]); }

    // Cliente: primeira célula não-vazia acima do cabeçalho (a faixa do topo)
    var cli = '';
    for (var k = 0; k < hi; k++) {
      var c0 = matriz[k] && matriz[k][0] != null ? String(matriz[k][0]).trim() : '';
      if (c0) { cli = c0; break; }
    }
    if (normalizar(cli) === 'CLIENTE') cli = ''; // rótulo padrão, não é nome real

    var linhas = [], nped = '';
    for (var r = hi + 1; r < matriz.length; r++) {
      var L = matriz[r] || [];
      var np = celula(L, iNped), artigo = celula(L, iArtigo), sku = celula(L, iSku);
      var cor = celula(L, iCor), unid = celula(L, iUnid), qtd = celula(L, iQtd);
      var dataSolic = brParaISO(celula(L, iData)); // '' se a coluna não existir
      if (!artigo && !sku && !qtd) continue; // pula linhas vazias / preenchimento
      if (!nped && np) nped = np;
      linhas.push({ sku: sku, artigo: artigo, unid: unid, cor: cor, dataSolic: dataSolic, qtd: qtd });
    }
    return { cliente: cli, numPedido: nped, linhas: linhas };
  }

  // Substitui TODOS os clientes da tela pela lista importada (com confirmação).
  function aplicarClientes(lista) {
    lista = (lista || []).filter(function (c) { return c.itens && c.itens.length; });
    if (!lista.length) {
      mostrarToast('Não encontrei itens no arquivo. Use um pedido exportado aqui.', 'warn');
      return;
    }
    var nc = lista.length;
    var aplicar = function () {
      clientes = lista;
      ativo = 0;
      irPara(0, 0);
      mostrarToast(nc > 1
        ? (nc + ' clientes importados.')
        : (lista[0].itens.length + ' item(ns) importado(s).'), 'ok');
    };
    if (totalItens()) {
      abrirModal({
        titulo: 'Substituir o que está na tela?',
        mensagem: 'Importar vai substituir tudo que está aberto (' + totalItens() +
          ' item(ns) em ' + clientes.length + ' cliente(s)) pelo conteúdo do arquivo.',
        confirmar: 'Substituir',
        cancelar: 'Cancelar',
        perigo: true
      }).then(function (ok) { if (ok) aplicar(); });
    } else {
      aplicar();
    }
  }

  function importarArquivo(file) {
    var nome = (file.name || '').toLowerCase();
    if (nome.slice(-4) === '.csv') {
      var fr = new FileReader();
      fr.onload = function () {
        try {
          var d = matrizParaPedido(parseCsvText(String(fr.result)));
          if (!d) { mostrarToast('Arquivo não reconhecido.', 'warn'); return; }
          aplicarClientes([{ nome: d.cliente, numPedido: d.numPedido, itens: d.linhas }]);
        } catch (e) { mostrarToast('Falha ao ler o CSV.', 'warn'); }
      };
      fr.onerror = function () { mostrarToast('Não consegui abrir o arquivo.', 'warn'); };
      fr.readAsText(file); // CSV exportado é UTF-8
    } else if (nome.slice(-5) === '.xlsx') {
      if (typeof window.ExcelJS === 'undefined') {
        mostrarToast('Leitor de Excel indisponível (offline). Importe o CSV.', 'warn');
        return;
      }
      var fr2 = new FileReader();
      fr2.onload = function () {
        var wb = new window.ExcelJS.Workbook();
        wb.xlsx.load(fr2.result).then(function () {
          var lista = [];
          // Cada aba = um cliente
          wb.worksheets.forEach(function (ws) {
            var matriz = [];
            ws.eachRow({ includeEmpty: true }, function (rowObj) {
              var arr = [];
              for (var c = 1; c <= 7; c++) arr.push(celulaTexto(rowObj.getCell(c).value));
              matriz.push(arr);
            });
            var d = matrizParaPedido(matriz);
            if (d && d.linhas.length) {
              lista.push({ nome: d.cliente || ws.name, numPedido: d.numPedido, itens: d.linhas });
            }
          });
          if (!lista.length) { mostrarToast('Não encontrei pedidos no arquivo.', 'warn'); return; }
          aplicarClientes(lista);
        }).catch(function () { mostrarToast('Falha ao ler o Excel.', 'warn'); });
      };
      fr2.onerror = function () { mostrarToast('Não consegui abrir o arquivo.', 'warn'); };
      fr2.readAsArrayBuffer(file);
    } else {
      mostrarToast('Formato não suportado. Use CSV ou XLSX.', 'warn');
    }
  }

  importPedido.addEventListener('click', function () { importFile.click(); });
  importFile.addEventListener('change', function () {
    var f = importFile.files && importFile.files[0];
    if (f) importarArquivo(f);
    importFile.value = ''; // permite reimportar o mesmo arquivo
  });

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

  // ===================== Modal de confirmação =====================
  // Substitui o window.confirm() por um diálogo no tema do app. Retorna Promise<bool>.
  var modalResolver = null;
  var modalPrevFoco = null;

  function abrirModal(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      modalResolver = resolve;
      modalTitle.textContent = opts.titulo || 'Confirmar';
      modalMsg.textContent = opts.mensagem || '';
      modalOk.textContent = opts.confirmar || 'Confirmar';
      modalCancel.textContent = opts.cancelar || 'Cancelar';
      modalOk.className = 'btn ' + (opts.perigo ? 'btn--danger' : 'btn--primary');
      modalPrevFoco = document.activeElement;
      modal.hidden = false;
      setTimeout(function () { modalOk.focus(); }, 0);
    });
  }
  function fecharModal(val) {
    if (modal.hidden) return;
    modal.hidden = true;
    var r = modalResolver;
    modalResolver = null;
    if (modalPrevFoco && modalPrevFoco.focus) { try { modalPrevFoco.focus(); } catch (e) {} }
    if (r) r(val);
  }
  modalOk.addEventListener('click', function () { fecharModal(true); });
  modalCancel.addEventListener('click', function () { fecharModal(false); });
  modal.addEventListener('click', function (e) {
    if (e.target && e.target.getAttribute('data-close')) fecharModal(false);
  });
  document.addEventListener('keydown', function (e) {
    if (modal.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); fecharModal(false); }
    else if (e.key === 'Enter') { e.preventDefault(); fecharModal(true); }
    else if (e.key === 'Tab') { // trap simples entre Cancelar e OK
      e.preventDefault();
      (document.activeElement === modalOk ? modalCancel : modalOk).focus();
    }
  });

  // ===================== Init =====================
  renderPedido(false);
  renderPager();
  renderIcons();
  searchInput.focus();
})();
