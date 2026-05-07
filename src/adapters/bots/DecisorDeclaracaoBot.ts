import type { DecisorDeclaracao } from '@/core/portas/DecisorDeclaracao';

export class DecisorDeclaracaoBot implements DecisorDeclaracao {
  declarar(): Promise<number> {
    return Promise.resolve(0);
  }
}
