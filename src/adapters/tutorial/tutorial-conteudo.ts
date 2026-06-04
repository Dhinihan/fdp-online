// Markup do overlay "Como jogar". Funções puras (sem Phaser nem DOM),
// portadas do protótipo aprovado em prototypes/tutorial-final.html.
// A escada de força é gerada a partir da ordem das cartas.

/** Da mais forte para a mais fraca. 3, 2 e Ás furam a fila. */
const ORDEM_FORCA = ['3', '2', 'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4'];
/** Quantidade de valores que "furam a fila" e ganham das figuras. */
const NATURAIS_FORTES = 3;

function ehNatural(indice: number): boolean {
  return indice < NATURAIS_FORTES;
}

/** Escada horizontal (desktop): a altura da carta representa a força. */
export function montarEscadaHorizontal(): string {
  const total = ORDEM_FORCA.length;
  return ORDEM_FORCA.map((valor, indice) => {
    const altura = Math.round(84 - 60 * (indice / (total - 1)));
    const classe = ehNatural(indice) ? ' top' : '';
    return `<div class="carta${classe}" style="height:${String(altura)}px">${valor}</div>`;
  }).join('');
}

/** Escada vertical (mobile): o comprimento da barra representa a força. */
export function montarEscadaVertical(): string {
  const total = ORDEM_FORCA.length;
  const linhas = ORDEM_FORCA.map((valor, indice) => {
    const largura = Math.round(100 - 74 * (indice / (total - 1)));
    const classe = ehNatural(indice) ? ' top' : '';
    return `<div class="linha${classe}"><div class="carta${classe}">${valor}</div><div class="barra-f" style="width:${String(largura)}%"></div></div>`;
  }).join('');
  return `<div class="topo-rot">▲ mais forte</div>${linhas}<div class="base-rot">mais fraca ▼</div>`;
}

function montarCiclo(): string {
  return `
    <div class="ciclo">
      <div class="et"><div class="bolha">1</div><div class="txt">
        <h3>Declare</h3><p>Quantos turnos você vai vencer nesta rodada?</p>
        <div class="extra"><span>Pode até <b>declarar 0</b>.</span></div>
      </div></div>
      <div class="seta">↓</div>
      <div class="et"><div class="bolha">2</div><div class="txt">
        <h3>Faça os turnos</h3><p>A carta mais forte <b>faz</b>.</p>
        <div class="extra"><span><b>Jogue qualquer carta</b> — não precisa ser do mesmo naipe.</span></div>
        <div class="extra"><span><b>Empate sem manilha?</b> Ninguém faz o turno.</span></div>
      </div></div>
      <div class="seta">↓</div>
      <div class="et"><div class="bolha">3</div><div class="txt">
        <h3>Acerte na conta</h3><p>A diferença é <b class="red">descontada</b> dos seus pontos.</p>
      </div></div>
      <div class="seta ciclar">↺ e começa a próxima rodada</div>
    </div>`;
}

function montarLateral(): string {
  return `
    <div class="lateral">
      <h3>A manilha</h3>
      <p>Vira-se uma carta; o valor <b>seguinte</b> na força das cartas é a manilha — vence qualquer carta da rodada.</p>
      <p style="margin-bottom:0">Duas manilhas? O <b>naipe</b> desempata:<br>Paus&nbsp;♣ › Copas&nbsp;<span class="vermelho">♥</span> › Espadas&nbsp;♠ › Ouros&nbsp;<span class="vermelho">♦</span></p>
      <div class="esp">
        <h3>1ª rodada</h3>
        <p>Você não vê a sua carta, só a dos outros. Declare no escuro.</p>
      </div>
    </div>`;
}

function montarForca(): string {
  return `
    <div class="forca">
      <div class="cab">A força das cartas</div>
      <div class="nota">Da mais forte pra mais fraca. Repare: <b>3, 2 e Ás</b> furam a fila e ganham até das figuras.</div>
      <div class="escada-h">${montarEscadaHorizontal()}</div>
      <div class="ancoras"><span class="f">◄ mais forte</span><span class="w">mais fraca ►</span></div>
      <div class="escada-v">${montarEscadaVertical()}</div>
    </div>`;
}

/** Markup completo do overlay (topo + corpo), pronto para o container. */
export function montarConteudoTutorial(): string {
  return `
    <div class="overlay">
      <div class="topo">
        <span class="marca">FDP</span><h1>Como jogar</h1>
        <button class="fechar" title="Voltar ao jogo" aria-label="Fechar">✕</button>
      </div>
      <div class="corpo">
        <div class="alvo"><b>Sobreviva.</b> <span>Comece com 5 pontos, eles só caem, o último de pé vence.</span></div>
        <div class="corpo3">${montarCiclo()}${montarLateral()}</div>
        ${montarForca()}
        <div class="cta"><button>Entendi, bora jogar</button></div>
      </div>
    </div>`;
}
