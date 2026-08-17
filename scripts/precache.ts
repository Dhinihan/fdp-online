/**
 * Comparação entre o conteúdo do `dist/` e o manifesto de precache do `sw.js`
 * gerado pelo Workbox. Funções puras: quem lê disco é `verifica-precache.ts`.
 */

/**
 * O `sw.js` e o runtime que ele carrega são o próprio mecanismo de cache, e por
 * isso nunca aparecem no manifesto que eles carregam. Não é allowlist de asset:
 * é a fronteira entre o que é cacheado e o que cacheia. A lista sai do próprio
 * `sw.js` — `define(["./workbox-<hash>"])` ou `importScripts("...")` — e não de
 * um padrão de nome, para que um arquivo qualquer chamado `workbox-*.js` não
 * escape do precache em silêncio.
 */
export function arquivosDoServiceWorker(conteudoSw: string): string[] {
  const dependencias = [...conteudoSw.matchAll(/(?:define\(\[|importScripts\()\s*"(?<caminho>[^"]+)"/g)].map(
    (referencia) => (referencia.groups?.caminho ?? '').replace(/^\.\//, ''),
  );

  return ['sw.js', ...dependencias.map((caminho) => (caminho.endsWith('.js') ? caminho : `${caminho}.js`))];
}

export function extrairUrlsDePrecache(conteudoSw: string): string[] {
  const chamada = /precacheAndRoute\(\[(?<manifesto>.*?)\]/s.exec(conteudoSw);
  if (!chamada?.groups) {
    throw new Error('Não encontrei o manifesto de precache (precacheAndRoute) no sw.js gerado.');
  }

  return [...chamada.groups.manifesto.matchAll(/url:"(?<url>[^"]+)"/g)].map((entrada) => entrada.groups?.url ?? '');
}

export function arquivosForaDoPrecache(
  arquivosDist: string[],
  urlsPrecache: string[],
  arquivosDoSw: string[],
): string[] {
  const cobertos = new Set([...urlsPrecache, ...arquivosDoSw]);

  return arquivosDist.filter((arquivo) => !cobertos.has(arquivo));
}
