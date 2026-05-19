import { avaliarCartas, type CategoriaCarta } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import type { DecisorDeclaracao } from '@/core/portas/DecisorDeclaracao';
import type { GeradorAleatorio } from '@/core/RngComSeed';
import type { EstadoRodada } from '@/types/estado-rodada';

export interface ParametrosDeclaracaoBot {
  poucasBaixas: number;
  declaracaoBaixa: number;
}

export const parametrosDeclaracaoBotPadrao: ParametrosDeclaracaoBot = {
  poucasBaixas: 1,
  declaracaoBaixa: 1,
};

export class DecisorDeclaracaoBot implements DecisorDeclaracao {
  private readonly temperatura: number;
  private readonly rng: GeradorAleatorio;
  private readonly parametros: ParametrosDeclaracaoBot;

  constructor(temperatura: number, rng: GeradorAleatorio, parametros = parametrosDeclaracaoBotPadrao) {
    this.temperatura = temperatura;
    this.rng = rng;
    this.parametros = parametros;
  }

  declarar(estado: EstadoRodada, mao: Carta[]): Promise<number> {
    if (estado.fase === 'distribuindo') return Promise.resolve(0);

    const avaliadas = avaliarCartas(mao, estado.manilha, cartasPublicas(estado), estado.maos.length);
    const contagemSegura = contarCategorias(
      avaliadas.map((avaliada) => avaliada.categoria),
      ['segura', 'garantida_agora'],
    );
    const contagemAltas = avaliadas.filter((avaliada) => avaliada.categoria === 'alta' && this.deveContar()).length;
    const contagemDefensiva = this.deveDeclararDefensivo(
      avaliadas.map((avaliada) => avaliada.categoria),
      contagemSegura + contagemAltas,
    )
      ? 1
      : 0;

    return Promise.resolve(Math.min(mao.length, Math.max(0, contagemSegura + contagemAltas + contagemDefensiva)));
  }

  private deveDeclararDefensivo(categorias: CategoriaCarta[], declaracao: number): boolean {
    const baixas = contarCategorias(categorias, ['baixa']);
    return declaracao <= this.parametros.declaracaoBaixa && baixas <= this.parametros.poucasBaixas && this.deveContar();
  }

  private deveContar(): boolean {
    return this.rng.random() < 1 - this.temperatura;
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
