FROM node:24-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates git gh \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/popper
COPY package.json package-lock.json ./
# Complete optional platform entries missing from the host-generated lock.
# This updates only the disposable image filesystem, preserving locked versions.
RUN npm install --package-lock-only --ignore-scripts && npm ci
ARG CODEX_VERSION=0.167.1
ARG CLAUDE_VERSION=2.1.322
RUN npm install --global @openai/codex@${CODEX_VERSION} @anthropic-ai/claude-code@${CLAUDE_VERSION}
COPY src ./src
COPY client.ts ./experiment/client.ts
COPY paseo.mjs ./paseo.mjs
RUN mkdir /trial && chown node:node /trial
ENV PASEO_CLI_JS=/opt/popper/paseo.mjs
USER node
WORKDIR /trial
CMD ["bash"]
