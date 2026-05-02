export const AGENTES_SUPORTADOS = ['codex', 'pi'] as const;
export const ESFORCO_CODEX_PADRAO = 'low';
export const MODELO_CODEX_PADRAO = 'gpt-5.4';
export const MODELO_PI_PADRAO = 'opencode-go';
const NOME_VARIAVEL_AGENTE = 'SANDCASTLE_AGENT';

export type AgenteSandcastle = (typeof AGENTES_SUPORTADOS)[number];

interface ConfiguracaoBaseAgente {
  agente: AgenteSandcastle;
  modelo: string;
}

export interface ConfiguracaoCodex extends ConfiguracaoBaseAgente {
  agente: 'codex';
  esforco: typeof ESFORCO_CODEX_PADRAO;
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
      modelo: MODELO_PI_PADRAO,
    };
  }

  return {
    agente,
    modelo: MODELO_CODEX_PADRAO,
    esforco: ESFORCO_CODEX_PADRAO,
  };
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
