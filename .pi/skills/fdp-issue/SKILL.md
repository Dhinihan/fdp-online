---
name: fdp-issue
description: Implementa uma issue do GitHub no projeto FDP. Leia AGENTS.md e a issue antes de codar. Rode testes. Abra PR.
---

## Instruções

Você vai implementar uma issue do projeto FDP (Faz De Propósito). Siga rigorosamente este fluxo.

### 1. Leitura Obrigatória

Antes de escrever qualquer código, leia nesta ordem:
1. `AGENTS.md` na raiz do projeto → regras de código, testes, qualidade.
2. `ARQUITETURA.md` na raiz → decisões arquiteturais (stack, camadas, fluxo de dados).
3. A issue no GitHub: `gh issue view <id> --json title,body,labels`

### 2. Entenda a Arquitetura

- `src/core/` ← **TypeScript puro**. Sem Phaser. Testável. TDD aqui.
- `src/adapters/phaser/` ← Render, input, scenes. Não faz TDD.
- `src/adapters/bots/` ← IA dos bots.
- `src/store/` ← Event emitter + estado.

### 3. TDD no Core (obrigatório)

No `src/core/` você DEVE usar TDD. Segue a filosofia de Matt Pocock:

**Bons testes** verificam comportamento via interfaces públicas, não detalhes de implementação. O código pode mudar por completo; os testes não devem quebrar.

**Bons testes** são estilo integração: exercitam caminhos reais através de APIs públicas. Descrevem *o que* o sistema faz, não *como* faz. Um bom teste lê como uma especificação — "usuário pode jogar uma carta válida" diz exatamente qual capacidade existe. Esses testes sobrevivem a refactors.

**Maus testes** estão acoplados à implementação. Eles mockam colaboradores internos, testam métodos privados, ou verificam por meios externos. Sinal de alerta: seu teste quebra quando você refatora, mas o comportamento não mudou.

#### Anti-padrão: Fatias Horizontais

**NUNCA escreva todos os testes antes de todo o código.** Isso é "fatiamento horizontal" — tratar RED como "escrever todos os testes" e GREEN como "escrever todo o código".

Isso produz **suítes frágeis**:
- Testes escritos sem entender a implementação
- Asserções super-especificadas que travam estrutura acidental
- Testes que passam pelos motivos errados
- Resistência a refatorar porque os testes quebram

**Abordagem correta**: Fatias verticais via tracer bullets. Um teste → uma implementação → repete. Cada teste responde ao que você aprendeu no ciclo anterior. Como você acabou de escrever o código, sabe exatamente qual comportamento importa e como verificá-lo.

```
ERRADO (horizontal):
  RED:   teste1, teste2, teste3, teste4, teste5
  GREEN: impl1, impl2, impl3, impl4, impl5

CERTO (vertical):
  RED→GREEN: teste1→impl1
  RED→GREEN: teste2→impl2
  RED→GREEN: teste3→impl3
  ...
```

#### Ciclo TDD

1. **Planeje**: Liste os comportamentos que o sistema deve suportar. Identifique a interface pública. Confirme quais comportamentos são mais importantes.
2. **Tracer Bullet**: Escreva UM teste que confirme UMA coisa sobre o sistema:
   - RED: escreva o teste → falha
   - GREEN: escreva código mínimo para passar → passa
3. **Loop Incremental**: Para cada comportamento restante:
   - RED: escreva o próximo teste → falha
   - GREEN: código mínimo para passar → passa
   - Regra: escreva o teste primeiro; código mínimo; sem refatorar durante RED/GREEN
4. **Refactor**: Depois que todos passarem, remova duplicação, melhore nomes, extraia funções. Verifique se os testes ainda passam.

#### Regras de implementação

- **Core**: comece pelo teste (TDD). 1 teste → 1 implementação → repete.
- **Adapter**: implemente o que o core precisa. Não precisa de teste unitário.
- Use nomes em **Português brasileiro**.
- Mantenha funções pequenas (máx 30 linhas, 3 parâmetros).
- Complexidade ciclomática máxima: 10.

### 4. Validação

```bash
pnpm typecheck
pnpm lint
pnpm test
```

Todos devem passar antes do commit.

### 5. Commit e PR

```bash
git add .
git commit -m "feat|fix|test|refactor: <descrição em português>"
git push origin <branch>
gh pr create --title "..." --body "Closes #<issue-id>"
```

Abra o PR e me informe o número.
