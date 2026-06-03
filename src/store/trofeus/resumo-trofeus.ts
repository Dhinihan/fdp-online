import { limiarDe, proximoNivel, type Nivel } from './tabela-trofeus';
import type { SnapshotTrofeus } from './tipos';

export interface ResumoTrofeus {
  mostrar: boolean;
  maiorTrofeu: Nivel | null;
  sequenciaAtual: number;
  proximoNivel: Nivel | null;
  faltam: number | null;
}

export function resumirTrofeus(snapshot: SnapshotTrofeus): ResumoTrofeus {
  const proximo = proximoNivel(snapshot.maiorTrofeu);
  return {
    mostrar: snapshot.maiorTrofeu !== null,
    maiorTrofeu: snapshot.maiorTrofeu,
    sequenciaAtual: snapshot.sequenciaAtual,
    proximoNivel: proximo,
    faltam: proximo === null ? null : Math.max(0, limiarDe(proximo) - snapshot.sequenciaAtual),
  };
}
