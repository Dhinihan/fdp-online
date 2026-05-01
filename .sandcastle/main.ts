import { existsSync, readFileSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import {
  formatarResultadoAgente,
  rodarAgenteSandcastle,
  validarAutenticacaoCodex,
  validarDocker,
} from './execucao-sandcastle';
import {
  adicionarLabelIssue,
  LABEL_EXECUCAO_SANDCASTLE,
  LABEL_EXECUTANDO_SANDCASTLE,
  lerComentariosIssue,
  lerIssue,
  listarIssuesCandidatas,
  removerLabelIssue,
  validarGhDisponivel,
  type ComentarioGitHub,
  type IssueGitHub,
} from './github-gh';

const LIMITE_ISSUES_POR_RODADA = 3;
const LIMITE_COMENTARIOS_CONTEXTO = 5;
const CAMINHO_ENV = new URL('.env', import.meta.url);
const CAMINHO_PROMPT = new URL('prompts/agente.md', import.meta.url);

interface OpcoesCron {
  dryRun: boolean;
}

function carregarEnvLocal(): void {
  if (existsSync(CAMINHO_ENV)) {
    loadEnvFile(CAMINHO_ENV);
  }
}

export async function executarCron(opcoes = lerOpcoesCli()): Promise<void> {
  carregarEnvLocal();
  validarGhDisponivel();
  validarAutenticacaoCodex();
  validarDocker();

  const issues = selecionarIssues(listarIssuesCandidatas());

  if (issues.length === 0) {
    console.log(`Nenhuma issue aberta com label ${LABEL_EXECUCAO_SANDCASTLE}.`);
    return;
  }

  for (const issue of issues) {
    await executarIssue(issue, opcoes);
  }
}

function selecionarIssues(issues: IssueGitHub[]): IssueGitHub[] {
  return [...issues]
    .sort((primeira, segunda) => primeira.createdAt.localeCompare(segunda.createdAt))
    .slice(0, LIMITE_ISSUES_POR_RODADA);
}

async function executarIssue(issueResumo: IssueGitHub, opcoes: OpcoesCron): Promise<void> {
  const issue = lerIssue(issueResumo.number);
  const comentarios = lerComentariosIssue(issue.number);
  const prompt = montarPromptAgente(issue, comentarios);

  if (opcoes.dryRun) {
    console.log(formatarDryRun(issue, comentarios));
    return;
  }

  adicionarLabelIssue(issue.number, LABEL_EXECUTANDO_SANDCASTLE);
  removerLabelIssue(issue.number, LABEL_EXECUCAO_SANDCASTLE);
  try {
    const resultado = await rodarAgenteSandcastle(issue, prompt);
    console.log(formatarResultadoAgente(issue, resultado));
  } finally {
    removerLabelIssue(issue.number, LABEL_EXECUTANDO_SANDCASTLE);
  }
}

function montarPromptAgente(issue: IssueGitHub, comentarios: ComentarioGitHub[]): string {
  const comentariosRecentes = comentarios.slice(-LIMITE_COMENTARIOS_CONTEXTO).map(formatarComentario).join('\n\n');
  const promptBase = lerPromptBaseAgente();

  return [
    aplicarPlaceholdersPrompt(promptBase),
    ...montarContextoIssue(issue),
    'Comentarios recentes:',
    comentariosRecentes || '(sem comentarios)',
  ].join('\n');
}

function lerPromptBaseAgente(): string {
  return readFileSync(CAMINHO_PROMPT, 'utf8').trim();
}

function aplicarPlaceholdersPrompt(promptBase: string): string {
  return promptBase
    .replaceAll('{{label_execucao}}', LABEL_EXECUCAO_SANDCASTLE)
    .replaceAll('{{label_executando}}', LABEL_EXECUTANDO_SANDCASTLE);
}

function montarContextoIssue(issue: IssueGitHub): string[] {
  return [
    'Contexto da issue:',
    `Numero: #${String(issue.number)}`,
    `Titulo: ${issue.title}`,
    `Estado: ${issue.state}`,
    `Labels: ${issue.labels.map((label) => label.name).join(', ') || 'nenhuma'}`,
    '',
    'Corpo:',
    issue.body || '(sem corpo)',
    '',
  ];
}

function formatarComentario(comentario: ComentarioGitHub): string {
  return [`Autor: ${comentario.author.login}`, `Criado em: ${comentario.createdAt}`, comentario.body].join('\n');
}

function formatarDryRun(issue: IssueGitHub, comentarios: ComentarioGitHub[]): string {
  return [
    `DRY RUN: issue #${String(issue.number)} seria enviada ao agente.`,
    `Titulo: ${issue.title}`,
    `Labels: ${issue.labels.map((label) => label.name).join(', ') || 'nenhuma'}`,
    `Comentarios no contexto: ${String(Math.min(comentarios.length, LIMITE_COMENTARIOS_CONTEXTO))}`,
  ].join('\n');
}

function lerOpcoesCli(): OpcoesCron {
  return {
    dryRun: process.argv.includes('--dry-run'),
  };
}

async function executarEntrada(): Promise<void> {
  try {
    await executarCron();
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : 'Falha desconhecida ao executar o cron.';

    console.error(mensagem);
    process.exitCode = 1;
  }
}

void executarEntrada();
