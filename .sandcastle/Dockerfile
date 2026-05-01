FROM node:24-bookworm

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN apt-get update && apt-get install -y \
  git \
  curl \
  jq \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
  | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
  | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && apt-get update \
  && apt-get install -y gh \
  && rm -rf /var/lib/apt/lists/*

RUN usermod -d /home/agent -m -l agent node
RUN npm install -g @openai/codex
RUN npm install -g playwright@1.59.1
RUN playwright install --with-deps chromium
RUN corepack enable
RUN mkdir -p /home/agent/.codex && chown -R 1000:1000 /home/agent/.codex
RUN mkdir -p /ms-playwright && chown -R 1000:1000 /ms-playwright
RUN git config --system url.https://github.com/.insteadOf git@github.com: \
  && git config --system credential.https://github.com.helper '!gh auth git-credential'

USER agent
WORKDIR /home/agent

ENTRYPOINT ["sleep", "infinity"]
