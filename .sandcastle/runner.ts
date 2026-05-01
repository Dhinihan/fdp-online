import { existsSync, readFileSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import {
  validarAutenticacaoCodex,
  validarDocker,
  formatarResultadoAgente,
  rodarAgenteSandcastle,
} from './execucao-sandcastle';
import { validarGhDisponivel } from './github';
import type { AdaptadorGenerico, ItemFila } from './processadores/tipos';

const CAMINHO_ENV = new URL('.env', import.meta.url);
const LIMITE_ITENS_POR_RODADA = 3;

interface OpcoesRunner {
  adaptadores: AdaptadorGenerico[];
  dryRun?: boolean;
  limite?: number;
}

interface EntradaFila {
  item: ItemFila;
  adaptador: AdaptadorGenerico;
}

export function prepararAmbiente(): void {
  carregarEnvLocal();
  validarGhDisponivel();
  validarAutenticacaoCodex();
  validarDocker();
}

export function lerArquivo(caminho: URL): string {
  return readFileSync(caminho, 'utf8').trim();
}

export async function executarEntrada(executar: () => Promise<void>, mensagemErroPadrao: string): Promise<void> {
  try {
    await executar();
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : mensagemErroPadrao;

    console.error(mensagem);
    process.exitCode = 1;
  }
}

export async function executarRunner(opcoes: OpcoesRunner): Promise<void> {
  prepararAmbiente();

  const fila = await montarFila(opcoes.adaptadores, opcoes.limite ?? LIMITE_ITENS_POR_RODADA);

  if (fila.length === 0) {
    console.log('Nenhum item elegivel para o Sandcastle.');
    return;
  }

  for (const entrada of fila) {
    await executarEntrada(
      () => processarEntrada(entrada, Boolean(opcoes.dryRun)),
      `Falha ao processar ${entrada.item.tipo} #${String(entrada.item.numero)}.`,
    );
  }
}

async function montarFila(adaptadores: AdaptadorGenerico[], limite: number): Promise<EntradaFila[]> {
  const entradas = await Promise.all(adaptadores.map(listarEntradasAdaptador));

  return entradas.flat().sort(compararEntradasFila).slice(0, limite);
}

async function listarEntradasAdaptador(adaptador: AdaptadorGenerico): Promise<EntradaFila[]> {
  const itens = await adaptador.listarElegiveis();

  return itens.map((item) => ({ item, adaptador }));
}

async function processarEntrada(entrada: EntradaFila, dryRun: boolean): Promise<void> {
  const item = await entrada.adaptador.carregarItem(entrada.item.numero);
  const motivoItem = entrada.adaptador.avaliarElegibilidade(item);

  if (motivoItem) {
    console.log(motivoItem);
    return;
  }

  const contexto = await entrada.adaptador.coletarContexto(item);
  const motivoContexto = entrada.adaptador.avaliarContexto?.(item, contexto);

  if (motivoContexto) {
    console.log(motivoContexto);
    return;
  }

  if (dryRun) {
    console.log(entrada.adaptador.formatarDryRun(item, contexto));
    return;
  }

  await executarAgenteParaEntrada(entrada, item, contexto);
}

async function executarAgenteParaEntrada(entrada: EntradaFila, item: unknown, contexto: unknown): Promise<void> {
  const branch = entrada.adaptador.obterBranch(item);
  const prompt = entrada.adaptador.montarPrompt(item, contexto);
  let lockAdquirido = false;

  try {
    await entrada.adaptador.fazerLock(item);
    lockAdquirido = true;
    const resultado = await rodarAgenteSandcastle(prompt, branch);
    console.log(formatarResultadoAgente(entrada.item.tipo, entrada.item.numero, resultado));
  } finally {
    if (lockAdquirido) {
      await entrada.adaptador.desfazerLock(item);
    }
  }
}

function compararEntradasFila(primeira: EntradaFila, segunda: EntradaFila): number {
  return (
    primeira.item.criadoEm.localeCompare(segunda.item.criadoEm) ||
    primeira.item.tipo.localeCompare(segunda.item.tipo) ||
    primeira.item.numero - segunda.item.numero
  );
}

function carregarEnvLocal(): void {
  if (existsSync(CAMINHO_ENV)) {
    loadEnvFile(CAMINHO_ENV);
  }
}
