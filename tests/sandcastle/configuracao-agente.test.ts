import { describe, expect, it } from 'vitest';
import { lerConfiguracaoAgente, MODELO_CODEX_PADRAO, MODELO_PI_PADRAO } from '../../.sandcastle/configuracao-agente';

describe('lerConfiguracaoAgente', () => {
  it('usa Codex por padrao quando a variavel nao esta definida', () => {
    expect(lerConfiguracaoAgente({})).toEqual({
      agente: 'codex',
      modelo: MODELO_CODEX_PADRAO,
      esforco: 'low',
    });
  });

  it('aceita Pi como agente global', () => {
    expect(lerConfiguracaoAgente({ SANDCASTLE_AGENT: 'pi' })).toEqual({
      agente: 'pi',
      modelo: MODELO_PI_PADRAO,
    });
  });

  it('falha com mensagem explicita para agente nao suportado', () => {
    expect(() => lerConfiguracaoAgente({ SANDCASTLE_AGENT: 'claude' })).toThrow(
      'Valor invalido para SANDCASTLE_AGENT: claude. Valores suportados: codex, pi.',
    );
  });
});
