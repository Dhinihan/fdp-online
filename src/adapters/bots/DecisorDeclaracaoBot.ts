import { avaliarCartas, type CategoriaCarta } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import type { DecisorDeclaracao } from '@/core/portas/DecisorDeclaracao';
import type { GeradorAleatorio } from '@/core/RngComSeed';
import type { EstadoRodada } from '@/types/estado-rodada';
import type { LoggerDebugBot } from './logger-debug-bot';

export interface ParametrosDeclaracaoBot {
  poucasBaixas: number;
  declaracaoBaixa: number;
  logger?: LoggerDebugBot;
}

export const parametrosDeclaracaoBotPadrao: ParametrosDeclaracaoBot = {
  poucasBaixas: 1,
  declaracaoBaixa: 1,
};

export class DecisorDeclaracaoBot implements DecisorDeclaracao {
  private readonly temperatura: number;
  private readonly rng: GeradorAleatorio;
  private readonly parametros: ParametrosDeclaracaoBot;
  private readonly logger?: LoggerDebugBot;

  constructor(temperatura: number, rng: GeradorAleatorio, parametros = parametrosDeclaracaoBotPadrao) {
    this.temperatura = temperatura;
    this.rng = rng;
    this.parametros = parametros;
    this.logger = parametros.logger;
  }

  declarar(estado: EstadoRodada, mao: Carta[]): Promise<number> {
    if (estado.fase === 'distribuindo') return Promise.resolve(0);

    const avaliadas = avaliarCartas(mao, estado.manilha, cartasPublicas(estado), estado.maos.length);
    const contagemSegura = contarCategorias(
      avaliadas.map((avaliada) => avaliada.categoria),
      ['segura', 'garantida_agora'],
    );
    const altasSorteadas = avaliadas
      .filter((avaliada) => avaliada.categoria === 'alta')
      .map(() => this.sortearContagem());
    const contagemAltas = altasSorteadas.filter((sorteio) => sorteio.conta).length;
    const defensivo = this.deveDeclararDefensivo(
      avaliadas.map((avaliada) => avaliada.categoria),
      contagemSegura + contagemAltas,
    );
    const contagemDefensiva = defensivo ? 1 : 0;
    const declaracao = Math.min(mao.length, Math.max(0, contagemSegura + contagemAltas + contagemDefensiva));

    this.logger?.registrarDeclaracao({
      mao: avaliadas,
      seguras: contagemSegura,
      altas: contagemAltas,
      sorteouAlta: altasSorteadas.some((sorteio) => sorteio.conta),
      defensivo,
      declaracao,
    });

    return Promise.resolve(declaracao);
  }

  private deveDeclararDefensivo(categorias: CategoriaCarta[], declaracao: number): boolean {
    const baixas = contarCategorias(categorias, ['baixa']);
    return declaracao <= this.parametros.declaracaoBaixa && baixas <= this.parametros.poucasBaixas && this.deveContar();
  }

  private deveContar(): boolean {
    return this.rng.random() < 1 - this.temperatura;
  }

  private sortearContagem(): { conta: boolean } {
    return { conta: this.deveContar() };
  }
}

function contarCategorias(categorias: CategoriaCarta[], esperadas: CategoriaCarta[]): number {
  return categorias.filter((categoria) => esperadas.includes(categoria)).length;
}

function cartasPublicas(estado: EstadoRodada): Carta[] {
  if (estado.fase === 'distribuindo') return [];

  const cartasEmMaos = estado.maos.flatMap((mao) => mao.cartas);
  return estado.cartasReveladas.filter((carta) => !cartasEmMaos.some((emMao) => cartasIguais(emMao, carta)));
}

function cartasIguais(a: Carta, b: Carta): boolean {
  return a.valor === b.valor && a.naipe === b.naipe;
}
