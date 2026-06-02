/**
 * Faz o gesto de "Voltar" do browser fechar o Ranking em vez de sair da página.
 *
 * Ao ativar, empilha uma entrada no histórico e escuta `popstate`. Um `popstate`
 * (Voltar) com o Ranking aberto fecha a cena sem navegar para fora. Fechar pelo
 * botão × consome a entrada empilhada (`back`) para o histórico não acumular
 * entradas fantasmas. Em ambos os casos o listener é removido — sem vazamento
 * entre aberturas da cena.
 *
 * Sem dependência do Phaser: testável em Vitest (exceção do AGENTS.md §3).
 */
export interface HistoricoNavegavel {
  pushState(estado: unknown, titulo: string): void;
  back(): void;
}

export interface AlvoPopstate {
  addEventListener(tipo: 'popstate', ouvinte: () => void): void;
  removeEventListener(tipo: 'popstate', ouvinte: () => void): void;
}

export class NavegacaoVoltarRanking {
  private ativo = false;
  private readonly ouvinte = (): void => {
    this.aoVoltar();
  };

  private readonly historico: HistoricoNavegavel;
  private readonly alvo: AlvoPopstate;
  private readonly aoFechar: () => void;

  constructor(historico: HistoricoNavegavel, alvo: AlvoPopstate, aoFechar: () => void) {
    this.historico = historico;
    this.alvo = alvo;
    this.aoFechar = aoFechar;
  }

  /** Empilha a entrada e passa a escutar o Voltar do browser. */
  ativar(): void {
    if (this.ativo) return;
    this.ativo = true;
    this.historico.pushState({ rankingAberto: true }, '');
    this.alvo.addEventListener('popstate', this.ouvinte);
  }

  /** Fechar pelo × : consome a entrada empilhada para equilibrar o histórico. */
  fecharPelaUI(): void {
    if (!this.ativo) return;
    this.desativar();
    this.historico.back();
  }

  /** Encerramento da cena (shutdown): só remove o listener, sem mexer no histórico. */
  encerrar(): void {
    this.desativar();
  }

  private aoVoltar(): void {
    if (!this.ativo) return;
    this.desativar();
    this.aoFechar();
  }

  private desativar(): void {
    if (!this.ativo) return;
    this.ativo = false;
    this.alvo.removeEventListener('popstate', this.ouvinte);
  }
}
