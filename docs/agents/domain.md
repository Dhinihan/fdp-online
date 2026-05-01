# Domain Docs

Como as skills de engenharia podem encontrar documentação de domínio e de arquitetura neste repositório ao explorar a base de código.

## Fontes de informação disponíveis

- **`AGENTS.md`** na raiz: convenções de código, testes, qualidade e fluxo de trabalho.
- **`REGRAS.md`** na raiz: regras do jogo, fluxo da partida, pontuação e casos especiais.
- **`CONTEXT.md`** na raiz: vocabulário canônico do domínio e ambiguidades já resolvidas.
- **`ARQUITETURA.md`** na raiz: decisões arquiteturais do projeto, camadas e responsabilidades.
- **`docs/adr/`**: decisões arquiteturais registradas que merecem memória institucional.

Se `REGRAS.md`, `CONTEXT.md` ou `docs/adr/` não existirem, prossiga silenciosamente. Não sinalize a ausência nem sugira criá-los de antemão.

## Layout

Este repositório está configurado como **single-context**.

Estrutura esperada quando a documentação existir:

```text
/
├── AGENTS.md
├── REGRAS.md
├── ARQUITETURA.md
├── CONTEXT.md
├── docs/adr/
└── src/
```

## Vocabulário

Ao nomear conceitos de domínio, prefira o vocabulário definido em `CONTEXT.md`. Para regras do jogo e fluxo da partida, `REGRAS.md` concentra a referência canônica. Na ausência deles, `AGENTS.md` e `ARQUITETURA.md` ajudam a recuperar a terminologia usada no projeto.

## Conflitos com ADR

Se uma proposta contrariar um ADR existente, sinalize isso explicitamente em vez de sobrescrever a decisão silenciosamente.
