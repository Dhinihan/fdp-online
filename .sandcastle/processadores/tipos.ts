export interface ItemFila {
  tipo: 'issue' | 'pr';
  numero: number;
  criadoEm: string;
}

export interface AdaptadorProcessamento<TItem, TContexto> {
  tipo: ItemFila['tipo'];
  listarElegiveis(): Promise<ItemFila[]> | ItemFila[];
  carregarItem(numero: number): Promise<TItem> | TItem;
  avaliarElegibilidade(item: TItem): string | null;
  coletarContexto(item: TItem): Promise<TContexto> | TContexto;
  avaliarContexto?(item: TItem, contexto: TContexto): string | null;
  formatarDryRun(item: TItem, contexto: TContexto): string;
  fazerLock(item: TItem): Promise<void> | void;
  desfazerLock(item: TItem): Promise<void> | void;
  montarPrompt(item: TItem, contexto: TContexto): string;
  obterBranch(item: TItem): string;
}

export type AdaptadorGenerico = AdaptadorProcessamento<unknown, unknown>;
