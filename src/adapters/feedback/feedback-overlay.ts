import type { FaseRodada } from '@/types/estado-rodada';
import './feedback.css';

const ENDPOINT_FORMSPREE = 'https://formspree.io/f/xzepoyoo';
const CHAVE_NOME = 'fdp-feedback-nome';
const MENSAGEM_ERRO = 'Não foi possível enviar. Verifique sua conexão e tente novamente.';

export type ContextoFeedback =
  | { origem: 'menu' }
  | { origem: 'partida' | 'fim-da-partida'; numeroRodada: number; fase: FaseRodada };

interface OpcoesFeedback {
  contexto: ContextoFeedback;
  aoFechar?: () => void;
}

interface ElementosFormulario {
  formulario: HTMLFormElement;
  nome: HTMLInputElement;
  feedback: HTMLTextAreaElement;
  mensagem: HTMLElement;
  botaoEnviar: HTMLButtonElement;
  sucesso: HTMLElement;
}

let overlayAtivo: HTMLElement | null = null;
let aoTeclar: ((evento: KeyboardEvent) => void) | null = null;
let envioAtivo: AbortController | null = null;
let rascunhoFeedback = '';

export function abrirFeedback(opcoes: OpcoesFeedback): boolean {
  if (overlayAtivo) return false;
  const fundo = criarOverlay();
  const elementos = obterElementos(fundo);
  if (!elementos) return false;

  document.body.appendChild(fundo);
  overlayAtivo = fundo;
  preencherFormulario(elementos);
  registrarEventos(fundo, elementos, opcoes);
  elementos.feedback.focus();
  return true;
}

function criarOverlay(): HTMLElement {
  const fundo = document.createElement('div');
  fundo.className = 'feedback-fundo';
  fundo.innerHTML = conteudoOverlay();
  return fundo;
}

function conteudoOverlay(): string {
  return `<section class="feedback-painel" role="dialog" aria-modal="true" aria-labelledby="feedback-titulo">
    <header class="feedback-topo">
      <h1 id="feedback-titulo">Enviar feedback</h1>
      <button class="feedback-fechar" type="button" aria-label="Fechar">×</button>
    </header>
    <div class="feedback-conteudo">
      <form class="feedback-formulario">
        <input class="feedback-armadilha" name="_gotcha" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">
        <label for="feedback-nome">Nome ou apelido <span>opcional</span></label>
        <input id="feedback-nome" name="nome" type="text" maxlength="100" autocomplete="nickname">
        <label for="feedback-texto">Feedback</label>
        <textarea id="feedback-texto" name="feedback" maxlength="2000" placeholder="Escreva aqui..." required></textarea>
        <p class="feedback-nota">Informações técnicas básicas serão enviadas junto.</p>
        <p class="feedback-mensagem" role="status" aria-live="polite"></p>
        <button class="feedback-enviar" type="submit">Enviar</button>
      </form>
      <div class="feedback-sucesso" hidden>
        <p>Feedback enviado. Obrigado por ajudar no playtest.</p>
        <button type="button">Voltar ao jogo</button>
      </div>
    </div>
  </section>`;
}

function obterElementos(fundo: HTMLElement): ElementosFormulario | null {
  const formulario = fundo.querySelector('.feedback-formulario');
  const nome = fundo.querySelector('#feedback-nome');
  const feedback = fundo.querySelector('#feedback-texto');
  const mensagem = fundo.querySelector('.feedback-mensagem');
  const botaoEnviar = fundo.querySelector('.feedback-enviar');
  const sucesso = fundo.querySelector('.feedback-sucesso');
  if (!(formulario instanceof HTMLFormElement)) return null;
  if (!(nome instanceof HTMLInputElement)) return null;
  if (!(feedback instanceof HTMLTextAreaElement)) return null;
  if (!(mensagem instanceof HTMLElement)) return null;
  if (!(botaoEnviar instanceof HTMLButtonElement)) return null;
  if (!(sucesso instanceof HTMLElement)) return null;
  return { formulario, nome, feedback, mensagem, botaoEnviar, sucesso };
}

function preencherFormulario(elementos: ElementosFormulario): void {
  elementos.nome.value = carregarNome();
  elementos.feedback.value = rascunhoFeedback;
}

function registrarEventos(fundo: HTMLElement, elementos: ElementosFormulario, opcoes: OpcoesFeedback): void {
  const fechar = (): void => {
    fecharFeedback(opcoes.aoFechar);
  };
  fundo.querySelector('.feedback-fechar')?.addEventListener('click', fechar);
  elementos.sucesso.querySelector('button')?.addEventListener('click', fechar);
  elementos.feedback.addEventListener('input', () => {
    rascunhoFeedback = elementos.feedback.value;
    elementos.feedback.setCustomValidity('');
  });
  elementos.formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    void enviarFeedback(elementos, opcoes.contexto);
  });
  registrarTeclaEscape(fechar);
}

function registrarTeclaEscape(fechar: () => void): void {
  aoTeclar = (evento: KeyboardEvent): void => {
    if (evento.key === 'Escape') fechar();
  };
  document.addEventListener('keydown', aoTeclar);
}

async function enviarFeedback(elementos: ElementosFormulario, contexto: ContextoFeedback): Promise<void> {
  const feedback = elementos.feedback.value.trim();
  if (!feedback) {
    elementos.feedback.setCustomValidity('Escreva seu feedback.');
    elementos.feedback.reportValidity();
    return;
  }
  definirEnviando(elementos, true);
  const controlador = new AbortController();
  envioAtivo = controlador;
  const requisicao = criarRequisicao(elementos, feedback, contexto);
  requisicao.signal = controlador.signal;
  try {
    const resposta = await fetch(ENDPOINT_FORMSPREE, requisicao);
    if (!resposta.ok) throw new Error('Falha no envio do feedback');
    concluirEnvio(elementos);
  } catch {
    if (!controlador.signal.aborted) mostrarErro(elementos);
  } finally {
    if (envioAtivo === controlador) envioAtivo = null;
  }
}

function criarRequisicao(elementos: ElementosFormulario, feedback: string, contexto: ContextoFeedback): RequestInit {
  const dados = new FormData(elementos.formulario);
  dados.set('nome', elementos.nome.value.trim());
  dados.set('feedback', feedback);
  dados.set('origem', contexto.origem);
  dados.set('url', window.location.href);
  dados.set('navegador', navigator.userAgent);
  dados.set('viewport', `${String(window.innerWidth)}x${String(window.innerHeight)}`);
  adicionarContextoPartida(dados, contexto);
  return { method: 'POST', body: dados, headers: { Accept: 'application/json' } };
}

function adicionarContextoPartida(dados: FormData, contexto: ContextoFeedback): void {
  if (contexto.origem === 'menu') return;
  dados.set('rodada', String(contexto.numeroRodada));
  dados.set('fase', contexto.fase);
}

function definirEnviando(elementos: ElementosFormulario, enviando: boolean): void {
  elementos.nome.disabled = enviando;
  elementos.feedback.disabled = enviando;
  elementos.botaoEnviar.disabled = enviando;
  elementos.botaoEnviar.textContent = enviando ? 'Enviando...' : 'Enviar';
  if (enviando) elementos.mensagem.textContent = '';
}

function mostrarErro(elementos: ElementosFormulario): void {
  elementos.mensagem.textContent = MENSAGEM_ERRO;
  definirEnviando(elementos, false);
  elementos.feedback.focus();
}

function concluirEnvio(elementos: ElementosFormulario): void {
  salvarNome(elementos.nome.value.trim());
  rascunhoFeedback = '';
  elementos.formulario.hidden = true;
  elementos.sucesso.hidden = false;
  const botaoVoltar = elementos.sucesso.querySelector('button');
  if (botaoVoltar instanceof HTMLButtonElement) botaoVoltar.focus();
}

function fecharFeedback(aoFechar?: () => void): void {
  if (!overlayAtivo) return;
  if (aoTeclar) document.removeEventListener('keydown', aoTeclar);
  envioAtivo?.abort();
  envioAtivo = null;
  overlayAtivo.remove();
  overlayAtivo = null;
  aoTeclar = null;
  aoFechar?.();
}

function carregarNome(): string {
  try {
    return (localStorage.getItem(CHAVE_NOME) ?? '').slice(0, 100);
  } catch {
    return '';
  }
}

function salvarNome(nome: string): void {
  try {
    if (nome) localStorage.setItem(CHAVE_NOME, nome);
    else localStorage.removeItem(CHAVE_NOME);
  } catch {
    // O envio não deve falhar se o navegador bloquear o armazenamento local.
  }
}
