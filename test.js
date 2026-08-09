'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseFrontmatter, generateSlug, renderTemplate, escapeHtml,
        generateFooter, buildInfoModal, renderTopicsSection, asciiTitle,
        renderHomeHero, renderHomeFeed, renderHomeManifesto,
        renderPostFrontmatter, renderArchiveTree, renderAsciiToc, renderPostFooter,
        renderPaperDocument, renderPaperTopNav, decoratePaperDocumentHtml, wrapAsciiText } = require('./build.js');

test('parseFrontmatter: extrai title e date', () => {
  const input = '---\ntitle: Hello World\ndate: 2026-05-18\n---\nconteúdo aqui';
  const { meta, body } = parseFrontmatter(input);
  assert.equal(meta.title, 'Hello World');
  assert.equal(meta.date, '2026-05-18');
  assert.equal(body, 'conteúdo aqui');
});

test('parseFrontmatter: sem frontmatter retorna body completo', () => {
  const input = 'apenas conteúdo';
  const { meta, body } = parseFrontmatter(input);
  assert.deepEqual(meta, {});
  assert.equal(body, 'apenas conteúdo');
});

test('parseFrontmatter: parseia tags como array', () => {
  const input = '---\ntitle: Foo\ntags: [tech, aprendizado]\n---\ncorpo';
  const { meta } = parseFrontmatter(input);
  assert.deepEqual(meta.tags, ['tech', 'aprendizado']);
});

test('generateSlug: deriva slug do nome do arquivo', () => {
  assert.equal(generateSlug('meu-artigo.md'), 'meu-artigo');
  assert.equal(generateSlug('src/posts/hello-world.md'), 'hello-world');
});

test('renderTemplate: substitui variáveis simples', () => {
  const tpl = 'Olá {{nome}}, você tem {{idade}} anos.';
  const result = renderTemplate(tpl, { nome: 'Essy', idade: '30' });
  assert.equal(result, 'Olá Essy, você tem 30 anos.');
});

test('renderTemplate: variável ausente vira string vazia', () => {
  const result = renderTemplate('{{a}} {{b}}', { a: 'X' });
  assert.equal(result, 'X ');
});

test('escapeHtml: escapa caracteres especiais', () => {
  assert.equal(escapeHtml('<script>'), '&lt;script&gt;');
  assert.equal(escapeHtml('a & b'), 'a &amp; b');
  assert.equal(escapeHtml('"quote"'), '&quot;quote&quot;');
});

test('asciiTitle: retorna pre.ascii-title com conteúdo', () => {
  const html = asciiTitle();
  assert.ok(html.includes('<pre class="ascii-title"'), 'deve ter pre.ascii-title');
  assert.ok(html.trim().length > 50, 'deve ter conteúdo significativo');
});

test('renderHomeHero: gera masthead limpo sem banner em caixa', () => {
  const html = renderHomeHero([
    { meta: { date: '2026-06-03' } },
  ], []);
  assert.ok(html.includes('root / index'), 'deve ter o kicker da home');
  assert.ok(html.includes('home-hero__brand-accent'), 'deve destacar a marca do site');
  assert.ok(!html.includes('home-hero__brand-accent--purple'), 'nao deve separar o 4 em roxo');
  assert.ok(html.includes('updated 2026-06-03'), 'deve expor a data mais recente');
  assert.ok(html.includes('1 paper'), 'deve contar apenas papers');
  assert.ok(!html.includes('ascii-title'), 'nao deve reutilizar o banner antigo');
  assert.ok(!html.includes('reflexões e aprendizados'), 'nao deve mostrar o subtitulo antigo na home');
  assert.ok(!html.includes('note'), 'nao deve mostrar notas no hero');
});

test('renderHomeFeed: lista itens como cards, sem arvore de arquivos', () => {
  const html = renderHomeFeed([
    { slug: 'alpha', meta: { title: 'Alpha Paper', author: 'alice', date: '2026-06-03', tags: ['privacy'] } },
    { slug: 'beta', meta: { title: 'Beta Paper', author: 'bob', date: '2026-06-02', pinned: 'true' } },
    { slug: 'gamma', meta: { title: 'Gamma Paper', author: 'carol', date: '2026-06-01', locked: 'true' } },
  ], [
    { slug: 'note-1', meta: { title: 'First Note', date: '2026-06-01' } },
  ]);
  assert.ok(html.includes('contents'), 'deve ter o titulo da lista');
  assert.ok(html.includes('thebixowithsevenheads'), 'deve ter a lateral do issue');
  assert.ok(html.includes('home-feed__side-char--red'), 'deve colorir a lateral com vermelho');
  assert.ok(!html.includes('home-feed__side-char--purple'), 'nao deve colorir a lateral com roxo');
  assert.ok(html.includes('Alpha Paper'), 'deve listar o paper mais recente');
  assert.ok(html.includes('class="home-feed-card"'), 'cada item deve virar um card/botao');
  assert.ok(html.includes('href="p/0x02/"'), 'deve linkar o paper pelo id hex cronologico');
  assert.ok(!html.includes('notes/note-1.html'), 'nao deve linkar a nota');
  assert.ok(html.includes('[0x00]'), 'deve numerar os itens em hexa');
  assert.ok(html.includes('[0x01]'), 'deve numerar o segundo paper em hexa');
  assert.ok(html.includes('[locked]'), 'deve mostrar item locked');
  assert.ok(html.includes('[pinned]'), 'deve mostrar item pinned');
  assert.ok(html.includes('home-feed-card__flag--locked'), 'deve marcar locked com classe propria');
  assert.ok(html.includes('home-feed-card__flag--pinned'), 'deve marcar pinned com classe propria');
  assert.ok(html.includes('home-feed-card__tag'), 'deve mostrar as tags no card');
  assert.ok(html.includes('home-feed-card--locked'), 'locked deve virar card nao clicavel');
  assert.ok(!html.includes('href="p/0x00/"'), 'locked nao deve virar link na home');
  assert.ok(!html.includes('archive-tree'), 'nao deve usar arvore de arquivos');
});

test('renderHomeManifesto: gera manifesto curto para a home', () => {
  const html = renderHomeManifesto();
  assert.ok(html.includes('M4n1nNnF44sT.pcap'), 'deve ter o novo titulo do manifesto');
  assert.ok(html.includes('01001010 01110101 01101101'), 'deve ter o bloco binario');
  assert.ok(html.includes('00111111 00100000 01001001'), 'deve conter a frase inteira em binario');
  assert.ok(html.includes('home-manifesto__bit--red'), 'deve destacar alguns bits em vermelho');
  const visibleMatch = html.match(/<span aria-hidden="true" class="home-manifesto__binary">([\s\S]*?)<\/span><\/pre>/);
  assert.ok(visibleMatch, 'deve renderizar a faixa visivel do manifesto');
  const visible = visibleMatch[1];
  const visibleBits = visible.replace(/<[^>]+>/g, '').replace(/\s+/g, '');
  const redCount = (visible.match(/home-manifesto__bit--red/g) || []).length;
  assert.ok(redCount > 0, 'deve destacar alguns bits em vermelho');
  assert.ok(redCount < visibleBits.length, 'nao deve destacar todos os bits em vermelho');
  assert.ok(!html.includes('reflexões e aprendizados'), 'nao deve repetir o subtitulo antigo');
});

test('renderTopicsSection: vazio retorna string vazia', () => {
  assert.equal(renderTopicsSection([], ''), '');
});

test('renderTopicsSection: topic normal gera link [ label ]', () => {
  const themes = [{ slug: 'computers', meta: { card_label: 'computers', block: 'false' } }];
  const html = renderTopicsSection(themes, '');
  assert.ok(html.includes('href="computers/index.html"'), 'deve ter link para o tópico');
  assert.ok(html.includes('[ computers ]'), 'deve ter label do tópico');
});

test('renderTopicsSection: topic bloqueado nao tem link e tem [locked]', () => {
  const themes = [{ slug: 'security', meta: { card_label: 'security', block: 'true' } }];
  const html = renderTopicsSection(themes, '');
  assert.ok(!html.includes('<a '), 'topico bloqueado nao deve ter tag <a>');
  assert.ok(html.includes('[locked]'), 'deve ter label [locked]');
});

test('generateFooter: mostra botão de info, sem expor xmpp/email direto', () => {
  const cfg = { xmpp: 'test@xmpp.example', email: 'test@mail.example' };
  const html = generateFooter('', cfg);
  assert.ok(html.includes('info-modal-trigger'), 'deve ter o botão que abre o modal de info');
  assert.ok(!html.includes('test@xmpp.example'), 'endereço xmpp não deve mais ficar exposto no footer');
  assert.ok(!html.includes('test@mail.example'), 'endereço email não deve mais ficar exposto no footer');
});

test('buildInfoModal: contém xmpp e email', () => {
  const cfg = { xmpp: 'test@xmpp.example', email: 'test@mail.example' };
  const html = buildInfoModal(cfg);
  assert.ok(html.includes('test@xmpp.example'), 'deve ter endereço xmpp');
  assert.ok(html.includes('test@mail.example'), 'deve ter endereço email');
});

test('buildInfoModal: cfg vazio não explode e não gera modal', () => {
  assert.doesNotThrow(() => buildInfoModal({}));
  assert.equal(buildInfoModal({}), '');
});

test('generateFooter: cfg vazio não explode', () => {
  assert.doesNotThrow(() => generateFooter('', {}));
});

test('parseFrontmatter: suporta links como objeto aninhado', () => {
  const input = '---\ntitle: Test\nlinks:\n  pdf: /file.pdf\n  source: https://github.com\n---\nbody';
  const { meta, body } = parseFrontmatter(input);
  assert.equal(meta.title, 'Test');
  assert.equal(typeof meta.links, 'object');
  assert.equal(meta.links.pdf, '/file.pdf');
  assert.equal(meta.links.source, 'https://github.com');
  assert.equal(body, 'body');
});

test('parseFrontmatter: converte booleano locked para string', () => {
  const input = '---\ntitle: T\nlocked: true\n---\nbody';
  const { meta } = parseFrontmatter(input);
  assert.equal(meta.locked, 'true');
});

test('parseFrontmatter: converte date para string ISO', () => {
  const input = '---\ntitle: T\ndate: 2026-06-03\n---\nbody';
  const { meta } = parseFrontmatter(input);
  assert.equal(typeof meta.date, 'string');
  assert.equal(meta.date, '2026-06-03');
});

test('renderPostFrontmatter: gera h1 com title em uppercase', () => {
  const post = { slug: 'test', meta: { title: 'Hello World' }, html: '' };
  const html = renderPostFrontmatter(post);
  assert.ok(html.includes('paper-title-sr'), 'deve ter titulo oculto');
  assert.ok(html.includes('HELLO WORLD'), 'titulo deve ser uppercase');
});

test('renderPostFrontmatter: omite linha by se nao ha author', () => {
  const post = { slug: 'test', meta: { title: 'T', date: '2026-06-03' }, html: '' };
  const html = renderPostFrontmatter(post);
  assert.ok(!html.includes('by '), 'nao deve ter linha by sem author');
});

test('renderPostFrontmatter: nao inclui links nem venue no topo', () => {
  const post = {
    slug: 'test',
    meta: { title: 'T', author: 'alice', venue: 'x', rev: 3, links: { pdf: '/f.pdf' } },
    html: '',
  };
  const html = renderPostFrontmatter(post);
  assert.ok(!html.includes('venue:'), 'nao deve expor venue');
  assert.ok(!html.includes('rev '), 'nao deve expor rev');
  assert.ok(!html.includes('[pdf]'), 'nao deve expor links no topo');
});

test('renderAsciiToc: gera topicos com links numerados', () => {
  const html = renderAsciiToc([
    { level: 2, text: 'Introduction', id: 'introduction' },
    { level: 2, text: 'Setup', id: 'setup' },
  ]);
  assert.ok(html.includes('TOPICOS'), 'deve ter cabecalho');
  assert.ok(html.includes('0x01'), 'deve numerar topicos');
  assert.ok(html.includes('href="#introduction"'), 'deve linkar para o primeiro topico');
});

test('renderPostFooter: links ficam no footer do artigo', () => {
  const post = {
    slug: 'test',
    meta: { links: { pdf: '/f.pdf', source: 'https://gh.com' } },
  };
  const html = renderPostFooter(post);
  assert.ok(html.includes('links:'), 'deve ter rotulo links');
  assert.ok(html.includes('href="/f.pdf"'), 'deve ter link pdf');
  assert.ok(html.includes('[source]'), 'deve ter label source');
});

test('renderArchiveTree: gera arvore ascii com .txt e metadados', () => {
  const items = [{
    slug: 'guia-rich-content',
    meta: {
      title: 'Guia de Rich Content',
      author: 'tsoi32',
      date: '2026-06-03',
    },
  }];
  const html = renderArchiveTree([
    { label: 'papers', groups: [{ label: 'computers', items }] },
  ], {
    rootLabel: 'root',
    hrefFn: item => `papers/${item.slug}.html`,
  });
  assert.ok(html.includes('root/'), 'deve ter raiz');
  assert.ok(html.includes('<details'), 'deve usar details colapsavel');
  assert.ok(html.includes('archive-folder__icon'), 'deve ter icone de pasta');
  assert.ok(html.includes('computers/'), 'deve ter pasta de tópico');
  assert.ok(html.includes('guia-rich-content.txt'), 'deve ter nome .txt');
  assert.ok(html.includes('GUIA DE RICH CONTENT'), 'deve ter metadados do titulo');
});

test('renderArchiveTree: locked nao vira link e pinned aparece marcado', () => {
  const items = [{
    slug: 'locked-example',
    meta: {
      title: 'Locked Example',
      author: 'tsoi32',
      date: '2026-05-31',
      locked: 'true',
      pinned: 'true',
    },
  }];
  const html = renderArchiveTree([
    { label: 'papers', groups: [{ label: 'computers', items }] },
  ], {
    rootLabel: 'root',
    hrefFn: item => `papers/${item.slug}.html`,
  });
  assert.ok(html.includes('[locked]'), 'deve mostrar badge locked');
  assert.ok(html.includes('[pinned]'), 'deve mostrar badge pinned');
  assert.ok(!html.includes('href="papers/locked-example.html"'), 'locked nao deve virar link');
});

test('renderPaperDocument: gera capa, sumario e seções em ASCII', () => {
  const text = renderPaperDocument({
    meta: {
      title: 'Paper Example',
      author: 'alice',
      date: '2026-06-03',
      description: 'Short subtitle',
      tags: ['elf', 'ascii'],
    },
    body: '# Intro\n\nBody text.',
  });
  const lines = text.split('\n');
  assert.ok(text.includes('PAPER EXAMPLE'), 'deve incluir capa com titulo');
  const coverTitleIndex = lines.findIndex(line => line.includes('PAPER EXAMPLE'));
  assert.ok(coverTitleIndex > 1, 'deve localizar o titulo da capa');
  assert.match(lines[coverTitleIndex - 1], /^\|\s+\|$/, 'deve ter respiro acima do titulo');
  assert.match(lines[coverTitleIndex - 2], /^\|\s+\|$/, 'deve ter duplo respiro acima do titulo');
  assert.match(lines[coverTitleIndex + 1], /^\|\s+\|$/, 'deve ter respiro abaixo do titulo');
  assert.match(lines[coverTitleIndex + 2], /^\|\s+\|$/, 'deve ter duplo respiro abaixo do titulo');
  assert.ok(text.includes('--[ Summary ]'), 'deve incluir sumario');
  assert.ok(text.includes('--[ 1 ]-- [ Intro ]'), 'deve numerar a primeira secao');
  const introIndex = lines.findIndex(line => line.includes('--[ 1 ]-- [ Intro ]'));
  assert.ok(introIndex > 2, 'deve localizar o heading da secao');
  assert.equal(lines[introIndex - 1], '', 'deve ter uma linha vazia acima do heading');
  assert.notEqual(lines[introIndex - 2], '', 'nao deve ter duas linhas vazias acima do heading');
  assert.equal(lines[introIndex + 1], '', 'deve ter uma linha vazia abaixo do heading');
  assert.notEqual(lines[introIndex + 2], '', 'nao deve ter duas linhas vazias abaixo do heading');
  assert.ok(text.includes('Body text.'), 'deve incluir o corpo do texto');
  assert.ok(!text.includes('--[ HOME ]--'), 'nao deve carregar navegacao dentro do paper');
});

test('renderPaperTopNav: gera botão de home para o index do site', () => {
  const html = renderPaperTopNav('../');
  assert.ok(html.includes('href="../index.html"'), 'deve apontar para o index do site');
  assert.ok(html.includes('class="paper-home-btn"'), 'deve renderizar como botão, não link ascii');
});

test('renderPaperDocument: usa cover manual e remove labels de bloco', () => {
  const codeText = renderPaperDocument({
    meta: {
      title: 'Paper Example',
      author: 'alice',
      date: '2026-06-03',
      cover: {
        hideTitle: true,
        caption: 'S0S4',
        art: [
          '.----------------------.',
          '|      MANUAL COVER     |',
          '|   RELOCATION PAPER    |',
          '|    ASCII COVER MODE   |',
          "'----------------------'",
        ].join('\n'),
      },
    },
    body: '# Intro\n\nBody text.\n\n```c\nint x = 1;\n```\n\nAfter.\n',
  });

  assert.ok(codeText.includes('MANUAL COVER'), 'deve incluir a capa manual');
  assert.ok(codeText.includes('S0S4'), 'deve incluir a legenda da capa');
  assert.ok(codeText.includes('2026-06-03'), 'deve incluir a data na capa');
  assert.ok(!codeText.includes('PAPER EXAMPLE'), 'nao deve renderizar o titulo automatico');
  assert.ok(!codeText.includes('--- C ---'), 'nao deve mostrar rotulo de bloco C');
  assert.ok(!codeText.includes('--- TEXT ---'), 'nao deve mostrar rotulo de bloco TEXT');
  const codeLines = codeText.split('\n');
  const codeLineIndex = codeLines.findIndex(line => line.includes('int x = 1;'));
  assert.ok(codeLineIndex > 0, 'deve localizar o bloco de codigo');
  const codeTopIndex = codeLineIndex - 2;
  const codeBottomIndex = codeLineIndex + 2;
  assert.equal(codeLines[codeTopIndex - 1], '', 'deve ter uma linha vazia antes do bloco C');
  assert.notEqual(codeLines[codeTopIndex - 2], '', 'nao deve ter uma segunda linha vazia antes do bloco C');
  assert.ok(codeLines[codeTopIndex].startsWith('┌C'), 'deve desenhar borda e label no bloco C');
  assert.match(codeLines[codeLineIndex - 1], /^│\s+│$/, 'deve manter padding interno no bloco C');
  assert.match(codeLines[codeLineIndex + 1], /^│\s+│$/, 'deve manter padding interno no bloco C');
  assert.ok(codeLines[codeBottomIndex].startsWith('└'), 'deve fechar a caixa do bloco C');
  assert.equal(codeLines[codeBottomIndex + 1], '', 'deve ter uma linha vazia depois do bloco C');
  assert.notEqual(codeLines[codeBottomIndex + 2], '', 'nao deve ter uma segunda linha vazia depois do bloco C');

  const textDoc = renderPaperDocument({
    meta: {
      title: 'Paper Example',
      author: 'alice',
      date: '2026-06-03',
      cover: {
        hideTitle: true,
        caption: 'S0S4',
        art: [
          '.----------------------.',
          '|      MANUAL COVER     |',
          '|   RELOCATION PAPER    |',
          '|    ASCII COVER MODE   |',
          "'----------------------'",
        ].join('\n'),
      },
    },
    body: '# Intro\n\n```text\nhello\nworld\n```\n\nAfter.\n',
  });

  const textLines = textDoc.split('\n');
  const helloLineIndex = textLines.findIndex(line => line === 'hello');
  assert.ok(helloLineIndex > 0, 'deve localizar o bloco text cru');
  assert.equal(textLines[helloLineIndex - 1], '', 'txt deve ter uma linha vazia antes');
  assert.equal(textLines[helloLineIndex], 'hello', 'bloco text nao deve virar caixa');
  assert.equal(textLines[helloLineIndex + 1], 'world', 'txt deve permanecer cru');
  assert.equal(textLines[helloLineIndex + 2], '', 'txt deve ter uma linha vazia depois');
  assert.notEqual(textLines[helloLineIndex + 3], '', 'txt nao deve ter uma segunda linha vazia depois');
});

test('renderPaperDocument: NOTE fica colado a esquerda no topo do callout', () => {
  const text = renderPaperDocument({
    meta: { title: 'Paper Example' },
    body: '> NOTE: This paper stays in plain ASCII on purpose.\n',
  });
  assert.ok(text.includes('╔NOTE'), 'deve alinhar NOTE no começo do bloco');
  assert.ok(text.includes('║  This paper stays in plain ASCII on purpose.'), 'deve manter o texto interno com padding');
  assert.ok(text.includes('╚'), 'deve fechar o bloco');
});

test('wrapAsciiText: inline code nao conta backticks na largura', () => {
  const lines = wrapAsciiText('alpha `beta` gamma', 16);
  assert.deepEqual(lines, ['alpha `beta` gamma']);
});

test('renderPaperDocument: codespan com espacos nao quebra no meio', () => {
  const text = renderPaperDocument({
    meta: { title: 'Paper Example' },
    body: '> WARN: Nunca execute codigo desconhecido como root. Nao existe desfazer para `rm -rf /`.\n',
  });
  const visible = text.replace(/\x1f|\x1e/g, '');
  assert.ok(visible.includes('rm -rf /'), 'deve manter o codespan inteiro');
  assert.ok(visible.includes('rm -rf /.'), 'deve manter a pontuacao colada ao codespan');
});

test('renderPaperDocument: blockquote simples vira texto normal', () => {
  const text = renderPaperDocument({
    meta: { title: 'Paper Example' },
    body: '> plain quote stays plain\n',
  });
  assert.ok(text.includes('plain quote stays plain'), 'deve manter o texto do quote');
  assert.ok(!text.includes('QUOTE'), 'nao deve gerar caixa QUOTE');
  assert.ok(!text.includes('+----------------------------------- QUOTE'), 'nao deve desenhar borda de quote');
});

test('decoratePaperDocumentHtml: colore NOTE e WARN sem soltar HTML cru', () => {
  const escaped = escapeHtml('┌C────────────────┐\n┌ASM───────────────┐\n┌SQL───────────────┐\n┌JAVA──────────────┐\n┌RUBY──────────────┐\n┌JSON──────────────┐\n┌JS────────────────┐\n┌PYTHON────────────┐\n┌PHP───────────────┐\n┌PERL──────────────┐\n╔NOTE══════════════╗\n╔WARN══════════════╗\n#include <stdio.h>\nThis has `inline code` and `more`.');
  const html = decoratePaperDocumentHtml(escaped);
  assert.ok(html.includes('paper-callout-label--note'), 'deve marcar NOTE');
  assert.ok(html.includes('paper-callout-label--warn'), 'deve marcar WARN');
  assert.ok(html.includes('paper-code-label--c'), 'deve marcar C');
  assert.ok(html.includes('paper-code-label--asm'), 'deve marcar ASM');
  assert.ok(html.includes('paper-code-label--sql'), 'deve marcar SQL');
  assert.ok(html.includes('paper-code-label--java'), 'deve marcar JAVA');
  assert.ok(html.includes('paper-code-label--ruby'), 'deve marcar RUBY');
  assert.ok(html.includes('paper-code-label--json'), 'deve marcar JSON');
  assert.ok(html.includes('paper-code-label--js'), 'deve marcar JS');
  assert.ok(html.includes('paper-code-label--python'), 'deve marcar PYTHON');
  assert.ok(html.includes('paper-code-label--php'), 'deve marcar PHP');
  assert.ok(html.includes('paper-code-label--perl'), 'deve marcar PERL');
  assert.ok(html.includes('paper-inline-code'), 'deve marcar inline code');
  assert.ok(html.includes('paper-inline-code--red'), 'deve colorir inline code em vermelho');
  assert.ok(!html.includes('paper-inline-code--purple'), 'nao deve colorir inline code em roxo');
  assert.ok(html.includes('&lt;stdio.h&gt;'), 'deve manter o texto escapado');
});
