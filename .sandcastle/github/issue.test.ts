import { expect, it } from 'vitest';
import { atualizarSecaoBlockedBy } from './issue';

const CORPO_BASE = [
  '## What to build',
  '',
  'Implementar o fluxo.',
  '',
  '## Acceptance criteria',
  '',
  '- [ ] Funciona',
].join('\n');
const CORPO_COM_BLOCKED_BY = [
  '## What to build',
  '',
  'Implementar o fluxo.',
  '',
  '## Blocked by',
  '',
  '- #40',
  '',
  '## Acceptance criteria',
  '',
  '- [ ] Funciona',
].join('\n');
const CORPO_ESPERADO_COM_NOVA_SECAO = [
  '## What to build',
  '',
  'Implementar o fluxo.',
  '',
  '## Acceptance criteria',
  '',
  '- [ ] Funciona',
  '',
  '## Blocked by',
  '',
  '- #49',
  '- #52',
].join('\n');
const CORPO_ESPERADO_COM_SECAO_ATUALIZADA = [
  '## What to build',
  '',
  'Implementar o fluxo.',
  '',
  '## Blocked by',
  '',
  '- #52',
  '',
  '## Acceptance criteria',
  '',
  '- [ ] Funciona',
].join('\n');

it('cria a secao no fim do corpo quando ela nao existe', () => {
  expect(atualizarSecaoBlockedBy(CORPO_BASE, [49, 52])).toBe(CORPO_ESPERADO_COM_NOVA_SECAO);
});

it('atualiza a secao existente sem duplicar o titulo', () => {
  expect(atualizarSecaoBlockedBy(CORPO_COM_BLOCKED_BY, [52])).toBe(CORPO_ESPERADO_COM_SECAO_ATUALIZADA);
});

it('normaliza dependencias repetidas e ordena as referencias', () => {
  expect(atualizarSecaoBlockedBy('', [52, 49, 52])).toBe(['## Blocked by', '', '- #49', '- #52'].join('\n'));
});
