import { describe, expect, it } from 'vitest';
import { DecisorJogadaLinhaQuente } from '@/adapters/bots/DecisorJogadaLinhaQuente';
import type { Carta } from '@/core/Carta';
import type { Jogador } from '@/types/entidades';
import type { EstadoEmJogo, MesaItem } from '@/types/estado-rodada';
import { criarCarta, criarJogador } from '../core/rodada-fixtures';

describe('DecisorJogadaLinhaQuente no fim da mesa', () => {
  it('deve atravessar quando líder precisa e carta líder é alta', atravessaLiderAlta);
  it('deve adiar quando líder precisa, carta líder é média e urgência é baixa', adiaLiderMedia);
  it('deve fazer quando líder precisa, carta líder é média e urgência é alta', fazLiderMediaUrgente);
  it('deve adiar quando líder não precisa e urgência é baixa', adiaLiderSemNecessidade);
  it('deve fazer quando líder não precisa e urgência é alta', fazLiderSemNecessidadeUrgente);
  it('deve evitar empate quando já cumpriu, líder precisa e carta líder é média', evitaEmpateComMedia);
  it('deve fugir com a maior perdedora quando líder não precisa', fogeComMaiorPerdedora);
  it('deve empatar quando líder não precisa e só há empate como fuga', empataQuandoSoHaEmpate);
  it('deve jogar a carta mais forte quando todas fazem', jogaMaisForteSemFuga);
});

async function atravessaLiderAlta(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComDois(), declaracoes: { j1: 1, bot: 1 }, vazas: { j1: 0, bot: 0 } });
  await expect(bot().decidirJogada([criarCarta('A', '♦'), criarCarta('3', '♦')], estado)).resolves.toEqual(
    criarCarta('3', '♦'),
  );
}

async function adiaLiderMedia(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComNove(), declaracoes: { j1: 1, bot: 1 }, vazas: { j1: 0, bot: 0 } });
  await expect(jogarContraNove(estado)).resolves.toEqual(criarCarta('6', '♦'));
}

async function fazLiderMediaUrgente(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComNove(), declaracoes: { j1: 1, bot: 2 }, vazas: { j1: 0, bot: 0 } });
  await expect(jogarContraNove(estado)).resolves.toEqual(criarCarta('Q', '♦'));
}

async function adiaLiderSemNecessidade(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComNove(), declaracoes: { j1: 0, bot: 1 }, vazas: { j1: 0, bot: 0 } });
  await expect(jogarContraNove(estado)).resolves.toEqual(criarCarta('6', '♦'));
}

async function fazLiderSemNecessidadeUrgente(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComNove(), declaracoes: { j1: 0, bot: 2 }, vazas: { j1: 0, bot: 0 } });
  await expect(jogarContraNove(estado)).resolves.toEqual(criarCarta('Q', '♦'));
}

async function evitaEmpateComMedia(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComNove(), declaracoes: { j1: 1, bot: 1 }, vazas: { j1: 0, bot: 1 } });
  const mao = [criarCarta('9', '♦'), criarCarta('6', '♦'), criarCarta('Q', '♦')];
  await expect(bot().decidirJogada(mao, estado)).resolves.toEqual(criarCarta('6', '♦'));
}

async function fogeComMaiorPerdedora(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComK(), declaracoes: { j1: 0, bot: 1 }, vazas: { j1: 0, bot: 1 } });
  const mao = [criarCarta('4', '♦'), criarCarta('Q', '♠'), criarCarta('A', '♦')];
  await expect(bot().decidirJogada(mao, estado)).resolves.toEqual(criarCarta('Q', '♠'));
}

async function empataQuandoSoHaEmpate(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComK(), declaracoes: { j1: 0, bot: 1 }, vazas: { j1: 0, bot: 1 } });
  await expect(bot().decidirJogada([criarCarta('K', '♦'), criarCarta('A', '♦')], estado)).resolves.toEqual(
    criarCarta('K', '♦'),
  );
}

async function jogaMaisForteSemFuga(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComNove(), declaracoes: { j1: 0, bot: 1 }, vazas: { j1: 0, bot: 1 } });
  await expect(bot().decidirJogada([criarCarta('Q', '♦'), criarCarta('A', '♦')], estado)).resolves.toEqual(
    criarCarta('A', '♦'),
  );
}

function jogarContraNove(estado: EstadoEmJogo): Promise<Carta> {
  const mao = [criarCarta('6', '♦'), criarCarta('Q', '♦'), criarCarta('A', '♦')];
  return bot().decidirJogada(mao, estado);
}

function bot(): DecisorJogadaLinhaQuente {
  return new DecisorJogadaLinhaQuente({ temperatura: 1, rng: { random: () => 0 }, liderBaixa: 8, liderAlta: 11 });
}

function criarEstado(config: Partial<EstadoEmJogo>): EstadoEmJogo {
  const jogadores = criarJogadores();
  return {
    fase: 'aguardandoJogada',
    jogadorAtual: 3,
    pontos: {},
    maos: jogadores.map((jogador) => ({ jogador, cartas: [], visivel: true })),
    cartasPorRodada: 3,
    manilha: '5',
    cartaVirada: null,
    declaracoes: {},
    mesa: [],
    cartasReveladas: [],
    vazas: {},
    turno: 1,
    ...config,
  };
}

function criarJogadores(): Jogador[] {
  return [criarJogador('j1', 'J1'), criarJogador('j2', 'J2'), criarJogador('j3', 'J3'), criarJogador('bot', 'Bot')];
}

function mesaComDois(): MesaItem[] {
  return [
    { jogadorId: 'j1', carta: criarCarta('2', '♣') },
    { jogadorId: 'j2', carta: criarCarta('7', '♥') },
    { jogadorId: 'j3', carta: criarCarta('8', '♠') },
  ];
}

function mesaComK(): MesaItem[] {
  return [
    { jogadorId: 'j1', carta: criarCarta('K', '♣') },
    { jogadorId: 'j2', carta: criarCarta('7', '♥') },
    { jogadorId: 'j3', carta: criarCarta('8', '♠') },
  ];
}

function mesaComNove(): MesaItem[] {
  return [
    { jogadorId: 'j1', carta: criarCarta('9', '♣') },
    { jogadorId: 'j2', carta: criarCarta('6', '♥') },
    { jogadorId: 'j3', carta: criarCarta('7', '♠') },
  ];
}
