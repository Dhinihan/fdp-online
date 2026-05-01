#!/usr/bin/env bash

set -euo pipefail

readonly CAMINHO_LOCK="${SANDCASTLE_LOCK:-/tmp/fdp-sandcastle.lock}"
readonly TEMPO_LIMITE="${SANDCASTLE_TIMEOUT:-30m}"
readonly BRANCH_BASE="${SANDCASTLE_BRANCH_BASE:-main}"

garantir_branch_base() {
  local branch_atual

  branch_atual="$(git branch --show-current)"

  if [[ "${branch_atual}" != "${BRANCH_BASE}" ]]; then
    echo "Execucao cancelada: branch atual '${branch_atual}' diferente de '${BRANCH_BASE}'." >&2
    exit 1
  fi
}

garantir_arvore_limpa() {
  if ! git diff --quiet --ignore-submodules --exit-code; then
    echo 'Execucao cancelada: ha alteracoes locais nao commitadas.' >&2
    exit 1
  fi

  if ! git diff --cached --quiet --ignore-submodules --exit-code; then
    echo 'Execucao cancelada: ha alteracoes locais em staging.' >&2
    exit 1
  fi
}

atualizar_branch_base() {
  git fetch origin "${BRANCH_BASE}"
  git pull --ff-only origin "${BRANCH_BASE}"
}

executar_cron() {
  timeout "${TEMPO_LIMITE}" \
    flock -n "${CAMINHO_LOCK}" \
    pnpm sandcastle:cron
}

main() {
  garantir_branch_base
  garantir_arvore_limpa
  atualizar_branch_base
  executar_cron
}

main "$@"
