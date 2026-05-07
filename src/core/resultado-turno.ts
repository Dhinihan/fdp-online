import type { Jogador } from '@/types/entidades';
import type { MesaItem } from '@/types/estado-rodada';
import type { Valor } from './Carta';
import { calcularIndiceVencedor, cartasEmpatam } from './comparador-carta';

export type ResultadoTurno = { tipo: 'vitoria'; jogador: Jogador } | { tipo: 'empate'; ultimoEmpatado: Jogador };

export function calcularResultadoTurno(mesa: MesaItem[], manilha: Valor, jogadores: Jogador[]): ResultadoTurno {
  const indiceMelhor = calcularIndiceVencedor(mesa, manilha);
  const cartaMelhor = mesa[indiceMelhor].carta;
  const empatados = mesa.filter((item, i) => i === indiceMelhor || cartasEmpatam(item.carta, cartaMelhor, manilha));
  if (empatados.length > 1) {
    const ultimoEmpatado = empatados[empatados.length - 1];
    const jogador = jogadores.find((j) => j.id === ultimoEmpatado.jogadorId);
    if (!jogador) throw new Error('Último empatado não encontrado');
    return { tipo: 'empate', ultimoEmpatado: jogador };
  }
  const jogadorId = mesa[indiceMelhor].jogadorId;
  const vencedor = jogadores.find((j) => j.id === jogadorId);
  if (!vencedor) throw new Error('Vencedor não encontrado');
  return { tipo: 'vitoria', jogador: vencedor };
}
