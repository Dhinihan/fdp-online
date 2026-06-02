/**
 * Geometria pura da rolagem da lista de participantes do Ranking (issue #249).
 *
 * Módulo deliberadamente sem `Scene`, sem o namespace `Phaser` e sem o
 * controlador: só números e retângulos. Assim o contrato é testável em Node
 * (Vitest) sem esbarrar na regra do AGENTS.md de não testar adapter Phaser — o
 * controlador, que toca `Scene`/`Container`/`input`, vive em
 * `rolagem-tabela-ranking.ts` e é validado visualmente.
 */

export interface RegiaoLista {
  esquerda: number;
  direita: number;
  topo: number;
  fundo: number;
}

export interface Ponto {
  x: number;
  y: number;
}

export interface EntradaGeometriaLista {
  esquerda: number;
  direita: number;
  primeiraLinhaTopo: number;
  fundo: number;
  alturaLinha: number;
  totalLinhas: number;
}

export interface GeometriaListaRanking {
  regiao: RegiaoLista;
  alturaVisivel: number;
  alturaConteudo: number;
}

/** Região retangular do corpo da tabela + alturas visível e total do conteúdo. */
export function calcularGeometriaLista(entrada: EntradaGeometriaLista): GeometriaListaRanking {
  const regiao: RegiaoLista = {
    esquerda: entrada.esquerda,
    direita: entrada.direita,
    topo: entrada.primeiraLinhaTopo,
    fundo: entrada.fundo,
  };
  return {
    regiao,
    alturaVisivel: entrada.fundo - entrada.primeiraLinhaTopo,
    alturaConteudo: entrada.totalLinhas * entrada.alturaLinha,
  };
}

/** Hit-test único: o ponteiro está dentro do corpo da tabela? */
export function contemPonteiroNaRegiao(regiao: RegiaoLista, ponto: Ponto): boolean {
  return ponto.x >= regiao.esquerda && ponto.x <= regiao.direita && ponto.y >= regiao.topo && ponto.y <= regiao.fundo;
}

/** Quanto a lista pode rolar: 0 quando o conteúdo cabe na área visível. */
export function offsetMaximoRolagem(alturaConteudo: number, alturaVisivel: number): number {
  return Math.max(0, alturaConteudo - alturaVisivel);
}

/** Há transbordo? Só então vale criar máscara e ligar o arrasto/roda. */
export function precisaRolar(alturaConteudo: number, alturaVisivel: number): boolean {
  return offsetMaximoRolagem(alturaConteudo, alturaVisivel) > 0;
}

/** Prende o deslocamento entre o topo (0) e o fim da lista (offsetMáximo). */
export function clampOffsetRolagem(offset: number, offsetMaximo: number): number {
  return Math.min(offsetMaximo, Math.max(0, offset));
}
