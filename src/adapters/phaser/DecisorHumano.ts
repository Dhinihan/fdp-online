import type { Carta } from '@/core/Carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import type { EstadoRodada } from '@/types/estado-rodada';

export class DecisorHumano implements DecisorJogada {
  private resolver?: (carta: Carta) => void;
  private cartaSelecionada?: Carta;

  decidirJogada(_mao: Carta[], _estado: EstadoRodada): Promise<Carta> {
    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  selecionar(carta: Carta): void {
    this.cartaSelecionada = carta;
  }

  desmarcar(): void {
    this.cartaSelecionada = undefined;
  }

  confirmar(): void {
    if (!this.cartaSelecionada) {
      throw new Error('Nenhuma carta selecionada');
    }
    if (!this.resolver) {
      throw new Error('Decisão não iniciada');
    }
    this.resolver(this.cartaSelecionada);
    this.limpar();
  }

  private limpar(): void {
    this.resolver = undefined;
    this.cartaSelecionada = undefined;
  }
}
