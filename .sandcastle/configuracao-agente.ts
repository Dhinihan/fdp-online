export const AGENTES_SUPORTADOS = ['codex', 'pi'] as const;
export const ESFORCOS_CODEX_SUPORTADOS = ['low', 'medium', 'high', 'xhigh'] as const;
export const ESFORCO_CODEX_PADRAO = 'low';
export const MODELO_CODEX_PADRAO = 'gpt-5.4';
export const MODELO_PI_PADRAO = 'opencode-go/mimo-v2-pro';
const NOME_VARIAVEL_AGENTE = 'SANDCASTLE_AGENT';
const NOME_VARIAVEL_MODELO_CODEX = 'SANDCASTLE_CODEX_MODEL';
const NOME_VARIAVEL_ESFORCO_CODEX = 'SANDCASTLE_CODEX_EFFORT';
const NOME_VARIAVEL_MODELO_PI = 'SANDCASTLE_PI_MODEL';

export type AgenteSandcastle = (typeof AGENTES_SUPORTADOS)[number];
export type EsforcoCodex = (typeof ESFORCOS_CODEX_SUPORTADOS)[number];

interface ConfiguracaoBaseAgente {
  agente: AgenteSandcastle;
  modelo: string;
}

export interface ConfiguracaoCodex extends ConfiguracaoBaseAgente {
  agente: 'codex';
  esforco: EsforcoCodex;
}

export interface ConfiguracaoPi extends ConfiguracaoBaseAgente {
  agente: 'pi';
}

export type ConfiguracaoAgente = ConfiguracaoCodex | ConfiguracaoPi;

export function lerConfiguracaoAgente(env = process.env): ConfiguracaoAgente {
  const agente = lerAgente(env);

  if (agente === 'pi') {
    return {
      agente,
      modelo: lerModeloPi(env),
    };
  }

  return {
    agente,
    modelo: lerModeloCodex(env),
    esforco: lerEsforcoCodex(env),
  };
}

function lerModeloCodex(env: NodeJS.ProcessEnv): string {
  const valor = env[NOME_VARIAVEL_MODELO_CODEX]?.trim();

  return valor || MODELO_CODEX_PADRAO;
}

function lerEsforcoCodex(env: NodeJS.ProcessEnv): EsforcoCodex {
  const valor = env[NOME_VARIAVEL_ESFORCO_CODEX]?.trim().toLowerCase();

  if (!valor) {
    return ESFORCO_CODEX_PADRAO;
  }

  if (ESFORCOS_CODEX_SUPORTADOS.includes(valor as EsforcoCodex)) {
    return valor as EsforcoCodex;
  }

  throw new Error(
    `Valor invalido para ${NOME_VARIAVEL_ESFORCO_CODEX}: ${valor}. Valores suportados: ${ESFORCOS_CODEX_SUPORTADOS.join(', ')}.`,
  );
}

function lerModeloPi(env: NodeJS.ProcessEnv): string {
  return env[NOME_VARIAVEL_MODELO_PI]?.trim() || MODELO_PI_PADRAO;
}

function lerAgente(env: NodeJS.ProcessEnv): AgenteSandcastle {
  const valorCru = env[NOME_VARIAVEL_AGENTE]?.trim().toLowerCase();

  if (!valorCru) {
    return 'codex';
  }

  if (valorCru === 'codex' || valorCru === 'pi') {
    return valorCru;
  }

  throw new Error(
    `Valor invalido para ${NOME_VARIAVEL_AGENTE}: ${valorCru}. Valores suportados: ${AGENTES_SUPORTADOS.join(', ')}.`,
  );
}
