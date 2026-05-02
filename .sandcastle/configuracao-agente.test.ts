import { describe, expect, it } from 'vitest';
import {
  lerConfiguracaoAgente,
  MODELO_CODEX_PADRAO,
  ESFORCO_CODEX_PADRAO,
  ESFORCOS_CODEX_SUPORTADOS,
  MODELO_PI_PADRAO,
  ESFORCO_PI_PADRAO,
  ESFORCOS_PI_SUPORTADOS,
} from './configuracao-agente';

describe('agente padrao', () => {
  it('retorna codex quando SANDCASTLE_AGENT nao esta definido', () => {
    const config = lerConfiguracaoAgente({});

    expect(config.agente).toBe('codex');
  });

  it('lanca erro para agente invalido', () => {
    expect(() => lerConfiguracaoAgente({ SANDCASTLE_AGENT: 'invalido' })).toThrow(
      /Valor invalido para SANDCASTLE_AGENT/,
    );
  });
});

describe('modelo do Codex', () => {
  it('usa modelo padrao quando override nao esta definido', () => {
    const config = lerConfiguracaoAgente({});

    expect(config.agente).toBe('codex');
    if (config.agente === 'codex') {
      expect(config.modelo).toBe(MODELO_CODEX_PADRAO);
    }
  });

  it('usa override quando SANDCASTLE_CODEX_MODEL esta definido', () => {
    const config = lerConfiguracaoAgente({ SANDCASTLE_CODEX_MODEL: 'gpt-4o' });

    expect(config.agente).toBe('codex');
    if (config.agente === 'codex') {
      expect(config.modelo).toBe('gpt-4o');
    }
  });

  it('ignora override quando agente e pi', () => {
    const config = lerConfiguracaoAgente({
      SANDCASTLE_AGENT: 'pi',
      SANDCASTLE_CODEX_MODEL: 'gpt-4o',
    });

    expect(config.agente).toBe('pi');
    if (config.agente === 'pi') {
      expect(config.modelo).not.toBe('gpt-4o');
    }
  });
});

describe('esforco do Codex', () => {
  it('usa esforco padrao quando override nao esta definido', () => {
    const config = lerConfiguracaoAgente({});

    expect(config.agente).toBe('codex');
    if (config.agente === 'codex') {
      expect(config.esforco).toBe(ESFORCO_CODEX_PADRAO);
    }
  });

  it.each(ESFORCOS_CODEX_SUPORTADOS)('aceita esforco valido: %s', (esforco) => {
    const config = lerConfiguracaoAgente({ SANDCASTLE_CODEX_EFFORT: esforco });

    expect(config.agente).toBe('codex');
    if (config.agente === 'codex') {
      expect(config.esforco).toBe(esforco);
    }
  });

  it('lanca erro para esforco invalido', () => {
    expect(() => lerConfiguracaoAgente({ SANDCASTLE_CODEX_EFFORT: 'extreme' })).toThrow(
      /Valor invalido para SANDCASTLE_CODEX_EFFORT/,
    );
  });

  it('aceita esforco em maiusculas (case-insensitive)', () => {
    const config = lerConfiguracaoAgente({ SANDCASTLE_CODEX_EFFORT: 'HIGH' });

    expect(config.agente).toBe('codex');
    if (config.agente === 'codex') {
      expect(config.esforco).toBe('high');
    }
  });
});

describe('modelo do Pi', () => {
  it('usa modelo padrao quando override nao esta definido', () => {
    const config = lerConfiguracaoAgente({ SANDCASTLE_AGENT: 'pi' });

    expect(config.agente).toBe('pi');
    if (config.agente === 'pi') {
      expect(config.modelo).toBe(MODELO_PI_PADRAO);
    }
  });

  it('usa override quando SANDCASTLE_PI_MODEL esta definido', () => {
    const config = lerConfiguracaoAgente({ SANDCASTLE_AGENT: 'pi', SANDCASTLE_PI_MODEL: 'outro-modelo' });

    expect(config.agente).toBe('pi');
    if (config.agente === 'pi') {
      expect(config.modelo).toBe('outro-modelo');
    }
  });

  it('lanca erro quando modelo e explicitamente vazio', () => {
    expect(() => lerConfiguracaoAgente({ SANDCASTLE_AGENT: 'pi', SANDCASTLE_PI_MODEL: '   ' })).toThrow(
      /Valor invalido para SANDCASTLE_PI_MODEL/,
    );
  });
});

describe('esforco do Pi', () => {
  it('usa esforco padrao quando override nao esta definido', () => {
    const config = lerConfiguracaoAgente({ SANDCASTLE_AGENT: 'pi' });

    expect(config.agente).toBe('pi');
    if (config.agente === 'pi') {
      expect(config.esforco).toBe(ESFORCO_PI_PADRAO);
    }
  });

  it.each(ESFORCOS_PI_SUPORTADOS)('aceita esforco valido: %s', (esforco) => {
    const config = lerConfiguracaoAgente({ SANDCASTLE_AGENT: 'pi', SANDCASTLE_PI_EFFORT: esforco });

    expect(config.agente).toBe('pi');
    if (config.agente === 'pi') {
      expect(config.esforco).toBe(esforco);
    }
  });

  it('lanca erro para esforco invalido', () => {
    expect(() => lerConfiguracaoAgente({ SANDCASTLE_AGENT: 'pi', SANDCASTLE_PI_EFFORT: 'extreme' })).toThrow(
      /Valor invalido para SANDCASTLE_PI_EFFORT/,
    );
  });

  it('aceita esforco em maiusculas (case-insensitive)', () => {
    const config = lerConfiguracaoAgente({ SANDCASTLE_AGENT: 'pi', SANDCASTLE_PI_EFFORT: 'HIGH' });

    expect(config.agente).toBe('pi');
    if (config.agente === 'pi') {
      expect(config.esforco).toBe('high');
    }
  });
});
