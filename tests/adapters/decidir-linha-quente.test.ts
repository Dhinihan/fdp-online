import { describe, expect, it } from 'vitest';
import { decidirLinhaQuente, type ResultadoQuente } from '@/adapters/bots/decidir-linha-quente';
import { ETAPA_SEGUE_FRIA } from '@/adapters/bots/decidir-linha-quente';
import { ETAPA_ABERTURA_SEGUE_FRIA, MOTIVO_ABERTURA_LINHA_QUENTE } from '@/adapters/bots/decidirAbertura';
import { DecisorJogadaPorTemperatura } from '@/adapters/bots/DecisorJogadaPorTemperatura';
import { existeGarantidaParaDepois } from '@/adapters/bots/garantida-para-depois';
import { lerMesa } from '@/adapters/bots/ler-mesa';
import type { DecisaoJogadaDebug } from '@/adapters/bots/logger-debug-bot';
import type { Carta } from '@/core/Carta';
import type { EstadoEmJogo, MesaItem } from '@/types/estado-rodada';
import { criarCarta } from '../core/rodada-fixtures';
import { criarEstadoAtravessia, cenariosRecusaAtravessia, maoAtravessia } from './fixtures-atravessia';
import { cenarioEsperaOportunidade, maoEsperaOportunidade } from './fixtures-espera-oportunidade';
import {
  cenarioBifurcacaoAntesDoFim,
  criarEstado as criarEstadoLinhaQuente,
  maoBifurcacao,
} from './fixtures-jogada-linha-quente';
import {
  cartasReveladasGarantidaTres,
  cenarioRecusaVencedoraSegura,
  cenarioVencedoraSegura,
  criarEstadoVencedoraSegura,
  maoVencedoraSegura,
} from './fixtures-vencedora-segura';

const LIDER_BAIXA = 8;

describe('decidirLinhaQuente na abertura', () => {
  it('deve seguir linha fria', () => {
    const estado = criarEstado({ mesa: [], declaracoes: { bot: 1 }, vazas: { bot: 0 } });
    const leitura = lerMesa(estado, [criarCarta('3', '♦'), criarCarta('8', '♦')]);

    expect(decidirLinhaQuente({ posicao: 'abre', estado, leitura, liderBaixa: LIDER_BAIXA })).toEqual({
      tipo: 'segue-fria',
      motivo: MOTIVO_ABERTURA_LINHA_QUENTE,
      etapa: ETAPA_ABERTURA_SEGUE_FRIA,
    });
  });

  it('deve montar caminho de seguir linha fria via DecisorJogadaPorTemperatura', async () => {
    const mao = [criarCarta('7', '♦'), criarCarta('2', '♦'), criarCarta('8', '♦')];
    const estado = criarEstado({ mesa: [], declaracoes: { bot: 2 }, vazas: { bot: 0 } });
    const jogadas: DecisaoJogadaDebug[] = [];
    const decisor = new DecisorJogadaPorTemperatura({
      temperatura: 1,
      rng: { random: () => 0 },
      logger: {
        registrarDeclaracao: () => undefined,
        registrarJogada: (jogada) => jogadas.push(jogada),
      },
    });

    await decisor.decidirJogada(mao, estado);

    expect(jogadas[0]?.quente?.caminho).toEqual(['jogada', 'abre a mesa', 'linha quente', 'segue linha fria']);
  });
});

describe('decidirLinhaQuente no meio', () => {
  it.each(cenariosMeio)('$nome', ({ estado: config, mao, esperado }) => {
    const estado = criarEstado(config);
    const leitura = lerMesa(estado, mao);
    expect(decidirLinhaQuente({ posicao: 'meio', estado, leitura, liderBaixa: LIDER_BAIXA })).toEqual(esperado);
  });

  it.each(cenariosRecusaAtravessia)('deve não atravessar quando $nome', ({ estado, mao }) => {
    const leitura = lerMesa(estado, mao);
    const resultado = decidirLinhaQuente({ posicao: 'meio', estado, leitura, liderBaixa: LIDER_BAIXA });
    if (resultado.tipo === 'recomenda') expect(resultado.etapa).not.toBe('atravessa');
  });

  it.each(cenarioRecusaVencedoraSegura)('deve não usar vencedora segura quando $nome', ({ estado, mao }) => {
    const leitura = lerMesa(estado, mao);
    const resultado = decidirLinhaQuente({ posicao: 'meio', estado, leitura, liderBaixa: LIDER_BAIXA });
    if (resultado.tipo === 'recomenda') expect(resultado.etapa).not.toBe('vencedora segura');
  });
});

describe('decidirLinhaQuente no fim da mesa', () => {
  it.each(cenariosFecha)('$nome', ({ mao, estado: config, esperado }) => {
    const estado = criarEstado(config);
    const leitura = lerMesa(estado, mao);
    expect(decidirLinhaQuente({ posicao: 'fecha', estado, leitura, liderBaixa: LIDER_BAIXA })).toEqual(esperado);
  });
});

describe('existeGarantidaParaDepois', () => {
  it('deve detectar garantida_agora na mão', () => {
    const estado = criarEstadoVencedoraSegura({
      manilha: '8',
      cartasReveladas: cartasReveladasGarantidaTres(),
    });
    const leitura = lerMesa(estado, [criarCarta('3', '♦'), criarCarta('7', '♦')]);
    expect(existeGarantidaParaDepois(leitura)).toBe(true);
  });

  it('deve retornar false sem garantida_agora na mão', () => {
    const estado = criarEstadoVencedoraSegura({ cartasReveladas: [] });
    expect(existeGarantidaParaDepois(lerMesa(estado, maoVencedoraSegura()))).toBe(false);
  });
});

const cenariosMeio: {
  nome: string;
  estado: Partial<EstadoEmJogo>;
  mao: Carta[];
  esperado: ResultadoQuente;
}[] = [
  {
    nome: 'deve pressionar quando bifurcação passa',
    estado: cenarioBifurcacaoAntesDoFim(),
    mao: maoBifurcacao(),
    esperado: {
      tipo: 'recomenda',
      carta: criarCarta('4', '♦'),
      motivo: 'pressão: fuga mais cara',
      etapa: 'pressiona',
    },
  },
  {
    nome: 'deve atravessar com vencedora mais barata sem garantida',
    estado: criarEstadoAtravessia(),
    mao: maoAtravessia(),
    esperado: {
      tipo: 'recomenda',
      carta: criarCarta('4', '♦'),
      motivo: 'atravessa: urgência 1.00, líder alta+ precisa, vencedora mais barata sem garantida',
      etapa: 'atravessa',
    },
  },
  {
    nome: 'deve escolher vencedora segura quando pressão não casa',
    estado: cenarioVencedoraSegura(),
    mao: maoVencedoraSegura(),
    esperado: {
      tipo: 'recomenda',
      carta: criarCarta('3', '♦'),
      motivo: 'vencedora segura: líder alta+ precisa, sem garantida para depois',
      etapa: 'vencedora segura',
    },
  },
  {
    nome: 'deve esperar oportunidade quando pressão e vencedora segura falham',
    estado: cenarioEsperaOportunidade(),
    mao: maoEsperaOportunidade(),
    esperado: {
      tipo: 'recomenda',
      carta: criarCarta('7', '♦'),
      motivo: 'espera oportunidade: descarte por necessidade',
      etapa: 'espera oportunidade',
    },
  },
  {
    nome: 'deve empatar quando já cumpriu e líder precisa alta+',
    estado: {
      mesa: [
        { jogadorId: 'j1', carta: criarCarta('2', '♣') },
        { jogadorId: 'j2', carta: criarCarta('7', '♥') },
      ],
      declaracoes: { j1: 1, bot: 1 },
      vazas: { j1: 0, bot: 1 },
    },
    mao: [criarCarta('2', '♦'), criarCarta('4', '♦')],
    esperado: {
      tipo: 'recomenda',
      carta: criarCarta('2', '♦'),
      motivo: 'já cumpriu; empate contra líder alta+',
    },
  },
  {
    nome: 'deve preferir perdedora com líder média quando já cumpriu',
    estado: {
      mesa: [
        { jogadorId: 'j1', carta: criarCarta('9', '♣') },
        { jogadorId: 'j2', carta: criarCarta('6', '♥') },
      ],
      declaracoes: { j1: 1, bot: 1 },
      vazas: { j1: 0, bot: 1 },
    },
    mao: [criarCarta('9', '♦'), criarCarta('7', '♦')],
    esperado: {
      tipo: 'recomenda',
      carta: criarCarta('7', '♦'),
      motivo: 'já cumpriu; perdedora mais forte',
    },
  },
  {
    nome: 'deve seguir fria sem carta que não faz quando já cumpriu',
    estado: {
      mesa: [
        { jogadorId: 'j1', carta: criarCarta('4', '♣') },
        { jogadorId: 'j2', carta: criarCarta('4', '♥') },
      ],
      declaracoes: { bot: 1 },
      vazas: { bot: 1 },
      manilha: '6',
    },
    mao: [criarCarta('5', '♦'), criarCarta('8', '♦'), criarCarta('K', '♦')],
    esperado: { tipo: 'segue-fria', motivo: 'linha quente segue fria: sem carta que não faz', etapa: ETAPA_SEGUE_FRIA },
  },
  {
    nome: 'deve seguir fria com urgência alta e nenhum ramo aplicável',
    estado: {
      mesa: [{ jogadorId: 'j1', carta: criarCarta('9', '♣') }],
      declaracoes: { j1: 1, bot: 2 },
      vazas: { j1: 0, bot: 0 },
    },
    mao: [criarCarta('7', '♦'), criarCarta('K', '♦')],
    esperado: { tipo: 'segue-fria', motivo: 'linha quente segue fria: nenhum ramo se aplica', etapa: ETAPA_SEGUE_FRIA },
  },
];

const cenariosFecha: {
  nome: string;
  mao: Carta[];
  estado: Partial<EstadoEmJogo>;
  esperado: ResultadoQuente;
}[] = [
  {
    nome: 'deve retornar G[N-X] quando precisa fazer e tem vencedoras',
    mao: [criarCarta('5', '♦'), criarCarta('8', '♦'), criarCarta('K', '♦')],
    estado: { mesa: mesaComQuatro(), declaracoes: { bot: 2 }, vazas: { bot: 0 }, manilha: '6' },
    esperado: {
      tipo: 'recomenda',
      carta: criarCarta('8', '♦'),
      motivo: 'precisa fazer; regra G[N-X]',
    },
  },
  {
    nome: 'deve retornar P[N-X] quando precisa fazer sem carta que vence',
    mao: [criarCarta('4', '♦'), criarCarta('6', '♦'), criarCarta('9', '♦'), criarCarta('Q', '♦')],
    estado: { mesa: mesaComK(), declaracoes: { bot: 2 }, vazas: { bot: 0 }, manilha: '5' },
    esperado: {
      tipo: 'recomenda',
      carta: criarCarta('6', '♦'),
      motivo: 'precisa fazer, sem carta que vence; P[N-X]',
    },
  },
  {
    nome: 'deve preservar a mais alta no último quando precisa fazer 1 e o líder jogou alta',
    mao: [criarCarta('4', '♦'), criarCarta('6', '♦'), criarCarta('9', '♦'), criarCarta('Q', '♦')],
    estado: { mesa: mesaComK(), declaracoes: { bot: 1 }, vazas: { bot: 0 }, manilha: '5' },
    esperado: {
      tipo: 'recomenda',
      carta: criarCarta('9', '♦'),
      motivo: 'precisa fazer, sem carta que vence; P[N-X]',
    },
  },
  {
    nome: 'deve adiar com P[N-X] quando líder é média e urgência é baixa',
    mao: [criarCarta('6', '♦'), criarCarta('Q', '♦'), criarCarta('A', '♦')],
    estado: { mesa: mesaComNove(), declaracoes: { j1: 1, bot: 1 }, vazas: { j1: 0, bot: 0 } },
    esperado: {
      tipo: 'recomenda',
      carta: criarCarta('6', '♦'),
      motivo: 'precisa fazer; adiou; P[N-X]',
    },
  },
  {
    nome: 'deve fugir com carta mais alta que não faz quando já cumpriu',
    mao: [criarCarta('K', '♦'), criarCarta('A', '♦')],
    estado: {
      mesa: [{ jogadorId: 'j1', carta: criarCarta('K', '♣') }],
      declaracoes: { bot: 1 },
      vazas: { bot: 1 },
    },
    esperado: {
      tipo: 'recomenda',
      carta: criarCarta('K', '♦'),
      motivo: 'já cumpriu; carta mais alta que não faz',
    },
  },
];

function criarEstado(config: Partial<EstadoEmJogo>): EstadoEmJogo {
  return criarEstadoLinhaQuente(config);
}

function mesaComK(): MesaItem[] {
  return [
    { jogadorId: 'j1', carta: criarCarta('K', '♣') },
    { jogadorId: 'j2', carta: criarCarta('7', '♥') },
    { jogadorId: 'j3', carta: criarCarta('8', '♠') },
  ];
}

function mesaComQuatro(): MesaItem[] {
  return [
    { jogadorId: 'j1', carta: criarCarta('4', '♣') },
    { jogadorId: 'j2', carta: criarCarta('4', '♥') },
    { jogadorId: 'j3', carta: criarCarta('4', '♠') },
  ];
}

function mesaComNove(): MesaItem[] {
  return [
    { jogadorId: 'j1', carta: criarCarta('9', '♣') },
    { jogadorId: 'j2', carta: criarCarta('6', '♥') },
    { jogadorId: 'j3', carta: criarCarta('7', '♠') },
  ];
}
