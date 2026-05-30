import type { Carta } from '@/core/Carta';
import { cartasEmpatam, cartaVence } from '@/core/comparador-carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';
import { cartaMaisForte, descartePorNecessidade, escolherVencedoraPorNecessidade } from './escolhas-por-necessidade';
import { MOTIVOS_FUGA_FECHA, escolherFugaJaCumpriu } from './escolher-fuga-ja-cumpriu';
import { cartasQueNaoFazemVaza, type LeituraDaMesa } from './ler-mesa';
import { ehAltaOuMelhor } from './predicados-carta-avaliada';

export interface DecisaoUltimoLinhaQuente {
  carta: Carta;
  motivo: string;
}

export function decidirUltimoLinhaQuente(estado: EstadoEmJogo, leitura: LeituraDaMesa): DecisaoUltimoLinhaQuente {
  if (leitura.necessidade > 0) return decidirQuandoPrecisaFazer(estado, leitura);
  return decidirQuandoJaCumpriu(estado, leitura);
}

export function cartaPerde(carta: Carta, lider: Carta, manilha: Carta['valor']): boolean {
  return !cartaVence(carta, lider, manilha) && !cartasEmpatam(carta, lider, manilha);
}

function decidirQuandoPrecisaFazer(estado: EstadoEmJogo, leitura: LeituraDaMesa): DecisaoUltimoLinhaQuente {
  if (leitura.vencedoras.length === 0) {
    return {
      carta: descartePorNecessidade(cartasQueNaoFazemVaza(leitura), estado.manilha, leitura.necessidade).carta,
      motivo: 'precisa fazer, sem carta que vence; P[N-X]',
    };
  }
  if (deveFazerAgora(leitura)) {
    return {
      carta: escolherVencedoraPorNecessidade(leitura.vencedoras, estado.manilha, leitura.necessidade).carta,
      motivo: 'precisa fazer; regra G[N-X]',
    };
  }
  if (leitura.perdedoras.length > 0) {
    return {
      carta: descartePorNecessidade(leitura.perdedoras, estado.manilha, leitura.necessidade).carta,
      motivo: 'precisa fazer; adiou; P[N-X]',
    };
  }
  return {
    carta: escolherVencedoraPorNecessidade(leitura.vencedoras, estado.manilha, leitura.necessidade).carta,
    motivo: 'precisa fazer; regra G[N-X]',
  };
}

function decidirQuandoJaCumpriu(estado: EstadoEmJogo, leitura: LeituraDaMesa): DecisaoUltimoLinhaQuente {
  const opcoes = {
    liderInteressado: leitura.liderQuerVaza,
    fallbackSemFuga: 'mais-forte-mao' as const,
    motivos: MOTIVOS_FUGA_FECHA,
  };
  const decisao = escolherFugaJaCumpriu(estado, leitura, opcoes);
  if (decisao) return decisao;
  return {
    carta: cartaMaisForte(leitura.avaliadas, estado.manilha).carta,
    motivo: MOTIVOS_FUGA_FECHA.fugaImpossivel,
  };
}

function deveFazerAgora(leitura: LeituraDaMesa): boolean {
  if (!leitura.lider) return true;
  if (leitura.liderQuerVaza && ehAltaOuMelhor(leitura.lider)) return true;
  return leitura.urgenciaAlta;
}
