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
- `image`: nome do arquivo em `media/` para usar uma imagem de verdade no lugar da arte ASCII
- `caption`: linha curta abaixo da arte/imagem
- `hideTitle`: esconde o box automatico com titulo, subtitulo, autor e tags
- `align`: `left` ou `center` (padrao: `center`)

### `image` (banner de verdade em vez de ASCII)

Se voce nao quer lidar com arte ASCII (ou ela ta saindo torta por causa de
escaping de YAML), use uma imagem normal:

```yaml
cover:
  hideTitle: true
  caption: tsoi32
  image: rev-shell-banner.jpg
```

Coloque o arquivo em `media/` (mesmo lugar das imagens inline). Se `image`
estiver presente, ela substitui totalmente a arte ASCII (`art` e `logo` sao
ignorados). `caption` e `date` continuam aparecendo embaixo, como no modo
ASCII.

### `art` como lista (recomendado para arte "larga")

O bloco literal `art: |` e sensivel a indentacao: se uma linha da arte tiver
menos espacos que a primeira, o YAML quebra e o build descarta o frontmatter
inteiro (titulo, data, tags, tudo) sem avisar.

Pra evitar isso, escreva cada linha da arte como uma string entre aspas numa
lista. Assim a indentacao da lista em si (os `-`) nao interfere no conteudo:

```yaml
cover:
  hideTitle: true
  caption: tsoi32
  art:
    - " /$$$$$$$  /$$ /$$$$$$$"
    - "| $$__  $$| $$| $$__  $$"
    - "|__/  |__/|__/|__/  |__/"
```

Use aspas duplas e escape `\` e `"` internos (ex: `\\` continua `\\`). O
build junta as linhas com `\n` antes de renderizar, e o alinhamento relativo
entre elas e preservado.

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
- blocos de codigo com `ascii` ou `art` saem sem nenhuma caixa: sem borda, sem
  fundo escuro, sem label — vira so texto puro dentro do paper, so que sem
  quebra de linha automatica (util pra arte ASCII solta no meio do artigo)
- blocos de codigo com `text`, `txt`, `plain` ou `plaintext` saem com fundo
  escuro, mas sem borda nem label
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
raw ascii diagram with dark background
```

```ascii
arte solta, sem caixa nenhuma, so o texto mesmo
```
````

## O que nao usar

Os campos antigos de blog e cards como `banner`, `banner_style` e
`banner_width` nao fazem parte do fluxo de paper atual. Se a ideia e escrever
um paper, fique no modelo acima.
