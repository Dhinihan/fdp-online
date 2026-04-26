import type {
  DeclaracaoFeita,
  CartaJogada,
  JogoEncerrado,
  JogoIniciado,
  ManilhaVirada,
  RodadaEncerrada,
  TurnoGanho,
} from './eventos-dominio';
import type { ArrastoCarta, ToqueBotao, ToqueCarta } from './eventos-input';
import type { CenaMudada, EfeitoCartaVirada, EfeitoSomTocado } from './eventos-visual';

export interface EventoMap {
  JOGO_INICIADO: JogoIniciado;
  MANILHA_VIRADA: ManilhaVirada;
  DECLARACAO_FEITA: DeclaracaoFeita;
  CARTA_JOGADA: CartaJogada;
  TURNO_GANHO: TurnoGanho;
  RODADA_ENCERRADA: RodadaEncerrada;
  JOGO_ENCERRADO: JogoEncerrado;
  TOQUE_CARTA: ToqueCarta;
  TOQUE_BOTAO: ToqueBotao;
  ARRASTO_CARTA: ArrastoCarta;
  EFEITO_CARTA_VIRADA: EfeitoCartaVirada;
  EFEITO_SOM_TOCADO: EfeitoSomTocado;
  CENA_MUDADA: CenaMudada;
}

export type EventoUnion = EventoMap[keyof EventoMap];
