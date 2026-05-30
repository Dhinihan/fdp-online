import type { LeituraDaMesa } from './ler-mesa';

export function existeGarantidaParaDepois(leitura: LeituraDaMesa): boolean {
  return leitura.avaliadas.some((avaliada) => avaliada.categoria === 'garantida_agora');
}
