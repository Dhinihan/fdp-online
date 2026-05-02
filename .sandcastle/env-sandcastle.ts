export function montarEnvAgente(env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  return {
    ...(env.OPENAI_API_KEY ? { OPENAI_API_KEY: env.OPENAI_API_KEY } : {}),
    ...(env.OPENCODE_API_KEY ? { OPENCODE_API_KEY: env.OPENCODE_API_KEY } : {}),
  };
}

export function montarEnvSandbox(env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  return {
    ...(env.GITHUB_TOKEN ? { GH_TOKEN: env.GITHUB_TOKEN } : {}),
    ...(env.GITHUB_TOKEN ? { GITHUB_TOKEN: env.GITHUB_TOKEN } : {}),
  };
}
