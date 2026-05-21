import { avaliarCartas, type CartaAvaliada, type CategoriaCarta } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import type { DecisorDeclaracao } from '@/core/portas/DecisorDeclaracao';
import type { GeradorAleatorio } from '@/core/RngComSeed';
import { estadoEmJogo, type EstadoEmJogo, type EstadoRodada } from '@/types/estado-rodada';
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
    if (estado.cartasPorRodada === 1) return Promise.resolve(this.declararPrimeiraRodada(estado));

    const avaliadas = avaliarCartas(mao, estado.manilha, cartasPublicas(estado), estado.maos.length);
    const segurasContadas = filtrarCategorias(avaliadas, ['segura', 'garantida_agora']);
    const altasCandidatas = filtrarCategorias(avaliadas, ['alta']);
    const altasSorteadas = avaliadas
      .filter((avaliada) => avaliada.categoria === 'alta')
      .map((avaliada) => ({ carta: avaliada, conta: this.deveContar() }));
    const contagemAltas = altasSorteadas.filter((sorteio) => sorteio.conta).length;
    const base = segurasContadas.length + contagemAltas;
    const defensivo = this.avaliarDefensivo(avaliadas, base, estado.cartasPorRodada);
    const contagemDefensiva = defensivo.estado === 'aplicado' ? 1 : 0;
    const declaracao = Math.min(mao.length, Math.max(0, base + contagemDefensiva));

    this.logger?.registrarDeclaracao({
      mao: avaliadas,
      segurasContadas,
      altasCandidatas,
      sorteiosAltas: altasSorteadas,
      defensivo,
      declaracao,
      regraEspecialPrimeiraRodada: false,
    });

    return Promise.resolve(declaracao);
  }

  private declararPrimeiraRodada(estado: EstadoRodada): number {
    const emJogo = estadoEmJogo(estado);
    const visiveis = cartasVisiveisDosOutros(emJogo);
    const avaliadas = avaliarCartas(visiveis, emJogo.manilha, [], emJogo.maos.length);
    const temAltaVisivel = avaliadas.some((avaliada) => ehCategoriaForte(avaliada.categoria));
    const declaracao = temAltaVisivel ? 0 : 1;

    this.logger?.registrarDeclaracao({
      mao: avaliadas,
      segurasContadas: filtrarCategorias(avaliadas, ['segura', 'garantida_agora']),
      altasCandidatas: filtrarCategorias(avaliadas, ['alta']),
      sorteiosAltas: [],
      defensivo: { estado: 'não elegível' },
      declaracao,
      regraEspecialPrimeiraRodada: true,
    });

    return declaracao;
  }

  private avaliarDefensivo(avaliadas: CartaAvaliada[], declaracao: number, cartasPorRodada: number) {
    if (!this.ehElegivelDefensivo(avaliadas, declaracao)) return { estado: 'não elegível' as const };
    const aplicaria = this.deveContar();
    if (!aplicaria) return { estado: 'sorteou' as const, aplicaria };
    const resultado = declaracao + 1;
    const teto = Math.floor(cartasPorRodada / 2);
    if (resultado > teto) return { estado: 'bloqueado' as const, base: declaracao, teto, resultado, cartasPorRodada };
    return { estado: 'aplicado' as const };
  }

  private ehElegivelDefensivo(avaliadas: CartaAvaliada[], declaracao: number): boolean {
    const baixas = contarCategorias(
      avaliadas.map((avaliada) => avaliada.categoria),
      ['baixa'],
    );
    return declaracao <= this.parametros.declaracaoBaixa && baixas <= this.parametros.poucasBaixas;
  }

  private deveContar(): boolean {
    return this.rng.random() < 1 - this.temperatura;
  }
}

function contarCategorias(categorias: CategoriaCarta[], esperadas: CategoriaCarta[]): number {
  return categorias.filter((categoria) => esperadas.includes(categoria)).length;
}

function filtrarCategorias(avaliadas: CartaAvaliada[], esperadas: CategoriaCarta[]): CartaAvaliada[] {
  return avaliadas.filter((avaliada) => esperadas.includes(avaliada.categoria));
}

function ehCategoriaForte(categoria: CategoriaCarta): boolean {
  return ['alta', 'segura', 'garantida_agora'].includes(categoria);
}

function cartasVisiveisDosOutros(estado: EstadoEmJogo): Carta[] {
  return estado.maos
    .filter((mao, indice) => indice !== estado.jogadorAtual && mao.visivel)
    .flatMap((mao) => mao.cartas);
}

function cartasPublicas(estado: EstadoRodada): Carta[] {
  if (estado.fase === 'distribuindo') return [];

  const cartasEmMaos = estado.maos.flatMap((mao) => mao.cartas);
  return estado.cartasReveladas.filter((carta) => !cartasEmMaos.some((emMao) => cartasIguais(emMao, carta)));
}

function cartasIguais(a: Carta, b: Carta): boolean {
  return a.valor === b.valor && a.naipe === b.naipe;
}
