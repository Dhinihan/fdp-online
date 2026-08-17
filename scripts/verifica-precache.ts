/**
 * Guarda contra degradação silenciosa do offline: um arquivo acima do teto de
 * tamanho, ou com extensão fora do `globPatterns`, sai do precache sem quebrar o
 * build. Aqui isso vira falha visível. Regra sem exceções: todo arquivo do
 * `dist/` precisa estar no precache — não existe allowlist.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { arquivosDoServiceWorker, arquivosForaDoPrecache, extrairUrlsDePrecache } from './precache.ts';

const raizDist = path.resolve(process.argv[2] ?? 'dist');

async function listarArquivos(diretorio: string, prefixo = ''): Promise<string[]> {
  const entradas = await readdir(diretorio, { withFileTypes: true });
  const listas = await Promise.all(
    entradas.map((entrada) =>
      entrada.isDirectory()
        ? listarArquivos(path.join(diretorio, entrada.name), `${prefixo}${entrada.name}/`)
        : Promise.resolve([`${prefixo}${entrada.name}`]),
    ),
  );

  return listas.flat();
}

const arquivos = await listarArquivos(raizDist);
const sw = await readFile(path.join(raizDist, 'sw.js'), 'utf8');
const faltando = arquivosForaDoPrecache(arquivos, extrairUrlsDePrecache(sw), arquivosDoServiceWorker(sw));

if (faltando.length > 0) {
  console.error(
    `Arquivos de ${raizDist} fora do precache do Service Worker:\n` +
      faltando.map((arquivo) => `  - ${arquivo}`).join('\n') +
      '\nAjuste workbox.globPatterns ou maximumFileSizeToCacheInBytes em vite.config.ts.',
  );
  process.exit(1);
}

console.log(`Precache OK: ${String(arquivos.length)} arquivos de ${raizDist} cobertos.`);
