import { adaptadorIssue } from './processadores/issue';
import { adaptadorPr } from './processadores/pr';
import { executarEntrada, executarRunner } from './runner';

interface OpcoesCli {
  dryRun: boolean;
  limite?: number;
}

export async function executarSandcastle(opcoes = lerOpcoesCli()): Promise<void> {
  await executarRunner({
    adaptadores: [adaptadorIssue, adaptadorPr],
    dryRun: opcoes.dryRun,
    limite: opcoes.limite,
  });
}

function lerOpcoesCli(): OpcoesCli {
  return {
    dryRun: process.argv.includes('--dry-run'),
    limite: lerLimiteCli(),
  };
}

function lerLimiteCli(): number | undefined {
  const indice = process.argv.findIndex((argumento) => argumento === '--limite');

  if (indice < 0) {
    return undefined;
  }

  if (indice + 1 >= process.argv.length) {
    throw new Error('Limite invalido: (ausente). Use --limite 3.');
  }

  const valor = process.argv[indice + 1];
  const limite = Number(valor);

  if (!Number.isInteger(limite) || limite <= 0) {
    throw new Error(`Limite invalido: ${valor}. Use --limite 3.`);
  }

  return limite;
}

void executarEntrada(() => executarSandcastle(), 'Falha desconhecida ao executar o Sandcastle.');
