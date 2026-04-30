import { codex, createSandbox } from '@ai-hero/sandcastle';
import { docker } from '@ai-hero/sandcastle/sandboxes/docker';

const LIMITE_ITERACOES_AGENTE = 5;
const TEMPO_INATIVIDADE_SEGUNDOS = 300;

export function executarCron(): void {
  void codex;
  void createSandbox;
  void docker;

  console.log(
    [
      'Sandcastle cron ainda esta em scaffold.',
      'Fase 1 criou a estrutura inicial; as proximas fases implementam GitHub, estado e execucao.',
      `Configuracao prevista: gpt-5.4, effort low, maxIterations ${String(LIMITE_ITERACOES_AGENTE)}, idleTimeoutSeconds ${String(TEMPO_INATIVIDADE_SEGUNDOS)}.`,
    ].join('\n'),
  );
}

executarCron();
