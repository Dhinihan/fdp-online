import type { DecisorDeclaracao } from '@/core/portas/DecisorDeclaracao';

export class DecisorDeclaracaoHumano implements DecisorDeclaracao {
  private resolver?: (valor: number) => void;

  declarar(): Promise<number> {
    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  confirmar(valor: number): void {
    if (!this.resolver) {
      throw new Error('Declaração não iniciada');
    }
    this.resolver(valor);
    this.resolver = undefined;
  }
}
