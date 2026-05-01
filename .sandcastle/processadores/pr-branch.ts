import { spawnSync } from 'node:child_process';
import type { PullRequestGitHub } from '../github';

export function validarBranchLocalPr(pr: PullRequestGitHub): void {
  validarPrMesmoRepositorio(pr);

  const referencia = resolverReferenciaPr(pr);
  const shaLocal = lerShaReferencia(pr, referencia);

  validarShaBranchLocal(pr, referencia, shaLocal);
  garantirBranchLocal(pr, shaLocal);
}

function validarPrMesmoRepositorio(pr: PullRequestGitHub): void {
  if (!pr.isCrossRepository) {
    return;
  }

  throw new Error(
    [
      `PR #${String(pr.number)} vem de fork: ${formatarHeadPr(pr)}.`,
      'O runner precisa resolver explicitamente a branch remota do fork antes de executar o agente nessa PR.',
    ].join('\n'),
  );
}

function resolverReferenciaPr(pr: PullRequestGitHub): string {
  const referencias = [
    `refs/heads/${pr.headRefName}`,
    `refs/remotes/origin/${pr.headRefName}`,
    `refs/pull/${String(pr.number)}/head`,
  ];

  for (const referencia of referencias) {
    const sha = lerShaReferenciaOpcional(referencia);

    if (sha === pr.headRefOid) {
      return referencia;
    }
  }

  throw new Error(
    [
      `Branch da PR #${String(pr.number)} nao resolvida localmente: ${formatarHeadPr(pr)}.`,
      'Busque uma ref local, remota ou refs/pull/*/head apontando para o head exato da PR antes de rodar o agente.',
    ].join('\n'),
  );
}

function lerShaReferencia(pr: PullRequestGitHub, referencia: string): string {
  const resultado = spawnSync('git', ['rev-parse', referencia], {
    encoding: 'utf8',
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (resultado.status === 0) {
    return resultado.stdout.trim();
  }

  throw new Error(
    [
      `Branch da PR #${String(pr.number)} nao resolvida localmente: ${formatarHeadPr(pr)}.`,
      'Evite usar apenas headRefName; a execucao deve apontar para o head exato da PR antes de rodar o agente.',
    ].join('\n'),
  );
}

function lerShaReferenciaOpcional(referencia: string): string | null {
  const resultado = spawnSync('git', ['rev-parse', referencia], {
    encoding: 'utf8',
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return resultado.status === 0 ? resultado.stdout.trim() : null;
}

function validarShaBranchLocal(pr: PullRequestGitHub, referencia: string, shaLocal: string): void {
  if (shaLocal !== pr.headRefOid) {
    throw new Error(
      [
        `Branch local divergente para a PR #${String(pr.number)}.`,
        `Esperado: ${pr.headRefOid}.`,
        `Encontrado em ${referencia}: ${shaLocal}.`,
        `Head informado pelo GitHub: ${formatarHeadPr(pr)}.`,
      ].join('\n'),
    );
  }
}

function formatarHeadPr(pr: PullRequestGitHub): string {
  return `${pr.headRepositoryOwner.login}:${pr.headRefName} @ ${pr.headRefOid}`;
}

function garantirBranchLocal(pr: PullRequestGitHub, sha: string): void {
  const referencia = `refs/heads/${pr.headRefName}`;
  const shaLocal = lerShaReferenciaOpcional(referencia);

  if (shaLocal === sha) {
    return;
  }

  const resultado = spawnSync('git', ['update-ref', referencia, sha], {
    encoding: 'utf8',
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (resultado.status !== 0) {
    throw new Error(
      [
        `Falha ao materializar a branch local da PR #${String(pr.number)}.`,
        `Ref alvo: ${referencia}.`,
        `SHA esperado: ${sha}.`,
      ].join('\n'),
    );
  }
}
