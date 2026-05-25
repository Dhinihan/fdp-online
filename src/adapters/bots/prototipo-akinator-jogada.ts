/* eslint-disable no-console, max-lines */
/**
 * PROTOTIPO DESCARTAVEL: validador interativo da arvore de jogada dos bots.
 *
 * Funciona como um "akinator": cada resposta aceita somente sim/nao e a saida
 * recomenda jogadas relativas da arvore canonica, nao cartas concretas.
 */
import { readFileSync } from 'node:fs';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';

type Perguntador = ReturnType<typeof createInterface>;
type Linha = 'fria' | 'quente';

interface Fato {
  pergunta: string;
  resposta: boolean;
}

interface Decisao {
  linha: Linha;
  acao: string;
  caminho: string[];
}

interface ResultadoJogada {
  fria: Decisao;
  quente: Decisao;
}

interface ResultadoGuarda {
  podeTentar: boolean;
  necessidadePositivaConhecida: boolean;
  urgenciaAlta?: boolean;
  existeJogadorInteressado?: boolean;
  existeJogadorInteressadoPorAgir?: boolean;
}

interface FatosNoMeio {
  existeVencedora?: boolean;
  existeCartaNaoFaz?: boolean;
  necessidadeZeroOuNegativa?: boolean;
  urgenciaAlta?: boolean;
  existeFugaUtil?: boolean;
  existeVencedoraBarataPreservandoGarantida?: boolean;
  existeJogadorInteressado?: boolean;
  existeJogadorInteressadoPorAgir?: boolean;
  existeGarantidaAgoraParaDepois?: boolean;
  liderInteressado?: boolean;
  liderAlta?: boolean;
}

interface FatosClassificacao {
  existeMaiorQueOito?: boolean;
  existeAltaOuMaior?: boolean;
}

const fatos: Fato[] = [];
const respostasScript = input.isTTY ? [] : readFileSync(0, 'utf8').split(/\r?\n/).filter(Boolean);

async function main(): Promise<void> {
  const rl = createInterface({ input, output });
  console.log('PROTOTIPO DESCARTAVEL - Akinator da arvore de jogada dos bots');
  console.log('Responda somente sim/nao. A recomendacao final e relativa, nao uma carta concreta.\n');

  const resultado = await decidirJogada(rl);
  imprimirResultado(resultado);

  rl.close();
}

async function decidirJogada(rl: Perguntador): Promise<ResultadoJogada> {
  if (await perguntar(rl, 'A mesa esta vazia?')) return repetirLinhasIguais(await decidirAbertura(rl));
  if (await perguntar(rl, 'Voce fecha a mesa, sem jogadores por agir depois de voce?')) return decidirFechando(rl);
  return decidirNoMeio(rl);
}

async function decidirAbertura(rl: Perguntador): Promise<Decisao> {
  const caminho = ['abre a mesa'];
  const fatosClassificacao: FatosClassificacao = {};
  if (await perguntar(rl, 'Sua necessidade e zero ou negativa?')) {
    return primeiraCategoriaDisponivel(rl, caminho, ['baixa', 'media', 'alta', 'segura', 'garantida_agora'], fatosClassificacao);
  }
  if (await perguntar(rl, 'Sua urgencia e alta? (necessidade / cartas na mao >= 0,66)')) {
    return primeiraCategoriaDisponivel(
      rl,
      [...caminho, 'urgencia alta'],
      ['alta', 'media', 'segura', 'baixa', 'garantida_agora'],
      fatosClassificacao,
    );
  }
  return primeiraCategoriaDisponivel(
    rl,
    [...caminho, 'sem urgencia alta'],
    ['baixa', 'media', 'alta', 'segura', 'garantida_agora'],
    fatosClassificacao,
  );
}

async function decidirNoMeio(rl: Perguntador): Promise<ResultadoJogada> {
  const caminho = ['joga no meio'];
  const guarda = await guardaDePosicaoPermite(rl);
  const fatosNoMeio: FatosNoMeio = {
    urgenciaAlta: guarda.urgenciaAlta,
    existeJogadorInteressado: guarda.existeJogadorInteressado,
    existeJogadorInteressadoPorAgir: guarda.existeJogadorInteressadoPorAgir,
  };

  const fria = await decidirNoMeioFria(
    rl,
    [...caminho, guarda.podeTentar ? 'guarda permite tentar' : 'guarda bloqueia tentar'],
    guarda,
    fatosNoMeio,
  );
  const quente = await decidirNoMeioQuente(rl, fria, guarda.necessidadePositivaConhecida, fatosNoMeio);
  return { fria, quente };
}

async function decidirNoMeioFria(
  rl: Perguntador,
  caminho: string[],
  guarda: ResultadoGuarda,
  fatosNoMeio: FatosNoMeio,
): Promise<Decisao> {
  const necessidadeZeroOuNegativa = guarda.necessidadePositivaConhecida
    ? false
    : await perguntar(rl, 'Sua necessidade e zero ou negativa?');
  fatosNoMeio.necessidadeZeroOuNegativa = necessidadeZeroOuNegativa;

  if (necessidadeZeroOuNegativa) {
    if (await perguntarExisteCartaNaoFaz(rl, fatosNoMeio)) {
      return decisao('fria', 'Jogue a carta mais alta entre as que nao fazem a vaza', caminho);
    }
    return decisao('fria', 'Jogue a carta mais barata da mao', [...caminho, 'fuga impossivel']);
  }

  if (!guarda.podeTentar) {
    return descarteOuBarata(rl, 'fria', [...caminho, 'nao pode tentar fazer'], fatosNoMeio);
  }
  fatosNoMeio.existeVencedora = await perguntar(rl, 'Existe vencedora?');
  if (fatosNoMeio.existeVencedora) {
    return decisao('fria', 'Escolha de vencedora por necessidade', [...caminho, 'existe vencedora']);
  }
  return descarteOuBarata(rl, 'fria', [...caminho, 'sem vencedora'], fatosNoMeio);
}

async function decidirNoMeioQuente(
  rl: Perguntador,
  fria: Decisao,
  necessidadePositivaConhecida: boolean,
  fatosNoMeio: FatosNoMeio,
): Promise<Decisao> {
  const caminho = ['linha quente no meio'];

  const necessidadeZeroOuNegativa = necessidadePositivaConhecida
    ? false
    : fatosNoMeio.necessidadeZeroOuNegativa ?? (await perguntar(rl, 'Sua necessidade e zero ou negativa?'));
  fatosNoMeio.necessidadeZeroOuNegativa = necessidadeZeroOuNegativa;

  if (necessidadeZeroOuNegativa) {
    if (await perguntar(rl, 'O lider e alta+? (referencia: A ou maior, incluindo 2, 3 ou manilha)')) {
      if (await perguntar(rl, 'Existe empate com a carta lider?')) {
        return decisao('quente', 'Jogue o empate mais caro', [...caminho, 'empate contra lider alta+']);
      }
    }
    return seguirFria(fria, caminho);
  }

  if (await podeAtravessar(rl, fatosNoMeio)) {
    return decisao('quente', 'Jogue a vencedora mais barata que nao seja garantida_agora', [
      ...caminho,
      'pode atravessar',
    ]);
  }

  if (await podePressionarEEsperar(rl, fatosNoMeio)) {
    if (fatosNoMeio.existeFugaUtil) {
      return decisao('quente', 'Jogue a fuga mais cara', [...caminho, 'pressiona e espera']);
    }
    return decisao('quente', 'Jogue a vencedora mais barata que nao seja garantida_agora, preservando garantida_agora', [
      ...caminho,
      'pressiona e espera',
    ]);
  }

  if (await podeTentarComVencedoraSegura(rl, fatosNoMeio)) {
    return decisao('quente', 'Tente fazer com a vencedora segura mais barata', [
      ...caminho,
      'tenta com vencedora segura',
    ]);
  }

  if (await podeEsperarOportunidade(rl, fatosNoMeio)) {
    return decisao('quente', 'Descarte por necessidade entre cartas que nao fazem a vaza', [
      ...caminho,
      'espera oportunidade de travessia',
    ]);
  }

  return seguirFria(fria, caminho);
}

async function decidirFechando(rl: Perguntador): Promise<ResultadoJogada> {
  const caminho = ['fecha a mesa'];
  const fria = await decidirFechandoFria(rl, [...caminho, 'linha fria']);
  const quente = await decidirFechandoQuente(rl, fria);
  return { fria, quente };
}

async function decidirFechandoFria(rl: Perguntador, caminho: string[]): Promise<Decisao> {
  if (await perguntar(rl, 'Sua necessidade e maior que zero?')) {
    if (await perguntar(rl, 'Existe vencedora?')) {
      return decisao('fria', 'Escolha de vencedora por necessidade', [...caminho, 'existe vencedora']);
    }
    return decisao('fria', 'Descarte por necessidade entre perdedoras e empates', [...caminho, 'sem vencedora']);
  }

  if (await perguntar(rl, 'Existe perdedora ou empate?')) {
    return decisao('fria', 'Jogue a carta mais forte entre perdedoras e empates', [...caminho, 'ja cumpriu']);
  }
  return decisao('fria', 'Jogue a carta mais forte da mao', [...caminho, 'fuga impossivel']);
}

async function decidirFechandoQuente(rl: Perguntador, fria: Decisao): Promise<Decisao> {
  const caminho = ['fecha a mesa', 'linha quente'];
  if (await perguntar(rl, 'Sua necessidade e maior que zero?')) {
    if (!(await perguntar(rl, 'Existe vencedora?'))) {
      return decisao('quente', 'Descarte por necessidade entre perdedoras e empates', [...caminho, 'sem vencedora']);
    }
    if (await deveFazerAgora(rl)) {
      return decisao('quente', 'Escolha de vencedora por necessidade', [...caminho, 'deve fazer agora']);
    }
    if (await perguntar(rl, 'Existe perdedora?')) {
      return decisao('quente', 'Descarte por necessidade entre perdedoras', [...caminho, 'adia tentativa']);
    }
    return decisao('quente', 'Escolha de vencedora por necessidade', [...caminho, 'sem descarte seguro']);
  }

  if (await perguntar(rl, 'O lider ainda precisa fazer?')) {
    if (await perguntar(rl, 'O lider e alta+? (referencia: A ou maior, incluindo 2, 3 ou manilha)')) {
      if (await perguntar(rl, 'Existe empate com a carta lider?')) {
        return decisao('quente', 'Jogue o empate mais forte', [...caminho, 'empate contra lider alta+']);
      }
    }
  }
  if (await perguntar(rl, 'Existe perdedora?')) {
    return decisao('quente', 'Jogue a perdedora mais forte', [...caminho, 'ja cumpriu']);
  }
  if (await perguntar(rl, 'Existe empate?')) {
    return decisao('quente', 'Jogue o empate mais forte', [...caminho, 'ja cumpriu sem perdedora']);
  }
  return seguirFria(fria, caminho);
}

async function guardaDePosicaoPermite(rl: Perguntador): Promise<ResultadoGuarda> {
  if (await perguntar(rl, 'Existe exatamente um jogador por agir depois de voce?')) {
    const jogadorPorAgirQuerFazer = await perguntar(rl, 'Esse jogador ainda precisa fazer vaza?');
    if (!jogadorPorAgirQuerFazer) {
      return {
        podeTentar: true,
        necessidadePositivaConhecida: false,
        existeJogadorInteressadoPorAgir: false,
      };
    }
    if (await perguntar(rl, 'Existe vencedora garantida_agora?')) {
      return {
        podeTentar: true,
        necessidadePositivaConhecida: false,
        existeJogadorInteressado: true,
        existeJogadorInteressadoPorAgir: true,
      };
    }
    const urgenciaAlta = await perguntar(rl, 'Sua urgencia e alta? (necessidade / cartas na mao >= 0,66)');
    return {
      podeTentar: urgenciaAlta,
      necessidadePositivaConhecida: urgenciaAlta,
      urgenciaAlta,
      existeJogadorInteressado: true,
      existeJogadorInteressadoPorAgir: true,
    };
  }

  if (await perguntar(rl, 'Existem dois ou mais jogadores por agir depois de voce?')) {
    if (await perguntar(rl, 'Todos os jogadores por agir ja cumpriram a declaracao?')) {
      return {
        podeTentar: true,
        necessidadePositivaConhecida: false,
        existeJogadorInteressadoPorAgir: false,
      };
    }
    const urgenciaAlta = await perguntar(rl, 'Sua urgencia e alta? (necessidade / cartas na mao >= 0,66)');
    return {
      podeTentar: urgenciaAlta,
      necessidadePositivaConhecida: urgenciaAlta,
      urgenciaAlta,
      existeJogadorInteressado: true,
      existeJogadorInteressadoPorAgir: true,
    };
  }

  return { podeTentar: true, necessidadePositivaConhecida: false };
}

async function podeAtravessar(rl: Perguntador, fatosNoMeio: FatosNoMeio): Promise<boolean> {
  const urgenciaAlta =
    fatosNoMeio.urgenciaAlta ?? (await perguntar(rl, 'Sua urgencia e alta? (necessidade / cartas na mao >= 0,66)'));
  fatosNoMeio.urgenciaAlta = urgenciaAlta;
  if (!urgenciaAlta) return false;
  if (!(await perguntarLiderInteressado(rl, fatosNoMeio))) return false;
  fatosNoMeio.existeJogadorInteressado = true;
  if (!(await perguntarLiderAlta(rl, fatosNoMeio))) return false;
  return perguntar(rl, 'Existe vencedora que nao seja garantida_agora?');
}

async function podePressionarEEsperar(rl: Perguntador, fatosNoMeio: FatosNoMeio): Promise<boolean> {
  const existeVencedora = fatosNoMeio.existeVencedora ?? (await perguntar(rl, 'Existe vencedora?'));
  fatosNoMeio.existeVencedora = existeVencedora;
  if (!existeVencedora) return false;
  const urgenciaAlta =
    fatosNoMeio.urgenciaAlta ?? (await perguntar(rl, 'Sua urgencia e alta? (necessidade / cartas na mao >= 0,66)'));
  fatosNoMeio.urgenciaAlta = urgenciaAlta;
  if (urgenciaAlta) return false;
  if (!(await perguntarExisteJogadorInteressado(rl, fatosNoMeio))) return false;
  fatosNoMeio.existeGarantidaAgoraParaDepois = await perguntar(
    rl,
    'Voce tem carta garantida_agora para uma vaza futura?',
  );
  if (!fatosNoMeio.existeGarantidaAgoraParaDepois) return false;
  fatosNoMeio.existeFugaUtil = await perguntar(
    rl,
    'Existe carta de fuga util agora? (perdedora ou empate que nao seja segura nem garantida)',
  );
  if (!fatosNoMeio.existeFugaUtil) {
    fatosNoMeio.existeVencedoraBarataPreservandoGarantida = await perguntar(
      rl,
      'Existe vencedora barata que nao seja garantida_agora, preservando uma garantida_agora para depois?',
    );
  }
  return Boolean(fatosNoMeio.existeFugaUtil || fatosNoMeio.existeVencedoraBarataPreservandoGarantida);
}

async function podeTentarComVencedoraSegura(rl: Perguntador, fatosNoMeio: FatosNoMeio): Promise<boolean> {
  const existeVencedora = fatosNoMeio.existeVencedora ?? (await perguntar(rl, 'Existe vencedora?'));
  fatosNoMeio.existeVencedora = existeVencedora;
  if (!existeVencedora) return false;
  const urgenciaAlta =
    fatosNoMeio.urgenciaAlta ?? (await perguntar(rl, 'Sua urgencia e alta? (necessidade / cartas na mao >= 0,66)'));
  fatosNoMeio.urgenciaAlta = urgenciaAlta;
  if (urgenciaAlta) return false;
  if (!(await perguntarExisteJogadorInteressado(rl, fatosNoMeio))) return false;
  if (fatosNoMeio.existeGarantidaAgoraParaDepois === true) return false;
  if (!(await perguntarLiderInteressado(rl, fatosNoMeio))) return false;
  if (!(await perguntarLiderAlta(rl, fatosNoMeio))) return false;
  return perguntar(rl, 'Tem vencedora segura? (2, 3 ou manilha)');
}

async function podeEsperarOportunidade(rl: Perguntador, fatosNoMeio: FatosNoMeio): Promise<boolean> {
  const urgenciaAlta = fatosNoMeio.urgenciaAlta ?? (await perguntar(rl, 'Sua urgencia e alta? (necessidade / cartas na mao >= 0,66)'));
  fatosNoMeio.urgenciaAlta = urgenciaAlta;
  if (urgenciaAlta) return false;
  return perguntarExisteCartaNaoFaz(rl, fatosNoMeio);
}

async function deveFazerAgora(rl: Perguntador): Promise<boolean> {
  if (await perguntar(rl, 'Nao existe lider?')) return true;
  if (await perguntar(rl, 'O lider ainda precisa fazer e e alta+? (referencia: A ou maior, incluindo 2, 3 ou manilha)')) {
    return true;
  }
  return perguntar(rl, 'Sua urgencia e alta? (necessidade / cartas na mao >= 0,66)');
}

async function primeiraCategoriaDisponivel(
  rl: Perguntador,
  caminho: string[],
  ordem: string[],
  fatosClassificacao: FatosClassificacao,
): Promise<Decisao> {
  await validarLimitesClassificacao(rl, fatosClassificacao);
  for (const categoria of ordem) {
    if (await perguntarCategoriaDisponivel(rl, categoria, fatosClassificacao)) {
      return decisao('fria', `Jogue a carta mais barata da primeira categoria disponivel: ${categoria}`, [
        ...caminho,
        `categoria ${categoria}`,
      ]);
    }
  }
  return decisao('fria', 'Jogue a carta mais barata da mao', [...caminho, 'sem categoria informada']);
}

async function perguntarCategoriaDisponivel(
  rl: Perguntador,
  categoria: string,
  fatosClassificacao: FatosClassificacao,
): Promise<boolean> {
  if (categoria === 'alta' && fatosClassificacao.existeAltaOuMaior !== undefined) {
    return fatosClassificacao.existeAltaOuMaior;
  }
  if (categoria === 'baixa' && fatosClassificacao.existeMaiorQueOito === false) return true;
  if (categoria === 'media' && fatosClassificacao.existeMaiorQueOito === false) return false;
  return perguntar(rl, perguntaCategoria(categoria));
}

function perguntaCategoria(categoria: string): string {
  const perguntas: Record<string, string> = {
    baixa: 'Existe carta 8 ou menor? (8, 7, 6, 5 ou 4)',
    media: 'Existe carta maior que 8 e menor que A? (9, 10, J, Q ou K)',
    alta: 'Existe A ou carta maior que A? (A, 2, 3 ou manilha)',
    segura: 'Existe carta segura? (referencia: carta muito alta, mas ainda bativel por carta viva)',
    garantida_agora: 'Existe carta garantida agora? (nenhuma carta viva vence ou empata com ela)',
  };
  return perguntas[categoria] ?? `Existe carta ${categoria}?`;
}

async function validarLimitesClassificacao(
  rl: Perguntador,
  fatosClassificacao: FatosClassificacao,
): Promise<void> {
  fatosClassificacao.existeMaiorQueOito = await perguntar(rl, 'Para validar baixa/media: existe carta maior que 8?');
  fatosClassificacao.existeAltaOuMaior = await perguntar(
    rl,
    'Para validar alta+: existe A ou carta maior que A? (A, 2, 3 ou manilha)',
  );
}

async function descarteOuBarata(
  rl: Perguntador,
  linha: Linha,
  caminho: string[],
  fatosNoMeio: FatosNoMeio,
): Promise<Decisao> {
  if (await perguntarExisteCartaNaoFaz(rl, fatosNoMeio)) {
    return decisao(linha, 'Descarte por necessidade entre cartas que nao fazem a vaza', caminho);
  }
  return decisao(linha, 'Jogue a carta mais barata da mao', [...caminho, 'sem carta que nao faz']);
}

async function perguntarExisteCartaNaoFaz(rl: Perguntador, fatosNoMeio: FatosNoMeio): Promise<boolean> {
  const existeCartaNaoFaz =
    fatosNoMeio.existeCartaNaoFaz ?? (await perguntar(rl, 'Existe carta que nao faz a vaza? (perdedora ou empate)'));
  fatosNoMeio.existeCartaNaoFaz = existeCartaNaoFaz;
  return existeCartaNaoFaz;
}

async function perguntarExisteJogadorInteressado(rl: Perguntador, fatosNoMeio: FatosNoMeio): Promise<boolean> {
  if (fatosNoMeio.existeJogadorInteressadoPorAgir === true) {
    fatosNoMeio.existeJogadorInteressado = true;
    return true;
  }

  const existeJogadorInteressado =
    fatosNoMeio.existeJogadorInteressado ??
    (fatosNoMeio.existeJogadorInteressadoPorAgir === false
      ? await perguntarLiderInteressado(rl, fatosNoMeio)
      : await perguntar(
          rl,
          'Existe jogador interessado? (lider atual ou alguem por agir ainda precisa fazer vaza)',
        ));
  fatosNoMeio.existeJogadorInteressado = existeJogadorInteressado;
  return existeJogadorInteressado;
}

async function perguntarLiderInteressado(rl: Perguntador, fatosNoMeio: FatosNoMeio): Promise<boolean> {
  const liderInteressado =
    fatosNoMeio.liderInteressado ?? (await perguntar(rl, 'O lider atual ainda precisa fazer vaza?'));
  fatosNoMeio.liderInteressado = liderInteressado;
  if (liderInteressado) fatosNoMeio.existeJogadorInteressado = true;
  return liderInteressado;
}

async function perguntarLiderAlta(rl: Perguntador, fatosNoMeio: FatosNoMeio): Promise<boolean> {
  const liderAlta = fatosNoMeio.liderAlta ?? (await perguntar(rl, 'O lider jogou alta+? (A, 2, 3 ou manilha)'));
  fatosNoMeio.liderAlta = liderAlta;
  return liderAlta;
}

function decisao(linha: Linha, acao: string, caminho: string[]): Decisao {
  return { linha, acao, caminho };
}

function repetirLinhasIguais(decisaoUnica: Decisao): ResultadoJogada {
  return {
    fria: decisaoUnica,
    quente: { ...decisaoUnica, linha: 'quente', caminho: ['linha quente segue abertura fria', ...decisaoUnica.caminho] },
  };
}

function seguirFria(fria: Decisao, caminho: string[]): Decisao {
  return { ...fria, caminho: [...caminho, 'sem ramo quente diferente', ...fria.caminho] };
}

async function perguntar(rl: Perguntador, pergunta: string): Promise<boolean> {
  const resposta = normalizar(await obterResposta(rl, pergunta));
  if (resposta === 'sim') {
    registrar(pergunta, true);
    return true;
  }
  if (resposta === 'nao') {
    registrar(pergunta, false);
    return false;
  }
  console.log('Resposta invalida. Use apenas sim ou nao.');
  return perguntar(rl, pergunta);
}

async function obterResposta(rl: Perguntador, pergunta: string): Promise<string> {
  const respostaScript = respostasScript.shift();
  if (respostaScript !== undefined) {
    console.log(`${pergunta} ${respostaScript}`);
    return respostaScript;
  }
  return rl.question(`${pergunta} `);
}

function normalizar(resposta: string): 'sim' | 'nao' | 'invalida' {
  const texto = resposta.trim().toLowerCase();
  if (['s', 'sim', 'y', 'yes'].includes(texto)) return 'sim';
  if (['n', 'nao', 'não', 'no'].includes(texto)) return 'nao';
  return 'invalida';
}

function registrar(pergunta: string, resposta: boolean): void {
  fatos.push({ pergunta, resposta });
  console.log('\nEstado validado ate aqui');
  console.table(fatos.map((fato) => ({ pergunta: fato.pergunta, resposta: fato.resposta ? 'sim' : 'nao' })));
}

function imprimirResultado(resultado: ResultadoJogada): void {
  console.log('\nResultado das linhas');
  imprimirDecisao('Linha fria', resultado.fria);
  imprimirDecisao('Linha quente', resultado.quente);
  if (resultado.fria.acao === resultado.quente.acao) {
    console.log('\nAs duas linhas chegaram na mesma jogada relativa.');
  } else {
    console.log('\nAs linhas divergem; a temperatura decidiria entre elas no jogo real.');
  }
}

function imprimirDecisao(titulo: string, decisaoLinha: Decisao): void {
  console.log(`\n${titulo}`);
  console.log(decisaoLinha.acao);
  console.log(decisaoLinha.caminho.map((passo) => `  > ${passo}`).join('\n'));
}

main().catch((erro: unknown) => {
  console.error(erro instanceof Error ? erro.message : erro);
  process.exitCode = 1;
});
