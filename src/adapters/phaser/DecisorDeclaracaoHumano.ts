import type { DecisorDeclaracao } from '@/core/portas/DecisorDeclaracao';

export class DecisorDeclaracaoHumano implements DecisorDeclaracao {
  private resolver?: (valor: number) => void;
  private declaracaoPendente?: Promise<number>;

  declarar(): Promise<number> {
    if (this.declaracaoPendente) return this.declaracaoPendente;
    this.declaracaoPendente = new Promise((resolve) => {
      this.resolver = resolve;
    });
    return this.declaracaoPendente;
  }

  confirmar(valor: number): void {
    if (!this.resolver) {
      throw new Error('Declaração não iniciada');
    }
    this.resolver(valor);
    this.resolver = undefined;
    this.declaracaoPendente = undefined;
  }
}
