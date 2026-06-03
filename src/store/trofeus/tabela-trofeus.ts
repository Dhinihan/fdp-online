/**
 * Tabela canônica dos Troféus: os sete níveis ordenados e seus limiares de
 * comprimento de Sequência de Vitórias, definidos num único lugar. Módulo puro
 * com consultas puras — quem precisa de um Troféu para um comprimento, do nível
 * acima de outro, ou do limiar de um nível, pergunta aqui.
 *
 * Como guardamos o `maiorTrofeu` (o nível), não o número que o conquistou, a
 * tabela de limiares pode mudar no futuro sem invalidar o progresso persistido.
 */

export type Nivel = 'bronze' | 'prata' | 'ouro' | 'esmeralda' | 'safira' | 'rubi' | 'diamante';

interface DefinicaoNivel {
  nivel: Nivel;
  limiar: number;
}

/** Níveis em ordem ascendente de limiar; a hierarquia inteira deriva daqui. */
const NIVEIS: readonly DefinicaoNivel[] = [
  { nivel: 'bronze', limiar: 3 },
  { nivel: 'prata', limiar: 5 },
  { nivel: 'ouro', limiar: 10 },
  { nivel: 'esmeralda', limiar: 15 },
  { nivel: 'safira', limiar: 25 },
  { nivel: 'rubi', limiar: 50 },
  { nivel: 'diamante', limiar: 100 },
];

export const NIVEIS_ORDENADOS: readonly Nivel[] = NIVEIS.map((d) => d.nivel);

/** Rótulos textuais exibidos na UI enquanto a arte visual não entra (slice futura). */
export const ROTULO_NIVEL: Record<Nivel, string> = {
  bronze: 'Bronze',
  prata: 'Prata',
  ouro: 'Ouro',
  esmeralda: 'Esmeralda',
  safira: 'Safira',
  rubi: 'Rubi',
  diamante: 'Diamante',
};

/** Maior nível cujo limiar o comprimento já atingiu; `null` abaixo do Bronze. */
export function trofeuPara(comprimento: number): Nivel | null {
  let conquistado: Nivel | null = null;
  for (const { nivel, limiar } of NIVEIS) {
    if (comprimento >= limiar) conquistado = nivel;
  }
  return conquistado;
}

/** Nível imediatamente acima; `null` (sem Troféu) parte do Bronze, Diamante não tem próximo. */
export function proximoNivel(trofeu: Nivel | null): Nivel | null {
  const indice = trofeu === null ? -1 : NIVEIS_ORDENADOS.indexOf(trofeu);
  return NIVEIS_ORDENADOS[indice + 1] ?? null;
}

/** Comprimento de Sequência de Vitórias que conquista o nível. */
export function limiarDe(nivel: Nivel): number {
  return NIVEIS[NIVEIS_ORDENADOS.indexOf(nivel)].limiar;
}

/** Type guard usado na leitura estrita do snapshot persistido. */
export function ehNivel(valor: unknown): valor is Nivel {
  return typeof valor === 'string' && (NIVEIS_ORDENADOS as readonly string[]).includes(valor);
}
