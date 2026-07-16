# Frontmatter de Papers

Este repo agora e paper-first. Todo paper fica em `src/posts/<tema>/<slug>.md`
e comeca com um bloco YAML entre `---`.

````md
---
title: Paper Surface Example
author: S0S4
date: 2026-06-04
theme: computers
tags: [example, ascii, layout, demo]
description: A fake paper showing every supported paper element in one place.
cover:
  hideTitle: true
  caption: tsoi32
  art: |
    .------------------------------------------------------------------.
    |                                                                  |
    |   ____   ____   ____   ____   ____   ____   ____                 |
    |  |  _ \ |  _ \ |  _ \ |  _ \ |  _ \ |  _ \ |  _ \               |
    |  | |_) || |_) || |_) || |_) || |_) || |_) || |_) |              |
    |  |____/ |____/ |____/ |____/ |____/ |____/ |____/               |
    |                                                                  |
    |                   PAPER  SURFACE  EXAMPLE                        |
    |                                                                  |
    '------------------------------------------------------------------'
links:
  source: https://codeberg.org/tsoi32
---
````

## Campos

| Campo | Tipo | Obrigatorio | O que faz |
|-------|------|-------------|-----------|
| `title` | string | sim | Titulo do paper. |
| `author` | string | nao | Autor mostrado na meta do paper. |
| `date` | `YYYY-MM-DD` | sim | Data do paper. Entra na ordenacao e na meta. |
| `theme` | string | nao | Categoria do paper. Se faltar, o build usa a pasta pai. |
| `tags` | string ou lista | nao | Tags do paper. Aceita `tag: foo` ou `tags: [foo, bar]`. |
| `description` | string | nao | Subtitulo/resumo curto. Tambem aceita `subtitle` como fallback. |
| `cover` | string ou objeto | nao | ASCII art da capa. Veja a secao abaixo. |
| `links` | objeto | nao | Links extras. As chaves viram labels no footer. |
| `draft` | `true`/`false` | nao | Se `true`, o arquivo nao entra no build. |
| `locked` | `true`/`false` | nao | Se `true`, o item pode aparecer em listas, mas sem link. |
| `pinned` | `true`/`false` | nao | Se `true`, sobe o item na listagem. |
| `new` | `true`/`false` | nao | Se `true`, mostra a tag `[NEW]` (arco-iris animado) na listagem. |
| `banner` | string | nao | Nome do arquivo em `media/` (ex: `banner: foto.jpg`). Aparece fixo no espaco vazio a direita da pagina do paper. Se definido, tambem vira a imagem de og:image/twitter:image desse paper (em vez da imagem padrao do site). |

## `cover`

O campo `cover` pode ser simples ou completo.

### Forma simples

```yaml
cover: |
  ____
  |  |
  |__|
```

Use quando voce quer so a arte ASCII. O titulo ainda aparece, a menos que
voce use a forma completa com `hideTitle: true`.

### Forma completa

```yaml
cover:
  hideTitle: true
  align: center
  caption: S0S4
  art: |
    ...
```

Campos aceitos em `cover`:

- `art`: ASCII art principal da capa
- `logo`: alias de `art`
- `caption`: linha curta abaixo da arte
- `hideTitle`: esconde o box automatico com titulo, subtitulo, autor e tags
- `align`: `left` ou `center` (padrao: `center`)

Se `cover` tiver `art`, o build tambem mostra a `caption` e a `date` abaixo da
arte, quando esses campos existirem.

## `links`

`links` e um mapa livre. Cada chave vira um link no rodape do paper.

```yaml
links:
  source: https://codeberg.org/tsoi32
  mirror: https://exemplo.com/espelho
  pdf: https://exemplo.com/paper.pdf
```

Use qualquer chave que fizer sentido. As mais comuns sao `source`, `mirror`
e `pdf`.

## Flags

Use booleans normais do YAML:

```yaml
draft: true
locked: true
pinned: true
```

- `draft: true` tira o arquivo do build
- `locked: true` deixa o item sem link
- `pinned: true` prioriza o item na listagem

Se voce quer o minimo do minimo, use so `title`, `author`, `date` e `cover`.
Os campos `theme`, `tags`, `description` e `links` sao opcionais e servem como
metadata: organizacao interna, meta do paper e links de apoio.

Na lista da home, `locked` e `pinned` aparecem como `[locked]` e `[pinned]`
em vermelho, usando a mesma cor do `64` no header.

## Como escrever o body

Depois do bloco `---`, escreva Markdown normal.

Regras importantes para papers:

- `#` vira titulo principal com bastante espaco acima e abaixo
- `##` vira secao numerada
- `> NOTE: ...` vira caixa NOTE
- `> WARN: ...` vira caixa WARN
- `> qualquer outra coisa` vira caixa de quote
- blocos de codigo com `text`, `txt`, `plain` ou `plaintext` saem crus, sem borda
- qualquer outra linguagem vira bloco com borda e label, por exemplo `C`,
  `BASH` ou `PYTHON`
- listas, tabelas e inline code sao mantidos como ASCII fixo

Exemplo:

````md
> NOTE: This paper stays in plain ASCII on purpose.

# The Linker Does Not Guess

## One Unresolved Call

```c
int main(void) {
    sum(1, 2);
}
```

```text
raw ascii diagram here
```
````

## O que nao usar

Os campos antigos de blog e cards como `banner`, `banner_style` e
`banner_width` nao fazem parte do fluxo de paper atual. Se a ideia e escrever
um paper, fique no modelo acima.
