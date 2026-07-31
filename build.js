'use strict';

const fs   = require('fs');
const path = require('path');
const marked = require('marked');
const hljs   = require('highlight.js');
const yaml   = require('js-yaml');

marked.setOptions({
  highlight(code, lang) {
    const valid = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language: valid }).value;
  },
  langPrefix: 'hljs language-',
  mangle:     false,
  headerIds:  false,
  gfm:        true,
  tables:     true,
});

function toAscii(text) {
  return String(text || '')
    .normalize('NFC')
    .replace(/[^\x00-\x7F\u00c0-\u00ff]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toAsciiLine(text) {
  return String(text || '')
    .normalize('NFC')
    .replace(/[^\x00-\x7F\u00c0-\u00ff]/g, '')
    .replace(/\r/g, '');
}

const PAPER_INLINE_OPEN = '\x1f';
const PAPER_INLINE_CLOSE = '\x1e';
const PAPER_IMAGE_OPEN = '\x02';
const PAPER_IMAGE_CLOSE = '\x03';
const PAPER_DARKBLOCK_OPEN = '\x04';
const PAPER_DARKBLOCK_CLOSE = '\x05';
const PAPER_TOKEN_OPEN = '\x06';
const PAPER_TOKEN_SEP = '\x07';
const PAPER_TOKEN_CLOSE = '\x08';
const PAPER_CODEBLOCK_OPEN = '\x0b';
const PAPER_CODEBLOCK_CLOSE = '\x0c';
const PAPER_CALLOUT_OPEN = '\x0e';
const PAPER_CALLOUT_CLOSE = '\x0f';
const PAPER_TABLE_OPEN = '\x10';
const PAPER_TABLE_CLOSE = '\x11';
const PAPER_SUMMARY_OPEN = '\x12';
const PAPER_SUMMARY_CLOSE = '\x13';
const PAPER_LINK_OPEN = '\x14';
const PAPER_LINK_SEP = '\x15';
const PAPER_LINK_CLOSE = '\x16';
const PAPER_BREAK = '\x17';

const HLJS_LANG_ALIASES = {
  asm: 'x86asm',
  assembly: 'x86asm',
  nasm: 'x86asm',
  gas: 'x86asm',
  fasm: 'x86asm',
  x86: 'x86asm',
  arm: 'armasm',
  arm64: 'armasm',
  aarch64: 'armasm',
  mips: 'mipsasm',
};

function resolveHljsLanguage(lang) {
  const safe = String(lang || '').trim().toLowerCase();
  return HLJS_LANG_ALIASES[safe] || safe;
}

function highlightCodeToPaperLines(code, lang) {
  const resolvedLang = resolveHljsLanguage(lang);
  const validLang = hljs.getLanguage(resolvedLang) ? resolvedLang : 'plaintext';
  if (validLang === 'plaintext') return null;
  let html;
  try {
    html = hljs.highlight(code, { language: validLang }).value;
  } catch (e) {
    return null;
  }
  const stack = [];
  let out = '';
  let i = 0;
  while (i < html.length) {
    if (html.startsWith('<span class="', i)) {
      const end = html.indexOf('">', i);
      if (end === -1) { out += html[i]; i++; continue; }
      const cls = html.slice(i + 13, end);
      stack.push(cls);
      out += PAPER_TOKEN_OPEN + cls + PAPER_TOKEN_SEP;
      i = end + 2;
      continue;
    }
    if (html.startsWith('</span>', i)) {
      if (stack.length) stack.pop();
      out += PAPER_TOKEN_CLOSE;
      i += 7;
      continue;
    }
    if (html[i] === '\n') {
      for (let k = stack.length - 1; k >= 0; k--) out += PAPER_TOKEN_CLOSE;
      out += '\n';
      for (let k = 0; k < stack.length; k++) out += PAPER_TOKEN_OPEN + stack[k] + PAPER_TOKEN_SEP;
      i++;
      continue;
    }
    out += html[i];
    i++;
  }
  return decodeHtmlEntities(out).split('\n');
}

function wrapDarkBlock(lines) {
  if (!lines || !lines.length) return lines;
  const out = lines.slice();
  out[0] = PAPER_DARKBLOCK_OPEN + out[0];
  out[out.length - 1] = out[out.length - 1] + PAPER_DARKBLOCK_CLOSE;
  return out;
}

function resolvePaperImageSrc(src, root) {
  const safeSrc = String(src || '');
  if (/^([a-z][a-z0-9+.-]*:)?\/\//i.test(safeSrc) || safeSrc.startsWith('/')) return safeSrc;
  return `${root || ''}static/media/${safeSrc}`;
}

function resolvePaperLinkHref(href, root) {
  const safe = String(href || '');
  if (/^[a-z][a-z0-9+.-]*:/i.test(safe) || safe.startsWith('//') || safe.startsWith('/') || safe.startsWith('#')) {
    return safe;
  }
  return `${root || ''}${safe}`;
}

function paperVisibleLength(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/\r/g, '')
    .replace(/[\x1e\x1f]/g, '')
    .replace(/\x14[^\x15]*\x15([^\x16]*)\x16/g, '$1')
    .replace(/`/g, '')
    .length;
}

function padPaperVisibleEnd(text, width) {
  const safe = String(text || '');
  return safe + ' '.repeat(Math.max(0, width - paperVisibleLength(safe)));
}

function renderTonedText(text, opts = {}) {
  const baseClass = opts.baseClass || 'tone';
  const shouldTone = opts.shouldTone || (() => true);
  const keepSpaces = opts.keepSpaces !== false;
  const parts = [];

  for (const ch of String(text || '')) {
    if (!shouldTone(ch)) {
      parts.push(ch === ' ' && keepSpaces ? ' ' : escapeHtml(ch));
      continue;
    }
    parts.push(`<span class="${baseClass} ${baseClass}--red">${escapeHtml(ch)}</span>`);
  }

  return parts.join('');
}

function slugifyHeading(text) {
  return toAscii(text).toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractHeadings(body) {
  const headings = [];
  let inCode = false;
  for (const line of body.split('\n')) {
    if (line.startsWith('```') || line.startsWith('~~~')) { inCode = !inCode; continue; }
    if (inCode) continue;
    const m = line.match(/^(#{1,4})\s+(.+)$/);
    if (m) headings.push({ level: m[1].length, text: m[2].trim(), id: slugifyHeading(m[2].trim()) });
  }
  return headings;
}

function generateTOC(headings) {
  if (headings.length < 3) return '';
  const minLevel = Math.min(...headings.map(h => h.level));
  const items = headings.map(h => {
    const depth = h.level - minLevel;
    return `<li class="toc-nav__item toc-nav__item--${depth}"><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`;
  }).join('\n');
  return `<nav class="toc-nav"><div class="toc-nav__title"><span>Contents</span><span class="window-controls"><span class="wbtn">─</span><span class="wbtn">□</span><span class="wbtn">×</span></span></div><ul class="toc-nav__list">\n${items}\n</ul></nav>`;
}

function wrapAsciiText(text, width) {
  const source = toAscii(text);
  const words = [];
  let buffer = '';
  let bufferProtected = false;
  let protectedMode = false;
  let expectedClose = '';

  const flushBuffer = () => {
    if (buffer) {
      words.push({ text: buffer, protected: bufferProtected });
      buffer = '';
      bufferProtected = false;
    }
  };

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (!protectedMode && (ch === PAPER_INLINE_OPEN || ch === PAPER_LINK_OPEN)) {
      protectedMode = true;
      bufferProtected = true;
      expectedClose = ch === PAPER_INLINE_OPEN ? PAPER_INLINE_CLOSE : PAPER_LINK_CLOSE;
      buffer += ch;
      continue;
    }
    if (protectedMode && ch === expectedClose) {
      buffer += ch;
      protectedMode = false;
      expectedClose = '';
      continue;
    }
    if (protectedMode) {
      buffer += ch;
      continue;
    }
    if (ch === PAPER_BREAK) {
      flushBuffer();
      words.push({ text: '', protected: false, isBreak: true });
      continue;
    }
    if (/\s/.test(ch)) {
      flushBuffer();
      continue;
    }
    buffer += ch;
  }
  flushBuffer();
  if (!words.length) return [''];

  const lines = [];
  let current = '';

  function joinTokens(left, right) {
    if (!left) return right;
    if (/^[,.;:!?)]$/.test(right)) return left + right;
    if (/[([{]$/.test(left)) return left + right;
    if (/(?<!\s)[\-\/]$/.test(left)) return left + right;
    return `${left} ${right}`;
  }

  function pushWord(word) {
    const value = word.text;
    if (word.protected || paperVisibleLength(value) <= width) {
      lines.push(value);
      return;
    }
    let chunk = '';
    let visible = 0;
    for (const ch of value) {
      if (visible >= width) {
        lines.push(chunk);
        chunk = '';
        visible = 0;
      }
      chunk += ch;
      visible++;
    }
    if (chunk) lines.push(chunk);
  }

  for (const word of words) {
    if (word.isBreak) {
      lines.push(current);
      current = '';
      continue;
    }
    const value = word.text;
    if (!current) {
      if (word.protected || paperVisibleLength(value) <= width) {
        current = value;
      } else {
        pushWord(word);
      }
      continue;
    }

    const candidate = joinTokens(current, value);
    if (paperVisibleLength(candidate) <= width) {
      current = candidate;
    } else {
      lines.push(current);
      if (word.protected || paperVisibleLength(value) <= width) {
        current = value;
      } else {
        pushWord(word);
        current = '';
      }
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function buildAsciiFrameLines(lines, opts = {}) {
  const preserveWhitespace = opts.preserveWhitespace === true;
  const rawLines = Array.isArray(lines)
    ? lines.map(line => preserveWhitespace ? toAsciiLine(line) : toAscii(line))
    : [];
  const pad = opts.pad == null ? 1 : opts.pad;
  const minWidth = opts.minWidth || 0;
  const align = opts.align || 'center';
  const borderChar = opts.borderChar || '-';
  const topBlankCount = Number.isFinite(opts.topBlankCount)
    ? Math.max(0, Math.floor(opts.topBlankCount))
    : (opts.topBlank === false ? 0 : 1);
  const bottomBlankCount = Number.isFinite(opts.bottomBlankCount)
    ? Math.max(0, Math.floor(opts.bottomBlankCount))
    : (opts.bottomBlank === false ? 0 : 1);
  const innerWidth = Math.max(
    minWidth - 2 - (pad * 2),
    ...rawLines.map(line => paperVisibleLength(line)),
    0
  );
  const boxWidth = innerWidth + (pad * 2);
  const border = '+' + borderChar.repeat(boxWidth) + '+';
  const blank = '|' + ' '.repeat(boxWidth) + '|';
  const body = rawLines.length
    ? rawLines.map(line => {
        const gap = innerWidth - paperVisibleLength(line);
        const left = align === 'left' ? 0 : Math.floor(gap / 2);
        const right = gap - left;
        return '|' + ' '.repeat(pad + left) + line + ' '.repeat(pad + right) + '|';
      })
    : [`|${' '.repeat(boxWidth)}|`];
  const out = [border];
  for (let i = 0; i < topBlankCount; i++) out.push(blank);
  out.push(...body);
  for (let i = 0; i < bottomBlankCount; i++) out.push(blank);
  out.push(border);
  return out;
}

function buildAsciiArtLines(art, opts = {}) {
  const rawLines = String(art || '').replace(/\r/g, '').split('\n');
  while (rawLines.length && !rawLines[0].trim()) rawLines.shift();
  while (rawLines.length && !rawLines[rawLines.length - 1].trim()) rawLines.pop();
  if (!rawLines.length) return [];

  const nonEmpty = rawLines.filter(line => line.trim());
  const indent = nonEmpty.length
    ? Math.min(...nonEmpty.map(line => (line.match(/^ */) || [''])[0].length))
    : 0;
  const lines = rawLines.map(line => toAsciiLine(line.slice(indent).replace(/[ \t]+$/g, '')));
  const align = opts.align || 'center';
  const width = opts.width || 78;

  return lines.map(line => {
    if (align === 'left') return line;
    const gap = Math.max(0, width - paperVisibleLength(line));
    const left = Math.floor(gap / 2);
    return ' '.repeat(left) + line;
  });
}

function buildAsciiCenteredLines(text, width) {
  const wrapped = wrapAsciiText(text, width);
  return wrapped.map(line => {
    const gap = Math.max(0, width - paperVisibleLength(line));
    const left = Math.floor(gap / 2);
    return ' '.repeat(left) + line;
  });
}

function buildAsciiBoxLines(text, opts = {}) {
  const safe = toAscii(text);
  if (!safe) return [];
  const minWidth = opts.minWidth || 42;
  const maxWidth = opts.maxWidth || 60;
  const pad = opts.pad == null ? 1 : opts.pad;
  const align = opts.align || 'center';
  const borderChar = opts.borderChar || '-';
  const innerMax = Math.max(1, maxWidth - 2 - (pad * 2));
  const lines = wrapAsciiText(safe, innerMax);
  const width = Math.max(
    minWidth - 2 - (pad * 2),
    ...lines.map(line => paperVisibleLength(line))
  );
  const contentWidth = Math.min(innerMax, width);
  const boxWidth = contentWidth + (pad * 2);
  const border = '+' + borderChar.repeat(boxWidth) + '+';

  return [
    border,
    ...lines.map(line => {
      const gap = contentWidth - paperVisibleLength(line);
      const left = align === 'left' ? 0 : Math.floor(gap / 2);
      const right = gap - left;
      return '|' + ' '.repeat(pad + left) + line + ' '.repeat(pad + right) + '|';
    }),
    border,
  ];
}

function normalizeCodeLabel(lang) {
  const safe = toAscii(lang).trim().toLowerCase();
  if (!safe) return 'CODE';
  const map = {
    bash: 'BASH',
    sh: 'BASH',
    shell: 'BASH',
    asm: 'ASM',
    assembly: 'ASM',
    nasm: 'ASM',
    gas: 'ASM',
    fasm: 'ASM',
    x86: 'ASM',
    x86asm: 'ASM',
    arm: 'ASM',
    arm64: 'ASM',
    aarch64: 'ASM',
    armasm: 'ASM',
    mips: 'ASM',
    mipsasm: 'ASM',
    riscv: 'ASM',
    riscvasm: 'ASM',
    c: 'C',
    cc: 'C++',
    cpp: 'C++',
    cxx: 'C++',
    js: 'JS',
    javascript: 'JS',
    ts: 'TS',
    typescript: 'TS',
    py: 'PYTHON',
    python: 'PYTHON',
    rb: 'RUBY',
    ruby: 'RUBY',
  };
  return map[safe] || safe.toUpperCase();
}

function paperCodeLabelClass(label) {
  const safe = toAscii(label).trim().toUpperCase();
  const map = {
    'C': 'c',
    'C++': 'cpp',
    'ASM': 'asm',
    'BASH': 'bash',
    'SH': 'bash',
    'SHELL': 'bash',
    'PYTHON': 'python',
    'JS': 'js',
    'TS': 'ts',
    'HTML': 'html',
    'CSS': 'css',
    'JSON': 'json',
    'YAML': 'yaml',
    'XML': 'xml',
    'SQL': 'sql',
    'GO': 'go',
    'RUST': 'rust',
    'PHP': 'php',
    'RUBY': 'ruby',
    'JAVA': 'java',
    'PERL': 'perl',
    'CODE': 'code',
    'TEXT': 'text',
    'TXT': 'text',
  };
  return map[safe] || safe.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function buildAsciiHeadingRule(number, text, width, opts = {}) {
  const safe = toAscii(text);
  const label = number ? `--[ ${number} ]--` : '--[ ]--';
  const title = opts.brackets === false ? safe : `[ ${safe} ]`;
  const prefix = `${label} `;
  const body = `${prefix}${title}`;
  const visible = paperVisibleLength(body);
  if (visible >= width) return [body];
  return [body + ' ' + '-'.repeat(Math.max(0, width - visible - 1))];
}

function flattenInlineTokens(tokens) {
  const parts = [];
  for (const token of tokens || []) {
    if (!token) continue;
    switch (token.type) {
      case 'text':
        parts.push(decodeHtmlEntities(token.text || token.raw || ''));
        break;
      case 'escape':
        parts.push(decodeHtmlEntities(token.text || token.raw || ''));
        break;
      case 'codespan':
        parts.push(PAPER_INLINE_OPEN + decodeHtmlEntities(token.text || '').replace(/\s+/g, ' ').trim() + PAPER_INLINE_CLOSE);
        break;
      case 'strong':
      case 'em':
      case 'del':
        parts.push(flattenInlineTokens(token.tokens || []));
        break;
      case 'link': {
        const label = flattenInlineTokens(token.tokens || []);
        const href = token.href || '';
        if (!href) {
          parts.push(label);
        } else {
          parts.push(PAPER_LINK_OPEN + href + PAPER_LINK_SEP + (label || href) + PAPER_LINK_CLOSE);
        }
        break;
      }
      case 'image': {
        const alt = toAscii(decodeHtmlEntities(token.text || ''));
        if (alt) parts.push(`[image: ${alt}]`);
        break;
      }
      case 'br':
        parts.push(PAPER_BREAK);
        break;
      default:
        if (Array.isArray(token.tokens)) {
          parts.push(flattenInlineTokens(token.tokens));
        } else {
          parts.push(decodeHtmlEntities(token.text || token.raw || ''));
        }
    }
  }
  return toAscii(parts.join(''));
}

function formatPaperHeadingNumber(offset) {
  return `0x${offset.toString(16).padStart(2, '0')}`;
}

function collectHeadingOutline(tokens, state = { offset: 1 }, outline = []) {
  for (const token of tokens || []) {
    if (!token) continue;
    if (token.type === 'heading') {
      const depth = Math.max(1, Math.min(6, token.depth || 1));
      const number = formatPaperHeadingNumber(state.offset);
      state.offset += 1;
      token._paperNumber = number;
      outline.push({ depth, number, text: flattenInlineTokens(token.tokens || [{ text: token.text || '' }]) });
    }
    for (const child of nestedTokens(token)) {
      collectHeadingOutline(child, state, outline);
    }
  }
  return outline;
}

function nestedTokens(token) {
  if (!token || typeof token !== 'object') return [];
  const nested = [];
  if (Array.isArray(token.tokens)) nested.push(token.tokens);
  if (Array.isArray(token.items)) {
    for (const item of token.items) {
      if (item && Array.isArray(item.tokens)) nested.push(item.tokens);
    }
  }
  return nested;
}

function renderListItemBlocks(item, depth, width) {
  const indent = '  '.repeat(Math.max(0, depth));
  const bullet = item.type === 'ordered' ? `${item.index}. ` : '- ';
  const prefix = indent + bullet;
  const leadTokens = [];
  const trailingBlocks = [];
  for (const token of item.tokens || []) {
    if (token && ['list', 'blockquote', 'code', 'table', 'html'].includes(token.type)) {
      trailingBlocks.push(token);
      continue;
    }
    leadTokens.push(token);
  }

  const text = flattenInlineTokens(leadTokens.length ? leadTokens : [{ text: item.text || '' }]);
  const available = Math.max(18, width - prefix.length);
  const wrapped = wrapAsciiText(text, available);
  const body = [prefix + wrapped[0]];
  for (const extra of wrapped.slice(1)) {
    body.push(' '.repeat(prefix.length) + extra);
  }

  for (const token of trailingBlocks) {
    if (!token) continue;
    if (token.type === 'list') {
      body.push(...renderListBlock(token, width, depth + 1));
    } else if (token.type === 'blockquote') {
      body.push(...renderBlockquoteBlock(token, width, depth + 1));
    } else if (token.type === 'code') {
      body.push(...renderCodeBlock(token, width, depth + 1));
    }
  }

  return body;
}

function renderListBlock(token, width, depth = 0) {
  const lines = [];
  const ordered = !!token.ordered;
  const start = Number.parseInt(token.start, 10) || 1;
  token.items.forEach((item, index) => {
    item.type = ordered ? 'ordered' : 'unordered';
    item.index = ordered ? start + index : null;
    lines.push(...renderListItemBlocks(item, depth, width));
  });
  return lines;
}

function renderParagraphBlock(token, width, indent = '') {
  const text = flattenInlineTokens(token.tokens || [{ text: token.text || token.raw || '' }]);
  const available = Math.max(18, width - indent.length);
  const wrapped = wrapAsciiText(text, available);
  return wrapped.map((line, i) => (i === 0 ? indent + line : indent + line));
}

function renderImageBlock(imgToken) {
  const payload = Buffer.from(JSON.stringify({
    src: imgToken.href || '',
    alt: decodeHtmlEntities(imgToken.text || ''),
  }), 'utf8').toString('base64');
  return [PAPER_IMAGE_OPEN + payload + PAPER_IMAGE_CLOSE];
}

function renderCodeBlock(token, width, indent = '') {
  const lang = String(token.lang || '').trim().toLowerCase();
  if (['ascii', 'art'].includes(lang)) {
    const artLines = String(token.text || '').replace(/\r/g, '').split('\n');
    return artLines.map(line => indent + line);
  }
  const rawLines = String(token.text || '').replace(/\r/g, '').split('\n').map(toAsciiLine);
  if (['txt', 'text', 'plain', 'plaintext'].includes(lang)) {
    return wrapDarkBlock(rawLines.map(line => indent + line));
  }

  const label = normalizeCodeLabel(lang);
  const labelClass = paperCodeLabelClass(label);
  const highlighted = highlightCodeToPaperLines(rawLines.join('\n'), lang);
  const code = (highlighted && highlighted.length === rawLines.length)
    ? highlighted.join('\n')
    : rawLines.join('\n');
  const payload = Buffer.from(JSON.stringify({ label, labelClass, code }), 'utf8').toString('base64');
  return [indent + PAPER_CODEBLOCK_OPEN + payload + PAPER_CODEBLOCK_CLOSE];
}

function renderTableBlock(token) {
  const header = token.header && token.header.length
    ? token.header.map(cell => flattenInlineTokens(cell.tokens || [{ text: cell.text || '' }]))
    : null;
  const rows = (token.rows || []).map(row =>
    row.map(cell => flattenInlineTokens(cell.tokens || [{ text: cell.text || '' }]))
  );
  const payload = Buffer.from(JSON.stringify({ header, rows }), 'utf8').toString('base64');
  return [PAPER_TABLE_OPEN + payload + PAPER_TABLE_CLOSE];
}

function renderBlockquoteBlock(token, width, depth = 0) {
  const children = token.tokens || [];
  const indent = '  '.repeat(Math.max(0, depth));
  const firstParagraph = children.find(c => c && c.type === 'paragraph');
  const firstText = firstParagraph
    ? flattenInlineTokens(firstParagraph.tokens || [{ text: firstParagraph.text || '' }])
    : '';
  const labelMatch = firstText.match(/^(NOTE|WARN|INFO):[\s\x17]*/i);

  if (labelMatch) {
    const kind = labelMatch[1].toUpperCase();
    const parts = [];
    for (const child of children) {
      if (!child) continue;
      if (child.type === 'paragraph') {
        parts.push(flattenInlineTokens(child.tokens || [{ text: child.text || '' }]));
      } else if (child.type === 'list') {
        parts.push(renderListBlock(child, width - 4, 0).join('\n'));
      } else if (child.type === 'code') {
        const rawLines = String(child.text || '').replace(/\r/g, '').split('\n').map(toAsciiLine);
        parts.push(rawLines.join(PAPER_BREAK));
      }
    }
    const body = parts.join('\n\n').trim().replace(/^(NOTE|WARN|INFO):[\s\x17]*/i, '');
    const payload = Buffer.from(JSON.stringify({ kind, body }), 'utf8').toString('base64');
    return [indent + PAPER_CALLOUT_OPEN + payload + PAPER_CALLOUT_CLOSE];
  }

  const inner = [];
  for (const child of children) {
    if (!child) continue;
    if (child.type === 'paragraph') inner.push(...renderParagraphBlock(child, width - 4, ''));
    else if (child.type === 'list') inner.push(...renderListBlock(child, width - 4, 0));
    else if (child.type === 'code') inner.push(...renderCodeBlock(child, width - 4, ''));
  }
  return inner.map(line => (line ? indent + line : line));
}

function renderPaperToken(token, ctx = {}) {
  const width = ctx.width || 78;
  switch (token.type) {
    case 'space':
      return [];
    case 'heading': {
      const number = token._paperNumber || '';
      const lines = buildAsciiHeadingRule(number, flattenInlineTokens(token.tokens || [{ text: token.text || '' }]), width, { brackets: true });
      return lines;
    }
    case 'paragraph': {
      const inline = token.tokens || [];
      if (inline.length === 1 && inline[0].type === 'image') {
        return renderImageBlock(inline[0]);
      }
      return renderParagraphBlock(token, width);
    }
    case 'list':
      return renderListBlock(token, width);
    case 'blockquote':
      return renderBlockquoteBlock(token, width);
    case 'code':
      return renderCodeBlock(token, width);
    case 'table':
      return renderTableBlock(token);
    case 'hr':
      return ['-'.repeat(width)];
    case 'html':
      return renderParagraphBlock({ tokens: [{ type: 'text', text: stripHtmlToAscii(token.raw || '') }] }, width);
    default:
      return [];
  }
}

function renderPaperBody(body, opts = {}) {
  const width = opts.width || 78;
  const tokens = marked.lexer(body || '', {
    gfm: true,
    tables: true,
    breaks: true,
  });
  const outline = collectHeadingOutline(tokens);
  const blocks = [];

  const pushBlock = (lines) => {
    if (!lines || !lines.length) return;
    blocks.push(...lines);
  };

  const pushPaddedBlock = (lines, before = 0, after = 0) => {
    if (!lines || !lines.length) return;
    for (let i = 0; i < before; i++) blocks.push('');
    blocks.push(...lines);
    for (let i = 0; i < after; i++) blocks.push('');
  };

  const pushTitledBlock = (lines, depth = 1) => {
    if (!lines || !lines.length) return;
    if (blocks.length && blocks[blocks.length - 1] !== '') blocks.push('');
    blocks.push(...lines);
    blocks.push('');
  };

  pushBlock(renderPaperCover(opts.meta || {}, width));
  if (outline.length) {
    if (blocks.length) blocks.push('');
    pushBlock(renderPaperSummary(outline, width));
  }
  const MAX_GAP = 6;
  for (const token of tokens) {
    if (token.type === 'space') {
      const blankLines = Math.max(0, (String(token.raw || '').match(/\n/g) || []).length - 1);
      const total = Math.min(MAX_GAP, blankLines);
      for (let i = 0; i < total; i++) blocks.push('');
      continue;
    }
    const lines = renderPaperToken(token, { width });
    if (!lines.length) continue;
    if (token.type === 'heading') pushTitledBlock(lines, token.depth || 1);
    else if (token.type === 'code') pushPaddedBlock(lines, 1, 1);
    else pushBlock(lines);
  }

  const opaqueBlockMarkers = [
    PAPER_CODEBLOCK_OPEN, PAPER_CALLOUT_OPEN, PAPER_TABLE_OPEN,
    PAPER_SUMMARY_OPEN, PAPER_IMAGE_OPEN,
  ];
  let insideDarkBlock = false;
  const withLineBg = blocks.map(line => {
    if (line === '') return line;
    const wasInsideDark = insideDarkBlock;
    const hasDarkOpen = line.includes(PAPER_DARKBLOCK_OPEN);
    const hasDarkClose = line.includes(PAPER_DARKBLOCK_CLOSE);
    if (hasDarkOpen) insideDarkBlock = true;
    if (hasDarkClose) insideDarkBlock = false;
    const isOpaque = wasInsideDark || hasDarkOpen || hasDarkClose
      || opaqueBlockMarkers.some(marker => line.includes(marker));
    if (isOpaque) return line;
    return PAPER_TOKEN_OPEN + 'paper-line-bg' + PAPER_TOKEN_SEP + line + PAPER_TOKEN_CLOSE;
  });

  return withLineBg.join('\n').replace(/\n{6,}/g, '\n\n\n\n\n').trimEnd();
}

function renderPaperTopNav(root = '', width = 130) {
  const prefix = '--[ ';
  const label = 'HOME';
  const suffix = ' ]';
  const safeRoot = String(root || '');
  const href = `${safeRoot}index.html`;
  const fillWidth = width - prefix.length - label.length - suffix.length;
  const fill = fillWidth > 0 ? '-'.repeat(fillWidth) : '';
  return `<div class="paper-top-nav">${escapeHtml(prefix)}<a class="paper-top-nav__link" href="${escapeHtml(href)}">${escapeHtml(label)}</a>${escapeHtml(suffix)}${escapeHtml(fill)}</div>`;
}

function renderPaperCover(meta, width) {
  const cover = readPaperCover(meta);
  const title = toAscii(meta.title || '').toUpperCase();
  const subtitle = toAscii(meta.description || meta.subtitle || '');
  const authorBits = [];
  if (meta.author) authorBits.push(`by ${toAscii(meta.author)}`);
  if (meta.date) authorBits.push(String(meta.date));
  const metaLine = authorBits.join(' / ');
  const tags = Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : []);
  const tagLine = tags.length ? `tags: ${tags.map(t => `[${toAscii(t)}]`).join(' ')}` : '';
  const textWidth = Math.max(20, width - 4);
  const lines = [];
  if (title) lines.push(...wrapAsciiText(title, textWidth));
  if (subtitle) {
    if (title) lines.push('', '');
    lines.push(...wrapAsciiText(subtitle, textWidth));
  }
  if (metaLine) lines.push(...wrapAsciiText(metaLine, textWidth));
  if (tagLine) lines.push(...wrapAsciiText(tagLine, textWidth));
  const out = [];
  if (cover && cover.art && !cover.image) {
    out.push(...buildAsciiArtLines(cover.art, { width, align: cover.align || 'center' }));
    const bannerLines = [];
    if (cover.caption) bannerLines.push(...buildAsciiCenteredLines(cover.caption, width));
    if (meta.date) bannerLines.push(...buildAsciiCenteredLines(String(meta.date), width));
    if (bannerLines.length) {
      out.push('');
      out.push('');
      out.push(...bannerLines);
    }
    out.push('');
  }
  if (!cover || !cover.hideTitle) {
    if (lines.length) {
      out.push(...buildAsciiFrameLines(lines, {
        minWidth: Math.max(width, 56),
        pad: 1,
        align: 'left',
        borderChar: '=',
        topBlankCount: 2,
        bottomBlankCount: 2,
      }));
    }
  }
  return out;
}

function artFromValue(v) {
  if (Array.isArray(v)) return v.map(String).join('\n');
  if (typeof v === 'string') return v;
  return '';
}

function readPaperCover(meta) {
  const raw = meta && meta.cover;
  if (!raw) return null;
  if (typeof raw === 'string' || Array.isArray(raw)) {
    return { art: artFromValue(raw), image: '', caption: '', hideTitle: false, align: 'center' };
  }
  if (!raw || typeof raw !== 'object') return null;
  const hideTitle = raw.hideTitle === true || raw.hideTitle === 'true' || raw.hideTitle === '1';
  const align = typeof raw.align === 'string' && raw.align.trim() ? raw.align.trim().toLowerCase() : 'center';
  const image = typeof raw.image === 'string' ? raw.image.trim() : '';
  const art = artFromValue(raw.art) || artFromValue(raw.logo);
  const caption = typeof raw.caption === 'string' ? raw.caption : '';
  return { art, image, caption, hideTitle, align };
}

function renderPaperSummary(entries, width) {
  const lines = [];
  entries.forEach(entry => {
    const label = entry.number;
    const text = toAscii(entry.text);
    lines.push(...wrapAsciiText(`${label} - ${text}`, width - 4));
  });
  const body = lines.join('\n');
  const payload = Buffer.from(JSON.stringify({ body }), 'utf8').toString('base64');
  return [PAPER_SUMMARY_OPEN + payload + PAPER_SUMMARY_CLOSE];
}

function renderPaperDocument(post, body = post.body || '') {
  return renderPaperBody(body, { meta: post.meta || {}, width: 130 });
}

function decodeHtmlEntities(text) {
  return String(text || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCharCode(code) : '';
    });
}

function stripHtmlToAscii(html) {
  let text = String(html || '');
  text = text.replace(/<code>([\s\S]*?)<\/code>/gi, (_, code) => `\`${code.replace(/<[^>]+>/g, '')}\``);
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>\s*<p>/gi, '\n\n');
  text = text.replace(/<\/?p>/gi, '');
  text = text.replace(/<\/?(strong|em|a|span|blockquote|aside)[^>]*>/gi, '');
  text = text.replace(/<[^>]+>/g, '');
  text = decodeHtmlEntities(text);
  return toAscii(text).replace(/[ \t]+\n/g, '\n').trim();
}

function centerWithChar(text, width, fillChar = '-') {
  const safe = String(text || '');
  const visible = paperVisibleLength(safe);
  if (width <= visible) return safe.slice(0, width);
  const extra = width - visible;
  const left = Math.floor(extra / 2);
  const right = extra - left;
  return fillChar.repeat(left) + safe + fillChar.repeat(right);
}

function renderAsciiBox(text, opts = {}) {
  const source = toAscii(text).toUpperCase();
  if (!source) return '';

  const minWidth = opts.minWidth || 42;
  const maxWidth = opts.maxWidth || 60;
  const pad = opts.pad == null ? 2 : opts.pad;
  const align = opts.align || 'center';
  const borderChar = opts.borderChar || '-';
  const className = opts.className || 'paper-title-art';
  const innerMax = Math.max(1, maxWidth - 2 - (pad * 2));
  const lines = wrapAsciiText(source, innerMax);
  const innerWidth = Math.max(
    minWidth - 2 - (pad * 2),
    ...lines.map(line => paperVisibleLength(line))
  );
  const contentWidth = Math.min(innerMax, innerWidth);
  const boxWidth = contentWidth + (pad * 2);
  const border = '+' + borderChar.repeat(boxWidth) + '+';

  const body = lines.map(line => {
    const gap = contentWidth - paperVisibleLength(line);
    const left = align === 'left' ? 0 : Math.floor(gap / 2);
    const right = gap - left;
    return '|' + ' '.repeat(pad + left) + line + ' '.repeat(pad + right) + '|';
  });

  return `<pre class="${escapeHtml(className)}" aria-hidden="true">${escapeHtml([border, ...body, border].join('\n'))}</pre>`;
}

function renderAsciiArtFrame(art, opts = {}) {
  const rawLines = String(art || '').replace(/\r/g, '').split('\n');
  while (rawLines.length && !rawLines[0].trim()) rawLines.shift();
  while (rawLines.length && !rawLines[rawLines.length - 1].trim()) rawLines.pop();
  if (!rawLines.length) return '';

  const nonEmpty = rawLines.filter(line => line.trim());
  const indent = nonEmpty.length
    ? Math.min(...nonEmpty.map(line => (line.match(/^ */) || [''])[0].length))
    : 0;
  const lines = rawLines.map(line => line.slice(indent).replace(/[ \t]+$/g, ''));
  const pad = opts.pad == null ? 2 : opts.pad;
  const minWidth = opts.minWidth || 0;
  const align = opts.align || 'center';
  const innerWidth = Math.max(
    minWidth - 2 - (pad * 2),
    ...lines.map(line => paperVisibleLength(line))
  );
  const boxWidth = innerWidth + (pad * 2);
  const border = '+' + '-'.repeat(boxWidth) + '+';
  const blank = '|' + ' '.repeat(boxWidth) + '|';
  const body = lines.map(line => {
    const gap = innerWidth - paperVisibleLength(line);
    const left = align === 'left' ? 0 : Math.floor(gap / 2);
    const right = gap - left;
    return '|' + ' '.repeat(pad + left) + line + ' '.repeat(pad + right) + '|';
  });
  const output = [border];
  if (opts.topBlank !== false) output.push(blank);
  output.push(...body);
  if (opts.bottomBlank !== false) output.push(blank);
  output.push(border);
  return `<pre class="${escapeHtml(opts.className || 'ascii-title')}" aria-hidden="true">${escapeHtml(output.join('\n'))}</pre>`;
}

function extractTableRows(fragment) {
  const rows = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(String(fragment || '')))) {
    const rowHtml = rowMatch[1];
    const cells = [];
    const cellRegex = /<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/gi;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowHtml))) {
      cells.push(stripHtmlToAscii(cellMatch[1]).replace(/\|/g, '/'));
    }
    if (cells.length) rows.push(cells);
  }
  return rows;
}

function renderAsciiTable(headerHtml, bodyHtml) {
  const rows = [...extractTableRows(headerHtml), ...extractTableRows(bodyHtml)];
  if (!rows.length) return '';

  const colCount = Math.max(...rows.map(row => row.length));
  const normalized = rows.map(row => Array.from({ length: colCount }, (_, i) => row[i] || ''));
  const widths = Array.from({ length: colCount }, (_, i) =>
    Math.max(3, ...normalized.map(row => paperVisibleLength(row[i])))
  );
  const border = '+' + widths.map(w => '-'.repeat(w + 2)).join('+') + '+';
  const renderRow = row => '| ' + row.map((cell, i) => padPaperVisibleEnd(cell, widths[i])).join(' | ') + ' |';

  const asciiLines = [border, renderRow(normalized[0]), border];
  for (const row of normalized.slice(1)) asciiLines.push(renderRow(row));
  asciiLines.push(border);

  const headRow = normalized[0];
  const bodyRows = normalized.slice(1);
  const semanticHead = `<thead><tr>${headRow.map(cell => `<th>${escapeHtml(cell)}</th>`).join('')}</tr></thead>`;
  const semanticBody = bodyRows.length
    ? `<tbody>${bodyRows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody>`
    : '<tbody></tbody>';

  return `<div class="ascii-table-wrap"><table class="sr-only">${semanticHead}${semanticBody}</table><pre class="ascii-table" aria-hidden="true">${escapeHtml(asciiLines.join('\n'))}</pre></div>`;
}

function renderAsciiCallout(kind, quoteHtml, opts = {}) {
  const label = toAscii(kind).toUpperCase() || 'NOTE';
  const rawText = stripHtmlToAscii(quoteHtml);
  const minWidth = opts.minWidth || (label === 'QUOTE' ? 64 : 72);
  const wrapWidth = opts.wrapWidth || 72;
  const borderChar = opts.borderChar || '-';
  const paras = rawText.split(/\n\s*\n/).filter(Boolean);
  const bodyLines = [];
  for (const para of paras.length ? paras : ['']) {
    if (!para.trim()) {
      bodyLines.push('');
      continue;
    }
    const wrapped = wrapAsciiText(para, wrapWidth);
    bodyLines.push(...wrapped);
  }

  const contentWidth = Math.max(
    minWidth,
    label.length + 2,
    ...bodyLines.map(line => paperVisibleLength(line) + 2)
  );
  const top = '+' + centerWithChar(` ${label} `, contentWidth, borderChar) + '+';
  const bottom = '+' + borderChar.repeat(contentWidth) + '+';
  const body = bodyLines.length
    ? bodyLines.map(line => `| ${padPaperVisibleEnd(line, contentWidth - 2)} |`)
    : [`| ${' '.repeat(contentWidth - 2)} |`];
  const ascii = [top, ...body, bottom].join('\n');
  const aria = `${label}: ${rawText}`.replace(/\s+/g, ' ').trim();
  const tag = label === 'QUOTE' ? 'blockquote' : 'aside';
  const role = label === 'QUOTE' ? 'group' : 'note';
  return `<${tag} data-type="${escapeHtml(label.toLowerCase())}" role="${escapeHtml(role)}" aria-label="${escapeHtml(aria)}"><span class="sr-only">${escapeHtml(aria)}</span><pre class="ascii-callout ascii-callout--${escapeHtml(label.toLowerCase())}" aria-hidden="true">${escapeHtml(ascii)}</pre></${tag}>`;
}

function renderAsciiHeading(level, text, id) {
  const safe = toAscii(text);
  const className = `ascii-heading-art ascii-heading-art--h${level}`;
  if (level === 1) {
    const box = renderAsciiBox(safe, {
      minWidth: 56,
      maxWidth: 68,
      pad: 1,
      align: 'left',
      borderChar: '=',
      className,
    });
    return `<div class="ascii-heading ascii-heading--h${level}" id="${escapeHtml(id)}"><h${level} class="sr-only">${escapeHtml(safe)}</h${level}>${box}</div>\n`;
  }

  if (level === 2) {
    const index = String(++_articleHeadingIndex).padStart(2, '0');
    const label = `--[ 0x${index} ]-- `;
    const wrapWidth = Math.max(18, 66 - label.length);
    const wrapped = wrapAsciiText(safe, wrapWidth);
    const body = wrapped.map((line, i) => i === 0 ? `${label}${line}` : `${' '.repeat(label.length)}${line}`).join('\n');
    return `<div class="ascii-heading ascii-heading--h${level}" id="${escapeHtml(id)}"><h${level} class="sr-only">${escapeHtml(safe)}</h${level}><pre class="${escapeHtml(className)}" aria-hidden="true">${escapeHtml(body)}</pre></div>\n`;
  }

  const rule = level === 3
    ? '-'.repeat(Math.max(24, Math.min(72, safe.length)))
    : '';
  const visible = level === 3
    ? [safe, rule].filter(Boolean).join('\n')
    : safe;
  return `<div class="ascii-heading ascii-heading--h${level}" id="${escapeHtml(id)}"><h${level} class="sr-only">${escapeHtml(safe)}</h${level}><pre class="${escapeHtml(className)}" aria-hidden="true">${escapeHtml(visible)}</pre></div>\n`;
}

function renderAsciiSubtitle(text) {
  const safe = toAscii(text);
  if (!safe) return '';
  const lines = wrapAsciiText(safe, 58);
  const body = lines.map((line, i) => i === 0 ? `--[ ${line} ]--` : `   ${line}`).join('\n');
  return `<pre class="paper-subtitle-art" aria-hidden="true">${escapeHtml(body)}</pre>`;
}

function renderPageHeader(title, subtitle = '', metaHtml = '') {
  const safeTitle = String(title || '').trim();
  if (!safeTitle && !subtitle && !metaHtml) return '';

  const titleHtml = safeTitle
    ? `${renderAsciiBox(safeTitle, { align: 'left', minWidth: 56, maxWidth: 68, pad: 1, borderChar: '=', className: 'paper-title-art' })}<h1>${escapeHtml(toAscii(safeTitle).toUpperCase())}</h1>`
    : '';
  const subtitleBlock = subtitle ? renderAsciiSubtitle(subtitle) : '';
  const metaBlock = metaHtml ? `<div class="paper-meta">${metaHtml}</div>` : '';
  return `<header class="paper-header">${titleHtml}${subtitleBlock}${metaBlock}</header>`;
}

function renderMetaBar(date, tags) {
  const arr = Array.isArray(tags) ? tags : (tags ? [tags] : []);
  if (!date && !arr.length) return '';
  const dateChip = date ? `<span class="meta-chip meta-chip--date">${escapeHtml(String(date))}</span>` : '';
  const tagChips = arr.map(t => `<span class="meta-chip meta-chip--tag">${escapeHtml(t)}</span>`).join('');
  return `<div class="post-meta-bar">${dateChip}${tagChips}</div>`;
}

function renderPostFrontmatter(post) {
  const m     = post.meta;
  const title = m.title || post.slug;
  const subtitle = m.description || m.subtitle || '';

  const tags = Array.isArray(m.tags) ? m.tags : (m.tags ? [m.tags] : []);
  const metaBits = [];
  if (m.author) metaBits.push(escapeHtml(m.author));
  if (m.date)   metaBits.push(escapeHtml(String(m.date)));
  const byLine = metaBits.length
    ? (m.author ? `by ${metaBits.join(' / ')}` : metaBits.join(' / '))
    : '';
  const tagLine = tags.length
    ? `tags: ${tags.map(t => `[${escapeHtml(t)}]`).join(' ')}`
    : '';

  const descLine = subtitle ? `<span class="paper-meta-line">${escapeHtml(subtitle)}</span>` : '';
  const metaLine = (byLine || tagLine)
    ? `<div class="paper-meta-row">${byLine ? `<span class="paper-meta-by">${byLine}</span>` : ''}${tagLine ? `<span class="paper-meta-tags">${tagLine}</span>` : ''}</div>`
    : '';
  const metaBlock = (descLine || metaLine)
    ? `<div class="paper-meta">${descLine}${metaLine}</div>`
    : '';

  const h1 = `<h1 class="paper-title-sr">${escapeHtml(toAscii(title).toUpperCase())}</h1>`;
  const titleBlock = renderAsciiSubtitle(title);

  return `<header class="paper-header">${h1}${titleBlock}${metaBlock}</header>`;
}

function renderAsciiToc(headings) {
  const sections = (headings || []).filter(h => h && h.level === 2);
  if (!sections.length) return '';

  const headingBox = renderAsciiBox('TOPICOS', {
    minWidth: 28,
    maxWidth: 40,
    pad: 1,
    align: 'left',
    borderChar: '-',
    className: 'paper-toc-art',
  });
  const items = sections.map((h, i) => {
    const index = `0x${String(i + 1).padStart(2, '0')}`;
    const label = `--[ ${index} ]-- ${toAscii(h.text)}`;
    return `<li class="paper-toc-item"><a href="#${escapeHtml(h.id)}">${escapeHtml(label)}</a></li>`;
  }).join('\n');
  return `<nav class="paper-toc" aria-label="Topicos">${headingBox}<ol class="paper-toc-list">${items}</ol></nav>`;
}

function renderPostFooter(post) {
  const links = post.meta && post.meta.links && typeof post.meta.links === 'object'
    ? Object.entries(post.meta.links)
        .filter(([, v]) => v)
        .map(([k, v]) => `<a href="${escapeHtml(String(v))}">[${escapeHtml(k)}]</a>`)
    : [];
  if (!links.length) return '';
  return `<footer class="paper-links-footer">
  <div class="paper-links-footer__head">+---------------- LINKS ----------------+</div>
  <div class="paper-links-footer__body">links: ${links.join(' ')}</div>
</footer>`;
}

marked.use({
  renderer: {
    code(code, lang) {
      const validLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
      const highlighted = hljs.highlight(code, { language: validLang }).value;
      const langLabel   = (lang || 'code').toUpperCase();
      return `<div class="pre-wrap">\n<div class="pre-header">--- ${escapeHtml(langLabel)} ---</div>\n<pre><code class="hljs language-${escapeHtml(validLang)}">${highlighted}</code></pre></div>\n`;
    },
    heading(text, level) {
      const id = slugifyHeading(text);
      return renderAsciiHeading(level, text, id);
    },
    table(header, body) {
      return `${renderAsciiTable(header, body)}\n`;
    },
    blockquote(quote) {
      const trimmed = quote.trim();
      if (trimmed.startsWith('<p>NOTE:')) {
        const inner = trimmed.replace(/^<p>NOTE:\s*/, '<p>');
        return `${renderAsciiCallout('note', inner, { minWidth: 62, wrapWidth: 60 })}\n`;
      }
      if (trimmed.startsWith('<p>WARN:')) {
        const inner = trimmed.replace(/^<p>WARN:\s*/, '<p>');
        return `${renderAsciiCallout('warn', inner, { minWidth: 62, wrapWidth: 60 })}\n`;
      }
      return `${renderAsciiCallout('quote', quote, { minWidth: 58, wrapWidth: 58, borderChar: '-' })}\n`;
    },
    image(href, title, text) {
      return '';
    },
  },
});

let _articleHeadingIndex = 0;

function renderMarkdownHtml(body) {
  _articleHeadingIndex = 0;
  return marked.parse(body);
}

// ─── config ───────────────────────────────────────────────────────────────────

const CONFIG = {
  siteTitle:    'tsoi32',
  siteSubtitle: 'reflexões e aprendizados',
  siteUrl:      'https://thebixowithsevenheads.wtf',
  ogDescription: 'vá para as montanhas, somente lá! existe a verdadeira paz que você tanto procura, amigo.',
  ogImagePath:  'static/media/bit.png',
};

const SITE_ASCII_TITLE = `Цой32`;

function asciiTitle() {
  return renderAsciiArtFrame(SITE_ASCII_TITLE, {
    className: 'ascii-title',
    minWidth: 88,
    pad: 2,
    align: 'left',
  });
}

// ─── utilities ───────────────────────────────────────────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  try {
    const raw = yaml.load(match[1]) || {};
    const meta = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v instanceof Date)      meta[k] = v.toISOString().slice(0, 10);
      else if (Array.isArray(v))  meta[k] = v.map(String);
      else if (v !== null && typeof v === 'object') meta[k] = v;
      else                        meta[k] = v == null ? '' : String(v);
    }
    return { meta, body: match[2] };
  } catch (e) {
    return { meta: {}, body: content };
  }
}

function generateSlug(filepath) {
  return path.basename(filepath, path.extname(filepath));
}

function renderTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : ''
  );
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function convertPaperTokenMarkers(text) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === PAPER_TOKEN_OPEN) {
      const sepIdx = text.indexOf(PAPER_TOKEN_SEP, i);
      if (sepIdx === -1) { out += ch; i++; continue; }
      const cls = text.slice(i + 1, sepIdx);
      out += `<span class="${cls}">`;
      i = sepIdx + 1;
      continue;
    }
    if (ch === PAPER_TOKEN_CLOSE) {
      out += '</span>';
      i++;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

function decoratePaperDocumentHtml(html, root = '') {
  let out = String(html || '')
    .replace(/\x04/g, '<span class="paper-block-dark">')
    .replace(/\x05/g, '</span>')
    .replace(/\x02([A-Za-z0-9+/=]*)\x03/g, (_, payload) => {
      try {
        const { src, alt } = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
        const resolvedSrc = resolvePaperImageSrc(src, root);
        return `<img src="${escapeHtml(resolvedSrc)}" alt="${escapeHtml(alt || '')}" class="paper-inline-image" loading="lazy">`;
      } catch (e) {
        return '';
      }
    })
    .replace(/\x0b([A-Za-z0-9+/=]*)\x0c/g, (_, payload) => {
      try {
        const { label, labelClass, code } = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
        return `<div class="pre-wrap"><div class="pre-header"><span class="paper-code-label paper-code-label--${escapeHtml(labelClass)}">${escapeHtml(label)}</span></div><pre><code class="hljs language-${escapeHtml(labelClass)}">${escapeHtml(code)}</code></pre></div>`;
      } catch (e) {
        return '';
      }
    })
    .replace(/\x0e([A-Za-z0-9+/=]*)\x0f/g, (_, payload) => {
      try {
        const { kind, body } = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
        const kindClass = kind.toLowerCase();
        const paragraphs = body
          .split(/\n\n+/)
          .map(p => `<p>${escapeHtml(p.trim()).replace(/\x17/g, '<br>')}</p>`)
          .join('');
        return `<div class="paper-callout paper-callout--${kindClass}"><div class="paper-callout__label">${escapeHtml(kind)}</div><div class="paper-callout__body">${paragraphs}</div></div>`;
      } catch (e) {
        return '';
      }
    })
    .replace(/\x10([A-Za-z0-9+/=]*)\x11/g, (_, payload) => {
      try {
        const { header, rows } = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
        const headHtml = header
          ? `<thead><tr>${header.map(cell => `<th>${escapeHtml(cell)}</th>`).join('')}</tr></thead>`
          : '';
        const bodyHtml = `<tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody>`;
        return `<div class="paper-table-wrap"><table class="paper-table">${headHtml}${bodyHtml}</table></div>`;
      } catch (e) {
        return '';
      }
    })
    .replace(/\x12([A-Za-z0-9+/=]*)\x13/g, (_, payload) => {
      try {
        const { body } = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
        return `<div class="paper-callout paper-callout--summary"><div class="paper-callout__label">Summary</div><pre class="paper-callout__body paper-callout__body--pre">${escapeHtml(body)}</pre></div>`;
      } catch (e) {
        return '';
      }
    });
  out = convertPaperTokenMarkers(out);
  out = out
    .replace(/\x14([^\x15]*)\x15([^\x16]*)\x16/g, (_, href, label) => {
      const resolvedHref = resolvePaperLinkHref(href, root);
      return `<a href="${resolvedHref}" class="paper-link">${label}</a>`;
    })
    .replace(/\x1f([^\x1e]*?)\x1e/g, (_, code) => {
      return `<span class="paper-inline-code paper-inline-code--red">${code}</span>`;
    })
    .replace(/`([^`\n]+)`/g, (_, code) => {
      return `<span class="paper-inline-code paper-inline-code--red">${code}</span>`;
    });
  return out;
}

// ─── file helpers ─────────────────────────────────────────────────────────────

function readTemplate(name) {
  return fs.readFileSync(path.join('templates', name + '.html'), 'utf8');
}

function ensureDir(dirpath) {
  fs.mkdirSync(dirpath, { recursive: true });
}

function _collectMarkdown(dir, inferredTheme) {
  if (!fs.existsSync(dir)) return [];
  const items = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      items.push(..._collectMarkdown(path.join(dir, entry.name), entry.name));
    } else if (entry.name.endsWith('.md')) {
      const raw            = fs.readFileSync(path.join(dir, entry.name), 'utf8');
      const { meta, body } = parseFrontmatter(raw);
      if (!meta.theme && inferredTheme) meta.theme = inferredTheme;
      items.push({ filename: entry.name, slug: generateSlug(entry.name), meta, body, html: renderMarkdownHtml(body) });
    }
  }
  return items;
}

function readMarkdownFiles(dir) {
  return _collectMarkdown(dir, null)
    .filter(item => item.meta.draft !== 'true')
    .sort((a, b) => (b.meta.date || '').localeCompare(a.meta.date || ''));
}

function parseChangelogEntries(markdownBody, limit) {
  const entries = [];
  let current   = null;
  for (const line of markdownBody.split('\n')) {
    if (line.startsWith('## ')) {
      if (current) entries.push(current);
      current = { date: line.slice(3).trim(), items: [] };
    } else if (current && line.startsWith('- ')) {
      current.items.push(line.slice(2).trim());
    }
  }
  if (current) entries.push(current);
  return entries.slice(0, limit);
}

// ─── render helpers ───────────────────────────────────────────────────────────

function formatDate(date) { return date || ''; }

function getFirstImage(body) {
  const match = body.match(/!\[.*?\]\((.+?)\)/);
  return match ? match[1] : null;
}

function getExcerpt(body, maxLen = 220) {
  const text = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/^#{1,6}\s+.+$/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~>-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s\S*$/, '') + '...';
}

function renderPostCard(item, href, root) {
  const excerpt = item.meta.description || getExcerpt(item.body);
  const tagsArr = item.meta.tags
    ? (Array.isArray(item.meta.tags) ? item.meta.tags : [item.meta.tags])
    : [];
  const tagsHtml = tagsArr.length
    ? `<span class="post-card__tags">[${tagsArr.join(', ')}]</span>`
    : '';
  const bgSrc = item.meta.banner
    ? `${root || ''}static/media/${item.meta.banner}`
    : getFirstImage(item.body);
  const bgStyle = bgSrc
    ? ` style="background-image: linear-gradient(to bottom, rgba(8,14,8,0.97) 0%, rgba(8,14,8,0.55) 100%), url('${bgSrc}'); background-size: cover; background-position: center; background-origin: border-box;"`
    : '';
  return `<a href="${href}" class="post-card"${bgStyle}>
  <h2 class="post-card__title">${escapeHtml(item.meta.title || item.slug)}</h2>
  <div class="post-card__meta">${formatDate(item.meta.date)} ${tagsHtml}</div>
  <p class="post-card__excerpt">${escapeHtml(excerpt)}</p>
  <span class="post-card__more">ler mais...</span>
</a>`;
}

function renderPostRow(item, index, href) {
  const hexId  = '0x' + (index + 1).toString(16).padStart(3, '0').toUpperCase();
  const date   = (item.meta.date || '').replace(/-/g, '.');
  const title  = escapeHtml(item.meta.title || item.slug);
  const arr    = Array.isArray(item.meta.tags) ? item.meta.tags : (item.meta.tags ? [item.meta.tags] : []);
  const tags   = arr.map(t => `<span class="row-tag">${escapeHtml(t)}</span>`).join(' ');

  if (item.meta.locked === 'true') {
    return `<tr class="post-row post-row--locked">
  <td class="col-id-cell">${hexId}</td>
  <td class="col-title-cell"><span class="locked-title">[locked] ${title}</span></td>
  <td class="col-date-cell">—</td>
  <td class="col-tags-cell">${tags}</td>
</tr>`;
  }

  const pinnedMark = item.meta.pinned === 'true' ? '<span class="pinned-mark">↑</span> ' : '';
  return `<tr class="post-row" onclick="location.href='${escapeHtml(href)}'">
  <td class="col-id-cell">${hexId}</td>
  <td class="col-title-cell"><a href="${escapeHtml(href)}">${pinnedMark}${title}</a></td>
  <td class="col-date-cell">${date}</td>
  <td class="col-tags-cell">${tags}</td>
</tr>`;
}

function renderPostTable(items, hrefFn) {
  if (!items.length) {
    return '<p style="padding:12px 14px;color:var(--text-muted);font-size:12px">em breve.</p>';
  }
  const sorted = [...items].sort((a, b) => {
    const ap = a.meta.pinned === 'true' ? 1 : 0;
    const bp = b.meta.pinned === 'true' ? 1 : 0;
    return bp - ap;
  });
  const rows = sorted.map((item, i) => renderPostRow(item, i, hrefFn(item))).join('\n');
  return `<div class="post-table-wrap">
<table class="post-table">
  <thead><tr>
    <th class="col-id-cell">ID</th>
    <th class="col-title-cell">TITLE</th>
    <th class="col-date-cell">DATE</th>
    <th class="col-tags-cell">TAGS</th>
  </tr></thead>
  <tbody>
${rows}
  </tbody>
</table>
</div>`;
}

function sortArchiveItems(items) {
  return [...items].sort((a, b) => {
    const ad = a.meta.date || '';
    const bd = b.meta.date || '';
    if (bd !== ad) return bd.localeCompare(ad);
    const at = toAscii(a.meta.title || a.slug).toLowerCase();
    const bt = toAscii(b.meta.title || b.slug).toLowerCase();
    return at.localeCompare(bt);
  });
}

function computeChronoIndexMap(items) {
  const chronological = [...items].sort((a, b) => {
    const ad = a.meta.date || '';
    const bd = b.meta.date || '';
    if (ad !== bd) return ad.localeCompare(bd);
    const at = toAscii(a.meta.title || a.slug).toLowerCase();
    const bt = toAscii(b.meta.title || b.slug).toLowerCase();
    return at.localeCompare(bt);
  });
  return new Map(chronological.map((item, i) => [item.slug, i]));
}

function paperHexId(index) {
  return '0x' + index.toString(16).padStart(2, '0');
}

function paperDirName(slug, chronoIndexMap) {
  const idx = chronoIndexMap.get(slug);
  return idx != null ? paperHexId(idx) : slug;
}

function groupArchiveItems(items, groupFn) {
  const map = new Map();
  for (const item of sortArchiveItems(items)) {
    const raw = groupFn(item);
    const label = toAscii(raw || 'misc').toLowerCase() || 'misc';
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(item);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, groupedItems]) => ({ label, items: groupedItems }));
}

function renderArchiveTree(sections, opts = {}) {
  const rootLabel = toAscii(opts.rootLabel || 'root').toLowerCase() || 'root';
  const fileNameFn = opts.fileNameFn || (item => `${item.slug}.txt`);
  const hrefFn = opts.hrefFn || (item => `${item.slug}.html`);
  const openDepth = Number.isFinite(opts.openDepth) ? opts.openDepth : 0;
  const metaLineFn = opts.metaLineFn || (item => {
    const parts = [];
    const title = toAscii(item.meta.title || item.slug).toUpperCase();
    if (title) parts.push(title);
    if (item.meta.author) parts.push(toAscii(item.meta.author).toUpperCase());
    if (item.meta.date) parts.push(String(item.meta.date));
    return parts.join(' / ');
  });

  const renderItem = (item) => {
    const href = escapeHtml(hrefFn(item));
    const fileName = escapeHtml(fileNameFn(item));
    const meta = metaLineFn ? metaLineFn(item) : '';
    const locked = item.meta && item.meta.locked === 'true';
    const pinned = item.meta && item.meta.pinned === 'true';
    const flags = [
      locked ? '<span class="archive-status archive-status--locked">[locked]</span>' : '',
      pinned ? '<span class="archive-status archive-status--pinned">[pinned]</span>' : '',
    ].filter(Boolean).join(' ');
    const nameHtml = locked
      ? `<span class="archive-file__name archive-file__name--locked">${fileName}</span>`
      : `<a class="archive-file__name" href="${href}">${fileName}</a>`;
    return `<div class="archive-file">
  <div class="archive-file__head">
    <span class="archive-file__icon" aria-hidden="true">-</span>
    ${nameHtml}${flags ? ` ${flags}` : ''}
  </div>${meta ? `\n  <div class="archive-file__meta">${escapeHtml(meta)}</div>` : ''}
</div>`;
  };

  const renderFolder = (node, depth) => {
    const label = toAscii(node.label || 'folder').toLowerCase() || 'folder';
    const openAttr = depth <= openDepth ? ' open' : '';
    const groups = Array.isArray(node.groups) ? node.groups : [];
    const items = Array.isArray(node.items) ? node.items : [];
    const children = groups.length
      ? groups.map(group => renderFolder(group, depth + 1)).join('\n')
      : sortArchiveItems(items).map(renderItem).join('\n');
    return `<details class="archive-folder" data-depth="${depth}"${openAttr}>
  <summary class="archive-folder__summary">
    <span class="archive-folder__icon" aria-hidden="true"></span>
    <span class="archive-folder__name">${escapeHtml(label)}/</span>
  </summary>
  <div class="archive-folder__children">
${children}
  </div>
</details>`;
  };

  const normalizedSections = (sections || [])
    .filter(section => section && ((section.groups && section.groups.length) || (section.items && section.items.length)))
    .map(section => ({
      label: toAscii(section.label || 'section').toLowerCase() || 'section',
      groups: Array.isArray(section.groups) ? section.groups : [],
      items: Array.isArray(section.items) ? section.items : [],
    }));

  const folders = normalizedSections.map((section, idx) => renderFolder(section, idx + 1)).join('\n');
  return `<div class="archive-tree-wrap"><div class="archive-tree"><div class="archive-root">${escapeHtml(rootLabel)}/</div>
${folders}
</div></div>`;
}

function formatTags(tags) {
  if (!tags || !tags.length) return '';
  const arr = Array.isArray(tags) ? tags : [tags];
  return ' [' + arr.join(', ') + ']';
}

function buildOmemoModal() {
  const raw = fs.existsSync('gifs/omemo.txt') ? fs.readFileSync('gifs/omemo.txt', 'utf8') : '';
  if (!raw.trim()) return '';
  return `<div id="omemo-modal" aria-hidden="true">
  <div class="pgp-modal-inner">
    <div class="panel">
      <div class="panel-header">
        <span>OMEMO keys — in64weTrust@pwned.life</span>
        <span class="window-controls"><span class="wbtn" id="omemo-modal-close">×</span></span>
      </div>
      <div class="panel-body"><pre class="omemo-keys">${escapeHtml(raw)}</pre></div>
    </div>
  </div>
</div>`;
}

function wrapInBase(body, opts) {
  const base = readTemplate('base');
  const cfg  = readSidebarConfig();
  const siteChrome = opts.siteChrome != null
    ? opts.siteChrome
    : `${asciiTitle()}<div class="separator"></div>`;
  const fullTitle = opts.rawTitle || (opts.pageTitle ? `${opts.pageTitle} :: ${CONFIG.siteTitle}` : CONFIG.siteTitle);
  return renderTemplate(base, {
    pageTitle:  fullTitle,
    ogTitle:       escapeHtml(fullTitle),
    ogDescription: escapeHtml(CONFIG.ogDescription),
    ogImage:       opts.ogImage || `${CONFIG.siteUrl}/${CONFIG.ogImagePath}`,
    root:       opts.root || '',
    bodyClass:  opts.bodyClass || '',
    wrapperClass: opts.wrapperClass || '',
    siteChrome,
    body,
    breadcrumb: opts.breadcrumb || '',
    footer:     generateFooter(opts.root || '', cfg, opts.footerExtra || ''),
    omemoModal: buildOmemoModal(),
    pageMascot: opts.pageMascot || '',
  });
}

function renderPageMascot(root) {
  return `<img src="${root}static/media/freebsd.gif" alt="" class="page-mascot" aria-hidden="true" loading="lazy" width="380" height="371">`;
}

function renderChangelog(entries) {
  if (!entries.length) return '<p style="color:var(--text-muted);font-size:12px">nenhuma entrada ainda.</p>';
  return entries.map(e => {
    const items = e.items.map(i => `<li>${escapeHtml(i)}</li>`).join('');
    return `<div class="changelog-entry"><span class="changelog-date">${escapeHtml(e.date)}</span><ul class="changelog-items">${items}</ul></div>`;
  }).join('\n');
}

function renderWidgetList(items, section) {
  if (!items.length) return '<p style="color:#4a6a4a;font-size:13px">nenhum item ainda.</p>';
  const lis = items.map(item => {
    if (item.meta.locked === 'true') {
      return `<li><span class="item-date">—</span><span class="locked-title">${escapeHtml(item.meta.title || item.slug)}</span> <span class="locked-tag">[ locked ]</span></li>`;
    }
    return `<li><span class="item-date">${formatDate(item.meta.date)}</span>` +
      `<a href="${section}/${item.slug}.html">${escapeHtml(item.meta.title || item.slug)}</a></li>`;
  }).join('\n');
  return `<ul class="widget-list">\n${lis}\n</ul>`;
}

function readSidebarConfig() {
  const file = 'src/sidebar/config.md';
  if (!fs.existsSync(file)) return {};
  const raw   = fs.readFileSync(file, 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  try { return yaml.load(match[1]) || {}; } catch(e) { return {}; }
}

function generateGifcities(root, cfg) {
  const dir      = 'media/badges';
  const EXCLUDED = new Set(['BERRRG.gif', 'BADGE_PWN.gif']);
  if (!fs.existsSync(dir)) return '';
  const exts  = new Set(['.gif', '.png', '.jpg', '.jpeg', '.webp']);
  const files = fs.readdirSync(dir)
    .filter(f => exts.has(path.extname(f).toLowerCase()) && !EXCLUDED.has(f));
  if (!files.length) return '';
  const gifLinks = (cfg && cfg.gif_links) ? cfg.gif_links : {};
  const imgs = files.map(f => {
    const img = `<img src="${root}static/media/badges/${escapeHtml(f)}" alt="${escapeHtml(f)}" loading="lazy" width="88" height="31">`;
    return gifLinks[f]
      ? `<a href="${escapeHtml(gifLinks[f])}" target="_blank" rel="noopener">${img}</a>`
      : img;
  }).join('\n    ');
  return `<div class="footer-gifs">\n    ${imgs}\n  </div>`;
}

function generateFooter(root, cfg, extra) {
  if (!cfg) cfg = {};
  const parts = [];
  if (cfg.xmpp) {
    const omemoLink = cfg.xmpp_omemo
      ? ` <a href="#" id="omemo-modal-trigger" class="footer-link">[ omemo keys &#8594; ]</a>`
      : '';
    parts.push(`<span>xmpp: ${escapeHtml(cfg.xmpp)}</span>${omemoLink}`);
  } else if (cfg.xmpp_omemo) {
    parts.push(`<a href="#" id="omemo-modal-trigger" class="footer-link">[ omemo keys &#8594; ]</a>`);
  }
  if (cfg.email)      parts.push(`<span>email: ${escapeHtml(cfg.email)}</span>`);
  if (cfg.x)          parts.push(`<a href="${escapeHtml(cfg.x)}" target="_blank" rel="noopener" class="footer-link">[ x.com/${escapeHtml(cfg.x.replace(/^https?:\/\/(x\.com\/|twitter\.com\/)/, ''))} &#8594; ]</a>`);
  const contactHtml = parts.join('  <span class="footer-sep">|</span>  ');
  const gifsHtml    = generateGifcities(root, cfg);
  return `<footer id="site-footer">
  <div class="footer-separator"></div>
  <div class="footer-contact">${contactHtml}</div>
  ${gifsHtml}
  ${extra || ''}
</footer>`;
}

function getPostsByTheme(posts, theme) {
  return posts.filter(p => (p.meta.theme || '').toLowerCase() === theme.toLowerCase());
}

function renderTaggedPostsSection(items, root) {
  if (!items.length) return '';
  const treeHtml = renderArchiveTree([
    { label: 'papers', items: items },
  ], {
    rootLabel: 'root',
    hrefFn: item => `${root}papers/${item.slug}.html`,
  });
  return `<hr style="border-top:1px solid var(--border);margin:20px 0 14px">` + treeHtml;
}

function renderHomeHeroRight() {
  return `<header class="home-hero home-hero--right">
  <div class="home-hero__markline" aria-hidden="true">
    <span class="home-hero__rule"></span>
    <span class="home-hero__brand">Цой<span class="home-hero__brand-accent">32</span></span>
    <span class="home-hero__rule"></span>
  </div>
</header>`;
}

function renderHomeFeed(posts, notes) {
  const withSection = (posts || []).map(item => ({ ...item, section: 'papers' }));

  const chronoIndex = computeChronoIndexMap(withSection);

  const combined = sortArchiveItems(withSection)
    .sort((a, b) => {
      const ap = a.meta.pinned === 'true' ? 1 : 0;
      const bp = b.meta.pinned === 'true' ? 1 : 0;
      if (ap !== bp) return bp - ap;
      const ad = a.meta.date || '';
      const bd = b.meta.date || '';
      if (bd !== ad) return bd.localeCompare(ad);
      const at = toAscii(a.meta.title || a.slug).toLowerCase();
      const bt = toAscii(b.meta.title || b.slug).toLowerCase();
      return at.localeCompare(bt);
    });

  const items = combined.length
    ? combined.map((item) => {
        const index = chronoIndex.get(item.slug);
        const href = `p/${paperDirName(item.slug, chronoIndex)}/`;
        const title = escapeHtml(toAscii(item.meta.title || item.slug));
        const metaValue = item.meta.author || item.meta.date || item.section;
        const meta = escapeHtml(toAscii(String(metaValue)));
        const flags = [];
        if (item.meta.locked === 'true') {
          flags.push('<span class="home-feed__flag home-feed__flag--locked">[locked]</span>');
        }
        if (item.meta.pinned === 'true') {
          flags.push('<span class="home-feed__flag home-feed__flag--pinned">[pinned]</span>');
        }
        if (item.meta.new === 'true') {
          flags.push('<span class="home-feed__flag home-feed__flag--new">[NEW]</span>');
        }
        const titleHtml = item.meta.locked === 'true'
          ? `<span class="home-feed__title home-feed__title--locked">${title}</span>`
          : `<a class="home-feed__title" href="${href}">${title}</a>`;
        const flagHtml = flags.length
          ? `<span class="home-feed__flags">${flags.join('')}</span>`
          : '';
        const titleCell = `<span class="home-feed__title-cell">${titleHtml}</span>`;
        const rowIndex = '0x' + index.toString(16).padStart(2, '0');
        return `<li class="home-feed__entry">
  <span class="home-feed__index">[${rowIndex}]</span>
  ${titleCell}
  <span class="home-feed__flags-cell">${flagHtml}</span>
  <span class="home-feed__dots" aria-hidden="true"></span>
  <span class="home-feed__meta">${meta}</span>
</li>`;
      }).join('\n')
    : `<li class="home-feed__empty">no entries yet.</li>`;

  return `<div class="home-feed home-feed--issue" aria-label="contents">
  <div class="home-feed__side home-feed__side--left" aria-hidden="true"><span class="sr-only">thebixowithsevenheads</span><span class="home-feed__side-text">${renderTonedText('thebixowithsevenheads', { baseClass: 'home-feed__side-char', shouldTone: ch => /[A-Za-z]/.test(ch) })}</span></div>
  <div class="home-feed__side home-feed__side--right" aria-hidden="true"><span class="sr-only">thebixowithsevenheads</span><span class="home-feed__side-text">${renderTonedText('thebixowithsevenheads', { baseClass: 'home-feed__side-char', shouldTone: ch => /[A-Za-z]/.test(ch) })}</span></div>
  <div class="home-feed__head">
    <span class="home-feed__label">contents</span>
    <span class="home-feed__count">${String(combined.length).padStart(2, '0')}</span>
  </div>
  <ol class="home-feed__list">
${items}
  </ol>
</div>`;
}

function renderWindowFrame(title, bodyHtml, { meta = '', flush = false } = {}) {
  return `<div class="home-window">
  <div class="window-titlebar">
    <span>${title}</span>
    <span class="window-titlebar__meta">
      ${meta}
      <span class="window-controls"><span class="wbtn">×</span></span>
    </span>
  </div>
  <div class="window-body${flush ? ' window-body--flush' : ''}">
    ${bodyHtml}
  </div>
</div>`;
}

function renderHomeManifesto() {
  const image = `<img src="static/media/bit.png" alt="" class="home-manifesto__image" loading="lazy" width="1254" height="1137">`;
  const bands = [
    { file: 'band-kino.png',    name: 'КИНО',        preview: 'preview-kino.mp3' },
    { file: 'band-molchat.jpg', name: 'МОЛЧАТ ДОМА', preview: 'preview-molchat.mp3' },
  ];
  const bandsGrid = `<div class="home-manifesto__bands">
${bands.map(b => {
    const img = `<img src="static/media/${b.file}" alt="${escapeHtml(b.name)}" class="home-manifesto__band-img" loading="lazy">`;
    const cover = `<div class="home-manifesto__band-cover">${img}</div>`;
    const play = b.preview
      ? `<button type="button" class="home-manifesto__band-play" data-audio="static/media/${escapeHtml(b.preview)}" aria-label="tocar prévia de ${escapeHtml(b.name)}">[&gt;]</button>`
      : '';
    return `  <div class="home-manifesto__band">
    ${cover}
    <div class="home-manifesto__band-row">
      <span class="home-manifesto__band-name">${escapeHtml(b.name)}</span>
      ${play}
    </div>
  </div>`;
  }).join('\n')}
</div>`;
  const bandsTitle = `<div class="home-manifesto__bands-title" lang="ru">Лучшие песни!</div>`;
  return renderWindowFrame('bitkill.png', image, { flush: true })
    + `<section class="home-manifesto home-manifesto--bands">
  ${bandsTitle}
  ${bandsGrid}
</section>`;
}

function renderHomeRail(posts, notes) {
  return renderHomeManifesto(posts, notes);
}

// ─── topics ──────────────────────────────────────────────────────────────────

function readTopics() {
  const dir = 'src/topics';
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(filename => {
      const raw            = fs.readFileSync(path.join(dir, filename), 'utf8');
      const { meta, body } = parseFrontmatter(raw);
      return { filename, slug: meta.slug || generateSlug(filename), meta, body };
    });
}

function readThemes() {
  const dir = 'src/themes';
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(filename => {
      const raw       = fs.readFileSync(path.join(dir, filename), 'utf8');
      const { meta }  = parseFrontmatter(raw);
      return { slug: meta.slug || generateSlug(filename), meta };
    });
}

function renderTopicsSection(themes, root) {
  if (!themes.length) return '';
  const links = themes.map(t => {
    const slug    = t.slug;
    const label   = escapeHtml(t.meta.card_label || slug);
    const blocked = t.meta.block === 'true';
    if (blocked) {
      return `<span class="topic-link topic-link--blocked">[ ${label} ] [locked]</span>`;
    }
    return `<a href="${root}${slug}/index.html" class="topic-link">[ ${label} ]</a>`;
  }).join('\n  ');
  return `<div class="section-block">
<div class="section-heading"><span class="section-prefix">&gt;&gt;</span> t&#243;picos</div>
<div class="topic-list">
  ${links}
</div>
</div>`;
}

function generateTopicPage(topic, posts, root) {
  const slug    = topic.meta.slug || topic.slug;
  const theme   = topic.meta.theme || slug;
  const matched = posts.filter(p => (p.meta.theme || '').toLowerCase() === theme.toLowerCase());
  const chronoIndex = computeChronoIndexMap(posts);

  const bodyHtml   = topic.body.trim() ? renderMarkdownHtml(topic.body) : '';
  const appendHtml = matched.length
    ? renderArchiveTree([
      { label: slug, items: matched },
    ], {
      rootLabel: 'root',
      hrefFn: item => `${root}p/${paperDirName(item.slug, chronoIndex)}/`,
    })
    : '';

  const postTpl = readTemplate('post');
  const pageBody = renderTemplate(postTpl, {
    frontmatter: renderPageHeader(topic.meta.title || slug),
    toc:         '',
    content:     bodyHtml + appendHtml,
    footer:      '',
  });

  const outDir = path.join('docs', slug);
  ensureDir(outDir);
  const topicTitle = topic.meta.title || slug;
  const breadcrumb = `<a href="${root}index.html">home</a> / ${escapeHtml(topicTitle)}`;
  const html = wrapInBase(pageBody, { pageTitle: topicTitle, root, breadcrumb });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
}

// ─── page generators ─────────────────────────────────────────────────────────

function generatePostPage(post, allPosts, outDir, root, topicsMap, opts = {}) {
  const effectiveRoot = opts.dirName ? root + '../' : root;
  const paperTpl = readTemplate('paper');
  const paperText = renderPaperDocument(post);
  const paperHtml = decoratePaperDocumentHtml(escapeHtml(paperText), effectiveRoot) + renderPostFooter(post);
  const body = renderTemplate(paperTpl, {
    content: paperHtml,
  });
  const cover = readPaperCover(post.meta || {});
  const ogImage = cover && cover.image
    ? `${CONFIG.siteUrl}/${resolvePaperImageSrc(cover.image, '').replace(/^\/+/, '')}`
    : undefined;
  const html = wrapInBase(body, {
    pageTitle: post.meta.title || post.slug,
    rawTitle: `${post.meta.title || post.slug} | @${post.meta.author || CONFIG.siteTitle}`,
    root: effectiveRoot,
    bodyClass: 'paper-mode',
    wrapperClass: 'paper-shell',
    siteChrome: renderPaperTopNav(effectiveRoot),
    ogImage,
  });
  if (opts.dirName) {
    const pageDir = path.join(outDir, opts.dirName);
    ensureDir(pageDir);
    fs.writeFileSync(path.join(pageDir, 'index.html'), html);
  } else {
    ensureDir(outDir);
    fs.writeFileSync(path.join(outDir, post.slug + '.html'), html);
  }
}

function generateListPage(items, opts) {
  const listTpl = readTemplate('list');
  const groupBy = opts.groupBy || null;
  const sectionLabel = opts.sectionLabel || opts.heading;
  const hrefFn = opts.hrefFn || (item => `${item.slug}.html`);
  const treeHtml = groupBy
    ? renderArchiveTree([{ label: sectionLabel, groups: groupArchiveItems(items, groupBy) }], {
      rootLabel: 'root',
      hrefFn,
    })
    : renderArchiveTree([{ label: sectionLabel, items }], {
      rootLabel: 'root',
      hrefFn,
    });
  const body    = renderTemplate(listTpl, {
    pageHeading: opts.heading,
    listHtml:    treeHtml,
  });

  const pageTitle  = opts.heading.replace(/::/g, '').trim();
  const breadcrumb = `<a href="${opts.root}index.html">home</a> / ${escapeHtml(pageTitle)}`;
  const html = wrapInBase(body, { pageTitle, root: opts.root, breadcrumb });
  ensureDir(opts.outDir);
  fs.writeFileSync(path.join(opts.outDir, 'index.html'), html);
}

function generateStaticPage(mdFile, outFile, opts) {
  const raw            = fs.existsSync(mdFile) ? fs.readFileSync(mdFile, 'utf8') : '';
  const { meta, body } = parseFrontmatter(raw);
  const postTpl        = readTemplate('post');
  const fmTitle  = opts.title !== undefined ? opts.title : (meta.title || '');
  const pageBody = renderTemplate(postTpl, {
    frontmatter: renderPageHeader(fmTitle),
    toc:         '',
    content:     renderMarkdownHtml(body) + (opts.appendHtml || ''),
    footer:      '',
  });
  const pageTitle  = opts.title || meta.title || '';
  const breadcrumb = pageTitle ? `<a href="${opts.root || ''}index.html">home</a> / ${escapeHtml(pageTitle)}` : '';
  const html = wrapInBase(pageBody, { pageTitle, root: opts.root || '', breadcrumb });
  ensureDir(path.dirname(outFile));
  fs.writeFileSync(outFile, html);
  return meta;
}

function generateCategoryPage(label, posts, matchTags, outDir, root) {
  const matched = posts.filter(p => {
    const tags = p.meta.tags
      ? (Array.isArray(p.meta.tags) ? p.meta.tags : [p.meta.tags])
      : [];
    return tags.some(t => matchTags.includes(t.toLowerCase()));
  });
  const chronoIndex = computeChronoIndexMap(posts);

  const listTpl = readTemplate('list');
  const treeHtml = renderArchiveTree([{ label, items: matched }], {
    rootLabel: 'root',
    hrefFn: item => `${root}p/${paperDirName(item.slug, chronoIndex)}/`,
  });
  const body    = renderTemplate(listTpl, {
    pageHeading: label,
    listHtml:    treeHtml,
  });

  const html = wrapInBase(body, { pageTitle: label, root });
  ensureDir(outDir);
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
}

function generateHomePage(posts, notes, topics, themes) {
  const indexTpl = readTemplate('index');
  const body     = renderTemplate(indexTpl, {
    homeHeroRight: renderHomeHeroRight(),
    homeFeed: renderHomeFeed(posts, notes),
    homeManifesto: renderHomeManifesto(),
  });

  const latestItems = sortArchiveItems(posts || []);
  const latestDate = latestItems.length ? String(latestItems[0].meta.date || '') : '';
  const footerExtra = latestDate ? `<div class="footer-updated">updated ${escapeHtml(latestDate)}</div>` : '';

  const html = wrapInBase(body, {
    rawTitle: `@tsoi32 | @${SITE_ASCII_TITLE}`,
    root: '',
    bodyClass: 'home-mode',
    wrapperClass: 'home-shell',
    siteChrome: '',
    footerExtra,
  });
  fs.writeFileSync(path.join('docs', 'index.html'), html);
}

function generate404Page() {
  const body = `
<div class="panel">
  <div class="panel-header">
    <span>KERNEL PANIC — segmentation fault</span>
    <span class="panel-controls">[ 0x00000000 ]</span>
  </div>
  <div class="panel-body" style="padding:40px 24px;text-align:center;">
    <img src="static/media/404-meme.png" alt="404" style="max-width:280px;width:100%;height:auto;border:1px solid var(--border);">
    <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:var(--text-muted);margin-top:14px;">página não encontrada</div>
    <a href="index.html" style="display:inline-block;margin-top:24px;padding:6px 20px;background:var(--surface);border-top:1px solid var(--border-hi);border-left:1px solid var(--border-hi);border-bottom:1px solid #000;border-right:1px solid #000;color:var(--text-muted);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;transition:background .15s,color .15s;" onmouseover="this.style.background='var(--ph)';this.style.color='var(--text)'" onmouseout="this.style.background='var(--surface)';this.style.color='var(--text-muted)'">← voltar para home</a>
  </div>
</div>`;
  const html = wrapInBase(body, { rawTitle: 'thebixowithsevenheads', root: '', siteChrome: '' });
  fs.writeFileSync(path.join('docs', '404.html'), html);
}

// ─── filesystem ───────────────────────────────────────────────────────────────

function copyDirRecursive(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDirRecursive(s, d) : fs.copyFileSync(s, d);
  }
}

function copyStatic() {
  if (fs.existsSync('static')) copyDirRecursive('static', path.join('docs', 'static'));
  if (fs.existsSync('media'))  copyDirRecursive('media',  path.join('docs', 'static', 'media'));
}

function clearDocs() {
  if (fs.existsSync('docs')) fs.rmSync('docs', { recursive: true, force: true });
  fs.mkdirSync('docs');
}


// ─── main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log(':: building...');

  clearDocs();
  copyStatic();
  fs.writeFileSync(path.join('docs', '.nojekyll'), '');
  fs.writeFileSync(path.join('docs', '.domains'), 'thebixowithsevenheads.wtf\ntsoi32.codeberg.page\npages.tsoi32.codeberg.page\n');
  fs.writeFileSync(path.join('docs', 'CNAME'), 'thebixowithsevenheads.wtf\n');

  const posts  = readMarkdownFiles('src/posts');
  const notes  = readMarkdownFiles('src/notes');
  const topics = readTopics();
  const themes = readThemes();
  const topicsMap = Object.fromEntries(
    topics.map(t => [t.meta.theme || t.slug, t.meta.title || t.slug])
  );

  const paperChronoIndex = computeChronoIndexMap(posts);

  ensureDir(path.join('docs', 'p'));
  for (const post of posts) {
    if (post.meta.locked !== 'true') {
      generatePostPage(post, posts, path.join('docs', 'p'), '../', topicsMap, {
        dirName: paperDirName(post.slug, paperChronoIndex),
      });
    }
  }

  ensureDir(path.join('docs', 'notes'));
  for (const note of notes) {
    if (note.meta.locked !== 'true') {
      generatePostPage(note, notes, path.join('docs', 'notes'), '../', topicsMap);
    }
  }

  for (const topic of topics) {
    if (topic.meta.block !== 'true') {
      generateTopicPage(topic, posts, '../');
    }
  }

  generateListPage(posts, {
    heading: 'papers',
    outDir: path.join('docs', 'p'),
    root: '../',
    groupBy: item => item.meta.theme || 'misc',
    hrefFn: item => `${paperDirName(item.slug, paperChronoIndex)}/`,
  });
  generateListPage(notes, {
    heading: 'notes',
    outDir: path.join('docs', 'notes'),
    root: '../',
  });

  generateHomePage(posts, notes, topics, themes);

  generate404Page();

  console.log(`:: done — ${posts.length} post(s), ${notes.length} note(s), ${topics.length} topic(s)`);
}

if (require.main === module) {
  main();
}

module.exports = {
  parseFrontmatter, generateSlug, renderTemplate, escapeHtml,
  decoratePaperDocumentHtml,
  CONFIG, readTemplate, ensureDir, readMarkdownFiles,
  parseChangelogEntries, formatDate, formatTags,
  wrapInBase, renderWidgetList, generateGifcities, generateFooter, asciiTitle,
  renderPostCard, renderPostRow, renderPostTable, sortArchiveItems, groupArchiveItems, renderArchiveTree, renderPostFrontmatter, renderAsciiToc, renderPostFooter,
  renderPaperDocument, renderPaperTopNav,
  renderHomeHeroRight, renderHomeFeed, renderHomeManifesto, renderHomeRail,
  readTopics, renderTopicsSection, generateTopicPage,
  generatePostPage, generateListPage, generateCategoryPage, generateStaticPage, generateHomePage,
  wrapAsciiText,
};
