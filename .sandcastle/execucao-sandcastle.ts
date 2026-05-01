import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { codex, run, type RunResult } from '@ai-hero/sandcastle';
import { docker } from '@ai-hero/sandcastle/sandboxes/docker';
import type { IssueGitHub } from './github-gh';

const MODELO_CODEX = 'gpt-5.4';
const NOME_IMAGEM_SANDCASTLE = 'sandcastle:fdp-online';
const CAMINHO_AUTH_CODEX = `${homedir()}/.codex/auth.json`;
const CAMINHO_CONFIG_DOCKER = `${homedir()}/.docker/config.json`;

export function validarAutenticacaoCodex(): void {
  if (process.env.OPENAI_API_KEY?.trim()) {
    return;
  }

  if (!existsSync(CAMINHO_AUTH_CODEX)) {
    throw new Error('Rode `codex login` ou defina OPENAI_API_KEY em .sandcastle/.env antes do cron.');
  }
}

export function validarDocker(): void {
  validarCredsStoreDocker();
  validarImagemSandcastle();
}

export async function rodarAgenteSandcastle(issue: IssueGitHub, prompt: string): Promise<RunResult> {
  const branch = `sandcastle-issue-${String(issue.number)}`;

  return run({
    agent: codex(MODELO_CODEX, { effort: 'low', env: montarEnvAgente() }),
    sandbox: docker({
      imageName: NOME_IMAGEM_SANDCASTLE,
      mounts: montarMountsDocker(),
      env: montarEnvSandbox(),
    }),
    cwd: process.cwd(),
    prompt,
    maxIterations: 5,
    idleTimeoutSeconds: 300,
    branchStrategy: { type: 'branch', branch },
    logging: { type: 'stdout' },
    name: `issue-${String(issue.number)}`,
  });
}

export function formatarResultadoAgente(issue: IssueGitHub, resultado: RunResult): string {
  return [
    `Issue #${String(issue.number)} processada pelo Sandcastle.`,
    `Branch: ${resultado.branch}`,
    `Commits: ${String(resultado.commits.length)}`,
    resultado.logFilePath ? `Log: ${resultado.logFilePath}` : null,
  ]
    .filter((linha): linha is string => Boolean(linha))
    .join('\n');
}

function montarEnvAgente(): Record<string, string> {
  return {
    ...(process.env.OPENAI_API_KEY ? { OPENAI_API_KEY: process.env.OPENAI_API_KEY } : {}),
  };
}

function montarEnvSandbox(): Record<string, string> {
  return {
    ...(process.env.GITHUB_TOKEN ? { GH_TOKEN: process.env.GITHUB_TOKEN } : {}),
  };
}

function montarMountsDocker(): { hostPath: string; sandboxPath: string; readonly?: boolean }[] {
  if (process.env.OPENAI_API_KEY || !existsSync(CAMINHO_AUTH_CODEX)) {
    return [];
  }

  return [{ hostPath: CAMINHO_AUTH_CODEX, sandboxPath: '/home/agent/.codex/auth.json', readonly: true }];
}

function validarCredsStoreDocker(): void {
  if (!existsSync(CAMINHO_CONFIG_DOCKER)) {
    return;
  }

  const conteudo = readFileSync(CAMINHO_CONFIG_DOCKER, 'utf8');
  const configuracao = JSON.parse(conteudo) as { credsStore?: string };

  if (configuracao.credsStore === 'desktop.exe') {
    throw new Error(
      [
        'Configuracao do Docker invalida para este ambiente: ~/.docker/config.json usa `credsStore: "desktop.exe"`.',
        'No WSL/Linux isso costuma gerar `docker: error getting credentials ... exec format error`.',
        'Ajuste o arquivo para remover `credsStore` ou use um helper compativel com Linux antes de rodar o cron.',
      ].join('\n'),
    );
  }
}

function validarImagemSandcastle(): void {
  const resultado = spawnSync('docker', ['image', 'inspect', NOME_IMAGEM_SANDCASTLE], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (resultado.status === 0) {
    return;
  }

  throw new Error(
    [
      `Imagem Docker ausente: ${NOME_IMAGEM_SANDCASTLE}.`,
      'Crie a imagem antes de rodar o cron com:',
      'pnpm sandcastle:build',
    ].join('\n'),
  );
}
