/**
 * Comparação entre o conteúdo do `dist/` e o manifesto de precache do `sw.js`
 * gerado pelo Workbox. Funções puras: quem lê disco é `verifica-precache.ts`.
 */

/** O `sw.js` e o runtime do Workbox são o próprio mecanismo de cache, e por isso
 * nunca aparecem no manifesto que eles carregam. Não é allowlist de asset: é a
 * fronteira entre o que é cacheado e o que cacheia. */
const ARQUIVOS_DO_SERVICE_WORKER = /^(sw\.js|workbox-[^/]+\.js)$/;

export function extrairUrlsDePrecache(conteudoSw: string): string[] {
  const chamada = /precacheAndRoute\(\[(?<manifesto>.*?)\]/s.exec(conteudoSw);
  if (!chamada?.groups) {
    throw new Error('Não encontrei o manifesto de precache (precacheAndRoute) no sw.js gerado.');
  }

  return [...chamada.groups.manifesto.matchAll(/url:"(?<url>[^"]+)"/g)].map((entrada) => entrada.groups?.url ?? '');
}

export function arquivosForaDoPrecache(arquivosDist: string[], urlsPrecache: string[]): string[] {
  const precacheados = new Set(urlsPrecache);

  return arquivosDist
    .filter((arquivo) => !ARQUIVOS_DO_SERVICE_WORKER.test(arquivo))
    .filter((arquivo) => !precacheados.has(arquivo));
}
