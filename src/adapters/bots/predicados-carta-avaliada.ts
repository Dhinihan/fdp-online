import type { CartaAvaliada } from '@/core/avaliador-carta';

export function ehAltaOuMelhor(avaliada: CartaAvaliada): boolean {
  return ['alta', 'segura', 'garantida_agora'].includes(avaliada.categoria);
}
