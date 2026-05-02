import { describe, expect, it } from 'vitest';
import {
  lerConfiguracaoAgente,
  MODELO_CODEX_PADRAO,
  ESFORCO_CODEX_PADRAO,
  ESFORCOS_CODEX_SUPORTADOS,
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
