import { describe, expect, it } from 'vitest';
import { analisarBlockedBy } from './bloqueios-issue';

function esperarInvalido(corpo: string, motivo: string): void {
  expect(analisarBlockedBy(corpo)).toEqual({
    status: 'invalido',
    motivo,
  });
}

describe('analisarBlockedBy', () => {
  it('aceita uma secao valida com referencias de issue', () => {
    const resultado = analisarBlockedBy(
      ['## What to build', 'texto', '', '## Blocked by', '', '- #12', '- #34'].join('\n'),
    );

    expect(resultado).toEqual({
      status: 'valido',
      dependencias: [12, 34],
    });
  });

  it('marca como invalido quando a secao esta ausente', () => {
    esperarInvalido('## What to build\n\ntexto', 'secao `## Blocked by` ausente');
  });

  it('marca como invalido quando a secao esta vazia', () => {
    esperarInvalido('## Blocked by\n\n## Acceptance criteria', 'secao `## Blocked by` vazia');
  });

  it('marca como invalido quando a secao esta duplicada', () => {
    esperarInvalido('## Blocked by\n\n- #1\n\n## Blocked by\n\n- #2', 'secao `## Blocked by` duplicada');
  });

  it('marca como invalido quando uma linha nao tem referencia numerica', () => {
    esperarInvalido(
      '## Blocked by\n\n- depende da base',
      'secao `## Blocked by` contem linha ilegivel sem referencia `#123`',
    );
  });

  it('marca como invalido quando a secao cita PR explicitamente', () => {
    esperarInvalido('## Blocked by\n\n- PR #12', 'secao `## Blocked by` referencia PR em vez de issue');
  });
});
