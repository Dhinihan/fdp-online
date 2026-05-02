#!/usr/bin/env bash

set -euo pipefail

readonly CAMINHO_LOCK="${SANDCASTLE_LOCK:-/tmp/fdp-sandcastle.lock}"
readonly TEMPO_LIMITE="${SANDCASTLE_TIMEOUT:-30m}"
readonly BRANCH_BASE="${SANDCASTLE_BRANCH_BASE:-main}"
readonly DESCRITOR_LOCK=9

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

  if [[ -n "$(git ls-files --others --exclude-standard)" ]]; then
    echo 'Execucao cancelada: ha arquivos nao rastreados na arvore de trabalho.' >&2
    exit 1
  fi

}

atualizar_branch_base() {
  local referencia_local referencia_remota

  git fetch --quiet origin "${BRANCH_BASE}"
  referencia_local="$(git rev-parse "${BRANCH_BASE}")"
  referencia_remota="$(git rev-parse "origin/${BRANCH_BASE}")"

  if [[ "${referencia_local}" != "${referencia_remota}" ]]; then
    git pull --ff-only origin "${BRANCH_BASE}"
  fi
}

adquirir_lock() {
  eval "exec ${DESCRITOR_LOCK}>\"${CAMINHO_LOCK}\""

  if ! flock -n "${DESCRITOR_LOCK}"; then
    echo "Execucao cancelada: nao foi possivel adquirir lock em '${CAMINHO_LOCK}'." >&2
    exit 1
  fi
}

executar_cron() {
  timeout "${TEMPO_LIMITE}" pnpm sandcastle:cron
}

main() {
  adquirir_lock
  garantir_branch_base
  garantir_arvore_limpa
  atualizar_branch_base
  executar_cron
}

main "$@"
