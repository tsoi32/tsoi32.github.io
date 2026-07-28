---
title: Rich Content Guide
author: tsoi32
date: 2026-07-28
theme: computers
tags: [demo, markdown, referencia]
description: Referencia interna do que o build sabe renderizar.
cover:
  align: center
  caption: "tsoi32 :: referencia interna"
  art: |
    .------------------------------------------------------------------.
    |                                                                    |
    |                       R I C H   C O N T E N T                    |
    |                                                                    |
    '------------------------------------------------------------------'
links:
  source: https://codeberg.org/tsoi32
---

> NOTE: Este paper existe só pra eu conferir se o build ainda sabe
> renderizar cada elemento depois de mexer no CSS. Não é conteúdo de
> verdade, é referência interna.

> WARN: Se algum bloco abaixo sair torto (tabela sem borda, code sem
> cor, callout sem caixa), é sinal de regressão no build.js ou no
> style.css.

> Isso aqui é uma citação comum, sem NOTE nem WARN na frente — vira
> uma caixa de quote genérica em vez de nota ou aviso.

## Texto e formatação inline

Parágrafo comum com **negrito**, *itálico* e `código inline`. Também dá
pra linkar tipo [codeberg](https://codeberg.org/tsoi32) no meio do
texto.

- item de lista
- outro item
  - sub-item de segundo nível
- último item

1. primeiro passo
2. segundo passo
3. terceiro passo

## Imagem

![tela de terminal genérica](wesuck.jpg)

## Tabela

| linguagem | ano  | paradigma       |
|-----------|------|-----------------|
| C         | 1972 | procedural      |
| Lisp      | 1958 | funcional       |
| Rust      | 2010 | multi-paradigma |

## Blocos de código

```c
int main(void) {
    return 0;
}
```

```bash
#!/usr/bin/env bash
echo "build ok"
```

```python
def main():
    print("build ok")

if __name__ == "__main__":
    main()
```

## Ascii art

```text
   .--.
  |o_o |
  |:_/ |
 //   \ \
(|     | )
/'\_   _/`\
\___)=(___/
```

## Fluxo em ascii

```text
[ MARKDOWN ]
      |
      v
[ marked.lexer ]
      |
      v
[ renderPaperToken ]
      |
      v
[ escapeHtml + decorate ]
      |
      v
[ PAGINA ]
```
