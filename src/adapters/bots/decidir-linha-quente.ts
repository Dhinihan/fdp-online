import type { Carta } from '@/core/Carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';
import type { PosicaoMesaJogadaDebug } from './debug-jogada-bot';
import { ETAPA_ABERTURA_SEGUE_FRIA, MOTIVO_ABERTURA_LINHA_QUENTE } from './decidirAbertura';
import { decidirUltimoLinhaQuente } from './decidirUltimoLinhaQuente';
import type { LeituraDaMesa } from './ler-mesa';
import { escolherTravessia } from './pode-atravessar';
import { escolherEsperarOportunidade } from './pode-esperar-oportunidade';
import { escolherVencedoraSegura } from './pode-vencedora-segura';
import { escolherJaCumpriuNoMeio, escolherPressao, podeBifurcar } from './regras-linha-quente';

export const ETAPA_SEGUE_FRIA = 'segue fria';

export type ResultadoQuente =
  | { tipo: 'recomenda'; carta: Carta; motivo: string; etapa: string }
  | { tipo: 'segue-fria'; motivo: string; etapa: string };

export interface EntradaDecidirLinhaQuente {
  posicao: PosicaoMesaJogadaDebug;
  estado: EstadoEmJogo;
  leitura: LeituraDaMesa;
  liderBaixa: number;
}

export function decidirLinhaQuente(entrada: EntradaDecidirLinhaQuente): ResultadoQuente {
  if (entrada.posicao === 'abre') {
    return { tipo: 'segue-fria', motivo: MOTIVO_ABERTURA_LINHA_QUENTE, etapa: ETAPA_ABERTURA_SEGUE_FRIA };
  }
  if (entrada.posicao === 'fecha') return decidirFecha(entrada.estado, entrada.leitura);
  return decidirMeio(entrada.estado, entrada.leitura, entrada.liderBaixa);
}

function decidirFecha(estado: EstadoEmJogo, leitura: LeituraDaMesa): ResultadoQuente {
  const decisao = decidirUltimoLinhaQuente(estado, leitura);
  return { tipo: 'recomenda', carta: decisao.carta, motivo: decisao.motivo, etapa: '' };
}

function decidirMeio(estado: EstadoEmJogo, leitura: LeituraDaMesa, liderBaixa: number): ResultadoQuente {
  const direta = tentarRamoDiretoMeio(estado, leitura);
  if (direta) return direta;

  const bifurcacao = podeBifurcar(leitura, liderBaixa);
  if (bifurcacao.pode) {
    const pressao = escolherPressao(leitura);
    return { tipo: 'recomenda', carta: pressao.carta, motivo: pressao.motivo, etapa: 'pressiona' };
  }

  const vencedoraSegura = escolherVencedoraSegura(leitura);
  if (vencedoraSegura) {
    return { tipo: 'recomenda', ...vencedoraSegura, etapa: 'vencedora segura' };
  }

  const espera = escolherEsperarOportunidade(estado, leitura);
  if (espera) {
    return { tipo: 'recomenda', ...espera, etapa: 'espera oportunidade' };
  }

  return { tipo: 'segue-fria', motivo: 'linha quente segue fria: nenhum ramo se aplica', etapa: ETAPA_SEGUE_FRIA };
}

function tentarRamoDiretoMeio(estado: EstadoEmJogo, leitura: LeituraDaMesa): ResultadoQuente | null {
  if (leitura.necessidade <= 0) return tentarJaCumpriuNoMeio(estado, leitura);
  const travessia = escolherTravessia(leitura);
  if (!travessia) return null;
  return { tipo: 'recomenda', ...travessia, etapa: 'atravessa' };
}

function tentarJaCumpriuNoMeio(estado: EstadoEmJogo, leitura: LeituraDaMesa): ResultadoQuente {
  const jaCumpriu = escolherJaCumpriuNoMeio(estado, leitura);
  if (jaCumpriu) return { tipo: 'recomenda', ...jaCumpriu, etapa: '' };
  return { tipo: 'segue-fria', motivo: 'linha quente segue fria: sem carta que não faz', etapa: ETAPA_SEGUE_FRIA };
}
