import { spawnSync } from 'node:child_process';

export interface ResultadoGh {
  stdout: string;
  stderr: string;
  status: number | null;
}

export function validarGhDisponivel(): void {
  executarGh(['auth', 'status']);
}

export function executarGhJson(argumentos: string[]): unknown {
  const resultado = executarGh(argumentos);

  return JSON.parse(resultado.stdout) as unknown;
}

export function executarGh(argumentos: string[]): ResultadoGh {
  const resultado = executarGhSemErro(argumentos);

  if (resultado.status !== 0) {
    throw new Error(formatarErroGh(argumentos, resultado));
  }

  return resultado;
}

export function executarGhSemErro(argumentos: string[]): ResultadoGh {
  const resultado = spawnSync('gh', argumentos, {
    encoding: 'utf8',
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return {
    stdout: resultado.stdout,
    stderr: resultado.stderr,
    status: resultado.status,
  };
}

function formatarErroGh(argumentos: string[], resultado: ResultadoGh): string {
  const comando = ['gh', ...argumentos].join(' ');
  const detalhe = resultado.stderr.trim() || resultado.stdout.trim() || 'sem detalhes do gh';

  return `Falha ao executar ${comando}: ${detalhe}`;
}
