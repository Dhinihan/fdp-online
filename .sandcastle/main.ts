import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { loadEnvFile } from 'node:process';
import { codex, createSandbox } from '@ai-hero/sandcastle';
import { docker } from '@ai-hero/sandcastle/sandboxes/docker';
import { validarGhDisponivel } from './github-gh';

const LIMITE_ITERACOES_AGENTE = 5;
const TEMPO_INATIVIDADE_SEGUNDOS = 300;
const CAMINHO_ENV = new URL('.env', import.meta.url);
const CAMINHO_AUTH_CODEX = `${homedir()}/.codex/auth.json`;

type ModoAutenticacaoCodex = 'chatgpt' | 'api';

interface ConfiguracaoLocal {
  githubToken: string;
  modoAutenticacaoCodex: ModoAutenticacaoCodex;
  openaiApiKey?: string;
}

function carregarEnvLocal(): void {
  if (existsSync(CAMINHO_ENV)) {
    loadEnvFile(CAMINHO_ENV);
  }
}

function lerVariavelObrigatoria(nome: 'GITHUB_TOKEN'): string {
  const valor = process.env[nome]?.trim();

  if (!valor) {
    throw new Error(`Configuracao ausente: defina ${nome} em .sandcastle/.env antes de rodar o cron.`);
  }

  return valor;
}

function lerOpenAiApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim() || undefined;
}

function validarLoginCodexChatGpt(): void {
  if (!existsSync(CAMINHO_AUTH_CODEX)) {
    throw new Error(
      'Configuracao ausente: faca login no Codex com ChatGPT (`codex login`) ou defina OPENAI_API_KEY em .sandcastle/.env.',
    );
  }

  const resultado = spawnSync('codex', ['login', 'status'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const saida = `${resultado.stdout}${resultado.stderr}`;

  if (resultado.status !== 0 || !saida.includes('Logged in using ChatGPT')) {
    throw new Error(
      'Configuracao ausente: nao foi possivel validar login do Codex. Rode `codex login` ou defina OPENAI_API_KEY em .sandcastle/.env.',
    );
  }
}

function carregarConfiguracaoLocal(): ConfiguracaoLocal {
  carregarEnvLocal();
  const openaiApiKey = lerOpenAiApiKey();

  if (openaiApiKey) {
    return {
      githubToken: lerVariavelObrigatoria('GITHUB_TOKEN'),
      modoAutenticacaoCodex: 'api',
      openaiApiKey,
    };
  }

  validarLoginCodexChatGpt();

  return {
    githubToken: lerVariavelObrigatoria('GITHUB_TOKEN'),
    modoAutenticacaoCodex: 'chatgpt',
  };
}

export function executarCron(configuracao = carregarConfiguracaoLocal()): void {
  validarGhDisponivel();

  void codex;
  void createSandbox;
  void docker;
  void configuracao.githubToken;
  void configuracao.modoAutenticacaoCodex;
  void configuracao.openaiApiKey;

  console.log(
    [
      'Sandcastle cron ainda esta em scaffold.',
      `Configuracao local carregada com sucesso. Autenticacao do Codex: ${configuracao.modoAutenticacaoCodex}.`,
      'Integracao com GitHub via gh validada com sucesso.',
      'As proximas fases implementam selecao, elegibilidade, retry e execucao.',
      `Configuracao prevista: gpt-5.4, effort low, maxIterations ${String(LIMITE_ITERACOES_AGENTE)}, idleTimeoutSeconds ${String(TEMPO_INATIVIDADE_SEGUNDOS)}.`,
    ].join('\n'),
  );
}

function executarEntrada(): void {
  try {
    executarCron();
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : 'Falha desconhecida ao iniciar o cron.';

    console.error(mensagem);
    process.exitCode = 1;
  }
}

executarEntrada();
