import type { MaoJogador } from '@/types/estado-rodada';
import type { RegistroCartasReveladas } from './RegistroCartasReveladas';

export function registrarCartasVisiveis(registro: RegistroCartasReveladas, maos: MaoJogador[]): void {
  for (const mao of maos) {
    if (!mao.visivel) continue;
    for (const carta of mao.cartas) registro.registrar(carta);
  }
}
