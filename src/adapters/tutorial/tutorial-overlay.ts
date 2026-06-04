// Controlador do overlay "Como jogar": cria/mostra/esconde um <div> HTML
// por cima do canvas Phaser. Engine-agnóstico — quem chama cuida de pausar
// e retomar a cena via as callbacks. Ver docs/adr/0004.
import { montarConteudoTutorial } from './tutorial-conteudo';
import './tutorial.css';

export interface OpcoesTutorial {
  /** Chamada quando o overlay é fechado (✕, CTA, ESC ou clique fora). */
  aoFechar?: () => void;
}

let overlayAtivo: HTMLElement | null = null;
let aoTeclar: ((evento: KeyboardEvent) => void) | null = null;

export function abrirTutorial(opcoes: OpcoesTutorial = {}): void {
  if (overlayAtivo) return;
  const fundo = document.createElement('div');
  fundo.className = 'tutorial-fundo';
  fundo.innerHTML = `<div class="tutorial-palco">${montarConteudoTutorial()}</div>`;
  document.body.appendChild(fundo);
  overlayAtivo = fundo;
  registrarFechamento(fundo, opcoes.aoFechar);
}

function fecharTutorial(aoFechar?: () => void): void {
  if (!overlayAtivo) return;
  if (aoTeclar) {
    document.removeEventListener('keydown', aoTeclar);
    aoTeclar = null;
  }
  overlayAtivo.remove();
  overlayAtivo = null;
  aoFechar?.();
}

function registrarFechamento(fundo: HTMLElement, aoFechar?: () => void): void {
  const fechar = (): void => {
    fecharTutorial(aoFechar);
  };
  fundo.querySelector('.fechar')?.addEventListener('click', fechar);
  fundo.querySelector('.cta button')?.addEventListener('click', fechar);
  fundo.addEventListener('click', (evento) => {
    if (evento.target === fundo) fechar();
  });
  aoTeclar = (evento: KeyboardEvent): void => {
    if (evento.key === 'Escape') fechar();
  };
  document.addEventListener('keydown', aoTeclar);
}
